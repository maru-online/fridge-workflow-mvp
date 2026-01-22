// Setup: supabase functions new whatsapp
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
async function sendWhatsAppReply(to: string, text: string): Promise<boolean> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!accessToken || !phoneNumberId) {
    console.error('Missing WhatsApp credentials: WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
    return false;
  }

  try {
    const url = `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`;
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
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('WhatsApp API error:', error);
      return false;
    }

    const result = await response.json();
    console.log('WhatsApp message sent:', result);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Get welcome message for new leads
 */
function getWelcomeMessage(customerName?: string, hasConsent?: boolean): string {
  const greeting = customerName ? `Hi ${customerName}!` : 'Hi there!';
  
  if (!hasConsent) {
    return `${greeting} 👋

Welcome to Fridge Business! We buy and repair fridges.

*Privacy Notice:*
To provide you with our services, we need to process your personal information. By continuing, you consent to us using your WhatsApp number and name to communicate with you about our services.

Reply *YES* to consent and continue, or *NO* to decline.

For more info, reply *INFO*.`;
  }
  
  return `${greeting} 👋

Welcome to Fridge Business! We buy and repair fridges.

What can we help you with today?

Reply with:
• *SELL* - Sell your fridge
• *REPAIR* - Repair your fridge
• *INFO* - More information

Our team is here to help! 🛠️`;
}

/**
 * Get or create conversation state
 */
async function getConversationState(supabase: any, whatsappId: string, leadId?: number) {
  const { data: state, error } = await supabase
    .from('conversation_states')
    .select('*')
    .eq('whatsapp_id', whatsappId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No state exists, create one
    const { data: newState, error: createError } = await supabase
      .from('conversation_states')
      .insert({
        whatsapp_id: whatsappId,
        lead_id: leadId,
        flow_type: 'idle',
        current_step: 'welcome',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating conversation state:', createError);
      return null;
    }
    return newState;
  }

  if (error) {
    console.error('Error fetching conversation state:', error);
    return null;
  }

  return state;
}

/**
 * Update conversation state
 */
async function updateConversationState(
  supabase: any,
  whatsappId: string,
  updates: {
    flow_type?: string;
    current_step?: string;
    collected_data?: any;
    lead_id?: number;
  }
) {
  const updateData: any = {
    last_message_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  if (updates.flow_type) updateData.flow_type = updates.flow_type;
  if (updates.current_step) updateData.current_step = updates.current_step;
  if (updates.collected_data) {
    // Merge with existing collected_data
    const { data: current } = await supabase
      .from('conversation_states')
      .select('collected_data')
      .eq('whatsapp_id', whatsappId)
      .single();
    
    const existing = current?.collected_data || {};
    updateData.collected_data = { ...existing, ...updates.collected_data };
  }
  if (updates.lead_id) updateData.lead_id = updates.lead_id;

  const { data, error } = await supabase
    .from('conversation_states')
    .update(updateData)
    .eq('whatsapp_id', whatsappId)
    .select()
    .single();

  if (error) {
    console.error('Error updating conversation state:', error);
    return null;
  }

  return data;
}

/**
 * Get list of villages for selection
 */
async function getVillagesList(supabase: any): Promise<string> {
  const { data: villages, error } = await supabase
    .from('villages')
    .select('name')
    .eq('active', true)
    .order('name');

  if (error || !villages || villages.length === 0) {
    return "Please tell me your village name:";
  }

  let message = "Which village are you in? Reply with the number:\n\n";
  villages.forEach((v: any, index: number) => {
    message += `${index + 1}. ${v.name}\n`;
  });
  message += "\nOr type your village name if it's not listed.";

  return message;
}

/**
 * Find village by name or number
 */
async function findVillage(supabase: any, input: string): Promise<number | null> {
  // Try to parse as number (1, 2, 3, etc.)
  const num = parseInt(input.trim());
  if (!isNaN(num)) {
    const { data: villages } = await supabase
      .from('villages')
      .select('id')
      .eq('active', true)
      .order('name')
      .range(num - 1, num - 1);
    
    if (villages && villages.length > 0) {
      return villages[0].id;
    }
  }

  // Try to find by name
  const { data: village } = await supabase
    .from('villages')
    .select('id')
    .ilike('name', `%${input.trim()}%`)
    .eq('active', true)
    .limit(1)
    .single();

  return village?.id || null;
}

/**
 * Handle Sell conversation flow
 */
async function handleSellFlow(
  supabase: any,
  whatsappId: string,
  messageText: string,
  leadId: number,
  state: any
): Promise<string | null> {
  const step = state.current_step;
  const collected = state.collected_data || {};

  // Start sell flow
  if (step === 'welcome' || step === 'idle') {
    await updateConversationState(supabase, whatsappId, {
      flow_type: 'sell',
      current_step: 'awaiting_name'
    });
    return "Great! Let's get started with selling your fridge. 😊\n\nWhat's your name?";
  }

  // Collect name
  if (step === 'awaiting_name') {
    const name = messageText.trim();
    if (name.length < 2) {
      return "Please provide a valid name (at least 2 characters).";
    }
    
    await updateConversationState(supabase, whatsappId, {
      current_step: 'awaiting_village',
      collected_data: { name }
    });

    // Update lead with name
    await supabase
      .from('leads')
      .update({ customer_name: name })
      .eq('id', leadId);

    const villagesMessage = await getVillagesList(supabase);
    return `Nice to meet you, ${name}! 👋\n\n${villagesMessage}`;
  }

  // Collect village
  if (step === 'awaiting_village') {
    const villageId = await findVillage(supabase, messageText);
    if (!villageId) {
      return "I couldn't find that village. Please check the list and try again, or type the village name exactly as shown.";
    }

    const { data: village } = await supabase
      .from('villages')
      .select('name')
      .eq('id', villageId)
      .single();

    await updateConversationState(supabase, whatsappId, {
      current_step: 'awaiting_fridge_condition',
      collected_data: { ...collected, village_id: villageId, village_name: village?.name }
    });

    // Update lead with village
    await supabase
      .from('leads')
      .update({ village_id: villageId })
      .eq('id', leadId);

    return `Thanks! ${village?.name} noted. 📍\n\nNow, what's the condition of your fridge?\n\nReply with:\n• *EXCELLENT* - Like new, works perfectly\n• *GOOD* - Works well, minor wear\n• *FAIR* - Works but needs some repairs\n• *POOR* - Not working or major issues`;
  }

  // Collect fridge condition
  if (step === 'awaiting_fridge_condition') {
    const condition = messageText.toUpperCase().trim();
    const validConditions = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
    
    if (!validConditions.includes(condition)) {
      return "Please reply with EXCELLENT, GOOD, FAIR, or POOR to describe your fridge condition.";
    }

    await updateConversationState(supabase, whatsappId, {
      current_step: 'awaiting_offer_response',
      collected_data: { ...collected, fridge_condition: condition.toLowerCase() }
    });

    // Calculate offer using offer engine
    const offer = await calculateOffer(
      supabase,
      collected.village_id,
      collected.village_name,
      condition.toLowerCase()
    );
    
    return `Perfect! I have all the details. 📋\n\n*Your Offer:*\n💰 R ${offer.amount}\n\n*Details:*\n• Condition: ${condition}\n• Location: ${collected.village_name}\n\nWould you like to accept this offer?\n\nReply with:\n• *YES* - Accept offer\n• *NO* - Decline\n• *NEGOTIATE* - Discuss price`;
  }

  // Handle offer response
  if (step === 'awaiting_offer_response') {
    const response = messageText.toUpperCase().trim();
    
    if (response === 'YES' || response.includes('ACCEPT')) {
      await updateConversationState(supabase, whatsappId, {
        current_step: 'completed'
      });

      // Update lead status
      await supabase
        .from('leads')
        .update({ status: 'qualified' })
        .eq('id', leadId);

      return `Excellent! ✅\n\nWe've accepted your offer. Our team will contact you shortly to arrange pickup.\n\nYou'll receive a confirmation message with pickup details soon.\n\nThank you for choosing Fridge Business! 🙏`;
    } else if (response === 'NO' || response.includes('DECLINE')) {
      await updateConversationState(supabase, whatsappId, {
        current_step: 'cancelled'
      });
      return "No problem! If you change your mind, just reply with SELL anytime. 👋";
    } else if (response === 'NEGOTIATE' || response.includes('NEGOTIATE')) {
      return "I understand you'd like to discuss the price. Our team will contact you shortly to negotiate. Please wait for our call. 📞";
    } else {
      return "Please reply with YES, NO, or NEGOTIATE.";
    }
  }

  return null;
}

/**
 * Calculate offer using offer engine
 */
async function calculateOffer(
  supabase: any,
  villageId: number | null,
  villageName: string | null,
  condition: string
): Promise<{ amount: number; currency: string }> {
  try {
    // Call offer engine edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const offerEngineUrl = `${supabaseUrl}/functions/v1/offer-engine`;
    
    const response = await fetch(offerEngineUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        condition: condition,
        village_id: villageId,
        village_name: villageName
      })
    });

    if (!response.ok) {
      console.error('Offer engine error:', await response.text());
      // Fallback to default pricing
      return getDefaultOffer(condition);
    }

    const offer = await response.json();
    return { amount: offer.amount, currency: offer.currency || 'ZAR' };
  } catch (error) {
    console.error('Error calling offer engine:', error);
    // Fallback to default pricing
    return getDefaultOffer(condition);
  }
}

