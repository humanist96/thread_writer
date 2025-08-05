# 간단한 Google Forms 연동 솔루션

## 5분 만에 설정하는 방법

### 1단계: Google Form 생성
1. [Google Forms](https://forms.google.com) 접속 (humanist96@gmail.com)
2. "빈 양식" 클릭
3. 제목: "YouTube AI Thread 저장"
4. 다음 질문들 추가:
   - Video ID (단답형)
   - Video Title (단답형) 
   - Channel Title (단답형)
   - Summary (장문형)
   - Thread Content (장문형)
   - Character Count (단답형)

### 2단계: 사전 입력된 링크 생성
1. 우측 상단 점 3개 메뉴 → "사전 입력된 링크 가져오기"
2. 각 필드에 테스트 값 입력:
   - Video ID: `{{VIDEO_ID}}`
   - Video Title: `{{VIDEO_TITLE}}`
   - 나머지도 동일하게
3. "링크 가져오기" 클릭
4. 생성된 URL 복사

### 3단계: 응답 자동 저장
1. "응답" 탭 클릭
2. 구글 시트 아이콘 클릭
3. "새 스프레드시트 만들기" 또는 기존 시트 선택
4. 연결 완료!

### 4단계: 코드 구현

```javascript
// lib/googleFormsIntegration.ts
export function generateGoogleFormUrl(data: {
  videoId: string
  videoTitle: string
  channelTitle: string
  summary: string
  threadContent: string
  characterCount: number
}) {
  // 위에서 복사한 사전 입력 URL 사용
  const baseUrl = '여기에_복사한_URL_붙여넣기';
  
  // URL 파라미터 교체
  const params = new URLSearchParams();
  params.append('entry.123456789', data.videoId); // 실제 entry ID로 교체
  params.append('entry.987654321', data.videoTitle); // 실제 entry ID로 교체
  // ... 나머지 필드들
  
  return `${baseUrl}?${params.toString()}`;
}
```

### 5단계: 자동 제출 (선택사항)
```javascript
// 숨겨진 iframe으로 자동 제출
export async function submitToGoogleForm(data: any) {
  const formUrl = generateGoogleFormUrl(data);
  
  // iframe 생성
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = formUrl + '&submit=Submit';
  document.body.appendChild(iframe);
  
  // 3초 후 제거
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 3000);
  
  return { success: true };
}
```

## 장점
- 서비스 계정 불필요
- API 키 불필요
- CORS 문제 없음
- 5분 만에 설정 완료
- Google Sheets에 자동 저장

## 현재 시트와 연동
기존 Google Sheet (1wWHBewQmdB1ZK0TJV-j0sLzaqdZsMhG59SkAGGMyrmU)를 사용하려면:
1. Form 응답 탭에서 구글 시트 아이콘 클릭
2. "기존 스프레드시트 선택"
3. 해당 시트 선택

이 방법이 가장 간단하고 확실합니다!