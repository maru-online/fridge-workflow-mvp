'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function DebugPage() {
  const [info, setInfo] = useState<Record<string, unknown> | null>(null)
  const supabase = createClient()

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    
    setInfo({
      hasSession: !!session,
      user: user ? { id: user.id, email: user.email } : null,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    })
  }

  async function testGoogleOAuth() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectTo = `${siteUrl}/auth/callback`
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
      },
    })

    setInfo({
      oauthUrl: data?.url,
      error: error?.message,
      containsGithub: data?.url?.toLowerCase().includes('github'),
    })
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
        
        <div className="space-y-4">
          <button
            onClick={checkAuth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Check Auth Status
          </button>
          
          <button
            onClick={testGoogleOAuth}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
          >
            Test Google OAuth URL
          </button>

          {info && (
            <div className="mt-6 p-4 bg-slate-100 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(info, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
