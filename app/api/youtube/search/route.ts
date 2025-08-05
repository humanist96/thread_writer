import { NextResponse } from 'next/server'
import { searchYouTube } from '@/lib/youtube'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const videos = await searchYouTube(query)
    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Failed to search videos' }, { status: 500 })
  }
}