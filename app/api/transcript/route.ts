import { NextResponse } from 'next/server'
import { getYouTubeTranscript } from '@/lib/transcript'

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    const transcript = await getYouTubeTranscript(videoId)
    
    return NextResponse.json({ transcript })
  } catch (error: any) {
    console.error('Transcript API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to extract transcript' 
    }, { status: 500 })
  }
}