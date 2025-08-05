// Manual test script for transcript extraction
// Run with: node manual-test.js

const axios = require('axios')

// Test videos - mix of English and Korean content
const testVideos = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up',
    expected: 'should have English captions'
  },
  {
    id: 'YQHsXMglC9A',
    title: 'Adele - Hello',
    expected: 'should have English captions'
  },
  {
    id: 'IwzUs1IMdyQ',
    title: 'BTS - Dynamite',
    expected: 'might have Korean or English captions'
  },
  {
    id: 'gdZLi9oWNZg',
    title: 'BTS - Dynamite (Official MV)',
    expected: 'might have Korean or English captions'
  },
  {
    id: 'fake-video-id-123',
    title: 'Non-existent video',
    expected: 'should fail with video not found'
  }
]

async function testTranscriptExtraction(videoId, title, expected) {
  console.log(`\n=== Testing: ${title} ===`)
  console.log(`Video ID: ${videoId}`)
  console.log(`Expected: ${expected}`)
  
  const startTime = Date.now()
  
  try {
    const response = await axios.post('http://localhost:3006/api/transcript', {
      videoId
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const transcript = response.data.transcript
    const duration = Date.now() - startTime
    
    console.log(`✅ SUCCESS (${duration}ms)`)
    console.log(`Transcript length: ${transcript.length} characters`)
    console.log(`First 200 chars: ${transcript.substring(0, 200)}...`)
    
    // Check if Korean
    const hasKorean = /[가-힣]/.test(transcript)
    console.log(`Contains Korean: ${hasKorean}`)
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.log(`❌ FAILED (${duration}ms)`)
    
    if (error.response) {
      console.log(`Error: ${error.response.data.error}`)
      console.log(`Status: ${error.response.status}`)
    } else if (error.code === 'ECONNABORTED') {
      console.log('Error: Request timeout')
    } else {
      console.log(`Error: ${error.message}`)
    }
  }
}

async function runTests() {
  console.log('YouTube Transcript Extraction Manual Test')
  console.log('========================================')
  console.log('Note: 자막 추출은 한도가 있으니 꼭 테스트가 필요할때 한 번씩만 수행해')
  console.log('Testing against: http://localhost:3006')
  console.log('')
  
  // Check debug endpoint first
  try {
    const debugResponse = await axios.get('http://localhost:3006/api/transcript/debug')
    console.log('Current Metrics:')
    console.log(JSON.stringify(debugResponse.data, null, 2))
  } catch (error) {
    console.log('Could not fetch debug metrics')
  }
  
  // Run tests one by one
  for (const video of testVideos) {
    await testTranscriptExtraction(video.id, video.title, video.expected)
    
    // Wait a bit between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('\n=== Test Complete ===')
  
  // Fetch updated metrics
  try {
    const debugResponse = await axios.get('http://localhost:3006/api/transcript/debug')
    console.log('\nUpdated Metrics:')
    console.log(JSON.stringify(debugResponse.data, null, 2))
  } catch (error) {
    console.log('Could not fetch updated debug metrics')
  }
}

// Run tests
runTests().catch(console.error)