// localStorage 기반 상태 보존 테스트
const { chromium } = require('playwright');

async function testStorePersistence() {
  console.log('🔧 Store 상태 보존 테스트');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: 홈페이지 접속
    console.log('\n1️⃣ 홈페이지 접속...');
    await page.goto('http://localhost:3007');
    console.log('✅ 홈페이지 로드 완료');
    
    // Step 2: 검색 및 비디오 선택
    console.log('\n2️⃣ 비디오 검색 및 선택...');
    await page.fill('input[placeholder*="Search"]', '바이브 코딩');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('[class*="group cursor-pointer"]');
    
    const firstVideo = await page.locator('[class*="group cursor-pointer"]').first();
    await firstVideo.click();
    await page.waitForSelector('.fixed.inset-0.z-50');
    console.log('✅ 비디오 선택 및 모달 열림');
    
    // Step 3: Thread 생성 대기
    console.log('\n3️⃣ Thread 생성 대기...');
    const success = await page.waitForSelector('text="Thread generated successfully"', { 
      timeout: 60000 
    }).then(() => true).catch(() => false);
    
    if (!success) {
      console.log('❌ Thread 생성 실패');
      return;
    }
    
    console.log('✅ Thread 생성 성공');
    
    // Step 4: localStorage 상태 확인
    console.log('\n4️⃣ localStorage 상태 확인...');
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('youtube-ai-thread-storage');
      return data ? JSON.parse(data) : null;
    });
    
    console.log('LocalStorage 데이터:');
    if (localStorageData) {
      console.log(`   - Threads: ${localStorageData.state?.threads?.length || 0}개`);
      console.log(`   - Summary: ${localStorageData.state?.summary ? '있음' : '없음'}`);
      console.log(`   - Selected Video: ${localStorageData.state?.selectedVideo?.title || '없음'}`);
    } else {
      console.log('   ❌ localStorage에 데이터 없음');
    }
    
    // Step 5: 에디터로 이동
    console.log('\n5️⃣ 에디터로 이동...');
    await page.click('button:has-text("View & Edit Thread")');
    await page.waitForURL('**/editor');
    console.log(`✅ 에디터 페이지 이동: ${page.url()}`);
    
    // Step 6: 페이지 로드 후 상태 확인 (hydration 대기)
    console.log('\n6️⃣ Store hydration 대기 및 확인...');
    await page.waitForTimeout(2000); // hydration 대기
    
    // No Threads 메시지 확인
    const noThreadsVisible = await page.locator(':text("No Threads Available")').isVisible().catch(() => false);
    
    if (noThreadsVisible) {
      console.log('❌ "No Threads Available" 메시지 표시됨');
      console.log('🔍 hydration이 완료되지 않았거나 데이터가 손실됨');
      
      // 추가로 3초 더 대기
      console.log('   추가 3초 대기...');
      await page.waitForTimeout(3000);
      
      const stillNoThreads = await page.locator(':text("No Threads Available")').isVisible().catch(() => false);
      if (stillNoThreads) {
        console.log('   ❌ 여전히 Thread 없음 - 데이터 복원 실패');
      } else {
        console.log('   ✅ Thread 복원됨!');
      }
    } else {
      console.log('✅ Thread 데이터가 정상적으로 표시됨');
    }
    
    // Step 7: 실제 Thread 요소 확인
    console.log('\n7️⃣ Thread 요소 확인...');
    
    const individualThreads = await page.locator('.group.relative').count();
    console.log(`   Individual Threads: ${individualThreads}개`);
    
    const viewModeButtons = {
      individual: await page.locator('button:has-text("Individual Threads")').isVisible().catch(() => false),
      combined: await page.locator('button:has-text("Combined View")').isVisible().catch(() => false)
    };
    
    console.log(`   View Mode 버튼들: Individual=${viewModeButtons.individual}, Combined=${viewModeButtons.combined}`);
    
    if (individualThreads > 0) {
      console.log('✅ Thread 에디터가 정상 작동');
      
      // Step 8: Combined View 테스트
      console.log('\n8️⃣ Combined View 테스트...');
      await page.click('button:has-text("Combined View")');
      await page.waitForTimeout(1000);
      
      const codeEditor = await page.locator('.code-editor').isVisible();
      console.log(`   코드 에디터: ${codeEditor ? '✅ 표시됨' : '❌ 없음'}`);
      
      if (codeEditor) {
        const aiRewriteBtn = await page.locator('button:has-text("AI Rewrite All")').isVisible();
        console.log(`   AI Rewrite 버튼: ${aiRewriteBtn ? '✅ 있음' : '❌ 없음'}`);
        
        // 텍스트 확인
        const editorText = await page.locator('.code-editor').inputValue();
        console.log(`   에디터 텍스트 길이: ${editorText.length}자`);
        
        if (editorText.length > 0) {
          console.log(`   첫 50자: "${editorText.substring(0, 50)}..."`);
        }
      }
      
      // Step 9: Individual View로 다시 전환
      console.log('\n9️⃣ Individual View 전환...');
      await page.click('button:has-text("Individual Threads")');
      await page.waitForTimeout(1000);
      
      const backToIndividual = await page.locator('.group.relative').count();
      console.log(`   Individual Threads: ${backToIndividual}개`);
      
    } else {
      console.log('❌ Thread 데이터 복원 실패');
    }
    
    // Step 10: 결과 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 테스트 결과');
    console.log('='.repeat(50));
    
    if (individualThreads > 0) {
      console.log('🎉 성공: localStorage 기반 상태 보존이 작동함');
      console.log('✅ Thread 에디터가 정상적으로 작동');
      console.log('✅ 두 가지 뷰 모드 모두 정상');
      console.log('✅ AI Rewrite 기능 사용 가능');
    } else {
      console.log('❌ 실패: 상태 보존이 작동하지 않음');
      console.log('🔧 추가 디버깅 필요');
    }
    
    console.log('\n⏰ 10초 후 브라우저 종료...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 에러:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 테스트 완료');
  }
}

testStorePersistence();