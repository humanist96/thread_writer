'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { YouTubeVideo } from '@/lib/youtube'
import { useStore } from '@/lib/store'

interface VideoGridProps {
  videos: YouTubeVideo[]
}

export default function VideoGrid({ videos }: VideoGridProps) {
  const { setSelectedVideo } = useStore()

  const handleVideoClick = (video: YouTubeVideo) => {
    setSelectedVideo(video)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {videos.map((video, index) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          onClick={() => handleVideoClick(video)}
          className="group cursor-pointer"
        >
          <div className="relative rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all duration-300">
            <div className="relative aspect-video">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
                {video.duration}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-white/60 mb-2">{video.channelTitle}</p>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span>{parseInt(video.viewCount).toLocaleString()} views</span>
                <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}