/**
 * Default offer calculation (fallback)
 */
function getDefaultOffer(condition: string): { amount: number; currency: string } {
  const basePrices: Record<string, number> = {
    'excellent': 800,
    'good': 600,
    'fair': 400,
    'poor': 250
  };

  const multipliers: Record<string, number> = {
    'excellent': 1.5,
    'good': 1.2,
    'fair': 0.8,
    'poor': 0.5
  };

  const basePrice = basePrices[condition] || 400;
  const multiplier = multipliers[condition] || 1.0;
  const amount = Math.round(basePrice * multiplier / 10) * 10;

  return { amount, currency: 'ZAR' };
}

/**
 * Handle Repair conversation flow
 */
async function handleRepairFlow(
  supabase: any,
  whatsappId: string,
  messageText: string,
  leadId: number,
  state: any
): Promise<string | null> {
  const step = state.current_step;
  const collected = state.collected_data || {};

  // Start repair flow
  if (step === 'welcome' || step === 'idle') {
    await updateConversationState(supabase, whatsappId, {
      flow_type: 'repair',
      current_step: 'awaiting_repair_description'
    });
    return "We can help with repairs! 🔧\n\nPlease describe the issue with your fridge.\n\nFor example:\n• Not cooling\n• Making strange noises\n• Leaking water\n• Not turning on\n\nWhat's wrong?";
  }

  // Collect repair description
  if (step === 'awaiting_repair_description') {
    const description = messageText.trim();
    if (description.length < 10) {
      return "Please provide more details about the issue (at least 10 characters).";
    }

    await updateConversationState(supabase, whatsappId, {
      current_step: 'awaiting_repair_location',
      collected_data: { ...collected, description }
    });

    const villagesMessage = await getVillagesList(supabase);
    return `Got it! 📝\n\n${villagesMessage}`;
  }

  // Collect location
  if (step === 'awaiting_repair_location') {
    const villageId = await findVillage(supabase, messageText);
    if (!villageId) {
      return "I couldn't find that village. Please check the list and try again, or type the village name exactly as shown.";
    }

    const { data: village } = await supabase
      .from('villages')
      .select('name')
      .eq('id', villageId)
      .single();

    await updateConversationState(supabase, whatsappId, {
      current_step: 'awaiting_repair_photos',
      collected_data: { ...collected, village_id: villageId, village_name: village?.name }
    });

    // Update lead with village
    await supabase
      .from('leads')
      .update({ village_id: villageId })
      .eq('id', leadId);

    return `Perfect! ${village?.name} noted. 📍\n\nWould you like to send a photo of the issue? (Optional)\n\nReply with:\n• *SKIP* - Continue without photo\n• Or send a photo of your fridge`;
  }

  // Handle photo step (or skip)
  if (step === 'awaiting_repair_photos') {
    const text = messageText.toUpperCase().trim();
    
    if (text === 'SKIP' || text.includes('SKIP')) {
      // Create repair ticket without photo
      const ticketResult = await createRepairTicket(supabase, leadId, collected);
      
      if (ticketResult) {
        await updateConversationState(supabase, whatsappId, {
          current_step: 'completed'
        });

        // Update lead status
        await supabase
          .from('leads')
          .update({ status: 'qualified' })
          .eq('id', leadId);

        return `✅ Repair request created!\n\n*Ticket ID:* ${ticketResult.ticket_id}\n\nOur team will contact you within 24 hours to schedule a visit.\n\nYou'll receive a confirmation message with appointment details.\n\nThank you! 🙏`;
      } else {
        return "Sorry, there was an error creating your repair request. Please try again or contact support.";
      }
    } else {
      // User might be sending a message instead of photo
      // For now, we'll create the ticket anyway
      // Photo handling will be done in media handling function
      const ticketResult = await createRepairTicket(supabase, leadId, collected);
      
      if (ticketResult) {
        await updateConversationState(supabase, whatsappId, {
          current_step: 'completed'
        });

        await supabase
          .from('leads')
          .update({ status: 'qualified' })
          .eq('id', leadId);

        return `✅ Repair request created!\n\n*Ticket ID:* ${ticketResult.ticket_id}\n\nOur team will contact you within 24 hours to schedule a visit.\n\nThank you! 🙏`;
      }
    }
  }

  return null;
}

