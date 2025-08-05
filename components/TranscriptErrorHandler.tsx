'use client'

import { motion } from 'framer-motion'

interface TranscriptErrorHandlerProps {
  error: string
  videoId?: string
  onRetry: () => void
  onClose?: () => void
  onManualInput?: () => void
  retryCount?: number
  maxRetries?: number
}

export default function TranscriptErrorHandler({ 
  error, 
  videoId, 
  onRetry, 
  onClose,
  onManualInput,
  retryCount = 0,
  maxRetries = 3
}: TranscriptErrorHandlerProps) {
  // Determine error type and provide specific guidance
  const getErrorInfo = () => {
    if (error.includes('captions available')) {
      return {
        icon: '🚫',
        title: 'No Captions Available',
        message: 'This video doesn\'t have captions or subtitles available.',
        advice: [
          'Try selecting a different video',
          'Look for videos with "CC" icon',
          'Check if the video has auto-generated captions enabled'
        ]
      }
    } else if (error.includes('unavailable') || error.includes('private')) {
      return {
        icon: '🔒',
        title: 'Video Unavailable',
        message: 'This video is either private, deleted, or unavailable in your region.',
        advice: [
          'Check if the video is publicly accessible',
          'Try a different video from the same channel',
          'Ensure you have the correct video link'
        ]
      }
    } else if (error.includes('network') || error.includes('timeout')) {
      return {
        icon: '🌐',
        title: 'Network Error',
        message: 'There was a problem connecting to YouTube.',
        advice: [
          'Check your internet connection',
          'Try again in a few moments',
          'The service might be temporarily unavailable'
        ]
      }
    } else {
      return {
        icon: '⚠️',
        title: 'Extraction Failed',
        message: 'We couldn\'t extract the transcript from this video.',
        advice: [
          'Try again - it might be a temporary issue',
          'Select a different video',
          'Contact support if the problem persists'
        ]
      }
    }
  }

  const errorInfo = getErrorInfo()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{errorInfo.icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-red-400 mb-2">
            {errorInfo.title}
          </h3>
          <p className="text-red-300 mb-4">
            {errorInfo.message}
          </p>
          
          <div className="mb-4">
            <p className="text-sm text-red-300/80 mb-2">Suggestions:</p>
            <ul className="list-disc list-inside space-y-1">
              {errorInfo.advice.map((tip, index) => (
                <li key={index} className="text-sm text-red-300/70">
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-red-300/50 mb-4">
            {videoId && <p>Video ID: {videoId}</p>}
            <p>Error details: {error}</p>
            {retryCount > 0 && <p>Retry attempt: {retryCount}/{maxRetries}</p>}
          </div>

          <div className="flex gap-2">
            {retryCount < maxRetries && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg text-sm transition-colors border border-red-500/30"
              >
                Try Again ({maxRetries - retryCount} attempts left)
              </button>
            )}
            
            {onManualInput && (
              <button
                onClick={onManualInput}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-white rounded-lg text-sm transition-colors border border-blue-500/30"
              >
                Enter Transcript Manually
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}