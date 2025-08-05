# Google Sheets 저장 문제 해결 가이드

## 문제 원인
Google Sheets API 키는 **읽기 전용**으로만 작동합니다. 데이터를 쓰기 위해서는 다음 중 하나가 필요합니다:
1. Google 서비스 계정 (Service Account)
2. Google Apps Script 웹앱

## 해결 방법 1: Google Apps Script 웹앱 설정 (권장)

### 1단계: Google Apps Script 프로젝트 생성
1. [Google Apps Script](https://script.google.com) 접속
2. humanist96@gmail.com 계정으로 로그인
3. "새 프로젝트" 클릭

### 2단계: 코드 복사
다음 코드를 복사하여 붙여넣기:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'saveThread') {
      return saveThreadData(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Unknown action'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
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
      data.timestamp,
      data.videoId,
      data.videoTitle,
      data.channelTitle,
      data.summary,
      data.threadContent,
      data.createdAt,
      data.characterCount
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

### 3단계: 웹앱으로 배포
1. 저장 (Ctrl+S) 후 프로젝트 이름 설정
2. "배포" → "새 배포" 클릭
3. 설정:
   - 유형: "웹 앱"
   - 설명: "YouTube AI Thread Save"
   - 실행: "나"
   - 액세스 권한: "모든 사용자"
4. "배포" 클릭
5. 권한 요청 시 승인
6. **웹 앱 URL 복사** (중요!)

### 4단계: 환경 변수 설정
`.env.local` 파일에 추가:
```
GOOGLE_APPS_SCRIPT_URL=여기에_복사한_웹앱_URL_붙여넣기
```

## 해결 방법 2: 서비스 계정 설정 (고급)

### 1단계: Google Cloud Console에서 서비스 계정 생성
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택 또는 생성
3. "IAM 및 관리자" → "서비스 계정"
4. "서비스 계정 만들기"
5. 키 생성 (JSON 형식)

### 2단계: Google Sheet에 권한 부여
1. 서비스 계정 이메일 복사 (예: your-service-account@project.iam.gserviceaccount.com)
2. Google Sheets 열기
3. "공유" → 서비스 계정 이메일 추가 (편집자 권한)

### 3단계: 환경 변수 설정
`.env.local` 파일에 추가:
```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

## 빠른 테스트

저장 기능을 테스트하려면:
```bash
node test-google-sheets.js
```

## 현재 상태
- Google Sheet ID: ✅ 설정됨 (1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU)
- Google API Key: ✅ 설정됨 (읽기 전용)
- 쓰기 권한: ❌ 추가 설정 필요

위의 방법 중 하나를 선택하여 설정하면 Google Sheets 저장이 정상적으로 작동합니다.