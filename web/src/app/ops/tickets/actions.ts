'use server'

import { createClient } from '@/utils/supabase/server'
import QRCode from 'qrcode'
import { revalidatePath } from 'next/cache'

export async function createTicketFromLead(leadId: number, ticketType: 'sell' | 'repair') {
  const supabase = await createClient()
  
  // Get lead details
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return { error: 'Lead not found' }
  }

  // Generate fridge code
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  const prefix = ticketType === 'sell' ? 'SELL' : 'REP'
  const fridgeCode = `${prefix}-${dateStr}-${randomSuffix}`

  // Create ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      lead_id: leadId,
      fridge_code: fridgeCode,
      category: ticketType,
      type: ticketType,
      status: 'open',
      description: lead.notes || `${ticketType === 'sell' ? 'Sell' : 'Repair'} request from WhatsApp`,
    })
    .select()
    .single()

  if (ticketError || !ticket) {
    return { error: 'Failed to create ticket' }
  }

  // Generate QR code
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(fridgeCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    })

    // Convert data URL to buffer
    const base64Data = qrDataUrl.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload QR code to Supabase Storage
    const fileName = `qr-codes/${fridgeCode}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading QR code:', uploadError)
      // Continue even if QR upload fails
    } else {
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      // Update ticket with QR code URL (we can store this in a new field or use image_url)
      await supabase
        .from('tickets')
        .update({ image_url: urlData.publicUrl })
        .eq('id', ticket.id)
    }
  } catch (qrError) {
    console.error('Error generating QR code:', qrError)
    // Continue even if QR generation fails
  }

  // Update lead status to qualified if not already
  if (lead.status === 'new') {
    await supabase
      .from('leads')
      .update({ status: 'qualified' })
      .eq('id', leadId)
  }

  revalidatePath('/ops/tickets')
  revalidatePath('/ops/leads')

  return { success: true, ticket, fridgeCode }
}

export async function assignTicket(ticketId: string, runnerId: string) {
  const supabase = await createClient()

  // Get ticket details for notification
  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      leads:lead_id (
        customer_name,
        whatsapp_id
      )
    `)
    .eq('id', ticketId)
    .single()

  const { error } = await supabase
    .from('tickets')
    .update({
      assigned_to: runnerId,
      status: 'assigned',
    })
    .eq('id', ticketId)

  if (error) {
    return { error: 'Failed to assign ticket' }
  }

  // Send notification to runner if they have WhatsApp (optional - requires runner profile with phone)
  // For now, we'll skip runner notifications as they use the app

  revalidatePath('/ops/tickets')
  return { success: true }
}

export async function updateTicketStatus(ticketId: string, status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'closed') {
  const supabase = await createClient()

  const updateData: any = { status }
  
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId)

  if (error) {
    return { error: 'Failed to update ticket status' }
  }

  revalidatePath('/ops/tickets')
  return { success: true }
}
