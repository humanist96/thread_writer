const { getYouTubeTranscript } = require('./lib/transcript.ts')

async function testTranscriptExtraction() {
  console.log('🧪 Testing YouTube Transcript Extraction...\n')
  
  const testCases = [
    {
      name: 'Valid video with captions',
      videoId: 'dQw4w9WgXcQ', // Rick Roll - known to have captions
      shouldSucceed: true
    },
    {
      name: 'Invalid video ID',
      videoId: 'invalid_video_id',
      shouldSucceed: false
    },
    {
      name: 'Empty video ID',
      videoId: '',
      shouldSucceed: false
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`)
    console.log(`🎬 Video ID: ${testCase.videoId}`)
    
    try {
      const startTime = Date.now()
      const transcript = await getYouTubeTranscript(testCase.videoId)
      const endTime = Date.now()
      
      console.log(`✅ Success (${endTime - startTime}ms)`)
      console.log(`📝 Transcript length: ${transcript.length} characters`)
      console.log(`🔤 First 100 chars: ${transcript.substring(0, 100)}...`)
      
      if (!testCase.shouldSucceed) {
        console.log(`⚠️  Expected failure but got success`)
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`)
      
      if (testCase.shouldSucceed) {
        console.log(`⚠️  Expected success but got failure`)
      }
    }
    
    console.log('─'.repeat(50))
  }
  
  console.log('🏁 Testing complete!')
}

// Only run if this file is executed directly
if (require.main === module) {
  testTranscriptExtraction().catch(console.error)
}

module.exports = { testTranscriptExtraction }