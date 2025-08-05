'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useStore } from '@/lib/store'

interface ThreadEditorProps {
  viewMode?: 'individual' | 'combined'
}

export default function ThreadEditor({ viewMode = 'individual' }: ThreadEditorProps) {
  const { threads, updateThread, reorderThreads, setThreads } = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [combinedText, setCombinedText] = useState('')
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)

  useEffect(() => {
    // Initialize combined text when switching to combined view
    if (viewMode === 'combined') {
      const combined = threads
        .sort((a, b) => a.order - b.order)
        .map(thread => thread.content)
        .join('\n\n')
      setCombinedText(combined)
    }
  }, [viewMode, threads])

  const handleEdit = (id: string, content: string) => {
    updateThread(id, content)
  }

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyCombined = () => {
    navigator.clipboard.writeText(combinedText)
    setCopiedId('combined')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReorder = (newOrder: typeof threads) => {
    const startIndex = threads.findIndex(t => t.id === newOrder[0].id)
    const endIndex = threads.findIndex(t => t.id === newOrder[newOrder.length - 1].id)
    reorderThreads(startIndex, endIndex)
  }

  const handleCombinedChange = (text: string) => {
    setCombinedText(text)
    
    // Split text back into individual threads
    const lines = text.split('\n\n').filter(line => line.trim())
    const updatedThreads = threads.map((thread, index) => ({
      ...thread,
      content: lines[index] || thread.content
    }))
    
    // Update the store with all threads at once
    setThreads(updatedThreads)
  }

  const handleRegenerate = async (id: string, currentContent: string) => {
    setRegeneratingId(id)
    
    try {
      const response = await fetch('/api/regenerate-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: currentContent,
          instruction: 'Make it more engaging and impactful'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        updateThread(id, data.content)
      } else {
        console.error('Failed to regenerate thread')
      }
    } catch (error) {
      console.error('Regeneration error:', error)
    } finally {
      setRegeneratingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {viewMode === 'combined' ? (
        // Combined View - Code Block Style
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 text-sm text-gray-400">threads.txt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setRegeneratingId('combined')
                    try {
                      const response = await fetch('/api/regenerate-thread', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          content: combinedText,
                          instruction: 'Improve all threads to be more engaging and impactful'
                        })
                      })
                      
                      if (response.ok) {
                        const data = await response.json()
                        setCombinedText(data.content)
                        handleCombinedChange(data.content)
                      }
                    } catch (error) {
                      console.error('Combined regeneration error:', error)
                    } finally {
                      setRegeneratingId(null)
                    }
                  }}
                  disabled={regeneratingId === 'combined'}
                  className="px-3 py-1 text-xs bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary hover:to-secondary text-white rounded transition-all disabled:opacity-50"
                >
                  {regeneratingId === 'combined' ? '🤖 AI Working...' : '✨ AI Rewrite All'}
                </button>
                <button
                  onClick={handleCopyCombined}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  {copiedId === 'combined' ? 'Copied!' : 'Copy All'}
                </button>
              </div>
            </div>
            
            {/* Editor */}
            <div className="relative">
              <textarea
                value={combinedText}
                onChange={(e) => handleCombinedChange(e.target.value)}
                className="code-editor w-full min-h-[400px] p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-y focus:outline-none"
                style={{ lineHeight: '1.6' }}
                placeholder="Enter your threads here..."
              />
              
              
              {/* Character Count */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">
                {combinedText.length} characters
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mt-6 bg-white/5 rounded-lg border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </h3>
            <div className="space-y-4">
              {combinedText.split('\n\n').filter(text => text.trim()).map((thread, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary">Thread {index + 1}</span>
                    <span className="text-xs text-white/40">
                      {thread.length}/280 characters
                    </span>
                  </div>
                  <p className="text-white/90 whitespace-pre-wrap">{thread}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        // Individual View - Original Style
        <Reorder.Group
        axis="y"
        values={threads}
        onReorder={handleReorder}
        className="space-y-4"
      >
        {threads.map((thread, index) => (
          <Reorder.Item
            key={thread.id}
            value={thread}
            className="cursor-move"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-all"
            >
              {/* Thread Number */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>

              {/* Drag Handle */}
              <div className="absolute left-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>

              {/* Content */}
              <div className="ml-8">
                {editingId === thread.id ? (
                  <textarea
                    value={thread.content}
                    onChange={(e) => handleEdit(thread.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    className="w-full min-h-[100px] p-3 bg-white/10 border border-white/20 rounded-lg text-white resize-none focus:outline-none focus:border-primary/50"
                    autoFocus
                    maxLength={280}
                  />
                ) : (
                  <p
                    onClick={() => setEditingId(thread.id)}
                    className="text-white/90 cursor-text hover:text-white transition-colors"
                  >
                    {thread.content}
                  </p>
                )}

                {/* Character Count */}
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs ${
                    thread.content.length > 280 ? 'text-red-400' : 'text-white/40'
                  }`}>
                    {thread.content.length}/280 characters
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(thread.id, thread.content)}
                      className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      {copiedId === thread.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => setEditingId(thread.id)}
                      className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRegenerate(thread.id, thread.content)}
                      disabled={regeneratingId === thread.id}
                      className="px-3 py-1 text-xs bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary hover:to-secondary text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {regeneratingId === thread.id ? (
                        <span className="flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          AI
                        </span>
                      ) : (
                        '✨ AI Rewrite'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      )}
    </div>
  )
}