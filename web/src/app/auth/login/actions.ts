'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/auth/error')
  }

  revalidatePath('/', 'layout')
  redirect('/ops')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/auth/error')
  }

  revalidatePath('/', 'layout')
  redirect('/ops')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectTo = `${siteUrl}/auth/callback`

  console.log('Starting Google OAuth with redirectTo:', redirectTo)
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

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
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data?.url) {
    console.log('OAuth URL generated:', data.url.substring(0, 100) + '...')
    // Check if URL contains 'github' - this shouldn't happen
    if (data.url.toLowerCase().includes('github')) {
      console.error('ERROR: OAuth URL contains GitHub! This is wrong.')
      redirect(`/auth/login?error=${encodeURIComponent('OAuth misconfiguration detected. Please check Supabase settings.')}`)
    }
    redirect(data.url)
  } else {
    redirect('/auth/login?error=No OAuth URL returned')
  }
}

export async function signInWithApple() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    redirect('/auth/error')
  }

  if (data.url) {
    redirect(data.url)
  }
}
