import { 
  getTextLength, 
  limitThreadLength, 
  limitAllThreads, 
  validateThread,
  splitCombinedThread 
} from '../lib/threadUtils'

describe('threadUtils', () => {
  describe('getTextLength', () => {
    test('한글 텍스트 길이 계산', () => {
      expect(getTextLength('안녕하세요')).toBe(5)
      expect(getTextLength('Hello World')).toBe(11)
      expect(getTextLength('한글과 English 섞인 텍스트')).toBe(18)
    })

    test('빈 문자열 처리', () => {
      expect(getTextLength('')).toBe(0)
    })
  })

  describe('limitThreadLength', () => {
    test('350자 이내 텍스트는 그대로 반환', () => {
      const text = '짧은 텍스트입니다.'
      expect(limitThreadLength(text)).toBe(text)
    })

    test('350자 초과 텍스트는 제한', () => {
      const longText = '가'.repeat(400)
      const result = limitThreadLength(longText)
      expect(result.length).toBeLessThanOrEqual(350 + 3) // +3 for '...'
      expect(result.endsWith('...')).toBe(true)
    })

    test('사용자 정의 최대 길이', () => {
      const text = '가'.repeat(100)
      const result = limitThreadLength(text, 50)
      expect(result.length).toBeLessThanOrEqual(53) // 50 + 3 for '...'
    })

    test('문장 단위로 자르기', () => {
      const text = '첫 번째 문장입니다. ' + '가'.repeat(340) + ' 마지막 문장입니다.'
      const result = limitThreadLength(text)
      expect(result.length).toBeLessThanOrEqual(353) // 350 + 3 for '...'
    })
  })

  describe('limitAllThreads', () => {
    test('모든 Thread 길이 제한', () => {
      const threads = [
        { id: '1', content: '짧은 내용', order: 1 },
        { id: '2', content: '가'.repeat(400), order: 2 },
        { id: '3', content: '보통 길이 내용입니다.', order: 3 }
      ]

      const result = limitAllThreads(threads)
      
      expect(result).toHaveLength(3)
      expect(result[0].content).toBe('짧은 내용')
      expect(result[1].content.length).toBeLessThanOrEqual(353)
      expect(result[1].content.endsWith('...')).toBe(true)
      expect(result[2].content).toBe('보통 길이 내용입니다.')
    })
  })

  describe('validateThread', () => {
    test('유효한 Thread 검증', () => {
      const text = '유효한 길이의 Thread 내용입니다.'
      const result = validateThread(text)
      expect(result.isValid).toBe(true)
      expect(result.length).toBe(text.length) // 실제 길이로 수정
      expect(result.message).toContain('유효한 길이')
    })

    test('빈 내용 검증', () => {
      const result = validateThread('')
      expect(result.isValid).toBe(false)
      expect(result.length).toBe(0)
      expect(result.message).toContain('비어있습니다')
    })

    test('너무 긴 내용 검증', () => {
      const longText = '가'.repeat(400)
      const result = validateThread(longText)
      expect(result.isValid).toBe(false)
      expect(result.length).toBe(400)
      expect(result.message).toContain('너무 깁니다')
    })
  })

  describe('splitCombinedThread', () => {
    test('짧은 내용은 분할하지 않음', () => {
      const content = '짧은 Thread 내용입니다.'
      const result = splitCombinedThread(content)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(content)
    })

    test('긴 내용을 350자 단위로 분할', () => {
      const sentences = [
        '첫 번째 문장입니다.',
        '두 번째 문장입니다.',
        '세 번째 문장입니다.'
      ]
      const longText = sentences.join(' ').repeat(20) // 매우 긴 텍스트 생성
      
      const result = splitCombinedThread(longText)
      expect(result.length).toBeGreaterThan(1)
      result.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(350)
      })
    })

    test('문장 경계에서 분할', () => {
      const content = '첫 번째 문장입니다. ' + '가'.repeat(330) + ' 마지막 문장입니다.'
      const result = splitCombinedThread(content)
      expect(result.length).toBeGreaterThanOrEqual(2)
    })
  })
})