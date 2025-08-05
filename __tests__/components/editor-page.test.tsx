import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import EditorPage from '@/app/editor/page'
import { useStore } from '@/lib/store'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock the store
jest.mock('@/lib/store', () => ({
  useStore: jest.fn()
}))

// Mock Background3D component
jest.mock('@/components/Background3D', () => {
  return function Background3D() {
    return <div data-testid="background-3d" />
  }
})

describe('EditorPage', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }
  
  const defaultStoreState = {
    threads: [],
    summary: '',
    selectedVideo: null,
    updateThread: jest.fn(),
    currentThread: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useStore as jest.Mock).mockReturnValue(defaultStoreState)
  })

  test('should show loading spinner during hydration', () => {
    render(<EditorPage />)
    
    // Should show loading spinner initially
    const spinner = screen.getByTestId('background-3d').parentElement?.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  test('should not redirect when currentThread is present', async () => {
    const storeWithThread = {
      ...defaultStoreState,
      currentThread: {
        id: 'thread-123',
        videoId: 'video-123',
        videoTitle: 'Test Video',
        videoDescription: 'Test Description',
        summary: 'Test Summary',
        threads: [
          { id: '1', content: 'Thread 1', order: 1 },
          { id: '2', content: 'Thread 2', order: 2 }
        ],
        createdAt: new Date().toISOString(),
        transcript: 'Test transcript'
      }
    }
    
    ;(useStore as jest.Mock).mockReturnValue(storeWithThread)
    
    render(<EditorPage />)
    
    // Wait for hydration and check no redirect happened
    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    }, { timeout: 2000 })
    
    // Should show editor content
    expect(screen.getByText('Thread Editor')).toBeInTheDocument()
  })

  test('should not redirect when selectedVideo is present', async () => {
    const storeWithVideo = {
      ...defaultStoreState,
      selectedVideo: {
        id: 'video-123',
        title: 'Test Video',
        channelTitle: 'Test Channel',
        description: 'Test Description',
        thumbnail: 'test.jpg',
        duration: '10:00'
      }
    }
    
    ;(useStore as jest.Mock).mockReturnValue(storeWithVideo)
    
    render(<EditorPage />)
    
    // Wait for hydration and check no redirect happened
    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    }, { timeout: 2000 })
    
    // Should show editor content
    expect(screen.getByText('Thread Editor')).toBeInTheDocument()
  })

  test('should redirect to home when no data is available after hydration', async () => {
    render(<EditorPage />)
    
    // Wait for redirect to happen after hydration timeout
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    }, { timeout: 2000 })
  })

  test('should display thread content when available', async () => {
    const storeWithContent = {
      ...defaultStoreState,
      currentThread: {
        id: 'thread-123',
        videoId: 'video-123',
        videoTitle: 'Test Video Title',
        videoDescription: 'Test Description',
        summary: 'This is a test summary',
        threads: [
          { id: '1', content: 'First thread content', order: 1 },
          { id: '2', content: 'Second thread content', order: 2 }
        ],
        createdAt: new Date().toISOString(),
        transcript: 'Test transcript'
      },
      selectedVideo: {
        id: 'video-123',
        title: 'Test Video Title',
        channelTitle: 'Test Channel',
        description: 'Test Description',
        thumbnail: 'test.jpg',
        duration: '10:00'
      }
    }
    
    ;(useStore as jest.Mock).mockReturnValue(storeWithContent)
    
    render(<EditorPage />)
    
    // Wait for content to be displayed
    await waitFor(() => {
      expect(screen.getByText('Thread Editor')).toBeInTheDocument()
      expect(screen.getByText('Test Video Title')).toBeInTheDocument()
      expect(screen.getByText('This is a test summary')).toBeInTheDocument()
    })
    
    // Check that thread content is in the textarea
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toContain('First thread content')
    expect(textarea.value).toContain('Second thread content')
  })

  test('should handle empty threads gracefully', async () => {
    const storeWithEmptyThreads = {
      ...defaultStoreState,
      currentThread: {
        id: 'thread-123',
        videoId: 'video-123',
        videoTitle: 'Test Video',
        videoDescription: 'Test Description',
        summary: 'Transcript extraction failed. Please add content manually.',
        threads: [],
        createdAt: new Date().toISOString(),
        transcript: ''
      },
      selectedVideo: {
        id: 'video-123',
        title: 'Test Video',
        channelTitle: 'Test Channel',
        description: 'Test Description',
        thumbnail: 'test.jpg',
        duration: '10:00'
      }
    }
    
    ;(useStore as jest.Mock).mockReturnValue(storeWithEmptyThreads)
    
    render(<EditorPage />)
    
    // Should not redirect
    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
    
    // Should show editor with empty content
    expect(screen.getByText('Thread Editor')).toBeInTheDocument()
    expect(screen.getByText('Transcript extraction failed. Please add content manually.')).toBeInTheDocument()
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('')
  })
})