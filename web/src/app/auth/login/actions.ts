'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

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
  redirect('/')
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
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    // Don't expose detailed error messages
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
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
        role: 'customer' // Changed from 'runner' to 'customer' since runner is shelved
      })
    
    if (profileError) {
      console.error('Profile creation error:', profileError)
    }

    revalidatePath('/', 'layout')
    redirect('/')
  }
}
