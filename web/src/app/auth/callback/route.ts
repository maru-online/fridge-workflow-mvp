import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function validateOrigin(requestUrl: URL): boolean {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXT_PUBLIC_SITE_URL
  ].filter(Boolean)
  
  return allowedOrigins.some(origin => requestUrl.origin === origin)
}

function sanitizeErrorMessage(error: string): string {
  // Remove sensitive information from error messages
  const sanitized = error.replace(/[<>"'&]/g, '')
  return sanitized.slice(0, 200) // Limit error message length
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  // Validate origin
  if (!validateOrigin(requestUrl)) {
    console.error('Invalid origin in OAuth callback:', requestUrl.origin)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/login?error=invalid_origin`)
  }

  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const sanitizedError = sanitizeErrorMessage(errorDescription || error)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(sanitizedError)}`)
  }

  // Validate required parameters
  if (!code) {
    console.error('Missing authorization code in OAuth callback')
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Missing authorization code')}`)
  }

  // Validate code format (basic check)
  if (code.length > 2048 || !/^[a-zA-Z0-9._-]+$/.test(code)) {
    console.error('Invalid authorization code format')
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Invalid authorization code')}`)
  }

  try {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Authentication failed')}`)
    }

    // Verify session was created
    if (!data.session || !data.user) {
      console.error('No session created after code exchange')
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Session creation failed')}`)
    }

    // Create user profile if it doesn't exist
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          role: 'customer'
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Continue anyway - profile can be created later
      }
    }

    // URL to redirect to after sign in process completes
    // Redirect to the root page, which handles role-based routing
    return NextResponse.redirect(`${origin}/`)
  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Authentication error')}`)
  }
}
