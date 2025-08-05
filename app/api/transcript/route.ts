import { NextResponse } from 'next/server'
import { getYouTubeTranscript } from '@/lib/transcript'
import { getSimpleTranscript } from '@/lib/simple-transcript'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    console.log(`[Transcript API] Processing request for video: ${videoId}`)
    console.log(`[Transcript API] Environment: ${process.env.VERCEL ? 'Vercel' : 'Local'}`)

    // Try simple method first in Vercel environment
    if (process.env.VERCEL) {
      console.log('[Transcript API] Using simple transcript method for Vercel')
      const result = await getSimpleTranscript(videoId)
      
      if (result.success && result.transcript) {
        console.log(`[Transcript API] Simple method success, length: ${result.transcript.length}`)
        return NextResponse.json({ transcript: result.transcript })
      } else {
        console.error('[Transcript API] Simple method failed:', result.error)
        throw new Error(result.error || 'Failed to extract transcript')
      }
    }

    // Use enhanced method for local development
    const transcript = await getYouTubeTranscript(videoId)
    console.log(`[Transcript API] Successfully extracted transcript, length: ${transcript.length}`)
    
    return NextResponse.json({ transcript })
  } catch (error: any) {
    console.error('[Transcript API] Error:', error)
    console.error('[Transcript API] Error stack:', error.stack)
    console.error('[Transcript API] Error details:', {
      message: error.message,
      name: error.name,
      videoId: request.url
    })
    
    return NextResponse.json({ 
      error: error.message || 'Failed to extract transcript',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 200 })
}