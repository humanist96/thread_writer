// 간단한 시스템 테스트
const { chromium } = require('playwright');

async function simpleTest() {
  console.log('🚀 간단한 YouTube AI Thread Generator 테스트\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newContext().then(ctx => ctx.newPage());
  
  try {
    // 1. 앱 열기
    console.log('1. 앱 열기...');
    await page.goto('http://localhost:3000');
    console.log('✅ 완료\n');
    
    // 2. 검색
    console.log('2. "바이브 코딩" 검색...');
    await page.fill('input[placeholder="Search YouTube videos..."]', '바이브 코딩');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('img[alt*="바이브"]', { timeout: 10000 });
    console.log('✅ 검색 결과 표시됨\n');
    
    // 3. 첫 번째 비디오 클릭
    console.log('3. 첫 번째 비디오 클릭...');
    await page.click('div[class*="cursor-pointer"]');
    await page.waitForSelector('.fixed.inset-0.z-50');
    console.log('✅ 모달 열림\n');
    
    // 4. 처리 대기
    console.log('4. 자막 추출 및 Thread 생성 대기 중...');
    
    // 성공 또는 에러 대기
    const result = await Promise.race([
      page.waitForSelector('text=Thread generated successfully', { timeout: 60000 }).then(() => 'success'),
      page.waitForSelector('[class*="bg-red-500/10"]', { timeout: 60000 }).then(() => 'error')
    ]);
    
    if (result === 'success') {
      console.log('✅ Thread 생성 성공!\n');
      
      // 5. 에디터로 이동
      console.log('5. 에디터로 이동...');
      await page.click('button:has-text("View & Edit Thread")');
      await page.waitForURL('**/editor');
      console.log('✅ 에디터 페이지 열림\n');
      
      // 6. Thread 확인
      console.log('6. 생성된 Thread 확인...');
      await page.waitForTimeout(3000); // 페이지 로드 대기
      
      // Copy 버튼으로 Thread 존재 확인
      const copyButton = await page.locator('button:has-text("Copy All Threads")');
      if (await copyButton.isVisible()) {
        console.log('✅ Thread가 표시됨\n');
        
        // Copy 테스트
        await copyButton.click();
        const copiedText = await page.locator('text=Copied!').isVisible({ timeout: 3000 });
        if (copiedText) {
          console.log('✅ Copy 기능 정상 작동\n');
        }
      }
      
      console.log('🎉 모든 테스트 통과!');
    } else {
      console.log('❌ Thread 생성 실패\n');
      const errorText = await page.locator('[class*="text-red-400"]').first().textContent();
      console.log('에러:', errorText);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    console.log('\n브라우저 10초 후 종료...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

simpleTest();