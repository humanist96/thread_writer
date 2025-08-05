# Google Sheets Write 문제 해결 가이드

## 문제 분석

현재 Google Sheets 저장이 안 되는 정확한 원인:

1. **API Key는 읽기 전용**: `AIzaSyABNSH0Ia2IPzRVZ1hyy4eg_Tr_6gFjrWE`는 쓰기 권한이 없음
2. **Google Apps Script 401 오류**: 스크립트가 제대로 배포되지 않았거나 권한 설정이 잘못됨
3. **Service Account 미설정**: 실제 서비스 계정 JSON이 아닌 placeholder 값만 있음

## 해결 방법 (3가지 중 선택)

### 방법 1: Google Apps Script 수정 (가장 빠른 해결책) ⭐추천

1. **Google Apps Script 새로 만들기**
   ```
   https://script.google.com 접속
   → 새 프로젝트 생성
   ```

2. **스크립트 코드 붙여넣기**
   ```javascript
   function doPost(e) {
     try {
       // CORS 헤더 설정
       const output = ContentService.createTextOutput();
       output.setMimeType(ContentService.MimeType.JSON);
       
       // 요청 데이터 파싱
       const data = JSON.parse(e.postData.contents);
       
       // 스프레드시트 열기
       const spreadsheet = SpreadsheetApp.openById('1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU');
       const sheet = spreadsheet.getSheetByName('YouTube Threads') || spreadsheet.insertSheet('YouTube Threads');
       
       // 헤더가 없으면 추가
       if (sheet.getLastRow() === 0) {
         sheet.appendRow(['Date', 'Video ID', 'Video Title', 'Channel', 'Summary', 'Threads']);
       }
       
       // 데이터 추가
       sheet.appendRow([
         new Date(),
         data.videoId || '',
         data.videoTitle || '',
         data.channelTitle || '',
         data.summary || '',
         JSON.stringify(data.threads || [])
       ]);
       
       return output.setContent(JSON.stringify({
         success: true,
         message: 'Data saved successfully'
       }));
       
     } catch (error) {
       return ContentService.createTextOutput(JSON.stringify({
         success: false,
         error: error.toString()
       })).setMimeType(ContentService.MimeType.JSON);
     }
   }
   
   function doGet(e) {
     return ContentService.createTextOutput('Google Apps Script is running').setMimeType(ContentService.MimeType.TEXT);
   }
   ```

3. **배포 설정 (중요!)**
   ```
   배포 → 새 배포
   → 유형: 웹 앱
   → 설명: YouTube AI Thread Saver
   → 다음 사용자로 실행: 나 (humanist96@gmail.com)
   → 액세스 권한: 모든 사용자 ⭐
   → 배포
   ```

4. **새 URL을 .env.local에 업데이트**
   ```
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/새로운URL/exec
   ```

### 방법 2: Service Account 설정 (가장 안정적)

1. **Google Cloud Console에서 Service Account 생성**
   ```
   https://console.cloud.google.com
   → APIs & Services → Credentials
   → Create Credentials → Service Account
   ```

2. **권한 설정**
   - Service Account에 "Editor" 역할 부여
   - JSON 키 다운로드

3. **Google Sheets에 권한 부여**
   - Service Account 이메일을 스프레드시트에 편집자로 추가

4. **.env.local 업데이트**
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account"...실제JSON내용...}
   ```

### 방법 3: 현재 수동 복사 기능 사용 (임시)

이미 구현된 기능으로, 자동 저장 실패 시:
1. 데이터가 클립보드에 복사됨
2. Google Sheets 링크가 제공됨
3. 수동으로 붙여넣기 가능

## 즉시 테스트 방법

```bash
# 1. 서버 재시작
cd youtube-ai-thread
PORT=7010 npm run dev

# 2. 브라우저에서 테스트
# - 비디오 검색 → AI Thread 생성 → Editor에서 "Google Sheets에 저장" 클릭

# 3. 디버그 스크립트 실행
node test-google-sheets-save.js
```

## 권장 순서

1. **먼저 Google Apps Script 방법 시도** (5분 소요)
2. 여전히 안 되면 **Service Account 설정** (20분 소요)
3. 급하면 **수동 복사 기능 사용**

## 주의사항

- Google Apps Script URL은 반드시 `/exec`로 끝나야 함
- 배포 시 "모든 사용자" 액세스 권한 필수
- 스프레드시트 ID가 정확한지 확인: `1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU`