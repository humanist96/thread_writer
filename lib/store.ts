import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { YouTubeVideo } from './youtube'

interface ThreadItem {
  id: string
  content: string
  order: number
}

interface ThreadData {
  id: string
  videoId: string
  videoTitle: string
  videoDescription: string
  summary: string
  threads: ThreadItem[]
  createdAt: string
  transcript: string
}

interface AppState {
  searchQuery: string
  searchResults: YouTubeVideo[]
  selectedVideo: YouTubeVideo | null
  isLoading: boolean
  isGenerating: boolean
  transcript: string
  summary: string
  threads: ThreadItem[]
  currentThread: ThreadData | null
  
  setSearchQuery: (query: string) => void
  setSearchResults: (results: YouTubeVideo[]) => void
  setSelectedVideo: (video: YouTubeVideo | null) => void
  setIsLoading: (loading: boolean) => void
  setIsGenerating: (generating: boolean) => void
  setTranscript: (transcript: string) => void
  setSummary: (summary: string) => void
  setThreads: (threads: ThreadItem[]) => void
  setCurrentThread: (thread: ThreadData | null) => void
  updateThread: (id: string, content: string) => void
  reorderThreads: (startIndex: number, endIndex: number) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      searchQuery: '',
      searchResults: [],
      selectedVideo: null,
      isLoading: false,
      isGenerating: false,
      transcript: '',
      summary: '',
      threads: [],
      currentThread: null,
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      setSelectedVideo: (video) => set({ selectedVideo: video }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setTranscript: (transcript) => set({ transcript }),
      setSummary: (summary) => set({ summary }),
      setThreads: (threads) => set({ threads }),
      setCurrentThread: (thread) => set({ currentThread: thread }),
      
      updateThread: (id, content) => set((state) => ({
        threads: state.threads.map((thread) =>
          thread.id === id ? { ...thread, content } : thread
        ),
      })),
      
      reorderThreads: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.threads)
        const [removed] = result.splice(startIndex, 1)
        result.splice(endIndex, 0, removed)
        
        return {
          threads: result.map((thread, index) => ({
            ...thread,
            order: index,
          })),
        }
      }),
    }),
    {
      name: 'youtube-ai-thread-storage',
      storage: createJSONStorage(() => localStorage),
      // 중요한 데이터만 persist
      partialize: (state) => ({
        selectedVideo: state.selectedVideo,
        transcript: state.transcript,
        summary: state.summary,
        threads: state.threads,
        currentThread: state.currentThread,
      }),
    }
  )
)