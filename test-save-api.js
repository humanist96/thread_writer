// Google Sheets 저장 API 직접 테스트
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSaveAPI() {
  console.log('🎯 Google Sheets 저장 API 직접 테스트');
  console.log('=' .repeat(50));
  
  const testData = {
    videoId: 'test123',
    videoTitle: '테스트 비디오 제목',
    channelTitle: '테스트 채널',
    summary: '테스트 요약 내용입니다.',
    threads: [
      '첫 번째 Thread 내용입니다. 이것은 350자 제한 테스트를 위한 내용입니다.',
      '두 번째 Thread 내용입니다. AI가 생성한 내용을 Google Sheets에 저장하는 테스트입니다.'
    ],
    createdAt: new Date().toISOString()
  };
  
  try {
    console.log('\n📤 API 요청 전송...');
    console.log('데이터:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3009/api/sheets/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`\n📥 응답 상태: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ 성공 응답:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.method === 'google_sheets_api') {
        console.log('\n🎉 Google Sheets API를 통해 저장됨!');
        console.log('📊 실제 Google Drive 스프레드시트에 데이터가 저장되었습니다.');
      } else if (result.method === 'google_apps_script') {
        console.log('\n🎉 Google Apps Script를 통해 저장됨!');
        console.log('📊 웹앱을 통해 Google Sheets에 데이터가 저장되었습니다.');
      } else if (result.method === 'local_fallback') {
        console.log('\n⚠️ 로컬 파일로 fallback 저장됨');
        console.log('🔧 Google Sheets 설정 필요');
      }
    } else {
      const error = await response.text();
      console.log('\n❌ 에러 응답:');
      console.log(error);
    }
    
  } catch (error) {
    console.error('\n❌ 요청 실패:', error.message);
    console.error(error.stack);
  }
}

// API 테스트 실행
testSaveAPI().then(() => {
  console.log('\n🏁 API 테스트 완료');
}).catch(error => {
  console.error('테스트 실행 실패:', error);
});