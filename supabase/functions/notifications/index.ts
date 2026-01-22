// Notifications Edge Function
// Sends WhatsApp notifications for various events

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WhatsApp Cloud API configuration
const WHATSAPP_API_VERSION = 'v21.0'
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`

/**
 * Send a WhatsApp message using Meta Cloud API
 */
async function sendWhatsAppMessage(to: string, text: string): Promise<{ success: boolean; error?: string }> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

  if (!accessToken || !phoneNumberId) {
    return { success: false, error: 'Missing WhatsApp credentials' }
  }

  try {
    const url = `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: text
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('WhatsApp API error:', error)
      return { success: false, error: `WhatsApp API error: ${error}` }
    }

    const result = await response.json()
    console.log('WhatsApp message sent:', result)
    return { success: true }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get notification templates
 */
function getNotificationTemplate(type: string, data: any): string {
  switch (type) {
    case 'ticket_assigned':
      return `🔔 *New Job Assigned*

You have been assigned a new job:

*Ticket:* ${data.fridge_code}
*Type:* ${data.type.toUpperCase()}
*Customer:* ${data.customer_name || 'Unknown'}

Please check your runner app for details.

Good luck! 🚀`

    case 'appointment_reminder':
      return `📅 *Appointment Reminder*

Hi ${data.customer_name || 'there'}!

This is a reminder about your scheduled appointment:

*Date:* ${new Date(data.scheduled_for).toLocaleDateString()}
*Time:* ${new Date(data.scheduled_for).toLocaleTimeString()}
*Type:* ${data.type === 'sell' ? 'Fridge Collection' : 'Repair Service'}

Our team will arrive at the scheduled time. If you need to reschedule, please reply to this message.

Thank you! 🙏`

    case 'job_completed':
      return `✅ *Job Completed*

Hi ${data.customer_name || 'there'}!

Great news! Your ${data.type === 'sell' ? 'fridge collection' : 'repair service'} has been completed successfully.

*Ticket:* ${data.fridge_code}
*Completed:* ${new Date().toLocaleDateString()}

Thank you for choosing Fridge Business! 🙏

If you have any questions, feel free to reach out.`

    case 'payment_received':
      return `💰 *Payment Received*

Hi ${data.customer_name || 'there'}!

We have received your payment of *R ${data.amount}*.

*Ticket:* ${data.fridge_code}
*Transaction Date:* ${new Date().toLocaleDateString()}

Thank you for your payment! Your transaction is now complete. ✅`

    default:
      return data.message || 'Notification from Fridge Business'
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (req.method === 'POST') {
      const body = await req.json()
      const { type, whatsapp_id, ticket_id, lead_id, data } = body

      // Validate request
      if (!type || !whatsapp_id) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: type, whatsapp_id' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      // Get additional data if ticket_id or lead_id provided
      let notificationData = data || {}

      if (ticket_id) {
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .select(`
            *,
            leads:lead_id (
              customer_name,
              whatsapp_id,
              villages:village_id (name)
            )
          `)
          .eq('id', ticket_id)
          .single()

        if (!ticketError && ticket) {
          notificationData = {
            ...notificationData,
            fridge_code: ticket.fridge_code,
            type: ticket.type,
            customer_name: ticket.leads?.customer_name,
            scheduled_for: ticket.scheduled_for,
          }
        }
      }

      if (lead_id) {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('customer_name, whatsapp_id')
          .eq('id', lead_id)
          .single()

        if (!leadError && lead) {
          notificationData = {
            ...notificationData,
            customer_name: lead.customer_name,
          }
        }
      }

      // Get notification message
      const message = getNotificationTemplate(type, notificationData)

      // Send WhatsApp message
      const result = await sendWhatsAppMessage(whatsapp_id, message)

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error || 'Failed to send notification' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Notification sent successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response('Method Not Allowed', { status: 405 })

  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
