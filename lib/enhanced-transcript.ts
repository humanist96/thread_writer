import { 
  TranscriptMethod, 
  TranscriptResult, 
  TranscriptOptions, 
  TranscriptCache,
  TranscriptMetrics,
  TranscriptExtractorConfig,
  CaptionTrack
} from './types/transcript'
import { YoutubeTranscript } from 'youtube-transcript'
import { Innertube } from 'youtubei.js'
import axios from 'axios'

export class EnhancedTranscriptExtractor {
  private config: TranscriptExtractorConfig
  private cache: Map<string, TranscriptCache> = new Map()
  private metrics: TranscriptMetrics
  private lastRequestTime: number = 0

  constructor(config?: Partial<TranscriptExtractorConfig>) {
    this.config = {
      defaultTimeout: 30000,
      maxRetries: 3,
      rateLimitDelay: 1000,
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour
      preferredMethods: [
        TranscriptMethod.INNERTUBE,
        TranscriptMethod.YOUTUBE_TRANSCRIPT,
        TranscriptMethod.YT_DLP,
        TranscriptMethod.YOUTUBE_API
      ],
      fallbackToManual: true,
      ...config
    }

    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageResponseTime: 0,
      methodStats: {} as any,
      errorCounts: {},
      koreanContentStats: { attempts: 0, successes: 0 }
    }

