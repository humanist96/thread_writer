import { getYouTubeTranscript } from '@/lib/transcript'

// Mock external dependencies to avoid ES module issues
jest.mock('youtubei.js', () => ({
  Innertube: {
    create: jest.fn().mockResolvedValue({
      getInfo: jest.fn().mockResolvedValue({
        basic_info: { title: 'Mock Video' },
        captions: {
          caption_tracks: [{
            language_code: 'en',
            base_url: 'https://mock.url/transcript.xml'
          }]
        }
      })
    })
  }
}))

jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      data: '<text start="0" dur="2">Hello world</text><text start="2" dur="3">Test transcript</text>'
    })
  }
}))

describe('Transcript Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getYouTubeTranscript', () => {
    it('should successfully extract transcript', async () => {
      // Arrange
      const videoId = 'dQw4w9WgXcQ'
      
      // Act
      const result = await getYouTubeTranscript(videoId)
      
      // Assert
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle invalid video IDs', async () => {
      // Arrange
      const invalidVideoId = 'invalid'
      
      // Act & Assert
      await expect(getYouTubeTranscript(invalidVideoId))
        .rejects.toThrow('Invalid YouTube video ID format')
    })

    it('should handle empty video IDs', async () => {
      // Act & Assert
      await expect(getYouTubeTranscript(''))
        .rejects.toThrow('Video ID is required')
    })

    it('should accept valid video ID formats', async () => {
      const validIds = ['dQw4w9WgXcQ', '9bZkp7q19f0', 'BaW_jenozKc']
      
      for (const videoId of validIds) {
        await expect(getYouTubeTranscript(videoId)).resolves.toBeDefined()
      }
    })
  })

  describe('Performance Tests', () => {
    it('should complete within reasonable time', async () => {
      const startTime = Date.now()
      
      await getYouTubeTranscript('dQw4w9WgXcQ')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(5000) // 5 seconds
    })
  })

  describe('Error Handling', () => {
    it('should provide user-friendly error messages', async () => {
      // Test various error scenarios
      const errorTests = [
        { input: '', expected: 'Video ID is required' },
        { input: 'abc', expected: 'Invalid YouTube video ID format' },
        { input: 'toolongvideoidthatexceeds11chars', expected: 'Invalid YouTube video ID format' }
      ]

      for (const test of errorTests) {
        await expect(getYouTubeTranscript(test.input))
          .rejects.toThrow(test.expected)
      }
    })
  })
})