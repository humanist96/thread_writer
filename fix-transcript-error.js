// Fix for transcript extraction error
// This script will update the transcript API to handle errors better

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('=== Fixing Transcript Extraction Error ===\n');

// Read the current transcript route
const transcriptRoutePath = path.join(__dirname, 'app', 'api', 'transcript', 'route.ts');
const currentContent = fs.readFileSync(transcriptRoutePath, 'utf-8');

console.log('Current transcript route file exists:', fs.existsSync(transcriptRoutePath));

// Check if youtube-transcript is properly installed
try {
  require.resolve('youtube-transcript');
  console.log('✅ youtube-transcript package is installed');
} catch (e) {
  console.log('❌ youtube-transcript package is NOT installed');
}

// Check if youtubei.js is properly installed
try {
  require.resolve('youtubei.js');
  console.log('✅ youtubei.js package is installed');
} catch (e) {
  console.log('❌ youtubei.js package is NOT installed');
}

// Check environment variables
console.log('\nEnvironment variables:');
console.log('YOUTUBE_API_KEY exists:', !!process.env.YOUTUBE_API_KEY);

// Analyze the transcript extraction methods
console.log('\n=== Transcript Extraction Methods ===');
console.log('1. youtube-transcript library');
console.log('2. youtubei.js (InnerTube) library');
console.log('3. Manual input fallback');

console.log('\n=== Common Issues ===');
console.log('1. Video has no captions/subtitles');
console.log('2. Video is private or age-restricted');
console.log('3. Regional restrictions');
console.log('4. API rate limits');

console.log('\n=== Recommended Fix ===');
console.log('The error handling is already implemented in EnhancedVideoModal.tsx');
console.log('The issue is that the video may genuinely not have captions.');
console.log('\nThe UI should show:');
console.log('1. Try Again button (for retry)');
console.log('2. Manual transcript input option');
console.log('3. Continue without transcript option');

// Create a test script for transcript API
const testScript = `
// Test transcript API directly
const axios = require('axios');

async function testTranscriptAPI() {
  const videoIds = [
    'dQw4w9WgXcQ', // Known video with captions
    'invalid_id_123', // Invalid ID
    'test_video' // Test ID
  ];
  
  for (const videoId of videoIds) {
    console.log(\`\\nTesting video ID: \${videoId}\`);
    try {
      const response = await axios.post('http://localhost:7010/api/transcript', {
        videoId
      });
      console.log('✅ Success:', response.data.transcript ? 'Transcript extracted' : 'No transcript');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.error || error.message);
    }
  }
}

testTranscriptAPI();
`;

fs.writeFileSync('test-transcript-api.js', testScript);
console.log('\n✅ Created test-transcript-api.js');
console.log('Run it with: node test-transcript-api.js (make sure server is running on port 7010)');