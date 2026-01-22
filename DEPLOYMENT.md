# Deployment Guide

This guide covers deploying the Fridge MVP to production.

## Prerequisites

- Node.js 18+ installed
- Supabase CLI installed (`npm install -g supabase`)
- Meta WhatsApp Business API access
- GitHub account for repository

## Environment Variables

### Supabase Edge Functions

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
VERIFY_TOKEN=fridge-mvp-secure-token-2026
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Next.js Web App

Create `.env.local` in the `web/` directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For server actions only
```

## Deployment Steps

### 1. Database Setup

```bash
# Link to your Supabase project
cd supabase
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Verify migrations
supabase db diff
```

### 2. Deploy Edge Functions

```bash
# Deploy WhatsApp webhook handler
supabase functions deploy whatsapp --no-verify-jwt

# Deploy notifications function
supabase functions deploy notifications --no-verify-jwt

# Deploy offer engine
supabase functions deploy offer-engine --no-verify-jwt
```

### 3. Configure WhatsApp Webhook

1. Go to [Meta Developer Portal](https://developers.facebook.com/apps)
2. Navigate to your WhatsApp Business app
3. Go to Configuration → Webhooks
4. Set Callback URL: `https://your-project.supabase.co/functions/v1/whatsapp`
5. Set Verify Token: `fridge-mvp-secure-token-2026` (must match VERIFY_TOKEN secret)
6. Subscribe to: `messages`, `message_status`

### 4. Deploy Next.js App

#### Option A: Vercel (Recommended)

```bash
cd web
vercel deploy --prod
```

#### Option B: Self-hosted

```bash
cd web
npm run build
npm start
```

### 5. Storage Bucket Setup

In Supabase Dashboard:
1. Go to Storage
2. Create bucket named `photos` (if not exists)
3. Set to Public
4. Configure policies:
   - Public read access
   - Authenticated upload access

### 6. Initial Data Setup

Run these SQL commands in Supabase SQL Editor:

```sql
-- Add initial villages
INSERT INTO public.villages (name, region) VALUES
  ('Soweto', 'Gauteng'),
  ('Alexandra', 'Gauteng'),
  ('Diepsloot', 'Gauteng')
ON CONFLICT DO NOTHING;

-- Add default pricing rules (if not exists)
INSERT INTO public.pricing_rules (rule_name, condition_type, base_price, multiplier, priority) VALUES
  ('Excellent Condition - Default', 'excellent', 800.00, 1.5, 10),
  ('Good Condition - Default', 'good', 600.00, 1.2, 10),
  ('Fair Condition - Default', 'fair', 400.00, 0.8, 10),
  ('Poor Condition - Default', 'poor', 250.00, 0.5, 10)
ON CONFLICT DO NOTHING;
```

## Security Checklist

- [ ] All environment variables set and secured
- [ ] VERIFY_TOKEN is strong and unique
- [ ] Service role key never exposed to client
- [ ] RLS policies enabled on all tables
- [ ] Storage bucket policies configured
- [ ] HTTPS enabled for all endpoints
- [ ] CORS configured appropriately

## Monitoring Setup

### Supabase Logs

Monitor edge function logs:
```bash
supabase functions logs whatsapp --follow
supabase functions logs notifications --follow
```

### Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Supabase built-in logging

## Rollback Procedure

If deployment fails:

1. **Database**: Use Supabase dashboard to revert migrations
2. **Functions**: Redeploy previous version
   ```bash
   supabase functions deploy whatsapp --version previous
   ```
3. **Web App**: Revert to previous deployment in Vercel/dashboard

## Post-Deployment Verification

1. Test WhatsApp webhook:
   - Send test message to WhatsApp Business number
   - Check Supabase logs for receipt
   - Verify lead created in database

2. Test Ops Dashboard:
   - Login with admin account
   - Verify leads appear
   - Test ticket creation

3. Test Runner App:
   - Login with runner account
   - Test QR code scanning
   - Test ticket completion

## Maintenance

### Regular Tasks

- Monitor edge function logs weekly
- Review and archive old leads (2-year retention)
- Update pricing rules as needed
- Rotate secrets quarterly

### Data Retention

Run this SQL monthly to archive old leads:

```sql
SELECT archive_old_leads();
```

## Troubleshooting

### WhatsApp Webhook Not Receiving Messages

1. Check webhook is verified in Meta Dashboard
2. Verify VERIFY_TOKEN matches
3. Check Supabase function logs
4. Ensure phone number is in test mode (if using test number)

### Edge Functions Failing

1. Check function logs: `supabase functions logs <function-name>`
2. Verify environment variables are set
3. Check Supabase project status
4. Review function code for errors

### Database Connection Issues

1. Verify SUPABASE_URL is correct
2. Check RLS policies aren't blocking access
3. Verify service role key is valid
4. Check database is not paused (free tier)

## Support

For issues:
1. Check Supabase logs
2. Review function logs
3. Check Meta Developer Portal for WhatsApp issues
4. Review this documentation
