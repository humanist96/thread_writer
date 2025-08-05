'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import axios from 'axios'
import Image from 'next/image'
import TranscriptErrorHandler from './TranscriptErrorHandler'
import ManualTranscriptInput from './ManualTranscriptInput'

export default function VideoModal() {
  const { 
    selectedVideo, 
    setSelectedVideo, 
    setTranscript, 
    setSummary, 
    setThreads,
    isLoading,
    setIsLoading 
  } = useStore()
  
  const [step, setStep] = useState<'idle' | 'extracting' | 'generating' | 'complete' | 'error' | 'manual'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)

  useEffect(() => {
    if (selectedVideo && step === 'idle') {
      extractAndGenerate()
    }
  }, [selectedVideo])

  const extractAndGenerate = async () => {
    if (!selectedVideo) return
    
    setStep('extracting')
    setIsLoading(true)
    setError(null)

    try {
      // Extract transcript with timeout
      const transcriptResponse = await axios.post('/api/transcript', {
        videoId: selectedVideo.id
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const transcript = transcriptResponse.data.transcript
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Received empty transcript from server')
      }
      
      setTranscript(transcript)
      
      setStep('generating')
      
      // Generate thread content
      const threadResponse = await axios.post('/api/generate-thread', {
        transcript,
        videoTitle: selectedVideo.title,
        videoDescription: selectedVideo.description
      })
      
      setSummary(threadResponse.data.summary)
      setThreads(threadResponse.data.threads)
      
      setStep('complete')
    } catch (err: any) {
      console.error('Process error:', err)
      
      let errorMessage = 'An error occurred during processing'
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || `Server error: ${err.response.status}`
      } else if (err.code === 'ECONNABORTED') {
        // Timeout error
        errorMessage = 'Request timed out. The video may be too long or have processing issues.'
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        // Network error
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (err.message) {
        // Other errors with message
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedVideo(null)
    setStep('idle')
    setError(null)
  }

  if (!selectedVideo) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl bg-dark/90 border border-white/20 rounded-2xl p-6 backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex gap-4 mb-6">
            <div className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={selectedVideo.thumbnail}
                alt={selectedVideo.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-lg line-clamp-2 mb-2">
                {selectedVideo.title}
              </h3>
              <p className="text-sm text-white/60">{selectedVideo.channelTitle}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Extracting Transcript */}
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              step === 'extracting' ? 'bg-primary/20 border border-primary/50' : 'bg-white/5'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'extracting' ? 'bg-primary animate-pulse' : 
                ['generating', 'complete'].includes(step) ? 'bg-green-500' : 'bg-white/20'
              }`}>
                {['generating', 'complete'].includes(step) ? (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-white text-sm">1</span>
                )}
              </div>
              <div>
                <p className="text-white font-medium">Extracting Transcript</p>
                <p className="text-sm text-white/60">
                  {step === 'extracting' ? 'Processing video captions...' : 
                   ['generating', 'complete'].includes(step) ? 'Transcript extracted successfully' : 
                   'Waiting to start'}
                </p>
              </div>
            </div>

            {/* Generating Thread */}
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              step === 'generating' ? 'bg-primary/20 border border-primary/50' : 'bg-white/5'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'generating' ? 'bg-primary animate-pulse' : 
                step === 'complete' ? 'bg-green-500' : 'bg-white/20'
              }`}>
                {step === 'complete' ? (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-white text-sm">2</span>
                )}
              </div>
              <div>
                <p className="text-white font-medium">Generating Thread Content</p>
                <p className="text-sm text-white/60">
                  {step === 'generating' ? 'AI is creating your thread...' : 
                   step === 'complete' ? 'Thread generated successfully' : 
                   'Waiting for transcript'}
                </p>
              </div>
            </div>

            {/* Error Display */}
            {step === 'error' && error && !showManualInput && (
              <TranscriptErrorHandler
                error={error}
                videoId={selectedVideo.id}
                onRetry={() => {
                  setStep('idle')
                  extractAndGenerate()
                }}
                onClose={handleClose}
              />
            )}

            {/* Manual Input Option */}
            {(step === 'error' || showManualInput) && (
              <>
                {!showManualInput && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-center"
                  >
                    <p className="text-white/60 mb-2">Or try manual input:</p>
                    <button
                      onClick={() => setShowManualInput(true)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                    >
                      Enter Transcript Manually
                    </button>
                  </motion.div>
                )}
                
                {showManualInput && (
                  <ManualTranscriptInput
                    videoTitle={selectedVideo.title}
                    onSubmit={async (manualTranscript) => {
                      setTranscript(manualTranscript)
                      setStep('generating')
                      setShowManualInput(false)
                      
                      try {
                        const threadResponse = await axios.post('/api/generate-thread', {
                          transcript: manualTranscript,
                          videoTitle: selectedVideo.title,
                          videoDescription: selectedVideo.description
                        })
                        
                        setSummary(threadResponse.data.summary)
                        setThreads(threadResponse.data.threads)
                        setStep('complete')
                      } catch (err) {
                        setError('Failed to generate thread from manual input')
                        setStep('error')
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                  />
                )}
              </>
            )}

            {/* Success Actions */}
            {step === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 mt-6"
              >
                <button
                  onClick={() => {
                    handleClose()
                    // Navigate to editor
                    window.location.href = '/editor'
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  View & Edit Thread
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}