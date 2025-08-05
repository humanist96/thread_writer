// Debug script to find exact error with transcript extraction
const { YoutubeTranscript } = require('youtube-transcript');
const { Innertube } = require('youtubei.js');
const axios = require('axios');

// Test video ID from the error message
const videoId = '7f0dJPXs-28';

console.log('🔍 Debugging Transcript Extraction for video:', videoId);
console.log('=====================================\n');

// Test 1: Direct YouTube page check
async function checkYouTubePage() {
  console.log('1. Checking YouTube page directly...');
  try {
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Check for captions in page data
    const hasCaptions = html.includes('"captions"') || html.includes('captionTracks');
    const hasSubtitles = html.includes('timedtext');
    
    console.log('   - Page loaded:', html.length > 0 ? '✅' : '❌');
    console.log('   - Has captions marker:', hasCaptions ? '✅' : '❌');
    console.log('   - Has subtitles marker:', hasSubtitles ? '✅' : '❌');
    
    // Try to find caption tracks in the HTML
    const captionMatch = html.match(/"captionTracks":\[(.*?)\]/);
    if (captionMatch) {
      console.log('   - Found caption tracks in HTML!');
      const tracks = captionMatch[0];
      console.log('   - Caption data preview:', tracks.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log();
}

// Test 2: youtube-transcript library
async function testYoutubeTranscript() {
  console.log('2. Testing youtube-transcript library...');
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log('   ✅ Success! Found', transcript.length, 'entries');
    if (transcript.length > 0) {
      console.log('   - First entry:', transcript[0]);
      console.log('   - Text sample:', transcript[0].text);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   - Error type:', error.constructor.name);
    console.log('   - Stack trace:', error.stack?.split('\n')[1]);
  }
  console.log();
}

// Test 3: Innertube library with detailed info
async function testInnertubeDetailed() {
  console.log('3. Testing Innertube library (detailed)...');
  try {
    const youtube = await Innertube.create({
      cache: false,
      generate_session_locally: true
    });
    
    console.log('   - Client created ✅');
    
    const info = await youtube.getInfo(videoId);
    console.log('   - Video info retrieved ✅');
    console.log('   - Title:', info.basic_info.title);
    console.log('   - Channel:', info.basic_info.author);
    console.log('   - Duration:', info.basic_info.duration, 'seconds');
    
    // Check captions availability
    const hasCaptions = info.captions;
    console.log('   - Has captions object:', hasCaptions ? '✅' : '❌');
    
    if (hasCaptions) {
      const tracks = info.captions.caption_tracks;
      console.log('   - Caption tracks found:', tracks ? tracks.length : 0);
      
      if (tracks && tracks.length > 0) {
        console.log('   - Available languages:');
        tracks.forEach((track, index) => {
          console.log(`     ${index + 1}. ${track.language_code}: ${track.name?.text || track.name}`);
          console.log(`        - Base URL: ${track.base_url ? 'Available' : 'Not available'}`);
          console.log(`        - VssId: ${track.vss_id || 'N/A'}`);
        });
        
        // Try to fetch first caption track
        if (tracks[0].base_url) {
          try {
            console.log('\n   - Attempting to fetch caption XML...');
            const response = await fetch(tracks[0].base_url);
            const text = await response.text();
            console.log('   - Caption XML fetched:', text.length > 0 ? `✅ (${text.length} chars)` : '❌');
            console.log('   - XML preview:', text.substring(0, 200) + '...');
          } catch (fetchError) {
            console.log('   - Failed to fetch caption XML:', fetchError.message);
          }
        }
      }
    }
    
    // Check for other caption indicators
    console.log('\n   - Alternative caption checks:');
    console.log('   - Has subtitles:', info.has_subtitles ? '✅' : '❌');
    console.log('   - Player response:', info.player?.captions ? 'Has captions' : 'No captions');
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   - Full error:', error);
  }
  console.log();
}

// Test 4: Check our API endpoint
async function testOurAPI() {
  console.log('4. Testing our API endpoint...');
  try {
    const response = await axios.post('http://localhost:3008/api/transcript', {
      videoId: videoId
    }, {
      timeout: 30000
    });
    
    console.log('   ✅ Success!');
    console.log('   - Transcript length:', response.data.transcript.length);
    console.log('   - Preview:', response.data.transcript.substring(0, 100) + '...');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data?.error || error.message);
    console.log('   - Status:', error.response?.status);
    console.log('   - Full error response:', error.response?.data);
  }
  console.log();
}

// Test 5: Manual extraction attempt
async function manualExtractionTest() {
  console.log('5. Manual extraction test...');
  try {
    // Get video page
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const html = response.data;
    
    // Look for ytInitialPlayerResponse
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (playerResponseMatch) {
      const playerResponse = JSON.parse(playerResponseMatch[1]);
      
      console.log('   - Found player response ✅');
      console.log('   - Has captions:', !!playerResponse.captions);
      
      if (playerResponse.captions) {
        const captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer?.captionTracks;
        console.log('   - Caption tracks:', captionTracks ? captionTracks.length : 0);
        
        if (captionTracks && captionTracks.length > 0) {
          console.log('   - Available tracks:');
          captionTracks.forEach((track, i) => {
            console.log(`     ${i + 1}. ${track.languageCode}: ${track.name.simpleText}`);
          });
        }
      }
    } else {
      console.log('   - Could not find player response in HTML');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await checkYouTubePage();
  await testYoutubeTranscript();
  await testInnertubeDetailed();
  await testOurAPI();
  await manualExtractionTest();
  
  console.log('\n📊 Debug Summary:');
  console.log('Video ID:', videoId);
  console.log('Tests completed. Check results above for issues.');
}

runAllTests().catch(console.error);