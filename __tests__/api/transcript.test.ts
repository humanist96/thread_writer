import { NextRequest } from 'next/server'
import { POST } from '@/app/api/transcript/route'
import * as transcriptLib from '@/lib/transcript'

// Mock the transcript library
jest.mock('@/lib/transcript')

describe('/api/transcript', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when videoId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/transcript', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Video ID is required')
  })

  it('should successfully return transcript', async () => {
    const mockTranscript = 'This is a test transcript for the video'
    const mockVideoId = 'test-video-id'
    
    // Mock the getYouTubeTranscript function
    const mockedGetTranscript = transcriptLib.getYouTubeTranscript as jest.MockedFunction<typeof transcriptLib.getYouTubeTranscript>
    mockedGetTranscript.mockResolvedValueOnce(mockTranscript)

    const request = new NextRequest('http://localhost:3000/api/transcript', {
      method: 'POST',
      body: JSON.stringify({ videoId: mockVideoId }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transcript).toBe(mockTranscript)
    expect(mockedGetTranscript).toHaveBeenCalledWith(mockVideoId)
  })

  it('should handle transcript extraction errors', async () => {
    const mockVideoId = 'test-video-id'
    const errorMessage = 'This video does not have captions available'
    
    const mockedGetTranscript = transcriptLib.getYouTubeTranscript as jest.MockedFunction<typeof transcriptLib.getYouTubeTranscript>
    mockedGetTranscript.mockRejectedValueOnce(new Error(errorMessage))

    const request = new NextRequest('http://localhost:3000/api/transcript', {
      method: 'POST',
      body: JSON.stringify({ videoId: mockVideoId }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe(errorMessage)
  })

  it('should handle Korean video transcripts', async () => {
    const mockKoreanTranscript = '안녕하세요 이것은 한국어 자막 테스트입니다'
    const mockVideoId = 'korean-video-id'
    
    const mockedGetTranscript = transcriptLib.getYouTubeTranscript as jest.MockedFunction<typeof transcriptLib.getYouTubeTranscript>
    mockedGetTranscript.mockResolvedValueOnce(mockKoreanTranscript)

    const request = new NextRequest('http://localhost:3000/api/transcript', {
      method: 'POST',
      body: JSON.stringify({ videoId: mockVideoId }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transcript).toBe(mockKoreanTranscript)
  })

  it('should handle generic errors with fallback message', async () => {
    const mockVideoId = 'test-video-id'
    
    const mockedGetTranscript = transcriptLib.getYouTubeTranscript as jest.MockedFunction<typeof transcriptLib.getYouTubeTranscript>
    mockedGetTranscript.mockRejectedValueOnce(new Error())

    const request = new NextRequest('http://localhost:3000/api/transcript', {
      method: 'POST',
      body: JSON.stringify({ videoId: mockVideoId }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to extract transcript')
  })
})