import { NextResponse } from 'next/server'
import { generateThreadFromTranscript } from '@/lib/anthropic'

export async function POST(request: Request) {
  try {
    const { transcript, videoTitle, videoDescription } = await request.json()
    
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 })
    }

    const threadContent = await generateThreadFromTranscript(
      transcript,
      videoTitle || 'Untitled Video',
      videoDescription || ''
    )
    
    return NextResponse.json(threadContent)
  } catch (error: any) {
    console.error('Thread generation API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to generate thread content' 
    }, { status: 500 })
  }
}