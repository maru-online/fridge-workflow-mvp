# Monitoring & Runbooks

This document outlines monitoring strategies and troubleshooting runbooks for the Fridge MVP.

## Monitoring Strategy

### Key Metrics to Monitor

1. **WhatsApp Webhook Health**
   - Message receipt rate
   - Response time
   - Error rate
   - Delivery status

2. **Database Performance**
   - Query response times
   - Connection pool usage
   - Storage usage
   - Active connections

3. **Edge Function Performance**
   - Execution time
   - Error rate
   - Invocation count
   - Memory usage

4. **Application Health**
   - Page load times
   - API response times
   - Error rates
   - User activity

## Monitoring Tools

### Supabase Built-in Monitoring

1. **Edge Function Logs**
   ```bash
   # View real-time logs
   supabase functions logs whatsapp --follow
   supabase functions logs notifications --follow
   ```

2. **Database Logs**
   - Access via Supabase Dashboard → Logs
   - Monitor slow queries
   - Track connection issues

3. **Storage Metrics**
   - Monitor bucket usage
   - Track upload/download rates
   - Check for failed uploads

### Recommended Third-Party Tools

1. **Sentry** (Error Tracking)
   - Track JavaScript errors
   - Monitor edge function errors
   - Alert on critical issues

2. **Uptime Robot** (Uptime Monitoring)
   - Monitor webhook endpoint
   - Check dashboard availability
   - Alert on downtime

3. **LogRocket** (Session Replay)
   - Debug user issues
   - Track user sessions
   - Monitor performance

## Runbooks

### Runbook 1: WhatsApp Webhook Not Receiving Messages

**Symptoms:**
- No new leads appearing in dashboard
- No logs in Supabase edge function
- Messages sent but not processed

**Diagnosis Steps:**
1. Check Meta Developer Portal → Webhooks → Status
2. Verify webhook is "Verified" and "Active"
3. Check Supabase function logs for errors
4. Verify VERIFY_TOKEN matches in both places
5. Test webhook manually using Meta's test tool

**Resolution:**
```bash
# 1. Re-verify webhook
# Go to Meta Dashboard → Webhooks → Edit
# Click "Verify and Save"

# 2. Check function logs
supabase functions logs whatsapp --tail 50

# 3. Redeploy function if needed
supabase functions deploy whatsapp --no-verify-jwt

# 4. Test with curl
curl -X GET "https://your-project.supabase.co/functions/v1/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

### Runbook 2: Edge Function Timeout Errors

**Symptoms:**
- Functions timing out
- Slow response times
- 504 errors in logs

**Diagnosis Steps:**
1. Check function execution time in logs
2. Review function code for long-running operations
3. Check database query performance
4. Monitor external API calls (WhatsApp API)

**Resolution:**
```typescript
// Optimize database queries
// Use indexes on frequently queried columns
// Batch operations where possible
// Add timeout handling for external APIs

// Example: Add timeout to WhatsApp API calls
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

fetch(url, {
  signal: controller.signal,
  // ... other options
});
```

### Runbook 3: Database Connection Pool Exhausted

**Symptoms:**
- "Too many connections" errors
- Slow database queries
- Timeouts on database operations

**Diagnosis Steps:**
1. Check active connections in Supabase Dashboard
2. Review connection pool settings
3. Look for connection leaks in code
4. Check for long-running queries

**Resolution:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections (if needed)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < now() - interval '5 minutes';

-- Review connection pool settings in Supabase Dashboard
```

### Runbook 4: Storage Upload Failures

**Symptoms:**
- Photos not uploading
- Storage errors in logs
- Missing images in dashboard

**Diagnosis Steps:**
1. Check storage bucket policies
2. Verify file size limits
3. Check storage quota
4. Review upload code for errors

**Resolution:**
```bash
# Check storage bucket
# Supabase Dashboard → Storage → photos bucket

# Verify policies
# Should have:
# - Public read access
# - Authenticated upload access

# Check file size limits
# Supabase default: 50MB per file
```

### Runbook 5: High Error Rate in Application

**Symptoms:**
- Many errors in logs
- Users reporting issues
- Failed operations

**Diagnosis Steps:**
1. Check error logs in Supabase
2. Review Sentry (if configured)
3. Check recent deployments
4. Review user reports

**Resolution:**
```bash
# 1. Check recent errors
supabase functions logs whatsapp --level error --tail 100

# 2. Review error patterns
# Look for common error messages
# Check for correlation with deployments

# 3. Rollback if recent deployment
supabase functions deploy whatsapp --version previous

# 4. Fix and redeploy
```

## Alerting

### Critical Alerts (Immediate Action Required)

1. **WhatsApp Webhook Down**
   - Alert: Webhook status changed to inactive
   - Action: Re-verify webhook immediately

2. **Database Unavailable**
   - Alert: Connection errors > 10% for 5 minutes
   - Action: Check Supabase status page, contact support

3. **Storage Full**
   - Alert: Storage usage > 90%
   - Action: Clean up old files or upgrade plan

### Warning Alerts (Monitor Closely)

1. **High Error Rate**
   - Alert: Error rate > 5% for 15 minutes
   - Action: Review logs, investigate root cause

2. **Slow Response Times**
   - Alert: P95 response time > 2 seconds
   - Action: Optimize queries, check database load

3. **Low Message Processing**
   - Alert: Messages processed < 50% of received
   - Action: Check function logs, verify processing logic

## Daily Checks

1. Review edge function logs for errors
2. Check WhatsApp webhook status
3. Monitor database performance
4. Review new leads and tickets
5. Check storage usage

## Weekly Reviews

1. Analyze error trends
2. Review performance metrics
3. Check for security issues
4. Review user feedback
5. Plan optimizations

## Monthly Tasks

1. Archive old leads (2-year retention)
2. Review and update pricing rules
3. Rotate secrets (quarterly)
4. Review and optimize database indexes
5. Update documentation

## Emergency Contacts

- **Supabase Support**: support@supabase.com
- **Meta WhatsApp Support**: https://developers.facebook.com/support
- **Project Team**: [Add your team contacts]

## Log Retention

- **Supabase Logs**: 7 days (free tier), 30 days (pro tier)
- **Application Logs**: Configure based on your hosting
- **Error Tracking**: 90 days (Sentry default)

## Performance Baselines

- **WhatsApp Response Time**: < 500ms
- **Database Query Time**: < 100ms (simple queries)
- **Page Load Time**: < 2 seconds
- **Edge Function Execution**: < 3 seconds

If metrics exceed these baselines, investigate and optimize.
