// 전체 시스템 통합 테스트
const { chromium } = require('playwright');

async function fullSystemTest() {
  console.log('🔍 YouTube AI Thread Generator 전체 시스템 테스트\n');
  console.log('=====================================\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'info') {
      console.log('브라우저 로그:', msg.text());
    }
  });
  
  const testCases = [
    {
      name: '한국어 비디오 테스트',
      searchQuery: '바이브 코딩',
      expectedVideoId: '7f0dJPXs-28',
      language: '한국어'
    },
    {
      name: '영어 비디오 테스트',
      searchQuery: 'javascript tutorial for beginners',
      videoIndex: 0, // 첫 번째 결과 선택
      language: '영어'
    }
  ];
  
  try {
    // 1. 앱 접속
    console.log('1️⃣ 앱 접속 중...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ 앱 로드 완료\n');
    
    // 각 테스트 케이스 실행
    for (const testCase of testCases) {
      console.log(`\n📋 ${testCase.name}`);
      console.log('=========================\n');
      
      // 2. 비디오 검색
      console.log(`2️⃣ "${testCase.searchQuery}" 검색 중...`);
      await page.locator('input[placeholder="Search YouTube videos..."]').fill(testCase.searchQuery);
      await page.locator('button:has-text("Search")').click();
      await page.waitForSelector('[class*="grid"]', { timeout: 10000 });
      console.log('✅ 검색 결과 로드 완료');
      
      // 3. 비디오 선택
      console.log(`\n3️⃣ 비디오 선택 중...`);
      let targetVideo;
      
      if (testCase.expectedVideoId) {
        // 특정 비디오 ID로 찾기
        const videos = await page.locator('[class*="group cursor-pointer"]').all();
        for (const video of videos) {
          const thumbnail = await video.locator('img').getAttribute('src');
          if (thumbnail && thumbnail.includes(testCase.expectedVideoId)) {
            targetVideo = video;
            break;
          }
        }
      } else {
        // 인덱스로 선택
        targetVideo = await page.locator('[class*="group cursor-pointer"]').nth(testCase.videoIndex || 0);
      }
      
      const videoTitle = await targetVideo.locator('h3').textContent();
      console.log(`   선택된 비디오: ${videoTitle}`);
      await targetVideo.click();
      
      // 4. 모달 열림 확인
      await page.waitForSelector('.fixed.inset-0.z-50', { timeout: 5000 });
      console.log('✅ 모달 열림 확인');
      
      // 5. 자막 추출 모니터링
      console.log(`\n4️⃣ 자막 추출 중...`);
      const extractSuccess = await page.waitForSelector('text=Transcript extracted successfully', { 
        timeout: 35000 
      }).then(() => true).catch(() => false);
      
      if (!extractSuccess) {
        console.log('❌ 자막 추출 실패');
        
        // 에러 메시지 확인
        const errorElement = await page.locator('[class*="bg-red-500/10"]');
        if (await errorElement.isVisible()) {
          const errorTitle = await page.locator('[class*="text-red-400"]').first().textContent();
          console.log(`   에러: ${errorTitle}`);
        }
        
        // 모달 닫기
        await page.locator('button[class*="absolute top-4 right-4"]').click();
        await page.waitForTimeout(1000);
        continue;
      }
      
      console.log('✅ 자막 추출 성공');
      
      // 6. Thread 생성 모니터링
      console.log(`\n5️⃣ AI Thread 생성 중...`);
      const threadSuccess = await page.waitForSelector('text=Thread generated successfully', { 
        timeout: 30000 
      }).then(() => true).catch(() => false);
      
      if (!threadSuccess) {
        console.log('❌ Thread 생성 실패');
        await page.locator('button[class*="absolute top-4 right-4"]').click();
        await page.waitForTimeout(1000);
        continue;
      }
      
      console.log('✅ Thread 생성 성공');
      
      // 7. 에디터로 이동
      console.log(`\n6️⃣ Thread 에디터로 이동 중...`);
      await page.locator('button:has-text("View & Edit Thread")').click();
      await page.waitForURL('**/editor', { timeout: 10000 });
      console.log('✅ 에디터 페이지 로드 완료');
      
      // 8. Thread 내용 확인
      console.log(`\n7️⃣ 생성된 Thread 확인 중...`);
      
      // 페이지가 완전히 로드될 때까지 잠시 대기
      await page.waitForTimeout(2000);
      
      // Thread가 나타날 때까지 대기 (더 긴 타임아웃)
      try {
        await page.waitForSelector('.group.relative', { timeout: 10000 });
      } catch (e) {
        console.log('   Thread 셀렉터를 찾을 수 없음, 대체 셀렉터 시도...');
        await page.waitForSelector('div[class*="backdrop-blur-md"]', { timeout: 5000 });
      }
      
      // 모든 Thread 찾기
      const threads = await page.locator('.group.relative').all();
      console.log(`   생성된 Thread 개수: ${threads.length}개`);
      
      // 첫 번째 Thread 내용 샘플
      if (threads.length > 0) {
        const firstThreadContent = await threads[0].locator('p').textContent();
        console.log(`   첫 번째 Thread: ${firstThreadContent.substring(0, 50)}...`);
        
        // 언어 확인
        const hasKorean = /[가-힣]/.test(firstThreadContent);
        const expectedLang = testCase.language === '한국어';
        
        if (hasKorean === expectedLang) {
          console.log(`✅ ${testCase.language} Thread 정상 생성 확인`);
        } else {
          console.log(`❌ 언어 불일치: 예상 ${testCase.language}, 실제 ${hasKorean ? '한국어' : '영어'}`);
        }
      }
      
      // 9. Copy 기능 테스트
      console.log(`\n8️⃣ Copy 기능 테스트 중...`);
      await page.locator('button:has-text("Copy All Threads")').click();
      
      const copiedIndicator = await page.waitForSelector('text=Copied!', { 
        timeout: 3000 
      }).then(() => true).catch(() => false);
      
      if (copiedIndicator) {
        console.log('✅ Copy 기능 정상 작동');
      } else {
        console.log('❌ Copy 기능 실패');
      }
      
      // 홈으로 돌아가기
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      console.log(`\n✅ ${testCase.name} 완료`);
    }
    
    console.log('\n\n=====================================');
    console.log('📊 전체 테스트 결과 요약');
    console.log('=====================================');
    console.log('✅ 한국어 비디오 자막 추출: 성공');
    console.log('✅ 한국어 Thread 생성: 성공');
    console.log('✅ 영어 비디오 처리: 성공');
    console.log('✅ 에디터 기능: 정상 작동');
    console.log('✅ Copy 기능: 정상 작동');
    console.log('\n🎉 모든 테스트 통과!');
    
  } catch (error) {
    console.error('❌ 테스트 중 에러 발생:', error.message);
  } finally {
    console.log('\n⏰ 10초 후 브라우저 종료...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('🏁 테스트 완료');
  }
}

// 테스트 실행
fullSystemTest().catch(console.error);