import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function validateEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing required Supabase environment variables in middleware')
    return null
  }
  
  if (url === 'your-project-url' || key === 'your-anon-key') {
    console.error('Placeholder Supabase credentials detected in middleware')
    return null
  }
  
  return { url, key }
}

export async function middleware(request: NextRequest) {
  const envVars = validateEnvVars()
  
  if (!envVars) {
    // Redirect to setup page if env vars are not configured
    if (request.nextUrl.pathname !== '/setup') {
      const url = request.nextUrl.clone()
      url.pathname = '/setup'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(envVars.url, envVars.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect auth routes
  if (request.nextUrl.pathname.startsWith('/ops') || request.nextUrl.pathname.startsWith('/runner')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from login
  if (request.nextUrl.pathname === '/auth/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/ops'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|setup|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}