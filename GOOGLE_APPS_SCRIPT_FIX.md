# Google Apps Script 401 에러 해결 가이드

## 문제
Google Apps Script URL이 401 (Unauthorized) 에러를 반환합니다.

## 해결 방법

### 1. Google Apps Script 배포 설정 확인

1. [Google Apps Script](https://script.google.com) 접속
2. 프로젝트 열기
3. "배포" → "배포 관리" 클릭
4. 현재 배포 옆의 편집(연필) 아이콘 클릭
5. **중요 설정 확인**:
   - **실행**: "나" (자신의 계정)
   - **액세스 권한**: "모든 사용자" ✅ (이것이 중요!)
   - ⚠️ "모든 Google 계정 사용자"가 아닌 "모든 사용자"여야 합니다
6. "새 배포" 클릭
7. 새 URL 복사

### 2. 테스트 URL
브라우저에서 새 URL을 직접 열어보세요:
- 정상: "doGet 메서드가 구현되지 않았습니다" 메시지 표시
- 문제: 로그인 화면이나 권한 요청 화면 표시

### 3. 올바른 Google Apps Script 코드

```javascript
function doPost(e) {
  try {
    // CORS 헤더 추가
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'saveThread') {
      const result = saveThreadData(data);
      output.setContent(JSON.stringify(result));
      return output;
    }
    
    output.setContent(JSON.stringify({
      success: false, 
      message: 'Unknown action'
    }));
    return output;
    
  } catch (error) {
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({
      success: false, 
      message: error.toString()
    }));
    return output;
  }
}

function saveThreadData(data) {
  // 여기에 실제 Google Sheet ID 입력
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
    
    return {
      success: true,
      message: 'Thread saved successfully',
      rowNumber: sheet.getLastRow()
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Save failed: ' + error.toString()
    };
  }
}

// 테스트용 GET 메서드
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({
    status: 'OK',
    message: 'Google Apps Script is working'
  }));
  return output;
}
```

### 4. 재배포 절차
1. 위 코드를 복사하여 붙여넣기
2. 저장 (Ctrl+S)
3. "배포" → "새 배포"
4. 설정:
   - 유형: "웹 앱"
   - 실행: "나"
   - 액세스 권한: "모든 사용자" (중요!)
5. "배포" 클릭
6. 새 URL을 `.env.local`에 업데이트

### 5. 권한 문제 지속 시
Google Sheet 자체의 공유 설정 확인:
1. Google Sheets 열기
2. 우측 상단 "공유" 클릭
3. "링크가 있는 모든 사용자" → "편집자" 설정
4. 또는 humanist96@gmail.com이 편집 권한 있는지 확인

## 임시 해결책
권한 문제가 계속되면 현재 구현된 수동 복사 기능을 사용하세요:
1. "Google Sheets에 저장" 클릭
2. 데이터가 클립보드에 복사됨
3. 자동으로 열리는 Google Sheets에 붙여넣기