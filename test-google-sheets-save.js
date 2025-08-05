// Google Sheets 저장 기능 테스트 스크립트
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testGoogleSheetsSave() {
  console.log('=== Google Sheets Save Test ===\n');

  // 1. 환경 변수 확인
  console.log('1. Environment Variables Check:');
  console.log(`   API Key exists: ${!!process.env.GOOGLE_SHEETS_API_KEY}`);
  console.log(`   Sheet ID: ${process.env.GOOGLE_SHEETS_ID || 'Not set'}`);
  console.log(`   Apps Script URL exists: ${!!process.env.GOOGLE_APPS_SCRIPT_URL}`);
  console.log(`   Service Account exists: ${!!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_KEY !== '{"type":"service_account","project_id":"your-project"}'}`);

  // 2. Google Apps Script 직접 테스트
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    console.log('\n2. Testing Google Apps Script directly:');
    console.log(`   URL: ${process.env.GOOGLE_APPS_SCRIPT_URL}`);
    
    try {
      // GET 요청으로 스크립트 상태 확인
      const getResponse = await axios.get(process.env.GOOGLE_APPS_SCRIPT_URL);
      console.log(`   ✅ GET request successful: ${getResponse.data}`);
    } catch (error) {
      console.log(`   ❌ GET request failed: ${error.response?.status || error.message}`);
    }

    try {
      // POST 요청으로 저장 테스트
      const testData = {
        videoId: 'test_123',
        videoTitle: 'Test Video',
        channelTitle: 'Test Channel',
        summary: 'Test summary',
        threads: ['Test thread content'],
        createdAt: new Date().toISOString()
      };

      const postResponse = await axios.post(process.env.GOOGLE_APPS_SCRIPT_URL, testData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`   ✅ POST request successful:`, postResponse.data);
    } catch (error) {
      console.log(`   ❌ POST request failed: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log(`   Error details:`, error.response.data.substring(0, 200));
      }
    }
  }

  // 3. Local API 엔드포인트 테스트
  console.log('\n3. Testing local API endpoint:');
  try {
    const response = await axios.post('http://localhost:7010/api/sheets/save', {
      videoId: 'test_456',
      videoTitle: 'API Test Video',
      channelTitle: 'API Test Channel',
      summary: 'API test summary',
      threads: ['API test thread'],
      createdAt: new Date().toISOString()
    });

    console.log(`   ✅ Local API test successful:`, response.data);
  } catch (error) {
    console.log(`   ❌ Local API test failed: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`   Error details:`, error.response.data);
    }
  }

  // 4. 권한 문제 분석
  console.log('\n4. Permission Analysis:');
  console.log('   Common issues:');
  console.log('   - API Key is read-only (cannot write)');
  console.log('   - Apps Script needs "Anyone" access permission');
  console.log('   - Service Account needs to be added as editor to sheet');
  console.log('   - Sheet ID must match: 1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU');

  // 5. 추천 해결책
  console.log('\n5. Recommended Solution:');
  console.log('   1) Redeploy Google Apps Script with "Anyone" access');
  console.log('   2) Or set up proper Service Account with JSON key');
  console.log('   3) Or use manual copy feature (already working)');
}

// 실행
testGoogleSheetsSave().catch(console.error);