import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function validateEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing required Supabase environment variables')
  }
  
  if (url === 'your-project-url' || key === 'your-anon-key') {
    throw new Error('Please configure your Supabase credentials in .env.local')
  }
  
  return { url, key }
}

export async function createClient() {
  const { url, key } = validateEnvVars()
  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
