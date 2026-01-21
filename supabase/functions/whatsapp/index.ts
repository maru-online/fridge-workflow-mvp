// Setup: supabase functions new whatsapp
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    
    // 1. Webhook Verification (GET)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      const VERIFY_TOKEN = Deno.env.get('VERIFY_TOKEN') || 'fridge-mvp-secret';

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified');
        return new Response(challenge, { status: 200 });
      }
      return new Response('Forbidden', { status: 403 });
    }

    // 2. Incoming Messages (POST)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Received Payload:', JSON.stringify(body, null, 2));

      // Check if it's a message
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // WhatsApp ID
        const text = message.text?.body;
        const name = value?.contacts?.[0]?.profile?.name;

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // a. Find or Create Lead
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('whatsapp_id', from)
          .single();
        
        if (!lead) {
            await supabase.from('leads').insert({
                whatsapp_id: from,
                customer_name: name,
                status: 'new',
                notes: 'Created via WhatsApp inbound: ' + (text || 'Media message')
            });
        }

        // b. Handle specific keywords (naive bot)
        // This is where we'd add logic to reply
        // For MVP, we just log and maybe echo back or auto-reply "Thanks"
        
        // TODO: Call WhatsApp Cloud API to reply
        // await sendWhatsAppReply(from, "Thanks for contacting Fridge Business! One of our agents will be with you shortly.");
      }

      return new Response('EVENT_RECEIVED', { status: 200 });
    }

    return new Response('Method Not Allowed', { status: 405 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// Helper function placeholder
// async function sendWhatsAppReply(to: string, text: string) { ... }