    // Initialize method stats
    Object.values(TranscriptMethod).forEach(method => {
      this.metrics.methodStats[method] = {
        attempts: 0,
        successes: 0,
        averageTime: 0
      }
    })
  }

  async extractTranscript(
    videoId: string, 
    options: TranscriptOptions = {}
  ): Promise<TranscriptResult> {
    const startTime = Date.now()
    
    try {
      this.validateVideoId(videoId)
      await this.enforceRateLimit()

      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getCachedTranscript(videoId)
        if (cached) {
          console.log(`[EnhancedTranscript] Using cached transcript for ${videoId}`)
          return {
            success: true,
            transcript: cached.transcript,
            method: cached.method,
            responseTime: Date.now() - startTime,
            isKorean: cached.isKorean
          }
        }
      }

      const mergedOptions = { ...this.getDefaultOptions(), ...options }
      
      // Try each method in order
      for (const method of this.config.preferredMethods) {
        console.log(`[EnhancedTranscript] Trying method: ${method}`)
        
        const result = await this.tryMethodWithRetry(videoId, method, mergedOptions)
        
        if (result.success && result.transcript) {
          // Cache successful result
          if (this.config.cacheEnabled) {
            this.cacheTranscript(videoId, result)
          }
          
          this.recordMetrics(result, startTime)
          return result
        }
        
        console.log(`[EnhancedTranscript] Method ${method} failed: ${result.error}`)
      }

      // All methods failed
      const finalResult: TranscriptResult = {
        success: false,
        error: 'All transcript extraction methods failed',
        method: TranscriptMethod.INNERTUBE,
        responseTime: Date.now() - startTime
      }

      this.recordMetrics(finalResult, startTime)
      throw new Error(this.getErrorMessage(finalResult.error || 'Unknown error'))

    } catch (error: any) {
      console.error('[EnhancedTranscript] Extraction error:', error.message)
      
      const failedResult: TranscriptResult = {
        success: false,
        error: error.message,
        method: TranscriptMethod.INNERTUBE,
        responseTime: Date.now() - startTime
      }
      
      this.recordMetrics(failedResult, startTime)
      throw error
    }
  }

  async tryMethodWithRetry(
    videoId: string, 
    method: TranscriptMethod, 
    options: TranscriptOptions
  ): Promise<TranscriptResult> {
    const maxRetries = options.maxRetries || this.config.maxRetries
    let lastError: string = ''

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.tryMethod(videoId, method, options)
        
        if (result.success) {
          result.retryCount = attempt
          return result
        }
        
        lastError = result.error || 'Unknown error'
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          console.log(`[EnhancedTranscript] Retrying ${method} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await this.sleep(delay)
        }
        
      } catch (error: any) {
        lastError = error.message
        console.error(`[EnhancedTranscript] Method ${method} attempt ${attempt + 1} error:`, error.message)
      }
    }

    return {
      success: false,
      error: lastError,
      method,
      responseTime: 0,
      retryCount: maxRetries
    }
  }

  async tryMethod(
    videoId: string, 
    method: TranscriptMethod, 
    options: TranscriptOptions
  ): Promise<TranscriptResult> {
    const startTime = Date.now()
    
    try {
      let result: TranscriptResult

      switch (method) {
        case TranscriptMethod.INNERTUBE:
          result = await this.extractWithInnertube(videoId, options)
          break
        case TranscriptMethod.YOUTUBE_TRANSCRIPT:
          result = await this.extractWithYoutubeTranscript(videoId, options)
          break
        case TranscriptMethod.YT_DLP:
          result = await this.extractWithYtDlp(videoId, options)
          break
        case TranscriptMethod.YOUTUBE_API:
          result = await this.extractWithYoutubeAPI(videoId, options)
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }

      result.responseTime = Date.now() - startTime
      return result

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        method,
        responseTime: Date.now() - startTime
      }
    }
  }

  private async extractWithInnertube(
    videoId: string, 
    options: TranscriptOptions
  ): Promise<TranscriptResult> {
    console.log(`[Innertube] Starting extraction for ${videoId}`)
    
    const youtube = await Innertube.create({
      cache: undefined as any, // Fix type issue
      generate_session_locally: true
    })

    const info = await youtube.getInfo(videoId)
    
    if (!info.captions?.caption_tracks || info.captions.caption_tracks.length === 0) {
      throw new Error('No captions available for this video')
    }

    const tracks = info.captions.caption_tracks
    console.log(`[Innertube] Found ${tracks.length} caption tracks`)

    // Select best track based on preferences
    const selectedTrack = this.selectBestTrack(tracks, options.preferredLanguages)
    
    if (!selectedTrack || !selectedTrack.base_url) {
      throw new Error('No suitable caption track found')
    }

    console.log(`[Innertube] Selected track: ${selectedTrack.language_code}`)

    // Fetch transcript XML
    const response = await axios.get(selectedTrack.base_url, {
      timeout: options.timeoutMs || this.config.defaultTimeout
    })

    const transcript = this.parseTranscriptXML(response.data)
    const isKorean = this.detectKorean(transcript)

    return {
      success: true,
      transcript,
      method: TranscriptMethod.INNERTUBE,
      responseTime: 0,
      isKorean
    }
  }

  private async extractWithYoutubeTranscript(
    videoId: string, 
    options: TranscriptOptions
  ): Promise<TranscriptResult> {
    console.log(`[YouTubeTranscript] Starting extraction for ${videoId}`)

    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId)
    
    if (!transcriptData || transcriptData.length === 0) {
      throw new Error('No transcript data available')
    }

    const transcript = transcriptData
      .map((entry: any) => entry.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!transcript) {
      throw new Error('Empty transcript after processing')
    }

    const isKorean = this.detectKorean(transcript)

    return {
      success: true,
      transcript: this.sanitizeTranscript(transcript),
      method: TranscriptMethod.YOUTUBE_TRANSCRIPT,
      responseTime: 0,
      isKorean
    }
  }

  private async extractWithYtDlp(
    videoId: string, 
    options: TranscriptOptions
  ): Promise<TranscriptResult> {
    console.log(`[YtDlp] Starting extraction for ${videoId}`)
    
    // TODO: Implement yt-dlp extraction
    // This would require spawning a child process and parsing subtitle files
    throw new Error('YT-DLP method not yet implemented')
  }

  private async extractWithYoutubeAPI(
    videoId: string, 
    options: TranscriptOptions
  ): Promise<TranscriptResult> {
    console.log(`[YouTubeAPI] Starting extraction for ${videoId}`)
    
    // TODO: Implement YouTube Data API v3 captions
    // This would require API key and proper caption track handling
    throw new Error('YouTube API method not yet implemented')
  }

  private selectBestTrack(tracks: any[], preferredLanguages?: string[]): any {
    const preferences = preferredLanguages || ['ko', 'ko-KR', 'en', 'en-US']
    
    // First try to find exact language match
    for (const lang of preferences) {
      const track = tracks.find(t => t.language_code === lang)
      if (track) return track
    }

    // Fallback to first available track
    return tracks[0]
  }

  private parseTranscriptXML(xml: string): string {
    const textMatches = xml.match(/<text[^>]*>([^<]+)<\/text>/g) || []
    
    if (textMatches.length === 0) {
      throw new Error('No text segments found in transcript XML')
    }

    const text = textMatches
      .map(match => {
        const textContent = match.replace(/<[^>]+>/g, '')
        return this.decodeHtmlEntities(textContent)
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) {
      throw new Error('Empty transcript after XML parsing')
    }

    return text
  }

  public validateVideoId(videoId: string): void {
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Video ID is required')
    }

    // YouTube video ID validation (11 characters, alphanumeric + - and _)
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/
    if (!videoIdRegex.test(videoId)) {
      throw new Error('Invalid YouTube video ID format')
    }
  }

  public sanitizeTranscript(text: string): string {
    return this.decodeHtmlEntities(text)
      .replace(/\s+/g, ' ')
      .trim()
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
  }

  private detectKorean(text: string): boolean {
    return /[가-힣]/.test(text)
  }

  private getCachedTranscript(videoId: string): TranscriptCache | null {
    const cached = this.cache.get(videoId)
    
    if (!cached) return null
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.config.cacheTTL) {
      this.cache.delete(videoId)
      return null
    }
    
    return cached
  }

  private cacheTranscript(videoId: string, result: TranscriptResult): void {
    if (!result.transcript) return

    this.cache.set(videoId, {
      videoId,
      transcript: result.transcript,
      method: result.method,
      timestamp: Date.now(),
      isKorean: result.isKorean || false,
      language: result.isKorean ? 'ko' : 'en'
    })

    // Clean up old cache entries if too many
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
  }

  private async enforceRateLimit(): Promise<void> {
    if (!this.config.rateLimitDelay) return

    const timeSinceLastRequest = Date.now() - this.lastRequestTime
    
    if (timeSinceLastRequest < this.config.rateLimitDelay) {
      const delay = this.config.rateLimitDelay - timeSinceLastRequest
      console.log(`[EnhancedTranscript] Rate limiting: waiting ${delay}ms`)
      await this.sleep(delay)
    }
    
    this.lastRequestTime = Date.now()
  }

  private recordMetrics(result: TranscriptResult, startTime: number): void {
    this.metrics.totalAttempts++
    
    if (result.success) {
      this.metrics.successfulAttempts++
      this.metrics.methodStats[result.method].successes++
      
      if (result.isKorean) {
        this.metrics.koreanContentStats.successes++
      }
    } else {
      this.metrics.failedAttempts++
      
      if (result.error) {
        this.metrics.errorCounts[result.error] = (this.metrics.errorCounts[result.error] || 0) + 1
      }
    }

    this.metrics.methodStats[result.method].attempts++
    
    const responseTime = result.responseTime || (Date.now() - startTime)
    this.updateAverageTime(this.metrics.methodStats[result.method], responseTime)
    this.updateAverageTime(this.metrics, responseTime)

    if (result.isKorean !== undefined) {
      this.metrics.koreanContentStats.attempts++
    }
  }

  private updateAverageTime(stats: any, newTime: number): void {
    if (!stats.averageTime || stats.averageTime === 0) {
      stats.averageTime = newTime
    } else {
      stats.averageTime = (stats.averageTime + newTime) / 2
    }
  }

  private getDefaultOptions(): TranscriptOptions {
    return {
      maxRetries: this.config.maxRetries,
      timeoutMs: this.config.defaultTimeout,
      preferredLanguages: ['ko', 'ko-KR', 'en', 'en-US'],
      allowAutoGenerated: true,
      enableRateLimiting: true
    }
  }

  private getErrorMessage(error: string): string {
    if (error.includes('No captions') || error.includes('transcript')) {
      return 'This video does not have captions available. Please select another video.'
    } else if (error.includes('unavailable') || error.includes('private')) {
      return 'This video is unavailable or private.'
    } else if (error.includes('video ID') || error.includes('Invalid')) {
      return 'Invalid video ID provided.'
    }
    
    return 'Failed to extract transcript. The video may not have captions enabled.'
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public getMetrics(): TranscriptMetrics {
    return { ...this.metrics }
  }

  public clearCache(): void {
    this.cache.clear()
  }

  public resetMetrics(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageResponseTime: 0,
      methodStats: {} as any,
      errorCounts: {},
      koreanContentStats: { attempts: 0, successes: 0 }
    }

    Object.values(TranscriptMethod).forEach(method => {
      this.metrics.methodStats[method] = {
        attempts: 0,
        successes: 0,
        averageTime: 0
      }
    })
  }
}