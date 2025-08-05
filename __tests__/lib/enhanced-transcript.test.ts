import { EnhancedTranscriptExtractor } from '@/lib/enhanced-transcript'
import { TranscriptMethod, TranscriptResult } from '@/lib/types/transcript'

// Mock external dependencies
jest.mock('youtube-transcript')
jest.mock('youtubei.js')
jest.mock('axios')

describe('EnhancedTranscriptExtractor', () => {
  let extractor: EnhancedTranscriptExtractor
  
  beforeEach(() => {
    extractor = new EnhancedTranscriptExtractor()
    jest.clearAllMocks()
  })

  describe('extractTranscript', () => {
    const testVideoId = 'dQw4w9WgXcQ'
    
    it('should successfully extract transcript using primary method', async () => {
      // Arrange
      const mockResult: TranscriptResult = {
        success: true,
        transcript: 'Hello world test transcript',
        method: TranscriptMethod.INNERTUBE,
        responseTime: 1000,
        isKorean: false
      }
      
      jest.spyOn(extractor, 'tryMethod').mockResolvedValueOnce(mockResult)
      
      // Act
      const result = await extractor.extractTranscript(testVideoId)
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.transcript).toBe('Hello world test transcript')
      expect(result.method).toBe(TranscriptMethod.INNERTUBE)
      expect(result.responseTime).toBeGreaterThan(0)
    })

    it('should fallback to secondary method when primary fails', async () => {
      // Arrange
      const failedResult: TranscriptResult = {
        success: false,
        error: 'Primary method failed',
        method: TranscriptMethod.INNERTUBE,
        responseTime: 500
      }
      
      const successResult: TranscriptResult = {
        success: true,
        transcript: 'Fallback method success',
        method: TranscriptMethod.YOUTUBE_TRANSCRIPT,
        responseTime: 1200,
        isKorean: false
      }
      
      jest.spyOn(extractor, 'tryMethod')
        .mockResolvedValueOnce(failedResult)
        .mockResolvedValueOnce(successResult)
      
      // Act
      const result = await extractor.extractTranscript(testVideoId)
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.transcript).toBe('Fallback method success')
      expect(result.method).toBe(TranscriptMethod.YOUTUBE_TRANSCRIPT)
    })

    it('should detect Korean content correctly', async () => {
      // Arrange
      const koreanResult: TranscriptResult = {
        success: true,
        transcript: '안녕하세요 한국어 자막입니다',
        method: TranscriptMethod.INNERTUBE,
        responseTime: 1000,
        isKorean: true
      }
      
      jest.spyOn(extractor, 'tryMethod').mockResolvedValueOnce(koreanResult)
      
      // Act
      const result = await extractor.extractTranscript(testVideoId)
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.isKorean).toBe(true)
      expect(result.transcript).toContain('안녕하세요')
    })

    it('should handle network timeouts with retry logic', async () => {
      // Arrange
      const timeoutError: TranscriptResult = {
        success: false,
        error: 'Network timeout',
        method: TranscriptMethod.INNERTUBE,
        responseTime: 30000
      }
      
      const retrySuccess: TranscriptResult = {
        success: true,
        transcript: 'Retry successful',
        method: TranscriptMethod.INNERTUBE,
        responseTime: 2000,
        isKorean: false
      }
      
      jest.spyOn(extractor, 'tryMethod')
        .mockResolvedValueOnce(timeoutError)
        .mockResolvedValueOnce(retrySuccess)
      
      // Act
      const result = await extractor.extractTranscript(testVideoId, { maxRetries: 1 })
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.transcript).toBe('Retry successful')
    })

    it('should throw appropriate error when all methods fail', async () => {
      // Arrange
      const failedResult: TranscriptResult = {
        success: false,
        error: 'No captions available',
        method: TranscriptMethod.INNERTUBE,
        responseTime: 1000
      }
      
      jest.spyOn(extractor, 'tryMethod').mockResolvedValue(failedResult)
      
      // Act & Assert
      await expect(extractor.extractTranscript(testVideoId))
        .rejects.toThrow('This video does not have captions available')
    })

    it('should respect rate limiting', async () => {
      // Arrange
      const startTime = Date.now()
      
      // Act
      await extractor.extractTranscript(testVideoId)
      await extractor.extractTranscript(testVideoId)
      
      const endTime = Date.now()
      
      // Assert - should have some delay between requests
      expect(endTime - startTime).toBeGreaterThan(100)
    })
  })

  describe('validateVideoId', () => {
    it('should accept valid YouTube video IDs', () => {
      const validIds = [
        'dQw4w9WgXcQ',
        '9bZkp7q19f0',
        'BaW_jenozKc'
      ]
      
      validIds.forEach(id => {
        expect(() => extractor.validateVideoId(id)).not.toThrow()
      })
    })

    it('should reject invalid video IDs', () => {
      const invalidIds = [
        '',
        'invalid',
        '123',
        'toolongtobeavalidyoutubevideoid',
        'invalid-chars!'
      ]
      
      invalidIds.forEach(id => {
        expect(() => extractor.validateVideoId(id)).toThrow()
      })
    })
  })

  describe('sanitizeTranscript', () => {
    it('should remove HTML entities and normalize whitespace', () => {
      const input = 'Hello&amp;world   &lt;test&gt;   &quot;quotes&quot;'
      const expected = 'Hello&world <test> "quotes"'
      
      const result = extractor.sanitizeTranscript(input)
      
      expect(result).toBe(expected)
    })

    it('should handle Korean text correctly', () => {
      const input = '안녕하세요   여러분   &amp; 환영합니다'
      const expected = '안녕하세요 여러분 & 환영합니다'
      
      const result = extractor.sanitizeTranscript(input)
      
      expect(result).toBe(expected)
    })
  })

  describe('performance and reliability', () => {
    it('should complete extraction within reasonable time limit', async () => {
      // Arrange
      const mockResult: TranscriptResult = {
        success: true,
        transcript: 'Quick response',
        method: TranscriptMethod.INNERTUBE,
        responseTime: 500,
        isKorean: false
      }
      
      jest.spyOn(extractor, 'tryMethod').mockResolvedValueOnce(mockResult)
      
      // Act
      const startTime = Date.now()
      const result = await extractor.extractTranscript(testVideoId)
      const endTime = Date.now()
      
      // Assert
      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(5000) // 5 seconds max
    })

    it('should handle concurrent requests safely', async () => {
      // Arrange
      const mockResult: TranscriptResult = {
        success: true,
        transcript: 'Concurrent test',
        method: TranscriptMethod.INNERTUBE,
        responseTime: 1000,
        isKorean: false
      }
      
      jest.spyOn(extractor, 'tryMethod').mockResolvedValue(mockResult)
      
      // Act
      const promises = Array(5).fill(null).map(() => 
        extractor.extractTranscript(testVideoId)
      )
      
      const results = await Promise.all(promises)
      
      // Assert
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.transcript).toBe('Concurrent test')
      })
    })
  })
})