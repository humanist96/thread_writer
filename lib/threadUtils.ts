// Thread 유틸리티 함수들

/**
 * 텍스트 길이를 계산 (한글 기준)
 */
export function getTextLength(text: string): number {
  return text.length
}

/**
 * Thread 내용을 350자로 제한
 */
export function limitThreadLength(content: string, maxLength: number = 350): string {
  if (content.length <= maxLength) {
    return content
  }
  
  // 350자에서 자르되, 단어 중간에서 자르지 않도록 처리
  let truncated = content.substring(0, maxLength)
  
  // 마지막 공백 또는 문장 구분자에서 자르기
  const lastSpace = truncated.lastIndexOf(' ')
  const lastPeriod = truncated.lastIndexOf('.')
  const lastNewline = truncated.lastIndexOf('\n')
  
  const cutPoint = Math.max(lastSpace, lastPeriod, lastNewline)
  
  if (cutPoint > maxLength * 0.8) { // 80% 이상이면 그 지점에서 자르기
    truncated = content.substring(0, cutPoint)
  }
  
  return truncated.trim() + (truncated.length < content.length ? '...' : '')
}

/**
 * Thread 배열의 모든 항목을 350자로 제한
 */
export function limitAllThreads(threads: Array<{id: string, content: string, order: number}>): Array<{id: string, content: string, order: number}> {
  return threads.map(thread => ({
    ...thread,
    content: limitThreadLength(thread.content, 350)
  }))
}

/**
 * Thread 내용 유효성 검사
 */
export function validateThread(content: string): {isValid: boolean, length: number, message: string} {
  const length = getTextLength(content)
  
  if (length === 0) {
    return {
      isValid: false,
      length,
      message: '내용이 비어있습니다.'
    }
  }
  
  if (length > 350) {
    return {
      isValid: false,
      length,
      message: `내용이 너무 깁니다. (${length}자/350자)`
    }
  }
  
  return {
    isValid: true,
    length,
    message: `유효한 길이입니다. (${length}자/350자)`
  }
}

/**
 * 결합된 Thread 내용을 350자 단위로 분할
 */
export function splitCombinedThread(combinedContent: string): string[] {
  const chunks: string[] = []
  let currentChunk = ''
  
  const sentences = combinedContent.split(/(?<=[.!?])\s+/)
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= 350) {
      currentChunk += (currentChunk ? ' ' : '') + sentence
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        // 문장 자체가 350자를 초과하는 경우
        chunks.push(limitThreadLength(sentence, 350))
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}