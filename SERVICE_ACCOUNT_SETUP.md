# Google Service Account Setup Guide

## 단계별 Google Service Account 설정

### 1. Google Cloud Console 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 ID 기록 (예: `youtube-ai-thread-12345`)

### 2. Google Sheets API 활성화

1. Google Cloud Console > API 및 서비스 > 라이브러리
2. "Google Sheets API" 검색 및 활성화
3. "Google Drive API"도 함께 활성화 (권한 관리용)

### 3. Service Account 생성

1. Google Cloud Console > IAM 및 관리 > 서비스 계정
2. "서비스 계정 만들기" 클릭
3. 서비스 계정 정보 입력:
   - **이름**: `youtube-ai-sheets-service`
   - **설명**: `YouTube AI Thread Google Sheets Integration`
4. "만들기 및 계속하기" 클릭
5. 역할 부여 (선택사항이지만 보안을 위해 권장):
   - **기본 편집자** 또는 **Project > Editor**
6. "완료" 클릭

### 4. Service Account Key 생성

1. 생성된 서비스 계정 클릭
2. "키" 탭 선택
3. "키 추가" > "새 키 만들기"
4. **JSON** 형식 선택
5. 키 파일 다운로드 (예: `youtube-ai-thread-12345-abc123.json`)

### 5. Google Sheets 권한 설정

1. [Google Sheets](https://sheets.google.com/)에서 대상 스프레드시트 열기
2. 우상단 "공유" 버튼 클릭
3. 서비스 계정 이메일 추가 (예: `youtube-ai-sheets-service@youtube-ai-thread-12345.iam.gserviceaccount.com`)
4. 권한을 **편집자**로 설정
5. "전송" 클릭

### 6. 환경변수 설정

다운로드한 JSON 키 파일의 내용을 환경변수로 설정:

**.env.local 파일 수정:**
```bash
# Google Service Account (JSON 키 파일 내용을 한 줄로)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"youtube-ai-thread-12345","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...-----END PRIVATE KEY-----\n","client_email":"youtube-ai-sheets-service@youtube-ai-thread-12345.iam.gserviceaccount.com","client_id":"123456789...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/youtube-ai-sheets-service%40youtube-ai-thread-12345.iam.gserviceaccount.com"}

# Google Sheet ID (스프레드시트 URL에서 추출)
GOOGLE_SHEET_ID=1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU
```

### 7. 권한 확인 체크리스트

✅ Google Cloud 프로젝트 생성 완료  
✅ Google Sheets API 활성화 완료  
✅ Google Drive API 활성화 완료  
✅ Service Account 생성 완료  
✅ Service Account JSON 키 다운로드 완료  
✅ Google Sheets에 Service Account 이메일 편집자 권한 부여 완료  
✅ .env.local에 GOOGLE_SERVICE_ACCOUNT_KEY 설정 완료  
✅ .env.local에 GOOGLE_SHEET_ID 설정 완료  

### 8. 테스트 실행

설정이 완료되면 다음 명령어로 테스트:

```bash
# API 저장 테스트
node test-save-api.js

# E2E 테스트
node test-google-sheets.js
```

### 9. 보안 주의사항

⚠️ **중요**: JSON 키 파일은 절대 Git에 커밋하지 마세요!  
⚠️ **권장**: Production 환경에서는 환경변수나 보안 키 관리 서비스 사용  
⚠️ **모범 사례**: 서비스 계정에 최소 권한만 부여  

### 10. 문제 해결

**403 Forbidden 오류**:
- Google Sheets에 서비스 계정 이메일이 편집자로 추가되었는지 확인
- Google Sheets API와 Google Drive API가 활성화되었는지 확인

**인증 오류**:
- JSON 키 파일 형식이 올바른지 확인
- 환경변수가 정확히 설정되었는지 확인

**API 키 vs Service Account**:
- API 키: 읽기 전용, 공개 데이터용
- Service Account: 읽기/쓰기, 비공개 데이터용 (이 프로젝트에 필요)

---

## 현재 상태

현재 시스템은 다음과 같이 동작합니다:

1. **1차 시도**: Google Sheets API (Service Account) ← **설정 필요**
2. **2차 시도**: Google Apps Script (웹앱) ← **선택적**
3. **3차 Fallback**: 로컬 JSON 파일 저장 ← **현재 상태**

Service Account를 설정하면 실제 Google Drive의 스프레드시트에 직접 저장됩니다.