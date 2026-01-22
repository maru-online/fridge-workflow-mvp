# OAuth Troubleshooting - GitHub Screen Issue

## Problem
When clicking "Sign in with Google", you're seeing a GitHub authentication screen instead.

## Root Cause
This typically happens when:
1. **Supabase OAuth is misconfigured** - GitHub might be set as the OAuth provider instead of Google
2. **Browser auto-fill** - Your browser has saved GitHub credentials and is auto-filling
3. **Redirect chain issue** - The OAuth flow is redirecting through GitHub

## Solutions

### Solution 1: Check Supabase OAuth Configuration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **Authentication** → **Providers**
3. Ensure **Google** is enabled and configured:
   - Client ID and Client Secret should be set
   - Authorized redirect URLs should include: `http://localhost:3000/auth/callback`
4. **Disable GitHub** if it's enabled (unless you want to use it)
5. Save changes

### Solution 2: Use Email/Password Login (Bypass OAuth)

Instead of using OAuth, you can:
1. Go to http://localhost:3000/auth/login
2. Use the email/password form at the bottom
3. Click "Sign Up" to create an account
4. Use that account to log in

### Solution 3: Clear Browser Data

1. In Cursor's browser, open Developer Tools (F12 or Cmd+Option+I)
2. Go to Application/Storage tab
3. Clear:
   - Cookies for `localhost:3000`
   - Local Storage
   - Session Storage
4. Refresh the page

### Solution 4: Use Debug Page

1. Go to http://localhost:3000/auth/debug
2. Click "Test Google OAuth URL"
3. Check if the generated URL contains "github" - if it does, there's a Supabase configuration issue
4. Check the console logs for more details

### Solution 5: Verify Environment Variables

Make sure your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Quick Fix: Use Email Login

The fastest way to get past this is to:
1. Click "Sign Up" on the login page
2. Enter an email and password
3. Check your email for the confirmation link (if email confirmation is enabled)
4. Or check Supabase dashboard → Authentication → Users to verify your account

## Next Steps

Once you're logged in, you can:
- Access the Ops Dashboard at http://localhost:3000/ops
- Access the Runner App at http://localhost:3000/runner
- Configure OAuth properly in Supabase for future use
