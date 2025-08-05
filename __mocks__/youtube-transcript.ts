// Mock for youtube-transcript to avoid ES module issues in Jest

export const YoutubeTranscript = {
  fetchTranscript: jest.fn().mockResolvedValue([
    { text: 'Mock transcript text', start: 0, duration: 2 },
    { text: 'More mock content', start: 2, duration: 3 }
  ])
}