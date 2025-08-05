// Playwright를 사용한 상세 진단 테스트
const { chromium } = require('playwright');

async function diagnoseEditorIssue() {
  console.log('🔍 YouTube AI Thread Generator 에디터 문제 진단');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    devtools: true, // 개발자 도구 열기
    args: ['--disable-web-security']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    console.log(`🌐 [${msg.type()}] ${msg.text()}`);
  });
  
  // 에러 캡처
  page.on('pageerror', error => {
    console.log(`❌ 페이지 에러: ${error.message}`);
  });
  
  try {
    // Step 1: 홈페이지 접속
    console.log('\n1️⃣ 홈페이지 접속...');
    await page.goto('http://localhost:3007', { waitUntil: 'networkidle' });
    console.log(`   현재 URL: ${page.url()}`);
    console.log(`   페이지 제목: ${await page.title()}`);
    
    // Step 2: 검색
    console.log('\n2️⃣ 검색 실행...');
    await page.fill('input[placeholder*="Search"]', '바이브 코딩');
    await page.click('button:has-text("Search")');
    await page.waitForLoadState('networkidle');
    
    // Step 3: 비디오 선택
    console.log('\n3️⃣ 비디오 선택...');
    await page.waitForSelector('[class*="group cursor-pointer"]', { timeout: 10000 });
    const firstVideo = await page.locator('[class*="group cursor-pointer"]').first();
    const videoTitle = await firstVideo.locator('h3').textContent();
    console.log(`   선택된 비디오: ${videoTitle}`);
    
    await firstVideo.click();
    await page.waitForSelector('.fixed.inset-0.z-50');
    
    // Step 4: Thread 생성 대기
    console.log('\n4️⃣ Thread 생성 대기...');
    const success = await page.waitForSelector('text="Thread generated successfully"', { 
      timeout: 60000 
    }).then(() => true).catch(() => false);
    
    if (!success) {
      console.log('❌ Thread 생성 실패');
      return;
    }
    
    console.log('✅ Thread 생성 성공');
    
    // Step 5: Store 상태 확인 (Thread 생성 후)
    console.log('\n5️⃣ Store 상태 확인 (Thread 생성 후)...');
    const storeState = await page.evaluate(() => {
      // Zustand store에 접근 시도
      const storeDiv = document.querySelector('[data-testid="store-state"]');
      
      // 로컬 스토리지 확인
      const localStorage = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        localStorage[key] = window.localStorage.getItem(key);
      }
      
      return {
        localStorage,
        location: window.location.href,
        hasReactDevTools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        reactVersion: window.React?.version || 'Not found'
      };
    });
    
    console.log('   Store 상태:', JSON.stringify(storeState, null, 2));
    
    // Step 6: 에디터로 이동 전 상태 기록
    console.log('\n6️⃣ 에디터 이동 전 상태 기록...');
    
    await page.evaluate(() => {
      // Zustand store 상태를 콘솔에 로그
      console.log('=== BEFORE NAVIGATION ===');
      console.log('Current URL:', window.location.href);
      
      // Next.js 라우터 상태 확인
      if (window.__NEXT_DATA__) {
        console.log('Next.js Data:', window.__NEXT_DATA__);
      }
    });
    
    // Step 7: 에디터로 이동
    console.log('\n7️⃣ 에디터로 이동...');
    await page.click('button:has-text("View & Edit Thread")');
    
    // URL 변경 대기
    await page.waitForURL('**/editor', { timeout: 10000 });
    console.log(`   이동 후 URL: ${page.url()}`);
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Step 8: 에디터 페이지 상태 상세 분석
    console.log('\n8️⃣ 에디터 페이지 상태 분석...');
    
    const editorState = await page.evaluate(() => {
      console.log('=== AFTER NAVIGATION ===');
      console.log('Current URL:', window.location.href);
      
      return {
        url: window.location.href,
        hasThreadsContainer: !!document.querySelector('[class*="space-y-4"]'),
        hasIndividualThreads: document.querySelectorAll('.group.relative').length,
        hasNoThreadsMessage: !!document.querySelector('text="No Threads Available"'),
        hasViewModeButtons: {
          individual: !!document.querySelector('button:has-text("Individual Threads")'),
          combined: !!document.querySelector('button:has-text("Combined View")')
        },
        bodyClasses: document.body.className,
        mainContent: document.querySelector('main')?.innerHTML?.substring(0, 500) || 'No main content'
      };
    });
    
    console.log('   에디터 상태:');
    console.log(`   - Threads 컨테이너: ${editorState.hasThreadsContainer}`);
    console.log(`   - Individual Threads: ${editorState.hasIndividualThreads}개`);
    console.log(`   - No Threads 메시지: ${editorState.hasNoThreadsMessage}`);
    console.log(`   - View Mode 버튼들: Individual=${editorState.hasViewModeButtons.individual}, Combined=${editorState.hasViewModeButtons.combined}`);
    
    // Step 9: DOM 구조 분석
    console.log('\n9️⃣ DOM 구조 분석...');
    
    const noThreadsElement = await page.locator('text="No Threads Available"');
    const isNoThreadsVisible = await noThreadsElement.isVisible().catch(() => false);
    
    if (isNoThreadsVisible) {
      console.log('❌ "No Threads Available" 메시지가 표시됨');
      console.log('🔍 문제 진단: Thread 데이터가 에디터 페이지로 전달되지 않음');
      
      // 추가 진단
      const diagnostics = await page.evaluate(() => {
        // React 컴포넌트 상태 확인 시도
        const reactRoot = document.querySelector('#__next');
        
        return {
          hasReactRoot: !!reactRoot,
          reactRootChildren: reactRoot?.children?.length || 0,
          currentPath: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        };
      });
      
      console.log('   진단 정보:', diagnostics);
      
    } else {
      console.log('✅ Thread 데이터가 정상적으로 표시됨');
      
      // Individual View 테스트
      const individualThreads = await page.locator('.group.relative').count();
      console.log(`   Individual Threads: ${individualThreads}개`);
      
      if (individualThreads > 0) {
        // Combined View 테스트
        console.log('\n🔄 Combined View 테스트...');
        await page.click('button:has-text("Combined View")');
        await page.waitForTimeout(1000);
        
        const codeEditor = await page.locator('.code-editor').isVisible();
        console.log(`   코드 에디터 표시: ${codeEditor}`);
        
        if (codeEditor) {
          // AI Rewrite 버튼 테스트
          const aiRewriteBtn = await page.locator('button:has-text("AI Rewrite All")').isVisible();
          console.log(`   AI Rewrite 버튼: ${aiRewriteBtn}`);
        }
      }
    }
    
    // Step 10: 결론 및 권장사항
    console.log('\n' + '='.repeat(60));
    console.log('📊 진단 결과');
    console.log('='.repeat(60));
    
    if (isNoThreadsVisible) {
      console.log('❌ 문제 확인: Thread 데이터 전달 실패');
      console.log('\n🔧 가능한 원인:');
      console.log('1. Zustand store가 페이지 이동 시 초기화됨');
      console.log('2. useStore hook이 올바르게 작동하지 않음');
      console.log('3. Next.js 라우팅 시 상태 손실');
      console.log('4. Store의 threads 배열이 비어있음');
      
      console.log('\n🛠️ 해결 방안:');
      console.log('1. localStorage나 sessionStorage에 thread 데이터 백업');
      console.log('2. URL 파라미터로 데이터 전달');
      console.log('3. useEffect에서 store 상태 복원 로직 추가');
    } else {
      console.log('✅ 에디터가 정상 작동함');
    }
    
    // 10초 대기
    console.log('\n⏰ 10초 후 브라우저 종료...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 에러:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n🏁 진단 완료');
  }
}

// 진단 실행
diagnoseEditorIssue();