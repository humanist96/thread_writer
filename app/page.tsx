'use client'

import { useState } from 'react'
import Background3D from '@/components/Background3D'
import SearchBar from '@/components/SearchBar'
import VideoGrid from '@/components/VideoGrid'
import EnhancedVideoModal from '@/components/EnhancedVideoModal'
import { useStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function Home() {
  const { searchResults, setSearchResults, isLoading, setIsLoading } = useStore()
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axios.get(`/api/youtube/search?q=${encodeURIComponent(query)}`)
      setSearchResults(response.data.videos)
    } catch (err) {
      setError('Failed to search videos. Please try again.')
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen relative">
      <Background3D />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="gradient-text">YouTube AI</span>
            <br />
            <span className="text-white">Thread Generator</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Transform YouTube videos into engaging thread content with AI-powered analysis
          </p>
        </motion.div>

        <SearchBar onSearch={handleSearch} />

        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center mt-20"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-center text-white"
            >
              {error}
            </motion.div>
          )}

          {searchResults.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VideoGrid videos={searchResults} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <EnhancedVideoModal />
    </main>
  )
}