import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * API route to send WhatsApp notifications
 * This is a proxy to the notifications edge function
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, whatsapp_id, ticket_id, lead_id, data } = body

    if (!type || !whatsapp_id) {
      return NextResponse.json(
        { error: 'Missing required fields: type, whatsapp_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Call the notifications edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        whatsapp_id,
        ticket_id,
        lead_id,
        data,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error || 'Failed to send notification' },
        { status: response.status }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