/**
 * Create a repair ticket
 */
async function createRepairTicket(supabase: any, leadId: number, collectedData: any): Promise<{ ticket_id: string } | null> {
  // Generate a fridge code for the repair ticket (format: REP-YYYYMMDD-XXX)
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const fridgeCode = `REP-${dateStr}-${randomSuffix}`;

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      lead_id: leadId,
      fridge_code: fridgeCode,
      category: 'repair',
      type: 'repair',
      status: 'open',
      description: collectedData.description || 'Repair request',
      location_gps: null // Can be updated later
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating repair ticket:', error);
    return null;
  }

  return { ticket_id: fridgeCode };
}

/**
 * Download media from WhatsApp Cloud API
 */
async function downloadWhatsAppMedia(mediaId: string): Promise<{ data: Uint8Array; mimeType: string } | null> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  if (!accessToken) {
    console.error('Missing WHATSAPP_ACCESS_TOKEN');
    return null;
  }

  try {
    // Get media URL
    const mediaUrl = `${WHATSAPP_API_BASE}/${mediaId}`;
    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!mediaResponse.ok) {
      console.error('Error fetching media URL:', await mediaResponse.text());
      return null;
    }

    const mediaData = await mediaResponse.json();
    const url = mediaData.url;
    const mimeType = mediaData.mime_type || 'image/jpeg';

    // Download actual media
    const downloadResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!downloadResponse.ok) {
      console.error('Error downloading media:', await downloadResponse.text());
      return null;
    }

    const arrayBuffer = await downloadResponse.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    return { data, mimeType };
  } catch (error) {
    console.error('Error in downloadWhatsAppMedia:', error);
    return null;
  }
}

