import Anthropic from '@anthropic-ai/sdk'
import { limitAllThreads } from './threadUtils'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ThreadContent {
  summary: string
  threads: Array<{
    id: string
    content: string
    order: number
  }>
}

export async function generateThreadFromTranscript(
  transcript: string,
  videoTitle: string,
  videoDescription: string
): Promise<ThreadContent> {
  console.log('[Anthropic] Starting thread generation...')
  console.log(`[Anthropic] Video title: ${videoTitle}`)
  console.log(`[Anthropic] Transcript length: ${transcript.length} characters`)
  
  try {
    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }
    
    // Detect language (Korean or English)
    const isKorean = /[가-힣]/.test(transcript)
    const language = isKorean ? 'Korean' : 'English'
    
    const prompt = `You are an expert social media content creator who can work in multiple languages. Based on the following YouTube video transcript, create engaging Twitter/X thread content.

Video Title: ${videoTitle}
Video Description: ${videoDescription}
Language: ${language}

Transcript:
${transcript.substring(0, 3000)}${transcript.length > 3000 ? '...' : ''}

CRITICAL REQUIREMENTS:
1. Create content in the SAME LANGUAGE as the transcript (${language})
2. Provide a concise summary (100-300 characters) of the main points
3. Create a thread of ONLY 2-3 tweets that:
   - Starts with an engaging hook (MAX 350 chars)
   - Key insight (MAX 350 chars)  
   - Call-to-action (MAX 350 chars)
   - ⚠️ ABSOLUTE 350 CHARACTER LIMIT per tweet
   - ⚠️ COUNT CHARACTERS INCLUDING EMOJIS
   - Remove all unnecessary words, articles, conjunctions
   - Use short sentences and bullet points
   - Be ultra-concise and direct

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "summary": "Brief summary in ${language}",
  "threads": [
    {"content": "First tweet content in ${language}", "order": 1},
    {"content": "Second tweet content in ${language}", "order": 2},
    {"content": "Third tweet content in ${language}", "order": 3},
    {"content": "Fourth tweet content in ${language}", "order": 4},
    {"content": "Fifth tweet content in ${language}", "order": 5}
  ]
}

Do not include any text before or after the JSON. Return only the JSON object.`

    console.log('[Anthropic] Sending request to Claude API...')
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }],
    })

    console.log('[Anthropic] Received response from Claude API')
    
    const content = response.content[0]
    if (content.type === 'text') {
      console.log('[Anthropic] Response text length:', content.text.length)
      
      // Try to extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        console.log('[Anthropic] Found JSON in response')
        
        try {
          const parsed = JSON.parse(jsonMatch[0])
          console.log('[Anthropic] Successfully parsed JSON')
          console.log(`[Anthropic] Generated ${parsed.threads?.length || 0} threads`)
          
          const threads = (parsed.threads || []).map((t: any, index: number) => ({
            id: `thread-${index + 1}`,
            content: t.content || '',
            order: t.order || index + 1
          }))

          // Thread 길이를 350자로 강제 제한
          const limitedThreads = limitAllThreads(threads)
          
          // 각 Thread가 실제로 350자 이하인지 재확인
          const validatedThreads = limitedThreads.map(thread => ({
            ...thread,
            content: thread.content.length > 350 
              ? thread.content.substring(0, 347) + '...'
              : thread.content
          }))
          
          console.log(`[Anthropic] Applied 350-character limit to ${validatedThreads.length} threads`)
          validatedThreads.forEach((thread, index) => {
            console.log(`[Anthropic] Thread ${index + 1}: ${thread.content.length} characters`)
          })
          
          return {
            summary: parsed.summary || 'Summary not available',
            threads: validatedThreads
          }
        } catch (parseError) {
          console.error('[Anthropic] JSON parse error:', parseError)
          throw new Error('Failed to parse JSON response from AI')
        }
      } else {
        console.error('[Anthropic] No JSON found in response:', content.text.substring(0, 200))
        throw new Error('AI response did not contain valid JSON')
      }
    } else {
      console.error('[Anthropic] Unexpected response type:', content.type)
      throw new Error('Unexpected response format from AI')
    }
  } catch (error: any) {
    console.error('[Anthropic] Error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      stack: error.stack
    })
    
    // Provide more specific error messages
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY.')
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.')
    } else if (error.status === 500) {
      throw new Error('Anthropic API server error. Please try again.')
    } else if (error.message?.includes('JSON')) {
      throw new Error(error.message)
    } else {
      throw new Error(`Failed to generate thread content: ${error.message}`)
    }
  }
}