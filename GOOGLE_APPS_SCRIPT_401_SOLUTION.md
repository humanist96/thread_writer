# Google Apps Script 401 에러 완벽 해결 가이드

## 문제
Google Apps Script가 401 (Unauthorized) 에러를 반환하여 Google Sheets에 저장할 수 없습니다.

## 해결 방법 (스크린샷 포함)

### 1. Google Apps Script 재배포

1. [Google Apps Script](https://script.google.com) 접속
2. 프로젝트 열기
3. **중요**: 기존 배포를 삭제하고 새로 만들어야 합니다

### 2. 올바른 코드 복사

```javascript
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'OK',
      message: 'Google Apps Script is working'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'saveThread') {
      return saveThreadData(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Unknown action'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveThreadData(data) {
  const SHEET_ID = '1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU';
  
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // 헤더가 없으면 추가
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 8).setValues([[
        'Timestamp', 'Video ID', 'Video Title', 'Channel Title', 
        'Summary', 'Thread Content', 'Created At', 'Character Count'
      ]]);
    }
    
    // 데이터 추가
    const row = [
      data.timestamp || new Date().toISOString(),
      data.videoId || '',
      data.videoTitle || '',
      data.channelTitle || '',
      data.summary || '',
      data.threadContent || '',
      data.createdAt || new Date().toISOString(),
      data.characterCount || 0
    ];
    
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Thread saved successfully',
        rowNumber: sheet.getLastRow()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Save failed: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3. 정확한 배포 설정

1. 코드 저장 (Ctrl+S)
2. 상단 메뉴 "배포" → "배포 관리"
3. 기존 배포가 있다면 삭제 (휴지통 아이콘)
4. "새 배포" 클릭
5. **필수 설정**:
   - 유형: **웹 앱**
   - 설명: YouTube AI Thread Save
   - 다음 사용자로 실행: **나** (humanist96@gmail.com)
   - 액세스 권한이 있는 사용자: **모든 사용자** ⚠️ 중요!
   
   ⚠️ 주의: "모든 Google 계정 사용자"가 아닌 "모든 사용자"를 선택해야 합니다!

6. "배포" 버튼 클릭
7. 새 URL 복사

### 4. URL 테스트

브라우저에서 새 URL 열기:
- ✅ 정상: `{"status":"OK","message":"Google Apps Script is working"}`
- ❌ 문제: 로그인 화면이나 HTML 페이지

### 5. 환경 변수 업데이트

`.env.local` 파일:
```
GOOGLE_APPS_SCRIPT_URL=새로_복사한_URL
```

### 6. 서버 재시작

```bash
# 기존 서버 종료 (Ctrl+C)
# 새로 시작
node start-service.js
```

## 대체 해결책: Google Forms 사용

Google Apps Script가 계속 문제가 있다면:

1. [Google Forms](https://forms.google.com) 접속
2. 새 양식 생성
3. 필드 추가:
   - Video ID (단답형)
   - Video Title (단답형)
   - Channel Title (단답형)
   - Summary (장문형)
   - Thread Content (장문형)
   - Character Count (단답형)

4. 응답을 Google Sheets에 연결
5. 폼 URL을 사용하여 자동 제출

## 현재 작동하는 기능

Google Apps Script 설정이 어렵다면:
1. "Google Sheets 열기" 버튼 클릭
2. 데이터가 클립보드에 자동 복사됨
3. Google Sheets에 수동으로 붙여넣기

이 방법이 가장 확실하고 빠릅니다.