# Fridge Workflow MVP - Deployment & Runbook

## 1. Environment Setup

### Production Variables
Ensure these new variables are added to your Supabase Edge Functions secrets:

```bash
# Core
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_DB_URL=...

# WhatsApp
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=fridge-mvp-secret

# Notifications
NOTIFICATION_EMAIL=alerts@fridge.business
```

### Rotating Secrets (D1 Task)
1. Run `openssl rand -hex 32` to generate a new `WHATSAPP_VERIFY_TOKEN`.
2. Update it in Supabase Dashboard -> Edge Functions -> Secrets.
3. Update the matching token in your Meta App Dashboard -> Webhooks.

## 2. Operations Guide

### Lead Management
- **Admins** use `/ops` to view incoming leads.
- Only leads who reply "YES" to consent will appear in the "Qualified" column (green badge).
- Leads who reply "NO" or withdraw consent are hidden from active views but kept for compliance.

### Runner Workflow
- **Runners** use `/runner` on mobile.
- Runners scan QR codes to start jobs.
- **Manual Entry:** If camera fails, enter `SELL-YYYYMMDD-XXX` code manually.
- **Payments:** Runners can only verify payments for tickets assigned to them.
- **Status:** Verifying payment moves ticket to `Closed`.

## 3. Troubleshooting

### "Email Rate Limit Exceeded"
- **Cause:** Too many auth emails sent to `admin@` during testing.
- **Fix:** Wait 1 hour OR create users manually in Supabase Dashboard -> Authentication -> Users.

### WhatsApp Message Failures
- **Check:** Supabase Edge Function logs for `whatsapp`.
- **Common Error:** "Template not found" -> Verify template name in Meta Dashboard.
- **Common Error:** "Token expired" -> Refresh System User token in Meta Business Manager.

### Ticket Not "Closing"
- **Check:** Ensure Runner app is sending `status: 'closed'` (not `completed`).
- **Check:** Ticket Trigger logs in Database if any custom logic fails.
