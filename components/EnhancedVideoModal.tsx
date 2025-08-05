'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import TranscriptErrorHandler from './TranscriptErrorHandler'
import ManualTranscriptInput from './ManualTranscriptInput'
import axios from 'axios'
import { useRouter } from 'next/navigation'

interface TranscriptStep {
  id: number
  title: string
  status: 'waiting' | 'in-progress' | 'completed' | 'failed'
  description: string
  error?: string
}

interface ThreadGenerationStep {
  id: number
  title: string
  status: 'waiting' | 'in-progress' | 'completed' | 'failed'
  description: string
  error?: string
}

export default function EnhancedVideoModal() {
  const router = useRouter()
  const { 
    selectedVideo, 
    setSelectedVideo, 
    isGenerating, 
    setIsGenerating,
    currentThread,
    setCurrentThread 
  } = useStore()

  const [transcriptSteps, setTranscriptSteps] = useState<TranscriptStep[]>([
    { id: 1, title: 'Extracting Transcript', status: 'waiting', description: 'Waiting to start' },
    { id: 2, title: 'Generating Thread Content', status: 'waiting', description: 'Waiting for transcript' }
  ])

  const [showManualInput, setShowManualInput] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showNavigationOptions, setShowNavigationOptions] = useState(false)
  const maxRetries = 3

  const updateStep = (stepId: number, updates: Partial<TranscriptStep>) => {
    setTranscriptSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  const resetSteps = () => {
    setTranscriptSteps([
      { id: 1, title: 'Extracting Transcript', status: 'waiting', description: 'Waiting to start' },
      { id: 2, title: 'Generating Thread Content', status: 'waiting', description: 'Waiting for transcript' }
    ])
    setExtractionError(null)
    setRetryCount(0)
    setShowManualInput(false)
    setShowNavigationOptions(false)
  }

  const handleExtractTranscript = async () => {
    if (!selectedVideo) return

    setIsGenerating(true)
    resetSteps()

    try {
      // Step 1: Extract Transcript
      updateStep(1, { status: 'in-progress', description: 'Extracting transcript using multiple methods...' })

      const transcriptResponse = await axios.post('/api/transcript', {
        videoId: selectedVideo.id
      })

      if (!transcriptResponse.data.transcript) {
        throw new Error('No transcript received from API')
      }

      updateStep(1, { 
        status: 'completed', 
        description: `Successfully extracted ${transcriptResponse.data.transcript.length} characters` 
      })

      await generateThread(transcriptResponse.data.transcript)

    } catch (error: any) {
      console.error('Transcript extraction error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
      
      updateStep(1, { 
        status: 'failed', 
        description: 'Failed to extract transcript',
        error: errorMessage
      })

      setExtractionError(errorMessage)
      
      // Stop generating FIRST to ensure UI updates
      setIsGenerating(false)
      
      // Debug logging
      console.log('[EnhancedVideoModal] Transcript extraction failed:', {
        errorMessage,
        retryCount,
        maxRetries,
        willShowNavigationOptions: true
      })
      
      // Then show navigation options
      setTimeout(() => {
        setShowNavigationOptions(true)
        console.log('[EnhancedVideoModal] Navigation options should now be visible')
        
        // Show manual input option if extraction fails after max retries
        if (retryCount >= maxRetries) {
          setShowManualInput(true)
        }
      }, 100) // Small delay to ensure state updates properly
    }
  }

  const handleRetry = async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      console.log(`Retry attempt ${retryCount + 1}/${maxRetries}`)
      // Hide navigation options during retry
      setShowNavigationOptions(false)
      setExtractionError(null)
      await handleExtractTranscript()
    } else {
      setShowManualInput(true)
    }
  }

  const handleManualTranscript = async (manualTranscript: string) => {
    try {
      updateStep(1, { 
        status: 'completed', 
        description: `Manual transcript provided (${manualTranscript.length} characters)` 
      })

      await generateThread(manualTranscript)
      setShowManualInput(false)
      setShowNavigationOptions(false)
    } catch (error: any) {
      console.error('Manual transcript processing error:', error)
      updateStep(1, { 
        status: 'failed', 
        description: 'Failed to process manual transcript',
        error: error.message
      })
    }
  }

  const generateThread = async (transcript: string) => {
    if (!selectedVideo) return

    try {
      // Step 2: Generate Thread
      updateStep(2, { status: 'in-progress', description: 'Generating AI thread content...' })

      const threadResponse = await axios.post('/api/generate-thread', {
        transcript,
        videoTitle: selectedVideo.title,
        videoDescription: selectedVideo.description
      })

      if (!threadResponse.data.threads || threadResponse.data.threads.length === 0) {
        throw new Error('No thread content generated')
      }

      updateStep(2, { 
        status: 'completed', 
        description: `Generated ${threadResponse.data.threads.length} thread posts` 
      })

      const newThread = {
        id: `thread-${Date.now()}`,
        videoId: selectedVideo.id,
        videoTitle: selectedVideo.title,
        videoDescription: selectedVideo.description,
        summary: threadResponse.data.summary,
        threads: threadResponse.data.threads,
        createdAt: new Date().toISOString(),
        transcript
      }
      
      setCurrentThread(newThread)

      // Small delay to ensure store is updated before navigation
      setTimeout(() => {
        setIsGenerating(false)
        router.push('/editor')
      }, 100)

    } catch (error: any) {
      console.error('Thread generation error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate thread'
      
      updateStep(2, { 
        status: 'failed', 
        description: 'Failed to generate thread content',
        error: errorMessage
      })
    } finally {
      // Only set isGenerating to false if navigation didn't happen
      // Navigation case is handled in the success block
      if (!currentThread) {
        setIsGenerating(false)
      }
    }
  }

  const closeModal = () => {
    setSelectedVideo(null)
    setIsGenerating(false)
    resetSteps()
  }

  // Navigate to editor with current video info, even without transcript
  const handleNavigateAnywayToEditor = () => {
    if (!selectedVideo) return

    console.log('[EnhancedVideoModal] Navigating to editor without transcript...')

    // Set current thread with empty or failed transcript
    const newThread = {
      id: `thread-${Date.now()}`,
      videoId: selectedVideo.id,
      videoTitle: selectedVideo.title,
      videoDescription: selectedVideo.description,
      summary: 'Transcript extraction failed. Please add content manually.',
      threads: [],
      createdAt: new Date().toISOString(),
      transcript: '' // Empty transcript since extraction failed
    }
    
    setCurrentThread(newThread)

    // Small delay to ensure store is updated
    setTimeout(() => {
      setIsGenerating(false)
      console.log('[EnhancedVideoModal] Navigating to /editor...')
      router.push('/editor')
    }, 100)
  }

  // Navigate to editor after thread generation failure
  const handleContinueToEditor = () => {
    if (!selectedVideo) return

    // Keep existing thread data if any, or create minimal thread
    if (!currentThread) {
      const newThread = {
        id: `thread-${Date.now()}`,
        videoId: selectedVideo.id,
        videoTitle: selectedVideo.title,
        videoDescription: selectedVideo.description,
        summary: 'Thread generation encountered issues. Please edit manually.',
        threads: [],
        createdAt: new Date().toISOString(),
        transcript: extractionError ? '' : 'Transcript available but thread generation failed'
      }
      
      setCurrentThread(newThread)
    }

    // Small delay to ensure store is updated
    setTimeout(() => {
      setIsGenerating(false)
      router.push('/editor')
    }, 100)
  }

  if (!selectedVideo) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && !isGenerating && closeModal()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 mr-4">
              <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                {selectedVideo.title}
              </h2>
              <p className="text-gray-400 text-sm">
                {selectedVideo.channelTitle} • {selectedVideo.duration}
              </p>
            </div>
            <button
              onClick={closeModal}
              disabled={isGenerating}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Video Thumbnail */}
          <div className="mb-6">
            <img
              src={selectedVideo.thumbnail}
              alt={selectedVideo.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>

          {/* Process Steps */}
          <div className="space-y-4 mb-6">
            {transcriptSteps.map((step) => (
              <motion.div
                key={step.id}
                className={`flex items-center p-4 rounded-lg border ${
                  step.status === 'completed' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : step.status === 'failed'
                    ? 'bg-red-500/10 border-red-500/30'
                    : step.status === 'in-progress'
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-gray-500/10 border-gray-500/30'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: step.id * 0.1 }}
              >
                <div className="flex-shrink-0 mr-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'completed' 
                      ? 'bg-green-500' 
                      : step.status === 'failed'
                      ? 'bg-red-500'
                      : step.status === 'in-progress'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                  }`}>
                    {step.status === 'completed' ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.status === 'failed' ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : step.status === 'in-progress' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-white text-sm font-bold">{step.id}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                  {step.error && (
                    <p className="text-sm text-red-400 mt-1">Error: {step.error}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Error Handler */}
          {extractionError && !showManualInput && (
            <div className="mb-6">
              <TranscriptErrorHandler
                error={extractionError}
                onRetry={handleRetry}
                onManualInput={() => setShowManualInput(true)}
                retryCount={retryCount}
                maxRetries={maxRetries}
              />
            </div>
          )}

          {/* Navigation Options after transcript failure */}
          {showNavigationOptions && !showManualInput && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h3 className="text-yellow-400 font-semibold mb-3">Continue without transcript?</h3>
              <p className="text-gray-300 text-sm mb-4">
                You can still create and edit AI thread content manually, or provide your own transcript for better results.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleNavigateAnywayToEditor}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l7 7-7 7M4 12h14" />
                  </svg>
                  Generate AI Thread Anyway
                </button>
                <button
                  onClick={() => setShowManualInput(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Enter Manual Transcript
                </button>
              </div>
            </div>
          )}

          {/* Manual Transcript Input */}
          {showManualInput && (
            <div className="mb-6">
              <ManualTranscriptInput
                onSubmit={handleManualTranscript}
                onCancel={() => {
                  setShowManualInput(false)
                  setShowNavigationOptions(true) // Show navigation options again
                }}
                videoTitle={selectedVideo.title}
              />
            </div>
          )}

          {/* Thread Generation Error - Continue to Editor Option */}
          {transcriptSteps.find(step => step.id === 2 && step.status === 'failed') && !isGenerating && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <h3 className="text-red-400 font-semibold mb-3">Thread Generation Failed</h3>
              <p className="text-gray-300 text-sm mb-4">
                The AI thread generation encountered an error, but you can still access the editor to create content manually.
              </p>
              <button
                onClick={handleContinueToEditor}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l7 7-7 7M4 12h14" />
                </svg>
                Continue to Editor
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isGenerating && !showManualInput && (
              <button
                onClick={handleExtractTranscript}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Generate AI Thread
              </button>
            )}
            
            <button
              onClick={closeModal}
              disabled={isGenerating}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Processing...' : 'Cancel'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}