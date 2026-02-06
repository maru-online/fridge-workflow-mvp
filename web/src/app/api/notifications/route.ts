import { NextRequest, NextResponse } from 'next/server'

// Input validation schema
interface NotificationRequest {
  type: string
  whatsapp_id: string
  ticket_id?: string
  lead_id?: string
  data?: Record<string, unknown>
}

function validateNotificationRequest(body: unknown): NotificationRequest | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  const bodyRecord = body as Record<string, unknown>
  const { type, whatsapp_id, ticket_id, lead_id, data } = bodyRecord

  // Required fields validation
  if (!type || typeof type !== 'string' || type.trim().length === 0) {
    return null
  }

  if (!whatsapp_id || typeof whatsapp_id !== 'string' || whatsapp_id.trim().length === 0) {
    return null
  }

  // WhatsApp ID format validation (should be numeric)
  if (!/^\d+$/.test(whatsapp_id.trim())) {
    return null
  }

  // Type validation
  const validTypes = ['welcome', 'offer', 'confirmation', 'reminder', 'status_update', 'payment_received']
  if (!validTypes.includes(type.trim().toLowerCase())) {
    return null
  }

  return {
    type: type.trim().toLowerCase(),
    whatsapp_id: whatsapp_id.trim(),
    ticket_id: ticket_id ? String(ticket_id).trim() : undefined,
    lead_id: lead_id ? String(lead_id).trim() : undefined,
    data: typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  }
}

/**
 * API route to send WhatsApp notifications
 * This is a proxy to the notifications edge function
 */
export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const validatedData = validateNotificationRequest(body)
    if (!validatedData) {
      return NextResponse.json(
        { error: 'Invalid request: missing or invalid required fields (type, whatsapp_id)' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Call the notifications edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Notifications function error:', errorText)
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
