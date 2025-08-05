// Add custom jest matchers from jest-dom
require('@testing-library/jest-dom')

// Mock environment variables
process.env.YOUTUBE_API_KEY = 'test-youtube-api-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-api-key'
process.env.GOOGLE_SHEETS_API_KEY = 'test-google-sheets-api-key'
process.env.GOOGLE_SHEET_ID = 'test-google-sheet-id'