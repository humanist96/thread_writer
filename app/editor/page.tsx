'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import Background3D from '@/components/Background3D'
import { useRouter } from 'next/navigation'
import { validateThread, limitThreadLength } from '@/lib/threadUtils'

export default function EditorPage() {
  const router = useRouter()
  const { threads, summary, selectedVideo, updateThread, currentThread } = useStore()
  const [copiedContent, setCopiedContent] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [combinedContent, setCombinedContent] = useState('')
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit')
  const [validation, setValidation] = useState<{isValid: boolean, length: number, message: string}>({
    isValid: true,
    length: 0,
    message: ''
  })
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle hydration state
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    // Only check for redirect after hydration is complete
    if (!isHydrated) return

    // Give some time for the store to fully update
    const timer = setTimeout(() => {
      // Use currentThread if available, otherwise fall back to threads
      const threadsToUse = currentThread?.threads || threads
      
      // Only redirect if we're sure there's no data after hydration
      if (!currentThread && !selectedVideo && threadsToUse.length === 0) {
        router.push('/')
      } else if (threadsToUse.length > 0 || currentThread) {
        // Initialize combined content when threads are loaded
        let combined = threadsToUse
          .sort((a, b) => a.order - b.order)
          .map(thread => thread.content)
          .join('\n\n')
        
        // Apply 350 character limit to combined content
        if (combined.length > 350) {
          combined = limitThreadLength(combined, 350)
        }
        
        setCombinedContent(combined)
        setValidation(validateThread(combined))
      } else {
        // Handle case where currentThread exists but has no threads (e.g., transcript failed)
        setCombinedContent('')
        setValidation(validateThread(''))
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [threads, currentThread, router, selectedVideo, isHydrated])

  const handleCopy = () => {
    navigator.clipboard.writeText(combinedContent)
    setCopiedContent(combinedContent)
    setTimeout(() => setCopiedContent(null), 2000)
  }

  const handleRegenerate = async () => {
    if (!combinedContent) return
    
    setIsRegenerating(true)
    try {
      const response = await fetch('/api/regenerate-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: combinedContent,
          instruction: 'Make it more engaging and impactful. Improve the structure and flow.'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const limitedContent = limitThreadLength(data.content, 350)
        setCombinedContent(limitedContent)
        setValidation(validateThread(limitedContent))
      } else {
        alert('AI 재작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Regenerate error:', error)
      alert('AI 재작성 중 오류가 발생했습니다.')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSaveToSheets = async () => {
    if (!selectedVideo) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/sheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          videoTitle: selectedVideo.title,
          channelTitle: selectedVideo.channelTitle,
          summary,
          threads: [combinedContent], // Save as single combined thread
          createdAt: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        const message = result.message || '저장되었습니다!'
        
        if (result.method === 'google_sheets_api') {
          alert(`✅ ${message}\n\n방법: Google Sheets API`)
        } else if (result.method === 'google_apps_script') {
          alert(`✅ ${message}\n\n방법: Google Apps Script`)
        } else if (result.method === 'manual_copy_required') {
          // 수동 복사가 필요한 경우
          const clipboardData = result.clipboardData
          const textToCopy = [
            clipboardData.timestamp,
            clipboardData.videoId,
            clipboardData.videoTitle,
            clipboardData.channelTitle,
            clipboardData.summary,
            clipboardData.threadContent,
            new Date().toISOString(),
            clipboardData.characterCount
          ].join('\t')
          
          // 클립보드에 복사
          navigator.clipboard.writeText(textToCopy).then(() => {
            alert(`📋 데이터가 클립보드에 복사되었습니다!\n\n${message}\n\n클릭하면 Google Sheets가 열립니다.`)
            // Google Sheets 열기
            window.open(result.result.googleSheetsUrl, '_blank')
          }).catch(() => {
            alert(`⚠️ ${message}\n\n수동으로 복사해주세요.`)
          })
        } else if (result.method === 'local_fallback') {
          alert(`⚠️ Google Sheets 연결 실패\n로컬에 임시 저장되었습니다.\n\n설정 가이드: GOOGLE_SHEETS_SETUP.md 참조`)
        } else {
          alert(`✅ ${message}`)
        }
      } else {
        const errorData = await response.json()
        alert(`저장 실패: ${errorData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Google Sheets 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // Check if we should show the "No Threads Available" screen
  const hasContent = currentThread || threads.length > 0 || selectedVideo
  
  // Don't show "No Threads" screen until hydration is complete
  if (!isHydrated) {
    return (
      <main className="min-h-screen relative">
        <Background3D />
        <div className="relative z-10 container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
        </div>
      </main>
    )
  }
  
  if (!hasContent) {
    return (
      <main className="min-h-screen relative">
        <Background3D />
        
        <div className="relative z-10 container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <button
              onClick={() => router.push('/')}
              className="mb-4 text-white/60 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Search
            </button>
            
            <h1 className="text-4xl font-bold text-white mb-2">Thread Editor</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center py-20"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-4">No Threads Available</h2>
              <p className="text-white/60 mb-8">
                It looks like you haven't generated any threads yet. Go back to search for a video and create some AI-powered thread content!
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Search for Videos
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative">
      <Background3D />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-white/60 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </button>
          
          <h1 className="text-4xl font-bold text-white mb-2">Thread Editor</h1>
          {selectedVideo && (
            <p className="text-white/60">
              Based on: <span className="text-white">{selectedVideo.title}</span>
            </p>
          )}
        </motion.div>

        {/* Summary Section */}
        {(currentThread?.summary || summary) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl"
          >
            <h2 className="text-xl font-semibold text-white mb-3">Summary</h2>
            <p className="text-white/80">{currentThread?.summary || summary}</p>
          </motion.div>
        )}

        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setPreviewMode('edit')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              previewMode === 'edit'
                ? 'bg-primary text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
          >
            편집 모드
          </button>
          <button
            onClick={() => setPreviewMode('preview')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              previewMode === 'preview'
                ? 'bg-primary text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
          >
            미리보기
          </button>
        </div>

        {/* Combined Thread Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Thread 내용</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || !combinedContent}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isRegenerating 
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isRegenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      AI 재작성 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      AI 재작성
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {previewMode === 'edit' ? (
              <div className="space-y-2">
                <textarea
                  value={combinedContent}
                  onChange={(e) => {
                    setCombinedContent(e.target.value)
                    setValidation(validateThread(e.target.value))
                  }}
                  className={`w-full h-96 bg-black/30 text-white font-mono text-sm p-4 rounded-lg border focus:outline-none resize-none ${
                    validation.isValid 
                      ? 'border-white/20 focus:border-primary' 
                      : 'border-red-500 focus:border-red-400'
                  }`}
                  placeholder="Thread 내용이 여기에 표시됩니다..."
                />
                <div className={`text-sm ${validation.isValid ? 'text-green-400' : 'text-red-400'}`}>
                  {validation.message}
                </div>
              </div>
            ) : (
              <div className="w-full h-96 bg-black/30 text-white p-4 rounded-lg border border-white/20 overflow-y-auto">
                <div 
                  className="prose prose-invert max-w-none whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: combinedContent.replace(/\n/g, '<br>') 
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap gap-4"
        >
          <button
            onClick={handleCopy}
            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copiedContent ? '복사됨!' : '내용 복사'}
          </button>
          
          <button
            onClick={handleSaveToSheets}
            disabled={isSaving || !combinedContent}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isSaving || !combinedContent
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                </svg>
                Google Sheets에 저장
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU'}/edit`
              window.open(sheetUrl, '_blank')
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Google Sheets 열기
          </button>
        </motion.div>
      </div>
    </main>
  )
}