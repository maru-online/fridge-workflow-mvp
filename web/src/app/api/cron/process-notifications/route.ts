import { NextRequest, NextResponse } from 'next/server'

// This API route is called by Vercel Cron to process scheduled notifications
// Schedule: Every minute (* * * * *)

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  
  // In production, Vercel Cron requests include an Authorization header
  // with a Bearer token matching CRON_SECRET environment variable
  if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  try {
    // Call the Supabase Edge Function to process notifications
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/process-notifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Function error:', errorText)
      return NextResponse.json(
        { error: 'Failed to process notifications', details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    console.log('Notifications processed:', result)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    })

  } catch (error) {
    console.error('Error processing notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
