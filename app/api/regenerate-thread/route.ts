import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { limitThreadLength } from '@/lib/threadUtils'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const { content, instruction } = await request.json()
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const isKorean = /[가-힣]/.test(content)
    const language = isKorean ? 'Korean' : 'English'
    
    const prompt = `You are an expert social media content creator. 

Current thread content:
${content}

User instruction: ${instruction || 'Improve this thread to be more engaging'}

CRITICAL REQUIREMENTS:
1. Rewrite in the SAME LANGUAGE (${language}) as the original
2. Keep the same general message but make it more engaging
3. Use appropriate emojis strategically
4. ⚠️ STRICT 350 CHARACTER LIMIT (Korean text focus)
5. Make it more impactful and shareable
6. Be extremely concise - cut unnecessary words
7. Focus on core message and impact

Return ONLY the improved thread content without any explanation or additional text.`

    console.log('[Regenerate] Sending request to Claude API...')
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: prompt
      }],
    })

    let regeneratedContent = response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : content
    
    // Apply strict 350 character limit
    regeneratedContent = limitThreadLength(regeneratedContent, 350)
    
    // Double-check and force limit if necessary
    if (regeneratedContent.length > 350) {
      regeneratedContent = regeneratedContent.substring(0, 347) + '...'
    }
    
    console.log('[Regenerate] Successfully regenerated thread')
    console.log(`[Regenerate] Applied 350-character limit: ${regeneratedContent.length} characters`)
    
    return NextResponse.json({ 
      content: regeneratedContent,
      originalLength: content.length,
      newLength: regeneratedContent.length
    })
  } catch (error: any) {
    console.error('Thread regeneration error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to regenerate thread' 
    }, { status: 500 })
  }
}