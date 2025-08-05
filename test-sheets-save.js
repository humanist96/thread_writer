// Google Sheets 저장 테스트
const axios = require('axios');

async function testGoogleSheetsSave() {
  try {
    console.log('Testing Google Sheets save functionality...\n');
    
    const testData = {
      videoId: 'test_' + Date.now(),
      videoTitle: '테스트 비디오 - Google Sheets 저장 테스트',
      channelTitle: '테스트 채널',
      summary: '이것은 Google Sheets 저장 기능을 테스트하기 위한 요약입니다.',
      threads: [
        '첫 번째 스레드 내용입니다.',
        '두 번째 스레드 내용입니다.',
        '세 번째 스레드 내용입니다.'
      ],
      createdAt: new Date().toISOString()
    };
    
    console.log('Sending test data to API...');
    
    const response = await axios.post('http://localhost:3010/api/sheets/save', testData);
    
    console.log('\n✅ Response received:');
    console.log('Method:', response.data.method);
    console.log('Message:', response.data.message);
    
    if (response.data.method === 'manual_copy_required') {
      console.log('\n📋 Manual copy required!');
      console.log('Google Sheets URL:', response.data.result.googleSheetsUrl);
      console.log('\nData to copy (tab-separated):');
      const clip = response.data.clipboardData;
      console.log([
        clip.timestamp,
        clip.videoId,
        clip.videoTitle,
        clip.channelTitle,
        clip.summary,
        clip.threadContent,
        new Date().toISOString(),
        clip.characterCount
      ].join('\t'));
    }
    
    console.log('\nFull response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// 서버가 실행 중인지 확인
axios.get('http://localhost:3010')
  .then(() => {
    console.log('Server is running on port 3010\n');
    testGoogleSheetsSave();
  })
  .catch(() => {
    console.error('❌ Server is not running on port 3010');
    console.log('Please run: PORT=3010 npm run dev');
  });