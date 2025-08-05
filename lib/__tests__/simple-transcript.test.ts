import { getSimpleTranscript } from '../simple-transcript'
import { YoutubeTranscript } from 'youtube-transcript'

jest.mock('youtube-transcript')

describe('SimpleTranscript', () => {
  const mockYoutubeTranscript = YoutubeTranscript as jest.Mocked<typeof YoutubeTranscript>

  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe('getSimpleTranscript', () => {
    it('should extract transcript successfully with Korean content', async () => {
      const mockTranscriptData = [
        { text: '안녕하세요', offset: 0, duration: 2000 },
        { text: '자바스크립트 강의입니다', offset: 2000, duration: 3000 }
      ]

      mockYoutubeTranscript.fetchTranscript.mockResolvedValueOnce(mockTranscriptData)

      const result = await getSimpleTranscript('test-video-id')

      expect(result.success).toBe(true)
      expect(result.transcript).toBe('안녕하세요 자바스크립트 강의입니다')
      expect(result.isKorean).toBe(true)
      expect(mockYoutubeTranscript.fetchTranscript).toHaveBeenCalledWith('test-video-id', { lang: 'ko' })
    })

    it('should extract transcript successfully with English content', async () => {
      const mockTranscriptData = [
        { text: 'Hello everyone', offset: 0, duration: 2000 },
        { text: 'Welcome to JavaScript tutorial', offset: 2000, duration: 3000 }
      ]

      mockYoutubeTranscript.fetchTranscript
        .mockRejectedValueOnce(new Error('Could not find Korean'))
        .mockResolvedValueOnce(mockTranscriptData)

      const result = await getSimpleTranscript('test-video-id')

      expect(result.success).toBe(true)
      expect(result.transcript).toBe('Hello everyone Welcome to JavaScript tutorial')
      expect(result.isKorean).toBe(false)
    })

    it('should handle missing captions gracefully', async () => {
      mockYoutubeTranscript.fetchTranscript.mockRejectedValue(
        new Error('Could not find captions for video')
      )

      const result = await getSimpleTranscript('test-video-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('No captions available for this video. The video may not have captions enabled.')
    })

    it('should handle private video error', async () => {
      mockYoutubeTranscript.fetchTranscript.mockRejectedValue(
        new Error('Video unavailable')
      )

      const result = await getSimpleTranscript('test-video-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Video is unavailable, private, or restricted in your region.')
    })

    it('should handle network errors', async () => {
      mockYoutubeTranscript.fetchTranscript.mockRejectedValue(
        new Error('fetch failed')
      )

      const result = await getSimpleTranscript('test-video-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error while fetching transcript. Please try again.')
    })

    it('should filter out empty text entries', async () => {
      const mockTranscriptData = [
        { text: 'Hello', offset: 0, duration: 1000 },
        { text: '', offset: 1000, duration: 1000 },
        { text: null, offset: 2000, duration: 1000 },
        { text: 'World', offset: 3000, duration: 1000 }
      ]

      mockYoutubeTranscript.fetchTranscript.mockResolvedValueOnce(mockTranscriptData)

      const result = await getSimpleTranscript('test-video-id')

      expect(result.success).toBe(true)
      expect(result.transcript).toBe('Hello World')
    })

    it('should remove music annotations', async () => {
      const mockTranscriptData = [
        { text: 'Welcome [Music]', offset: 0, duration: 2000 },
        { text: '[Applause] Thank you', offset: 2000, duration: 2000 }
      ]

      mockYoutubeTranscript.fetchTranscript.mockResolvedValueOnce(mockTranscriptData)

      const result = await getSimpleTranscript('test-video-id')

      expect(result.success).toBe(true)
      expect(result.transcript).toBe('Welcome Thank you')
    })

    it('should handle different response formats', async () => {
      const mockTranscriptData = [
        { snippet: 'Text from snippet field' },
        { content: 'Text from content field' },
        { text: 'Text from text field' }
      ]

      mockYoutubeTranscript.fetchTranscript.mockResolvedValueOnce(mockTranscriptData)

      const result = await getSimpleTranscript('test-video-id')

      expect(result.success).toBe(true)
      expect(result.transcript).toBe('Text from snippet field Text from content field Text from text field')
    })

    it('should reject transcripts that are too short', async () => {
      const mockTranscriptData = [
        { text: 'Hi', offset: 0, duration: 500 }
      ]

      mockYoutubeTranscript.fetchTranscript
        .mockResolvedValueOnce(mockTranscriptData)
        .mockResolvedValueOnce(mockTranscriptData)
        .mockResolvedValueOnce(mockTranscriptData)
        .mockResolvedValueOnce(mockTranscriptData)

      const result = await getSimpleTranscript('test-video-id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to extract transcript')
    })
  })
})