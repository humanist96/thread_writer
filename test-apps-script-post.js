const axios = require('axios');

async function testGoogleAppsScriptPost() {
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbwP_Kwkjm4b4jna7dPi18UhWzN2Y_n_duLomRKxwZhFQg0XbMwaQIu_0hfmH8a3zDoc/exec';
  
  console.log('=== Testing Google Apps Script POST Request ===\n');
  console.log('URL:', scriptUrl);
  
  // Test data
  const testData = {
    action: 'saveThread',
    timestamp: new Date().toISOString(),
    videoId: 'post_test_' + Date.now(),
    videoTitle: 'POST Test Video Title',
    channelTitle: 'Test Channel',
    summary: 'This is a test summary for Google Sheets',
    threadContent: 'This is the thread content that should be saved to Google Sheets',
    characterCount: 65,
    createdAt: new Date().toISOString()
  };
  
  console.log('\nSending data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await axios.post(scriptUrl, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Accept any status less than 500
      }
    });
    
    console.log('\n✅ Response received!');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    if (response.data) {
      console.log('\nResponse data:');
      console.log(typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
      
      // If response is HTML, it might be an error page
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        console.log('\n❌ Received HTML instead of JSON. This usually means:');
        console.log('1. The script is not deployed with "Anyone" access');
        console.log('2. The script URL is incorrect');
        console.log('3. There\'s an error in the Google Apps Script code');
        
        // Check for specific error messages
        if (response.data.includes('로그인') || response.data.includes('Sign in')) {
          console.log('\n⚠️  Authentication required! Please redeploy with "Anyone" access.');
        }
      } else if (response.data.success) {
        console.log('\n✅ Data saved successfully to Google Sheets!');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
  
  console.log('\n=== Test completed ===');
}

testGoogleAppsScriptPost();