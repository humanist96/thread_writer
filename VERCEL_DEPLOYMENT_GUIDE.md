# Vercel 배포 가이드

## 1. Vercel 웹사이트에서 배포 (권장)

1. [Vercel](https://vercel.com) 접속 후 로그인
2. "New Project" 클릭
3. GitHub 연동 및 `humanist96/thread_writer` 저장소 선택
4. Import 클릭

## 2. 환경 변수 설정

Vercel 대시보드에서 프로젝트 선택 → Settings → Environment Variables

### 필수 환경 변수:
```
YOUTUBE_API_KEY=your_youtube_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 선택 환경 변수 (Google Sheets):
```
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_APPS_SCRIPT_URL=your_google_apps_script_url_here
```

## 3. 배포 설정

1. Framework Preset: Next.js (자동 감지됨)
2. Build Command: `npm run build` (기본값)
3. Output Directory: `.next` (기본값)
4. Install Command: `npm install` (기본값)

## 4. 배포 실행

"Deploy" 버튼 클릭

## 5. 배포 완료 후

- 배포 URL: `thread-writer.vercel.app` 또는 커스텀 도메인
- 환경 변수 업데이트 시 재배포 필요

## CLI로 배포 (대안)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서
cd youtube-ai-thread
vercel

# 프로덕션 배포
vercel --prod
```

## 주의사항

1. 모든 API 키는 실제 사용하는 키로 교체하세요
2. Google Service Account JSON은 Vercel 환경 변수에 한 줄로 입력
3. API 키들은 보안을 위해 절대 코드에 하드코딩하지 마세요
4. Vercel Functions 타임아웃은 기본 10초, Pro 플랜은 60초까지 가능
5. 환경 변수 변경 후에는 재배포가 필요합니다