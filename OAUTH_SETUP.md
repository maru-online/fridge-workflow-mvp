# OAuth Setup Guide

## Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### 2. Configure OAuth Consent Screen
1. Go to APIs & Services → OAuth consent screen
2. Choose "External" user type
3. Fill in required fields:
   - App name: "Fridge Workflow MVP"
   - User support email: your email
   - Developer contact: your email

### 3. Create OAuth Credentials
1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "Fridge Workflow Web"
5. Authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)

### 4. Get Credentials
- Copy Client ID and Client Secret
- Add to your `.env.local`:
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Apple OAuth Setup

### 1. Apple Developer Account
- Requires paid Apple Developer Program membership ($99/year)
- Sign in to [Apple Developer Portal](https://developer.apple.com/)

### 2. Create App ID
1. Go to Certificates, Identifiers & Profiles
2. Click Identifiers → App IDs
3. Register new App ID with "Sign In with Apple" capability

### 3. Create Service ID
1. Go to Identifiers → Services IDs
2. Register new Service ID
3. Configure "Sign In with Apple":
   - Primary App ID: Select the App ID created above
   - Domains: `localhost:3000`, `your-domain.com`
   - Return URLs: 
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.com/auth/callback`

### 4. Create Private Key
1. Go to Keys
2. Register new key with "Sign In with Apple" capability
3. Download the .p8 key file
4. Note the Key ID

### 5. Get Credentials
- Team ID: Found in membership details
- Service ID: The identifier you created
- Key ID: From the private key
- Private Key: Content of the .p8 file

Add to your `.env.local`:
```bash
APPLE_CLIENT_ID=your-service-id
APPLE_CLIENT_SECRET=your-generated-jwt-token
```

Note: Apple Client Secret is a JWT token you need to generate using your private key.

## Supabase Configuration

### 1. Enable Providers in Supabase Dashboard
1. Go to Authentication → Providers
2. Enable Google:
   - Client ID: Your Google Client ID
   - Client Secret: Your Google Client Secret
3. Enable Apple:
   - Client ID: Your Apple Service ID
   - Client Secret: Your Apple JWT token

### 2. Configure Redirect URLs
In Supabase Auth settings, add:
- `http://localhost:3000/auth/callback`
- `https://your-domain.com/auth/callback`

## Testing OAuth Flow

### Development Testing
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/auth/login`
3. Click "Google" or "Apple" buttons
4. Complete OAuth flow
5. Should redirect to `/ops` dashboard

### Verification Checklist
- [ ] OAuth providers enabled in Supabase config
- [ ] Environment variables set correctly
- [ ] Redirect URLs configured in provider consoles
- [ ] Redirect URLs added to Supabase Auth settings
- [ ] Test OAuth flow works end-to-end
- [ ] User profile created automatically after OAuth signup

## Troubleshooting

### Common Issues
1. **"OAuth misconfiguration detected"**
   - Check that OAuth URLs contain correct provider domains
   - Verify redirect URLs match exactly

2. **"Invalid redirect URI"**
   - Ensure redirect URLs are added to both provider console and Supabase
   - Check for trailing slashes or protocol mismatches

3. **"Authentication failed"**
   - Verify client ID and secret are correct
   - Check that providers are enabled in Supabase dashboard

4. **Profile creation fails**
   - Check database permissions
   - Verify profiles table exists and RLS policies allow inserts

### Debug Mode
Enable debug logging by adding to your OAuth actions:
```typescript
console.log('OAuth URL generated:', data.url)
```

## Security Notes
- Never commit OAuth secrets to version control
- Use environment variables for all credentials
- Regularly rotate OAuth secrets
- Monitor OAuth usage in provider consoles