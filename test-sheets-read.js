// Google Sheets 읽기 테스트
const { google } = require('googleapis');

async function testGoogleSheetsRead() {
  console.log('🎯 Google Sheets 읽기 테스트');
  console.log('=' .repeat(50));
  
  const API_KEY = 'AIzaSyABNSH0Ia2IPzRVZ1hyy4eg_Tr_6gFjrWE';
  const SHEET_ID = '1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU';
  
  try {
    console.log('\n📖 API 키로 Google Sheets 접근 중...');
    
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });
    
    // 시트 정보 가져오기
    console.log('📊 시트 정보 조회...');
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID
    });
    
    console.log(`   시트 제목: ${sheetInfo.data.properties.title}`);
    console.log(`   시트 개수: ${sheetInfo.data.sheets.length}`);
    
    // 데이터 읽기 시도
    console.log('\n📋 데이터 읽기 시도...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:H10'
    });
    
    const rows = response.data.values || [];
    console.log(`   읽은 행 수: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('   첫 번째 행:', rows[0]);
      if (rows.length > 1) {
        console.log('   두 번째 행:', rows[1]);
      }
    }
    
    console.log('\n✅ 읽기 테스트 성공!');
    console.log('⚠️ 하지만 API 키는 읽기 전용입니다.');
    console.log('📝 쓰기를 위해서는 서비스 계정이 필요합니다.');
    
  } catch (error) {
    console.error('\n❌ 읽기 테스트 실패:', error.message);
    
    if (error.message.includes('403')) {
      console.log('🔐 권한 오류: 시트가 비공개이거나 API 키에 권한이 없습니다.');
    } else if (error.message.includes('404')) {
      console.log('🔍 시트를 찾을 수 없습니다: ID를 확인해주세요.');
    }
  }
}

testGoogleSheetsRead().then(() => {
  console.log('\n🏁 읽기 테스트 완료');
}).catch(error => {
  console.error('테스트 실행 실패:', error);
});