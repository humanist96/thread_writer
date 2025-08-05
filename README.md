# YouTube AI Thread Generator

YouTube 동영상의 자막을 추출하여 AI가 스레드 형식의 콘텐츠를 생성해주는 Next.js 애플리케이션입니다.

Transform YouTube videos into engaging thread content with AI-powered analysis.

## 주요 기능 / Features

- 🔍 **YouTube 동영상 검색**: YouTube API를 통한 동영상 검색
- 📝 **자동 자막 추출**: youtube-transcript, youtubei.js를 이용한 자막 추출
- 🤖 **AI 스레드 생성**: OpenAI GPT-4를 활용한 스레드 콘텐츠 생성
- ✏️ **스레드 편집기**: 생성된 스레드 편집 및 커스터마이징
- 💾 **Google Sheets 저장**: Google Sheets API 연동 (선택사항)
- 📋 **클립보드 복사**: 간편한 복사/붙여넣기 기능
- 🎨 **반응형 디자인**: 모바일/데스크톱 모두 지원

## 기술 스택 / Tech Stack

- **Framework**: Next.js 15.4.5, React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (localStorage 지원)
- **Animations**: Framer Motion
- **AI**: OpenAI GPT-4 API
- **APIs**: YouTube Data API v3, YouTube Transcript API, Google Sheets API
- **Testing**: Playwright

## Setup

1. Clone the repository:
```bash
git clone https://github.com/humanist96/thread_writer.git
cd thread_writer
```

2. Install dependencies:
```bash
npm install
```

3. 환경 변수 설정 `.env.local`:
```env
# 필수 / Required
YOUTUBE_API_KEY=your_youtube_api_key
OPENAI_API_KEY=your_openai_api_key

# 선택사항 / Optional (Google Sheets)
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_APPS_SCRIPT_URL=your_apps_script_url  # For write access
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 환경 변수 / Environment Variables

### 필수 항목 (Required)
- `YOUTUBE_API_KEY`: YouTube Data API v3 키 (Google Cloud Console에서 발급)
- `OPENAI_API_KEY`: OpenAI API 키

### 선택 항목 (Optional)
- `GOOGLE_SHEETS_API_KEY`: Google Sheets API 키 (읽기 전용)
- `GOOGLE_SHEETS_ID`: 저장할 스프레드시트 ID
- `GOOGLE_APPS_SCRIPT_URL`: Google Apps Script 웹앱 URL (쓰기 권한용)

## Usage

1. **Search Videos**: Enter keywords to search YouTube videos
2. **Select Video**: Click on a video to extract its transcript
3. **Generate Thread**: AI automatically creates thread content from the transcript
4. **Edit & Customize**: Edit individual tweets, reorder them, adjust content
5. **Save & Share**: Copy threads or save to Google Sheets

## Google Sheets Setup

1. Create a new Google Sheet
2. Set up columns: Timestamp, Video ID, Video Title, Channel, Summary, Threads, Created At
3. Enable Google Sheets API in Google Cloud Console
4. Share the sheet with your service account email

## 배포 / Deployment

### Vercel 배포

1. Vercel CLI 설치:
```bash
npm i -g vercel
```

2. 배포:
```bash
vercel
```

3. 환경 변수 설정:
Vercel 대시보드에서 프로젝트 Settings → Environment Variables에 추가

### 프로덕션 배포:
```bash
vercel --prod
```

## API Routes

- `/api/youtube/search` - Search YouTube videos
- `/api/transcript` - Extract video transcript
- `/api/generate-thread` - Generate thread content with AI
- `/api/sheets/save` - Save threads to Google Sheets

## 문제 해결 / Troubleshooting

### 자막 추출 실패
- 동영상에 자막이 없는 경우 → "Generate AI Thread Anyway" 또는 "Enter Manual Transcript" 사용
- 지역 제한 동영상 → 다른 동영상 선택
- API 할당량 초과 → 잠시 후 재시도

### Google Sheets 저장 실패
- API 키는 읽기 전용 → Google Apps Script URL 설정 필요
- 권한 오류 → 스프레드시트 공유 설정 확인

## 기여하기 / Contributing

Issues와 Pull Requests를 환영합니다!

## 라이선스 / License

MIT License