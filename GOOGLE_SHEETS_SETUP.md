# Google Sheets 연동 설정 가이드

## 1. Google Cloud Console에서 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 ID를 기록해두세요

## 2. Google Sheets API 활성화

1. Google Cloud Console에서 "API 및 서비스" > "라이브러리" 이동
2. "Google Sheets API" 검색 후 활성화
3. "Google Drive API"도 검색 후 활성화 (파일 접근 권한용)

## 3. 서비스 계정 생성

1. "API 및 서비스" > "사용자 인증 정보" 이동
2. "사용자 인증 정보 만들기" > "서비스 계정" 선택
3. 서비스 계정 이름 입력 (예: "youtube-ai-thread-service")
4. 역할: "편집자" 또는 "기본" 선택
5. "완료" 클릭

## 4. 서비스 계정 키 생성

1. 생성된 서비스 계정 클릭
2. "키" 탭으로 이동
3. "키 추가" > "새 키 만들기" > "JSON" 선택
4. JSON 파일이 다운로드됩니다

## 5. Google Sheets 생성 및 공유

1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트 생성
2. URL에서 스프레드시트 ID 복사:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
3. 스프레드시트를 서비스 계정과 공유:
   - "공유" 버튼 클릭
   - 서비스 계정 이메일 주소 입력 (JSON 파일의 `client_email` 값)
   - "편집자" 권한으로 공유

## 6. 환경 변수 설정

`.env.local` 파일에 다음 내용 추가:

```env
# Google Sheets 설정
GOOGLE_SHEET_ID=1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU

# 방법 1: 서비스 계정 키 (JSON 전체 내용을 한 줄로)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# 방법 2: API 키 (읽기 전용, 백업용)
GOOGLE_SHEETS_API_KEY=your_api_key_here
```

## 7. JSON 키 파일 처리

JSON 키 파일을 한 줄로 변환하는 방법:

```bash
# Linux/Mac
cat service-account-key.json | jq -c . | pbcopy

# Windows PowerShell
Get-Content service-account-key.json | ConvertFrom-Json | ConvertTo-Json -Compress | Set-Clipboard
```

## 8. 테스트

1. 애플리케이션 시작
2. YouTube 비디오 검색 및 Thread 생성
3. "Google Sheets에 저장" 버튼 클릭
4. Google Sheets에서 데이터 확인

## 문제 해결

### 권한 오류
- 서비스 계정이 스프레드시트에 편집자 권한으로 공유되었는지 확인
- Google Sheets API와 Google Drive API가 모두 활성화되었는지 확인

### 인증 오류
- JSON 키가 올바르게 환경변수에 설정되었는지 확인
- JSON 형식이 유효한지 확인 (온라인 JSON 검증기 사용)

### 스프레드시트 ID 오류
- URL에서 올바른 스프레드시트 ID를 복사했는지 확인
- ID에 특수문자나 공백이 없는지 확인

## 보안 주의사항

1. JSON 키 파일을 Git에 커밋하지 마세요
2. 환경변수에만 키를 저장하세요
3. 서비스 계정에 최소한의 권한만 부여하세요
4. 정기적으로 키를 교체하세요