// Google Apps Script 직접 테스트
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// 새로운 URL 직접 설정 (환경 변수가 로드되지 않을 경우 대비)
const HARDCODED_URL = 'https://script.google.com/macros/s/AKfycbwP_Kwkjm4b4jna7dPi18UhWzN2Y_n_duLomRKxwZhFQg0XbMwaQIu_0hfmH8a3zDoc/exec';

async function testGoogleAppsScript() {
  const SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || HARDCODED_URL;
  
  console.log('Google Apps Script URL from env:', process.env.GOOGLE_APPS_SCRIPT_URL);
  console.log('Using URL:', SCRIPT_URL);
  
  if (!SCRIPT_URL) {
    console.error('❌ GOOGLE_APPS_SCRIPT_URL not found in environment variables!');
    return;
  }
  
  const testData = {
    action: 'saveThread',
    timestamp: new Date().toISOString(),
    videoId: 'direct_test_' + Date.now(),
    videoTitle: 'Direct Test Video',
    channelTitle: 'Test Channel',
    summary: 'Testing Google Apps Script directly',
    threadContent: 'This is a direct test of Google Apps Script',
    characterCount: 42,
    createdAt: new Date().toISOString()
  };
  
  console.log('\nSending test data to Google Apps Script...');
  console.log('URL:', SCRIPT_URL);
  console.log('Data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      redirect: 'follow' // Google Apps Script may redirect
    });
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', response.headers.raw());
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('\nParsed Response:', JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log('Response is not JSON');
    }
    
  } catch (error) {
    console.error('\n❌ Error calling Google Apps Script:', error);
  }
}

// Check if node-fetch is installed
try {
  require.resolve('node-fetch');
  testGoogleAppsScript();
} catch (e) {
  console.log('Installing node-fetch...');
  const { execSync } = require('child_process');
  execSync('npm install node-fetch@2', { stdio: 'inherit' });
  console.log('Please run the script again.');
}