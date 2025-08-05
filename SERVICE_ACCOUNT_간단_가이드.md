# Service Account 빠른 설정 가이드

## 📍 Service Account 찾는 곳

### 1. Google Cloud Console
```
https://console.cloud.google.com
```

### 2. 메뉴 경로
```
☰ (햄버거 메뉴) → IAM 및 관리자 → 서비스 계정
```

## 🚀 5분 만에 설정하기

### Step 1: 프로젝트 만들기
1. 상단 프로젝트 선택 → "새 프로젝트"
2. 프로젝트 이름: `youtube-ai-thread`
3. "만들기" 클릭

### Step 2: Service Account 생성
1. "서비스 계정 만들기" 클릭
2. 이름: `sheets-writer`
3. "만들기 및 계속" → "편집자" 역할 선택 → "완료"

### Step 3: JSON 키 다운로드
1. 생성된 서비스 계정 클릭
2. "키" 탭 → "키 추가" → "새 키 만들기"
3. "JSON" 선택 → "만들기"
4. 파일이 자동 다운로드됨

### Step 4: Google Sheets API 활성화
```
APIs & Services → 라이브러리 → "Google Sheets API" 검색 → 사용 설정
```

### Step 5: 스프레드시트에 권한 추가 ⭐중요
1. 다운로드한 JSON 파일 열기
2. `"client_email": "xxxxx@xxxxx.iam.gserviceaccount.com"` 찾기
3. Google Sheets 열기: https://docs.google.com/spreadsheets/d/1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU
4. "공유" → 위 이메일 추가 → "편집자" 권한 → "보내기"

### Step 6: .env.local 업데이트
```bash
# JSON 파일 내용 전체를 한 줄로 복사해서 붙여넣기
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...전체내용...}
```

## ✅ 완료!

서버 재시작하고 테스트:
```bash
cd youtube-ai-thread
PORT=7010 npm run dev
```

## 🆘 안 될 때는?

Google Apps Script 방법이 더 쉬워요:
→ `GOOGLE_SHEETS_FIX_GUIDE.md` 참조