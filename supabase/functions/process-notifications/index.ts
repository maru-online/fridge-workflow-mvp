// Process Scheduled Notifications Edge Function
// This function is called by a cron job to send pending notifications

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
 * Get notification message based on type
 */
function getNotificationMessage(
  type: string,
  ticket: any,
  lead: any
): string {
  const customerName = lead?.customer_name || 'there'
  
  switch (type) {
    case 'appointment_reminder':
      const scheduledDate = new Date(ticket?.scheduled_for)
      const isOneHourReminder = scheduledDate.getTime() - Date.now() < 2 * 60 * 60 * 1000
      
      if (isOneHourReminder) {
        return `⏰ *Reminder: 1 Hour Until Your Appointment*

Hi ${customerName}!

Your ${ticket?.type === 'sell' ? 'fridge collection' : 'repair service'} is scheduled for *1 hour from now*.

Our team will arrive shortly. Please ensure you're available.

Thank you! 🙏`
      } else {
        return `📅 *Appointment Reminder*

Hi ${customerName}!

This is a friendly reminder about your scheduled appointment:

*Date:* ${scheduledDate.toLocaleDateString()}
*Time:* ${scheduledDate.toLocaleTimeString()}
*Type:* ${ticket?.type === 'sell' ? 'Fridge Collection' : 'Repair Service'}

Our team will arrive at the scheduled time. If you need to reschedule, please reply to this message.

Thank you! 🙏`
      }

    case 'job_completed':
      return `✅ *Job Completed*

Hi ${customerName}!

Great news! Your ${ticket?.type === 'sell' ? 'fridge collection' : 'repair service'} has been completed successfully.

*Ticket:* ${ticket?.fridge_code}
*Completed:* ${new Date().toLocaleDateString()}

Thank you for choosing Fridge Business! 🙏

If you have any questions, feel free to reach out.`

    case 'follow_up':
      return `👋 *How was your experience?*

Hi ${customerName}!

We hope you're satisfied with our recent service. We'd love to hear your feedback!

Reply with:
• ⭐⭐⭐⭐⭐ - Excellent!
• ⭐⭐⭐⭐ - Good
• ⭐⭐⭐ - Average
• ⭐⭐ - Not great
• ⭐ - Poor

Your feedback helps us improve! 🙏`

    default:
      return 'Notification from Fridge Business'
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

    // Get pending notifications that are due
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select(`
        *,
        tickets:ticket_id (*),
        leads:lead_id (*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50) // Process 50 at a time

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications', processed: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`Processing ${pendingNotifications.length} notifications...`)

    let successCount = 0
    let failCount = 0

    for (const notification of pendingNotifications) {
      const message = getNotificationMessage(
        notification.notification_type,
        notification.tickets,
        notification.leads
      )

      const result = await sendWhatsAppMessage(notification.whatsapp_id, message)

      if (result.success) {
        // Mark as sent
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id)
        
        successCount++
      } else {
        // Mark as failed
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'failed',
            error_message: result.error
          })
          .eq('id', notification.id)
        
        failCount++
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications processed',
        processed: pendingNotifications.length,
        success: successCount,
        failed: failCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error processing notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
