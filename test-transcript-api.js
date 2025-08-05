
// Test transcript API directly
const axios = require('axios');

async function testTranscriptAPI() {
  const videoIds = [
    'dQw4w9WgXcQ', // Known video with captions
    'invalid_id_123', // Invalid ID
    'test_video' // Test ID
  ];
  
  for (const videoId of videoIds) {
    console.log(`\nTesting video ID: ${videoId}`);
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
