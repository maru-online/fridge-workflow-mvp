'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { validatePhoneNumber, validateOtpCode } from '@/utils/validation'

// Input validation functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

function validatePassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128
}

function sanitizeInput(input: string): string {
  return input.trim().slice(0, 1000) // Limit input length
}

export async function signUpWithPhone(formData: FormData) {
  const supabase = await createClient()

  const phone = sanitizeInput(formData.get('phone') as string || '')

  // Validate phone number
  const phoneValidation = validatePhoneNumber(phone)
  if (!phoneValidation.isValid) {
    redirect(`/auth/login?error=${encodeURIComponent(phoneValidation.error || 'Invalid phone number')}`)
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneValidation.sanitized!,
    options: {
      channel: 'sms',
    },
  })

  if (error) {
    console.error('Phone signup error:', error)
    redirect(`/auth/login?error=${encodeURIComponent('Failed to send verification code')}`)
  }

  // Redirect to verification page
  redirect(`/auth/verify?phone=${encodeURIComponent(phoneValidation.sanitized!)}`)
}

export async function verifyPhoneOtp(formData: FormData) {
  const supabase = await createClient()

  const phone = sanitizeInput(formData.get('phone') as string || '')
  const otp = sanitizeInput(formData.get('otp') as string || '')

  // Validate inputs
  const phoneValidation = validatePhoneNumber(phone)
  if (!phoneValidation.isValid) {
    redirect(`/auth/verify?phone=${encodeURIComponent(phone)}&error=${encodeURIComponent('Invalid phone number')}`)
  }

  const otpValidation = validateOtpCode(otp)
  if (!otpValidation.isValid) {
    redirect(`/auth/verify?phone=${encodeURIComponent(phone)}&error=${encodeURIComponent(otpValidation.error || 'Invalid code')}`)
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneValidation.sanitized!,
    token: otpValidation.sanitized!,
    type: 'sms',
  })

  if (error) {
    console.error('OTP verification error:', error)
    redirect(`/auth/verify?phone=${encodeURIComponent(phone)}&error=${encodeURIComponent('Invalid or expired code')}`)
  }

  // Create user profile if it doesn't exist
  if (data.user) {
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
          full_name: phone.replace(/\D/g, '').slice(-4), // Last 4 digits as temp name
          role: 'runner',
          phone_number: phoneValidation.sanitized
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/ops')
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = sanitizeInput(formData.get('email') as string || '')
  const password = sanitizeInput(formData.get('password') as string || '')

  // Validate inputs
  if (!validateEmail(email)) {
    redirect(`/auth/login?error=${encodeURIComponent('Invalid email format')}`)
  }

  if (!validatePassword(password)) {
    redirect(`/auth/login?error=${encodeURIComponent('Password must be 8-128 characters')}`)
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Don't expose detailed error messages
    redirect(`/auth/login?error=${encodeURIComponent('Invalid credentials')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/ops')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = sanitizeInput(formData.get('email') as string || '')
  const password = sanitizeInput(formData.get('password') as string || '')

  // Validate inputs
  if (!validateEmail(email)) {
    redirect(`/auth/login?error=${encodeURIComponent('Invalid email format')}`)
  }

  if (!validatePassword(password)) {
    redirect(`/auth/login?error=${encodeURIComponent('Password must be 8-128 characters')}`)
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    // Don't expose detailed error messages
    redirect(`/auth/login?error=${encodeURIComponent('Signup failed. Please try again.')}`)
  }

  // Check if email confirmation is required
  if (authData.user && !authData.session) {
    redirect(`/auth/login?message=${encodeURIComponent('Check your email to confirm your account before signing in')}`)
  }

  // Create user profile after successful signup (only if auto-confirmed)
  if (authData.user && authData.session) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: email.split('@')[0].slice(0, 50), // Limit name length
        role: 'runner'
      })
    
    if (profileError) {
      console.error('Profile creation error:', profileError)
    }

    revalidatePath('/', 'layout')
    redirect('/ops')
  }
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Validate site URL
  if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
    redirect(`/auth/login?error=${encodeURIComponent('Invalid site configuration')}`)
  }
  
  const redirectTo = `${siteUrl}/auth/callback`

  console.log('Starting Google OAuth with redirectTo:', redirectTo)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      skipBrowserRedirect: false,
    },
  })

  if (error) {
    console.error('Google OAuth error:', error)
    redirect(`/auth/login?error=${encodeURIComponent('OAuth authentication failed')}`)
  }

  if (data?.url) {
    // Security check: ensure URL is from Google
    if (!data.url.includes('accounts.google.com')) {
      console.error('ERROR: OAuth URL is not from Google!')
      redirect(`/auth/login?error=${encodeURIComponent('OAuth misconfiguration detected')}`)
    }
    redirect(data.url)
  } else {
    redirect('/auth/login?error=OAuth URL generation failed')
  }
}

export async function signInWithApple() {
  const supabase = await createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Validate site URL
  if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
    redirect(`/auth/login?error=${encodeURIComponent('Invalid site configuration')}`)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    console.error('Apple OAuth error:', error)
    redirect(`/auth/login?error=${encodeURIComponent('OAuth authentication failed')}`)
  }

  if (data?.url) {
    // Security check: ensure URL is from Apple
    if (!data.url.includes('appleid.apple.com')) {
      console.error('ERROR: OAuth URL is not from Apple!')
      redirect(`/auth/login?error=${encodeURIComponent('OAuth misconfiguration detected')}`)
    }
    redirect(data.url)
  } else {
    redirect('/auth/login?error=OAuth URL generation failed')
  }
}
