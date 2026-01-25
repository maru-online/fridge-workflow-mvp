'use server'

import { createClient } from '@/utils/supabase/server'
import QRCode from 'qrcode'
import { revalidatePath } from 'next/cache'
import { validateUuid, sanitizeText } from '@/utils/validation'

export async function createTicketFromLead(leadId: number, ticketType: 'sell' | 'repair') {
  const supabase = await createClient()
  
  // Validate inputs
  if (!leadId || leadId <= 0) {
    return { error: 'Invalid lead ID' }
  }
  
  if (!['sell', 'repair'].includes(ticketType)) {
    return { error: 'Invalid ticket type' }
  }
  
  // Get lead details with validation
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return { error: 'Lead not found' }
  }

  // Generate secure fridge code
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  const prefix = ticketType === 'sell' ? 'SELL' : 'REP'
  const fridgeCode = `${prefix}-${dateStr}-${randomSuffix}`

  // Sanitize description
  const description = sanitizeText(
    lead.notes || `${ticketType === 'sell' ? 'Sell' : 'Repair'} request from WhatsApp`,
    500
  )

  // Create ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      lead_id: leadId,
      fridge_code: fridgeCode,
      category: ticketType,
      type: ticketType,
      status: 'open',
      description: description,
    })
    .select()
    .single()

  if (ticketError || !ticket) {
    console.error('Ticket creation error:', ticketError)
    return { error: 'Failed to create ticket' }
  }

  // Generate QR code securely
  try {
    // Generate QR code as data URL with security options
    const qrDataUrl = await QRCode.toDataURL(fridgeCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    })

    // Convert data URL to buffer
    const base64Data = qrDataUrl.split(',')[1]
    if (!base64Data) {
      throw new Error('Invalid QR code data')
    }
    
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload QR code to Supabase Storage with secure filename
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

      if (urlData?.publicUrl) {
        // Update ticket with QR code URL
        await supabase
          .from('tickets')
          .update({ image_url: urlData.publicUrl })
          .eq('id', ticket.id)
      }
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

  // Validate inputs
  const ticketValidation = validateUuid(ticketId)
  if (!ticketValidation.isValid) {
    return { error: 'Invalid ticket ID format' }
  }
  
  const runnerValidation = validateUuid(runnerId)
  if (!runnerValidation.isValid) {
    return { error: 'Invalid runner ID format' }
  }

  // Verify runner exists and has correct role
  const { data: runner, error: runnerError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', runnerId)
    .single()

  if (runnerError || !runner) {
    return { error: 'Runner not found' }
  }

  if (runner.role !== 'runner' && runner.role !== 'admin') {
    return { error: 'Invalid runner role' }
  }

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

  if (!ticket) {
    return { error: 'Ticket not found' }
  }

  const { error } = await supabase
    .from('tickets')
    .update({
      assigned_to: runnerId,
      status: 'assigned',
    })
    .eq('id', ticketId)

  if (error) {
    console.error('Ticket assignment error:', error)
    return { error: 'Failed to assign ticket' }
  }

  revalidatePath('/ops/tickets')
  return { success: true }
}

export async function updateTicketStatus(
  ticketId: string, 
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'closed'
) {
  const supabase = await createClient()

  // Validate inputs
  const ticketValidation = validateUuid(ticketId)
  if (!ticketValidation.isValid) {
    return { error: 'Invalid ticket ID format' }
  }

  const validStatuses = ['open', 'assigned', 'in_progress', 'completed', 'closed']
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status' }
  }

  // Verify ticket exists
  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id, status')
    .eq('id', ticketId)
    .single()

  if (!existingTicket) {
    return { error: 'Ticket not found' }
  }

  const updateData: any = { status }
  
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId)

  if (error) {
    console.error('Ticket status update error:', error)
    return { error: 'Failed to update ticket status' }
  }

  revalidatePath('/ops/tickets')
  return { success: true }
}
