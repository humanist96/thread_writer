import { getYouTubeTranscript, formatTranscriptForDisplay } from '@/lib/transcript'
import { YoutubeTranscript } from 'youtube-transcript'

// Mock the youtube-transcript module
jest.mock('youtube-transcript')

describe('YouTube Transcript Extraction', () => {
  const mockVideoId = 'test-video-id'
  const mockTranscript = [
    { text: 'Hello world', start: 0, duration: 2 },
    { text: 'This is a test', start: 2, duration: 3 },
    { text: 'YouTube transcript', start: 5, duration: 2 }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getYouTubeTranscript', () => {
    it('should successfully extract transcript when available', async () => {
      // Arrange
      const mockedFetchTranscript = YoutubeTranscript.fetchTranscript as jest.MockedFunction<typeof YoutubeTranscript.fetchTranscript>
      mockedFetchTranscript.mockResolvedValueOnce(mockTranscript)

      // Act
      const result = await getYouTubeTranscript(mockVideoId)

      // Assert
      expect(mockedFetchTranscript).toHaveBeenCalledWith(mockVideoId)
      expect(result).toBe('Hello world This is a test YouTube transcript')
    })

    it('should throw error when no transcript is available', async () => {
      // Arrange
      const mockedFetchTranscript = YoutubeTranscript.fetchTranscript as jest.MockedFunction<typeof YoutubeTranscript.fetchTranscript>
      mockedFetchTranscript.mockResolvedValueOnce([])

      // Act & Assert
      await expect(getYouTubeTranscript(mockVideoId)).rejects.toThrow('No transcript available for this video')
    })

    it('should handle specific error when transcript is not found', async () => {
      // Arrange
      const mockedFetchTranscript = YoutubeTranscript.fetchTranscript as jest.MockedFunction<typeof YoutubeTranscript.fetchTranscript>
      mockedFetchTranscript.mockRejectedValueOnce(new Error('Could not find transcript'))

      // Act & Assert
      await expect(getYouTubeTranscript(mockVideoId)).rejects.toThrow(
        'This video does not have captions available. Please select another video.'
      )
    })

    it('should handle video unavailable error', async () => {
      // Arrange
      const mockedFetchTranscript = YoutubeTranscript.fetchTranscript as jest.MockedFunction<typeof YoutubeTranscript.fetchTranscript>
      mockedFetchTranscript.mockRejectedValueOnce(new Error('Video unavailable'))

      // Act & Assert
      await expect(getYouTubeTranscript(mockVideoId)).rejects.toThrow('This video is unavailable or private.')
    })

    it('should handle Korean language transcripts', async () => {
      // Arrange
      const koreanTranscript = [
        { text: '안녕하세요', start: 0, duration: 2 },
        { text: '이것은 테스트입니다', start: 2, duration: 3 },
        { text: '유튜브 자막', start: 5, duration: 2 }
      ]
      const mockedFetchTranscript = YoutubeTranscript.fetchTranscript as jest.MockedFunction<typeof YoutubeTranscript.fetchTranscript>
      mockedFetchTranscript.mockResolvedValueOnce(koreanTranscript)

      // Act
      const result = await getYouTubeTranscript(mockVideoId)

      // Assert
      expect(result).toBe('안녕하세요 이것은 테스트입니다 유튜브 자막')
    })

    it('should handle mixed language transcripts', async () => {
      // Arrange
      const mixedTranscript = [
        { text: 'Hello 안녕하세요', start: 0, duration: 2 },
        { text: 'This is 테스트', start: 2, duration: 3 }
      ]
      const mockedFetchTranscript = YoutubeTranscript.fetchTranscript as jest.MockedFunction<typeof YoutubeTranscript.fetchTranscript>
      mockedFetchTranscript.mockResolvedValueOnce(mixedTranscript)

      // Act
      const result = await getYouTubeTranscript(mockVideoId)

      // Assert
      expect(result).toBe('Hello 안녕하세요 This is 테스트')
    })

    it('should handle network errors gracefully', async () => {
      // Arrange
      const mockedFetchTranscript = YoutubeTranscript.fetchTranscript as jest.MockedFunction<typeof YoutubeTranscript.fetchTranscript>
      mockedFetchTranscript.mockRejectedValueOnce(new Error('Network error'))

      // Act & Assert
      await expect(getYouTubeTranscript(mockVideoId)).rejects.toThrow(
        'Failed to extract transcript. The video may not have captions enabled.'
      )
    })

    it('should clean up extra whitespace in transcript', async () => {
      // Arrange
      const messyTranscript = [
        { text: 'Hello   world', start: 0, duration: 2 },
        { text: '  This  is   a   test  ', start: 2, duration: 3 }
      ]
      const mockedFetchTranscript = YoutubeTranscript.fetchTranscript as jest.MockedFunction<typeof YoutubeTranscript.fetchTranscript>
      mockedFetchTranscript.mockResolvedValueOnce(messyTranscript)

      // Act
      const result = await getYouTubeTranscript(mockVideoId)

      // Assert
      expect(result).toBe('Hello world This is a test')
    })
  })

  describe('formatTranscriptForDisplay', () => {
    it('should return full text when under max length', () => {
      const text = 'Short text'
      const result = formatTranscriptForDisplay(text, 100)
      expect(result).toBe(text)
    })

    it('should truncate and add ellipsis when over max length', () => {
      const text = 'This is a very long text that needs to be truncated'
      const result = formatTranscriptForDisplay(text, 20)
      expect(result).toBe('This is a very long ...')
    })

    it('should use default max length of 1000', () => {
      const text = 'a'.repeat(1100)
      const result = formatTranscriptForDisplay(text)
      expect(result).toBe('a'.repeat(1000) + '...')
    })
  })
})