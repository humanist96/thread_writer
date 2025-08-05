import axios from 'axios'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  viewCount: string
  duration: string
}

export async function searchYouTube(query: string, maxResults: number = 12): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured')
  }

  console.log('Searching YouTube with query:', query)
  console.log('Using API key:', YOUTUBE_API_KEY ? 'Present' : 'Missing')

  try {
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        key: YOUTUBE_API_KEY,
        maxResults,
        type: 'video',
        order: 'relevance',
      },
    })

    const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',')

    const detailsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoIds,
        key: YOUTUBE_API_KEY,
      },
    })

    return detailsResponse.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: item.statistics.viewCount,
      duration: parseDuration(item.contentDetails.duration),
    }))
  } catch (error) {
    console.error('YouTube search error:', error)
    throw new Error('Failed to search YouTube videos')
  }
}

function parseDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return '0:00'

  const hours = (match[1] || '').replace('H', '')
  const minutes = (match[2] || '').replace('M', '')
  const seconds = (match[3] || '').replace('S', '')

  const parts = []
  if (hours) parts.push(hours)
  parts.push(minutes || '0')
  parts.push(seconds.padStart(2, '0'))

  return parts.join(':')
}