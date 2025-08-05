import { YoutubeTranscript } from 'youtube-transcript'

export interface SimpleTranscriptResult {
  success: boolean
  transcript?: string
  error?: string
  isKorean?: boolean
}

export async function getSimpleTranscript(videoId: string): Promise<SimpleTranscriptResult> {
  console.log(`[SimpleTranscript] Extracting transcript for video: ${videoId}`)
  
  try {
    // Try multiple language options
    const languageOptions = ['ko', 'en', 'auto']
    let lastError: Error | null = null
    
    for (const lang of languageOptions) {
      try {
        console.log(`[SimpleTranscript] Trying language: ${lang}`)
        
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: lang === 'auto' ? undefined : lang,
        })
        
        if (!transcriptData || transcriptData.length === 0) {
          console.log(`[SimpleTranscript] No data for language: ${lang}`)
          continue
        }
        
        const transcript = transcriptData
          .map((entry: any) => {
            // Handle different response formats
            const text = entry.text || entry.snippet || entry.content || ''
            return text.toString()
          })
          .filter(text => text.length > 0)
          .join(' ')
          .replace(/\s+/g, ' ')
          .replace(/\[.*?\]/g, '') // Remove [Music] type annotations
          .trim()
        
        if (!transcript || transcript.length < 10) {
          console.log(`[SimpleTranscript] Transcript too short for language: ${lang}`)
          continue
        }
        
        const isKorean = /[가-힣]/.test(transcript)
        console.log(`[SimpleTranscript] Success! Language: ${lang}, Is Korean: ${isKorean}, Length: ${transcript.length}`)
        
        return {
          success: true,
          transcript,
          isKorean
        }
      } catch (error: any) {
        console.error(`[SimpleTranscript] Error with language ${lang}:`, error.message)
        lastError = error
      }
    }
    
    // If all language attempts failed, try without language specification
    try {
      console.log(`[SimpleTranscript] Trying without language specification`)
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId)
      
      if (transcriptData && transcriptData.length > 0) {
        const transcript = transcriptData
          .map((entry: any) => entry.text || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        
        if (transcript && transcript.length >= 10) {
          return {
            success: true,
            transcript,
            isKorean: /[가-힣]/.test(transcript)
          }
        }
      }
    } catch (error: any) {
      console.error(`[SimpleTranscript] Final attempt error:`, error.message)
      lastError = error
    }
    
    // Parse error messages for better user feedback
    const errorMessage = lastError?.message || 'Unknown error'
    
    if (errorMessage.includes('Could not find') || errorMessage.includes('Transcript is disabled')) {
      return {
        success: false,
        error: 'No captions available for this video. The video may not have captions enabled.'
      }
    }
    
    if (errorMessage.includes('Video unavailable') || errorMessage.includes('private')) {
      return {
        success: false,
        error: 'Video is unavailable, private, or restricted in your region.'
      }
    }
    
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return {
        success: false,
        error: 'Network error while fetching transcript. Please try again.'
      }
    }
    
    return {
      success: false,
      error: `Failed to extract transcript: ${errorMessage}`
    }
    
  } catch (error: any) {
    console.error('[SimpleTranscript] Unexpected error:', error)
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    }
  }
}

// Alternative method using direct API call (for debugging)
export async function debugTranscriptFetch(videoId: string): Promise<void> {
  console.log(`[DebugTranscript] Testing transcript fetch for: ${videoId}`)
  
  try {
    // Log environment
    console.log('[DebugTranscript] Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    })
    
    // Test basic fetch
    const testUrl = `https://www.youtube.com/watch?v=${videoId}`
    console.log(`[DebugTranscript] Testing URL access: ${testUrl}`)
    
    // Try to get transcript
    const result = await getSimpleTranscript(videoId)
    console.log('[DebugTranscript] Result:', result)
    
  } catch (error: any) {
    console.error('[DebugTranscript] Debug error:', error)
  }
}