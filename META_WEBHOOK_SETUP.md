# Meta Webhook Configuration Guide

## Current Setup

Your WhatsApp webhook handler is already deployed as a Supabase Edge Function.

### Webhook Details

**Callback URL:** `https://ymeixyzoontlhnwyztba.supabase.co/functions/v1/whatsapp`

**Verify Token:** You need to set this in your Supabase project secrets (see below)

---

## Step 1: Set Your Verify Token in Supabase

Before configuring Meta, you need to set the VERIFY_TOKEN secret in Supabase:

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Edge Functions** → **Secrets**
3. Add a new secret:
   - **Name:** `VERIFY_TOKEN`
   - **Value:** Choose a secure random string (e.g., `fridge-mvp-secure-token-2026`)
   
   **OR** via CLI (if you have Supabase CLI):
   ```bash
   supabase secrets set VERIFY_TOKEN=fridge-mvp-secure-token-2026
   ```

---

## Step 2: Configure Meta Webhook

1. **Go to Meta Developer Portal**
   - Visit: https://developers.facebook.com/apps
   - Select your app

2. **Navigate to WhatsApp → Configuration**
   - Click on "Webhooks" section

3. **Edit Webhook Configuration**
   - **Callback URL:** `https://ymeixyzoontlhnwyztba.supabase.co/functions/v1/whatsapp`
   - **Verify Token:** Use the same token you set in Step 1 (e.g., `fridge-mvp-secure-token-2026`)

4. **Subscribe to Webhook Fields**
   Select the following fields:
   - ✅ `messages` (to receive incoming messages)
   - ✅ `message_status` (optional, for delivery status)
   - ✅ `messaging_product` (optional)

5. **Click "Verify and Save"**
   - Meta will send a GET request to your webhook URL
   - If your verify token matches, verification will succeed

---

## Step 3: Test the Webhook

1. **Send a Test Message**
   - In Meta Developer Portal, use the test phone number
   - Send a message to your WhatsApp Business number

2. **Check Logs**
   - Go to **Supabase Dashboard** → **Edge Functions** → **whatsapp** → **Logs**
   - You should see the incoming webhook payload

3. **Verify Database**
   - Go to **Supabase Dashboard** → **Table Editor** → **leads**
   - Check if a new lead was created from the WhatsApp message

---

## Troubleshooting

### Webhook Verification Fails
- **Issue:** Meta returns "Verification failed"
- **Solution:** 
  - Ensure VERIFY_TOKEN is set correctly in Supabase secrets
  - Check Edge Function logs for errors
  - Verify URL is exactly: `https://ymeixyzoontlhnwyztba.supabase.co/functions/v1/whatsapp`

### Messages Not Received
- **Issue:** Webhook verified but messages not appearing
- **Solution:**
  - Check you've subscribed to `messages` field
  - Review Edge Function logs
  - Verify the `leads` table exists in your database

### CORS Errors
- **Issue:** Browser/app shows CORS errors
- **Solution:** The Edge Function already includes CORS headers, but ensure you're making POST requests with proper headers

---

## Current Webhook Implementation

The webhook (`supabase/functions/whatsapp/index.ts`) currently:

✅ **Handles GET** - Verifies webhook with Meta  
✅ **Handles POST** - Receives incoming messages  
✅ **Creates Leads** - Stores WhatsApp messages in database  
⏳ **Auto-Reply** - TODO: Add WhatsApp Cloud API integration  

---

## Next Steps After Webhook Setup

1. **Add WhatsApp Cloud API Credentials** to send messages back
2. **Test end-to-end flow**:
   - User sends WhatsApp message → Webhook receives → Lead created → Auto-reply sent
3. **Connect to Runner App** for fridge scanning workflow

---

## Quick Reference

| Item | Value |
|------|-------|
| Project URL | https://ymeixyzoontlhnwyztba.supabase.co |
| Webhook URL | https://ymeixyzoontlhnwyztba.supabase.co/functions/v1/whatsapp |
| Verify Token | (Set in Supabase Secrets) |
| Meta Developer Portal | https://developers.facebook.com/apps |
