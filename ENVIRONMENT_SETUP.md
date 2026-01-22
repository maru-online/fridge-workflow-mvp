# Environment Setup Guide

Quick reference for setting up environment variables and configuration.

## Required Environment Variables

### Supabase Edge Functions

Set in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

| Variable | Description | Example |
|----------|-------------|---------|
| `VERIFY_TOKEN` | Token for WhatsApp webhook verification | `fridge-mvp-secure-token-2026` |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp API access token | `EAAxxxxxxxxxxxxx` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp phone number ID | `1015379818315279` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |

### Next.js Web Application

Create `.env.local` in `web/` directory:

```bash
# Public variables (exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Server-only variables (not exposed to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Only for server actions
```

## Getting Credentials

### Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Meta WhatsApp Credentials

1. Go to [Meta Developer Portal](https://developers.facebook.com/apps)
2. Select your WhatsApp Business app
3. Go to WhatsApp → API Setup
4. Copy:
   - Phone Number ID → `WHATSAPP_PHONE_NUMBER_ID`
   - Temporary Access Token → `WHATSAPP_ACCESS_TOKEN` (or generate permanent token)

## Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Rotate secrets regularly** - Every 90 days recommended
3. **Use different tokens for dev/staging/prod**
4. **Limit service role key usage** - Only for server-side operations
5. **Use strong VERIFY_TOKEN** - At least 32 characters, random

## Verification Checklist

- [ ] All Supabase secrets set in dashboard
- [ ] `.env.local` created in `web/` directory
- [ ] WhatsApp webhook verified
- [ ] Test message received successfully
- [ ] Ops dashboard loads correctly
- [ ] Runner app loads correctly

## Troubleshooting

### "Missing WhatsApp credentials" error
- Check secrets are set in Supabase Dashboard
- Verify secret names match exactly (case-sensitive)
- Redeploy edge function after setting secrets

### "Invalid Supabase URL" error
- Verify URL format: `https://xxx.supabase.co` (no trailing slash)
- Check project is not paused
- Verify project exists and is accessible

### Webhook verification fails
- Ensure VERIFY_TOKEN matches exactly in Meta Dashboard
- Check webhook URL is correct
- Verify edge function is deployed