/**
 * Upload media to Supabase Storage
 */
async function uploadMediaToStorage(
  supabase: any,
  fileData: Uint8Array,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  try {
    const fileExt = mimeType.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const storagePath = `whatsapp/${timestamp}-${fileName}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(storagePath, fileData, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.error('Error uploading to storage:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(storagePath);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Error in uploadMediaToStorage:', error);
    return null;
  }
}

/**
 * Handle media message from WhatsApp
 */
async function handleMediaMessage(
  supabase: any,
  whatsappId: string,
  message: any,
  leadId?: number
): Promise<void> {
  const mediaId = message.image?.id || message.video?.id || message.document?.id;
  const mediaType = message.image ? 'image' : message.video ? 'video' : 'document';

  if (!mediaId) {
    console.error('No media ID found in message');
    return;
  }

  // Download media
  const media = await downloadWhatsAppMedia(mediaId);
  if (!media) {
    console.error('Failed to download media');
    return;
  }

  // Upload to storage
  const fileName = `whatsapp-${mediaId}`;
  const publicUrl = await uploadMediaToStorage(supabase, media.data, fileName, media.mimeType);

  if (!publicUrl) {
    console.error('Failed to upload media to storage');
    return;
  }

  console.log('Media uploaded successfully:', publicUrl);

  // Get conversation state to see if we're in a flow
  const state = await getConversationState(supabase, whatsappId, leadId);
  
  if (state && state.flow_type === 'repair' && state.current_step === 'awaiting_repair_photos') {
    // Link photo to repair ticket if we can find/create one
    const collected = state.collected_data || {};
    
    // Try to find existing ticket for this lead
    if (leadId) {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id')
        .eq('lead_id', leadId)
        .eq('type', 'repair')
        .order('created_at', { ascending: false })
        .limit(1);

      if (tickets && tickets.length > 0) {
        const ticketId = tickets[0].id;
        
        // Store photo in ticket_photos
        await supabase
          .from('ticket_photos')
          .insert({
            ticket_id: ticketId,
            storage_path: publicUrl,
            caption: 'Photo from WhatsApp'
          });

        // Update ticket with image URL if not set
        await supabase
          .from('tickets')
          .update({ image_url: publicUrl })
          .eq('id', ticketId);
      }
    }

    // Acknowledge photo receipt
    await sendWhatsAppReply(whatsappId, "✅ Photo received! Thank you.\n\nCreating your repair request now...");
    
    // Create ticket if not already created
    if (leadId && collected.description) {
      const ticketResult = await createRepairTicket(supabase, leadId, collected);
      
      if (ticketResult) {
        await updateConversationState(supabase, whatsappId, {
          current_step: 'completed'
        });

        await supabase
          .from('leads')
          .update({ status: 'qualified' })
          .eq('id', leadId);

        await sendWhatsAppReply(whatsappId, `✅ Repair request created!\n\n*Ticket ID:* ${ticketResult.ticket_id}\n\nOur team will contact you within 24 hours to schedule a visit.\n\nThank you! 🙏`);
      }
    }
  } else if (leadId) {
    // Store photo link in lead notes for general photos
    const { data: lead } = await supabase
      .from('leads')
      .select('notes')
      .eq('id', leadId)
      .single();

    const updatedNotes = (lead?.notes || '') + `\n[Photo received: ${publicUrl}]`;
    await supabase
      .from('leads')
      .update({ notes: updatedNotes })
      .eq('id', leadId);
  }
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

      // Handle message status updates (delivery receipts, read receipts, etc.)
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Check if it's a status update (not a message)
      if (value?.statuses) {
        const status = value.statuses[0];
        console.log('Message status update:', status);
        // Log status updates but don't reply
        return new Response('EVENT_RECEIVED', { status: 200 });
      }

      // Check if it's a message
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // WhatsApp ID
        const rawText = message.text?.body || '';
        const text = rawText.toUpperCase().trim();
        const name = value?.contacts?.[0]?.profile?.name;

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // a. Find or Create Lead
        let lead;
        const { data: existingLead, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('whatsapp_id', from)
          .single();
        
        if (!existingLead) {
          const { data: newLead, error: insertError } = await supabase
            .from('leads')
            .insert({
              whatsapp_id: from,
              customer_name: name,
              status: 'new',
              notes: 'Created via WhatsApp inbound: ' + (rawText || 'Media message'),
              consent_given: false,
              retention_expires_at: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString() // 2 years
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Error creating lead:', insertError);
          } else {
            lead = newLead;
            // Send welcome message with consent request to new leads (only if not media)
            if (!message.image && !message.video && !message.document) {
              await sendWhatsAppReply(from, getWelcomeMessage(name, false));
            }
          }
        } else {
          lead = existingLead;
          
          // Handle consent if not given
          if (!lead.consent_given && !lead.consent_withdrawn) {
            const upperText = text.toUpperCase();
            if (upperText === 'YES' || upperText.includes('CONSENT') || upperText.includes('AGREE')) {
              // Update consent
              await supabase
                .from('leads')
                .update({
                  consent_given: true,
                  consent_date: new Date().toISOString()
                })
                .eq('id', lead.id);
              
              // Send welcome message
              await sendWhatsAppReply(from, getWelcomeMessage(lead.customer_name || name, true));
              return new Response('EVENT_RECEIVED', { status: 200 });
            } else if (upperText === 'NO' || upperText.includes('DECLINE')) {
              // Withdraw consent
              await supabase
                .from('leads')
                .update({
                  consent_withdrawn: true,
                  consent_withdrawn_date: new Date().toISOString()
                })
                .eq('id', lead.id);
              
              await sendWhatsAppReply(from, "Thank you for your response. We respect your privacy. If you change your mind, you can reply YES anytime.");
              return new Response('EVENT_RECEIVED', { status: 200 });
            } else if (!message.image && !message.video && !message.document) {
              // Remind about consent if not given
              await sendWhatsAppReply(from, getWelcomeMessage(lead.customer_name || name, false));
              return new Response('EVENT_RECEIVED', { status: 200 });
            }
          }
          
          // Check if consent was withdrawn
          if (lead.consent_withdrawn) {
            if (text === 'YES' || text.includes('CONSENT')) {
              // Re-consent
              await supabase
                .from('leads')
                .update({
                  consent_given: true,
                  consent_date: new Date().toISOString(),
                  consent_withdrawn: false,
                  consent_withdrawn_date: null
                })
                .eq('id', lead.id);
              
              await sendWhatsAppReply(from, getWelcomeMessage(lead.customer_name || name, true));
              return new Response('EVENT_RECEIVED', { status: 200 });
            } else {
              await sendWhatsAppReply(from, "We respect your privacy choice. To use our services, please reply YES to provide consent.");
              return new Response('EVENT_RECEIVED', { status: 200 });
            }
          }
        }

        // b. Handle media messages first
        if (message.image || message.video || message.document) {
          await handleMediaMessage(supabase, from, message, lead?.id);
          return new Response('EVENT_RECEIVED', { status: 200 });
        }

        // c. Get or create conversation state
        const state = await getConversationState(supabase, from, lead?.id);
        if (!state) {
          console.error('Failed to get/create conversation state');
          return new Response('EVENT_RECEIVED', { status: 200 });
        }

        // Check consent before processing flows
        if (!lead.consent_given || lead.consent_withdrawn) {
          await sendWhatsAppReply(from, getWelcomeMessage(lead.customer_name || name, false));
          return new Response('EVENT_RECEIVED', { status: 200 });
        }

        // d. Handle conversation flows based on state
        let replyMessage: string | null = null;

        // Check if user wants to start a new flow
        if (text === 'SELL' || text.includes('SELL')) {
          // Reset state and start sell flow
          await updateConversationState(supabase, from, {
            flow_type: 'sell',
            current_step: 'awaiting_name',
            collected_data: {}
          });
          replyMessage = await handleSellFlow(supabase, from, rawText, lead?.id, {
            current_step: 'awaiting_name',
            flow_type: 'sell'
          });
        } else if (text === 'REPAIR' || text.includes('REPAIR')) {
          // Reset state and start repair flow
          await updateConversationState(supabase, from, {
            flow_type: 'repair',
            current_step: 'awaiting_repair_description',
            collected_data: {}
          });
          replyMessage = await handleRepairFlow(supabase, from, rawText, lead?.id, {
            current_step: 'awaiting_repair_description',
            flow_type: 'repair'
          });
        } else if (text === 'INFO' || text.includes('INFO')) {
          await sendWhatsAppReply(from, "Fridge Business - We buy used fridges and provide repair services. Reply with SELL to sell your fridge or REPAIR for service requests.");
        } else if (state.flow_type === 'sell') {
          // Continue sell conversation flow
          replyMessage = await handleSellFlow(supabase, from, rawText, lead?.id, state);
        } else if (state.flow_type === 'repair') {
          // Continue repair conversation flow
          replyMessage = await handleRepairFlow(supabase, from, rawText, lead?.id, state);
        } else if (state.current_step === 'welcome' || state.current_step === 'idle') {
          // Default response for idle state
          if (text && !['SELL', 'REPAIR', 'INFO', 'HELLO', 'HI'].includes(text)) {
            replyMessage = "Thanks for your message! Reply with SELL, REPAIR, or INFO for quick help.";
          }
        }

        // Send reply if we have one
        if (replyMessage) {
          await sendWhatsAppReply(from, replyMessage);
        }
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
