import { EnhancedTranscriptExtractor } from './enhanced-transcript'
import { TranscriptOptions } from './types/transcript'

export interface TranscriptEntry {
  text: string
  start: number
  duration: number
  offset?: number
}

// Global enhanced extractor instance
const enhancedExtractor = new EnhancedTranscriptExtractor({
  defaultTimeout: 30000,
  maxRetries: 3,
  rateLimitDelay: 1000,
  cacheEnabled: true,
  cacheTTL: 3600000,
  fallbackToManual: true
})

export async function getYouTubeTranscript(
  videoId: string, 
  options?: TranscriptOptions
): Promise<string> {
  console.log(`[Transcript] Starting enhanced extraction for video: ${videoId}`)
  
  try {
    const result = await enhancedExtractor.extractTranscript(videoId, options)
    
    if (!result.success || !result.transcript) {
      throw new Error(result.error || 'Failed to extract transcript')
    }
    
    console.log(`[Transcript] Successfully extracted transcript using ${result.method}`)
    console.log(`[Transcript] Response time: ${result.responseTime}ms`)
    console.log(`[Transcript] Is Korean: ${result.isKorean}`)
    console.log(`[Transcript] Length: ${result.transcript.length} characters`)
    
    return result.transcript
    
  } catch (error: any) {
    console.error('[Transcript] Enhanced extraction failed:', error.message)
    
    // Log metrics for debugging
    const metrics = enhancedExtractor.getMetrics()
    console.log('[Transcript] Current metrics:', {
      successRate: metrics.totalAttempts > 0 
        ? `${((metrics.successfulAttempts / metrics.totalAttempts) * 100).toFixed(2)}%`
        : '0%',
      totalAttempts: metrics.totalAttempts,
      averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
      koreanSuccessRate: metrics.koreanContentStats.attempts > 0
        ? `${((metrics.koreanContentStats.successes / metrics.koreanContentStats.attempts) * 100).toFixed(2)}%`
        : '0%'
    })
    
    throw error
  }
}

// Legacy function for backward compatibility
export async function getYouTubeTranscriptLegacy(videoId: string): Promise<string> {
  return getYouTubeTranscript(videoId)
}

// Export enhanced extractor for advanced usage
export { enhancedExtractor as transcriptExtractor }

export function formatTranscriptForDisplay(transcript: string, maxLength: number = 1000): string {
  if (transcript.length <= maxLength) {
    return transcript
  }
  
  return transcript.substring(0, maxLength) + '...'
}