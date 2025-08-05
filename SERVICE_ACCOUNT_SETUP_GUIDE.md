# Google Service Account 설정 가이드

## Service Account 생성 위치 및 방법

### 1. Google Cloud Console 접속
```
https://console.cloud.google.com
```

### 2. 프로젝트 선택 또는 생성
- 상단의 프로젝트 선택 드롭다운 클릭
- 기존 프로젝트 선택 또는 "새 프로젝트" 클릭
- 프로젝트 이름: "YouTube AI Thread" (예시)

### 3. Service Account 생성 단계

#### Step 1: Navigation
```
좌측 메뉴 → IAM 및 관리자 → 서비스 계정
또는
APIs & Services → Credentials → Create Credentials → Service Account
```

#### Step 2: Service Account 만들기
1. **"서비스 계정 만들기"** 버튼 클릭
2. 서비스 계정 세부정보 입력:
   - 서비스 계정 이름: `youtube-ai-thread-writer`
   - 서비스 계정 ID: 자동 생성됨
   - 서비스 계정 설명: "YouTube AI Thread Google Sheets Writer"
3. **"만들기 및 계속"** 클릭

#### Step 3: 권한 부여
1. 역할 선택:
   - "편집자" (Editor) 역할 선택
   또는
   - "Google Sheets API > Sheets Editor" 선택
2. **"계속"** 클릭

#### Step 4: 키 생성
1. **"완료"** 클릭 후 생성된 서비스 계정 클릭
2. **"키"** 탭으로 이동
3. **"키 추가"** → **"새 키 만들기"**
4. 키 유형: **JSON** 선택
5. **"만들기"** 클릭
6. JSON 파일이 자동으로 다운로드됨

### 4. Google Sheets API 활성화

#### APIs 활성화
```
APIs & Services → 라이브러리 → "Google Sheets API" 검색 → 사용 설정
```

### 5. Google Sheets에 권한 부여

#### 중요! 스프레드시트에 Service Account 추가
1. Google Sheets 열기: https://docs.google.com/spreadsheets/d/1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU
2. 우측 상단 **"공유"** 버튼 클릭
3. Service Account 이메일 추가:
   - 다운로드받은 JSON 파일에서 `client_email` 찾기
   - 예: `youtube-ai-thread@project-id.iam.gserviceaccount.com`
4. 권한: **"편집자"** 선택
5. **"보내기"** 클릭

### 6. .env.local 파일 업데이트

#### JSON 파일 내용 복사
1. 다운로드받은 JSON 파일 열기
2. 전체 내용 복사
3. .env.local 파일 열기
4. 다음과 같이 한 줄로 붙여넣기:

```bash
# 기존 (placeholder)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project"...}

# 새로운 (실제 JSON 내용을 한 줄로)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"youtube-ai-thread-123456","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n","client_email":"youtube-ai-thread@youtube-ai-thread-123456.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/youtube-ai-thread%40youtube-ai-thread-123456.iam.gserviceaccount.com"}
```

### 7. 서버 재시작 및 테스트

```bash
# 서버 재시작
cd youtube-ai-thread
PORT=7010 npm run dev

# 테스트
node test-google-sheets-save.js
```

## 체크리스트

- [ ] Google Cloud Console 프로젝트 생성
- [ ] Service Account 생성
- [ ] JSON 키 다운로드
- [ ] Google Sheets API 활성화
- [ ] 스프레드시트에 Service Account 이메일 추가 (편집자 권한)
- [ ] .env.local에 JSON 키 추가
- [ ] 서버 재시작

## 주의사항

1. **JSON 키 보안**: 절대 GitHub에 커밋하지 마세요
2. **이메일 주소**: Service Account의 이메일 주소를 반드시 스프레드시트에 추가해야 합니다
3. **한 줄로 저장**: .env.local에 JSON을 저장할 때 반드시 한 줄로 저장하세요
4. **권한**: 스프레드시트에서 "편집자" 권한을 부여해야 합니다

## 대안: Google Apps Script 사용

Service Account 설정이 복잡하다면, Google Apps Script를 사용하는 것이 더 간단할 수 있습니다:
- 구글 계정만 있으면 사용 가능
- 별도의 인증 설정 불필요
- GOOGLE_SHEETS_FIX_GUIDE.md 참조