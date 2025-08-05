// Mock for youtubei.js to avoid ES module issues in Jest

export const Innertube = {
  create: jest.fn().mockResolvedValue({
    getInfo: jest.fn().mockResolvedValue({
      basic_info: {
        title: 'Mock Video Title'
      },
      captions: {
        caption_tracks: [
          {
            language_code: 'en',
            name: 'English',
            base_url: 'https://mock-transcript-url.com/transcript.xml'
          }
        ]
      }
    })
  })
}