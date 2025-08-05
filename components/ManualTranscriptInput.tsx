'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface ManualTranscriptInputProps {
  onSubmit: (transcript: string) => void
  onCancel?: () => void
  videoTitle: string
}

export default function ManualTranscriptInput({ onSubmit, onCancel, videoTitle }: ManualTranscriptInputProps) {
  const [transcript, setTranscript] = useState('')
  const [charCount, setCharCount] = useState(0)

  const handleSubmit = () => {
    if (transcript.trim().length > 50) {
      onSubmit(transcript.trim())
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setTranscript(text)
    setCharCount(text.length)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">✍️</div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            Manual Transcript Input
          </h3>
          <p className="text-white/70 mb-4">
            Can't extract captions automatically? You can paste the transcript manually.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Paste or type the video transcript:
              </label>
              <textarea
                value={transcript}
                onChange={handleChange}
                placeholder="Enter the video transcript here..."
                className="w-full h-48 p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary/50 resize-none"
              />
              <div className="mt-2 flex justify-between text-sm text-white/50">
                <span>{charCount} characters</span>
                <span>Minimum 50 characters required</span>
              </div>
            </div>

            <div className="text-xs text-white/50">
              <p className="mb-1">Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You can copy captions from YouTube's transcript feature</li>
                <li>Or transcribe key points from the video</li>
                <li>The AI will create a thread based on your input</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={charCount < 50}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  charCount >= 50
                    ? 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}
              >
                Generate Thread from Manual Input
              </button>
              
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}