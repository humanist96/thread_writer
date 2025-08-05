import { NextResponse } from 'next/server'
import { searchYouTube } from '@/lib/youtube'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  // Check if YouTube API key is available
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY is not configured')
    return NextResponse.json({ error: 'YouTube API key is not configured' }, { status: 500 })
  }

  try {
    const videos = await searchYouTube(query)
    return NextResponse.json({ videos })
  } catch (error: any) {
    console.error('Search API error:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })
    return NextResponse.json({ 
      error: 'Failed to search videos',
      details: error.response?.data?.error?.message || error.message
    }, { status: 500 })
  }
}