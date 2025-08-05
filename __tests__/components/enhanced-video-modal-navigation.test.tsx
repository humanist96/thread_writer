import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import EnhancedVideoModal from '@/components/EnhancedVideoModal'
import { useStore } from '@/lib/store'

// Mock dependencies
jest.mock('axios')
jest.mock('@/lib/store')
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedUseStore = useStore as jest.MockedFunction<typeof useStore>

const mockVideo = {
  id: 'test-video-id',
  title: 'Test Video Title',
  description: 'Test video description',
  thumbnail: 'https://example.com/thumbnail.jpg',
  channelTitle: 'Test Channel',
  duration: '10:30',
  publishedAt: '2024-01-01T00:00:00Z',
  channelId: 'test-channel-id',
  viewCount: 1000,
}

const mockStoreState = {
  selectedVideo: mockVideo,
  setSelectedVideo: jest.fn(),
  isGenerating: false,
  setIsGenerating: jest.fn(),
  currentThread: null,
  setCurrentThread: jest.fn(),
}

describe('EnhancedVideoModal Navigation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseStore.mockReturnValue(mockStoreState as any)
    mockLocation.href = ''
  })

  describe('Navigation after transcript extraction failure', () => {
    it('should provide option to navigate to editor even when transcript extraction fails', async () => {
      // Mock transcript API failure
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Transcript extraction failed' } }
      })

      render(<EnhancedVideoModal />)

      // Click Generate AI Thread button
      const generateButton = screen.getByText('Generate AI Thread')
      fireEvent.click(generateButton)

      // Wait for extraction to fail
      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      // Should show error and retry options
      expect(screen.getByText(/Transcript extraction failed/)).toBeInTheDocument()
      
      // Should provide a way to continue to editor despite failure
      const continueButton = screen.queryByText(/Generate AI Thread Anyway/)
      expect(continueButton).toBeInTheDocument()
    })

    it('should navigate to editor when "Generate AI Thread Anyway" is clicked after transcript failure', async () => {
      // Mock transcript API failure
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Transcript extraction failed' } }
      })

      render(<EnhancedVideoModal />)

      // Click Generate AI Thread button
      const generateButton = screen.getByText('Generate AI Thread')
      fireEvent.click(generateButton)

      // Wait for extraction to fail
      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      // Click "Generate AI Thread Anyway" button
      const continueButton = screen.getByText(/Generate AI Thread Anyway/)
      fireEvent.click(continueButton)

      // Should navigate to editor with empty transcript
      await waitFor(() => {
        expect(mockLocation.href).toBe('/editor')
      })

      // Should set current thread with empty transcript
      expect(mockStoreState.setCurrentThread).toHaveBeenCalledWith(
        expect.objectContaining({
          videoId: mockVideo.id,
          videoTitle: mockVideo.title,
          transcript: '',
        })
      )
    })

    it('should show manual transcript input option after max retries', async () => {
      // Mock transcript API failure
      mockedAxios.post.mockRejectedValue({
        response: { data: { error: 'Transcript extraction failed' } }
      })

      render(<EnhancedVideoModal />)

      // Click Generate AI Thread button
      const generateButton = screen.getByText('Generate AI Thread')
      fireEvent.click(generateButton)

      // Wait for initial failure
      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      // Click retry 3 times (max retries)
      const retryButton = screen.getByText(/Retry/)
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      fireEvent.click(retryButton)
      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      fireEvent.click(retryButton)
      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      // Should show manual input option after max retries
      await waitFor(() => {
        expect(screen.getByText(/Enter Manual Transcript/)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation with manual transcript input', () => {
    it('should navigate to editor after successful manual transcript submission', async () => {
      // Mock transcript API failure
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Transcript extraction failed' } }
      })

      // Mock successful thread generation
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          threads: [{ id: '1', content: 'Test thread', order: 0 }],
          summary: 'Test summary'
        }
      })

      render(<EnhancedVideoModal />)

      // Simulate failure and manual input
      const generateButton = screen.getByText('Generate AI Thread')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      // Force show manual input (simulate max retries reached)
      const manualInputButton = screen.getByText(/Enter Manual Transcript/)
      fireEvent.click(manualInputButton)

      // Enter manual transcript
      const textArea = screen.getByPlaceholderText(/Enter the video transcript/)
      fireEvent.change(textArea, { target: { value: 'Manual test transcript' } })

      // Submit manual transcript
      const submitButton = screen.getByText(/Generate Thread/)
      fireEvent.click(submitButton)

      // Should navigate to editor after successful thread generation
      await waitFor(() => {
        expect(mockLocation.href).toBe('/editor')
      }, { timeout: 3000 })

      // Should set current thread with manual transcript
      expect(mockStoreState.setCurrentThread).toHaveBeenCalledWith(
        expect.objectContaining({
          videoId: mockVideo.id,
          videoTitle: mockVideo.title,
          transcript: 'Manual test transcript',
        })
      )
    })

    it('should handle manual transcript submission failure gracefully', async () => {
      // Mock initial transcript failure
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Transcript extraction failed' } }
      })

      // Mock thread generation failure
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Thread generation failed' } }
      })

      render(<EnhancedVideoModal />)

      // Simulate manual input after failure
      const generateButton = screen.getByText('Generate AI Thread')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      // Show manual input
      const manualInputButton = screen.getByText(/Enter Manual Transcript/)
      fireEvent.click(manualInputButton)

      // Enter and submit manual transcript
      const textArea = screen.getByPlaceholderText(/Enter the video transcript/)
      fireEvent.change(textArea, { target: { value: 'Manual test transcript' } })

      const submitButton = screen.getByText(/Generate Thread/)
      fireEvent.click(submitButton)

      // Should show error for thread generation failure
      await waitFor(() => {
        expect(screen.getByText(/Failed to generate thread content/)).toBeInTheDocument()
      })

      // Should still provide option to navigate to editor
      const continueButton = screen.getByText(/Continue to Editor/)
      expect(continueButton).toBeInTheDocument()
    })
  })

  describe('Proper error handling with navigation', () => {
    it('should always provide navigation option regardless of transcript status', async () => {
      // Mock transcript API failure
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Network error' } }
      })

      render(<EnhancedVideoModal />)

      const generateButton = screen.getByText('Generate AI Thread')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      // Should always show navigation options
      const continueButton = screen.getByText(/Generate AI Thread Anyway/)
      expect(continueButton).toBeInTheDocument()

      const manualInputButton = screen.getByText(/Enter Manual Transcript/)
      expect(manualInputButton).toBeInTheDocument()
    })

    it('should clear error states when navigating to editor', async () => {
      // Mock failure then recovery
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Temporary failure' } }
      })

      render(<EnhancedVideoModal />)

      const generateButton = screen.getByText('Generate AI Thread')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to extract transcript/)).toBeInTheDocument()
      })

      // Navigate anyway
      const continueButton = screen.getByText(/Generate AI Thread Anyway/)
      fireEvent.click(continueButton)

      // Should clear generating state
      expect(mockStoreState.setIsGenerating).toHaveBeenCalledWith(false)

      // Should navigate
      await waitFor(() => {
        expect(mockLocation.href).toBe('/editor')
      })
    })
  })

  describe('UI state management during navigation', () => {
    it('should properly manage loading states during navigation flow', async () => {
      render(<EnhancedVideoModal />)

      const generateButton = screen.getByText('Generate AI Thread')
      
      // Initially not generating
      expect(mockStoreState.setIsGenerating).not.toHaveBeenCalled()

      fireEvent.click(generateButton)

      // Should set generating to true
      expect(mockStoreState.setIsGenerating).toHaveBeenCalledWith(true)
    })

    it('should reset states when modal is closed', async () => {
      render(<EnhancedVideoModal />)

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockStoreState.setSelectedVideo).toHaveBeenCalledWith(null)
      expect(mockStoreState.setIsGenerating).toHaveBeenCalledWith(false)
    })
  })
})