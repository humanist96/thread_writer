// Test Innertube library directly
const { Innertube } = require('youtubei.js');

async function testInnertube() {
  console.log('Testing Innertube library...\n');
  
  try {
    const youtube = await Innertube.create();
    console.log('✅ Innertube client created\n');
    
    // Test with a known video
    const videoId = 'jNQXAC9IVRw'; // "Me at the zoo" - first YouTube video
    console.log(`Testing video: ${videoId}`);
    
    const info = await youtube.getInfo(videoId);
    console.log(`Title: ${info.basic_info.title}`);
    console.log(`Duration: ${info.basic_info.duration} seconds`);
    console.log(`Views: ${info.basic_info.view_count}`);
    
    // Check captions
    const captions = info.captions?.caption_tracks;
    console.log(`\nCaptions available: ${captions ? captions.length : 0}`);
    
    if (captions && captions.length > 0) {
      console.log('Available languages:');
      captions.forEach(track => {
        console.log(`  - ${track.language_code}: ${track.name?.text || track.name}`);
      });
      
      // Try to get transcript
      try {
        const transcript = await youtube.getTranscript(videoId);
        console.log('\n✅ Transcript fetched successfully');
        console.log('Transcript type:', typeof transcript);
        console.log('Has content:', !!transcript.content);
      } catch (e) {
        console.log('\n❌ Failed to fetch transcript:', e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test with Korean video
async function testKoreanVideo() {
  console.log('\n\nTesting Korean video...\n');
  
  try {
    const youtube = await Innertube.create();
    const videoId = 'IwzUs1IMdyQ'; // BTS video
    
    console.log(`Testing video: ${videoId}`);
    const info = await youtube.getInfo(videoId);
    console.log(`Title: ${info.basic_info.title}`);
    
    const captions = info.captions?.caption_tracks;
    console.log(`Captions available: ${captions ? captions.length : 0}`);
    
    if (captions && captions.length > 0) {
      captions.forEach(track => {
        console.log(`  - ${track.language_code}: ${track.name?.text || track.name}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
(async () => {
  await testInnertube();
  await testKoreanVideo();
})();