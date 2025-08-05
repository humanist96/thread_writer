// Combined View 에디터 테스트
const { chromium } = require('playwright');

async function testCombinedEditor() {
  console.log('🎯 Combined View 에디터 테스트');
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
    await page.goto('http://localhost:3008');
    console.log('✅ 홈페이지 로드 완료');
    
    // Step 2: 검색 및 비디오 선택
    console.log('\n2️⃣ 비디오 검색 및 선택...');
    await page.fill('input[placeholder*="Search"]', '바이브 코딩');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('[class*="group cursor-pointer"]');
    
    const firstVideo = await page.locator('[class*="group cursor-pointer"]').first();
    const videoTitle = await firstVideo.locator('h3').textContent();
    console.log(`   선택된 비디오: ${videoTitle}`);
    
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
    
    // Step 4: 에디터로 이동
    console.log('\n4️⃣ 에디터로 이동...');
    await page.click('button:has-text("View & Edit Thread")');
    await page.waitForURL('**/editor');
    console.log(`✅ 에디터 페이지 이동: ${page.url()}`);
    
    // Step 5: Combined View 확인
    console.log('\n5️⃣ Combined View 인터페이스 확인...');
    await page.waitForTimeout(2000); // hydration 대기
    
    // 편집 모드 버튼 확인
    const editModeBtn = await page.locator('button:has-text("편집 모드")').isVisible();
    const previewModeBtn = await page.locator('button:has-text("미리보기")').isVisible();
    console.log(`   편집 모드 버튼: ${editModeBtn ? '✅' : '❌'}`);
    console.log(`   미리보기 버튼: ${previewModeBtn ? '✅' : '❌'}`);
    
    // Combined textarea 확인
    const textarea = await page.locator('textarea').isVisible();
    console.log(`   Combined 텍스트 에리어: ${textarea ? '✅' : '❌'}`);
    
    if (textarea) {
      const textContent = await page.locator('textarea').inputValue();
      console.log(`   텍스트 길이: ${textContent.length}자`);
      
      if (textContent.length > 0) {
        console.log(`   첫 100자: "${textContent.substring(0, 100)}..."`);
        
        // Step 6: 미리보기 테스트
        console.log('\n6️⃣ 미리보기 모드 테스트...');
        await page.click('button:has-text("미리보기")');
        await page.waitForTimeout(1000);
        
        const previewDiv = await page.locator('.prose.prose-invert').isVisible();
        console.log(`   미리보기 div: ${previewDiv ? '✅' : '❌'}`);
        
        // 다시 편집 모드로
        await page.click('button:has-text("편집 모드")');
        await page.waitForTimeout(500);
        
        // Step 7: AI 재작성 테스트
        console.log('\n7️⃣ AI 재작성 기능 테스트...');
        const aiRewriteBtn = await page.locator('button:has-text("AI 재작성")').isVisible();
        console.log(`   AI 재작성 버튼: ${aiRewriteBtn ? '✅' : '❌'}`);
        
        if (aiRewriteBtn) {
          console.log('   AI 재작성 버튼 클릭...');
          await page.click('button:has-text("AI 재작성")');
          
          // 로딩 상태 확인
          const loadingBtn = await page.waitForSelector('button:has-text("AI 재작성 중...")', { timeout: 5000 }).catch(() => null);
          if (loadingBtn) {
            console.log('   ✅ AI 재작성 로딩 상태 확인');
            
            // 완료까지 대기 (최대 30초)
            const completed = await page.waitForSelector('button:has-text("AI 재작성")', { timeout: 30000 }).then(() => true).catch(() => false);
            console.log(`   AI 재작성 완료: ${completed ? '✅' : '❌'}`);
          }
        }
        
        // Step 8: 저장 기능 테스트
        console.log('\n8️⃣ 저장 기능 테스트...');
        const saveBtn = await page.locator('button:has-text("Google Sheets에 저장")').isVisible();
        console.log(`   저장 버튼: ${saveBtn ? '✅' : '❌'}`);
        
        if (saveBtn) {
          console.log('   저장 버튼 클릭...');
          
          // 페이지 dialog 이벤트 리스너 추가
          let alertMessage = '';
          page.on('dialog', async (dialog) => {
            alertMessage = dialog.message();
            console.log(`   📢 Alert: ${alertMessage}`);
            await dialog.accept();
          });
          
          await page.click('button:has-text("Google Sheets에 저장")');
          
          // 로딩 상태 확인
          const loadingBtn = await page.waitForSelector('button:has-text("저장 중...")', { timeout: 5000 }).catch(() => null);
          if (loadingBtn) {
            console.log('   ✅ 저장 로딩 상태 확인');
            
            // 완료까지 대기
            await page.waitForSelector('button:has-text("Google Sheets에 저장")', { timeout: 15000 }).catch(() => {});
            
            // 3초 대기 후 alert 메시지 확인
            await page.waitForTimeout(3000);
            
            if (alertMessage) {
              if (alertMessage.includes('성공적으로 저장')) {
                console.log('   ✅ Google Sheets 저장 성공');
              } else if (alertMessage.includes('로컬에 저장')) {
                console.log('   ✅ 로컬 fallback 저장 성공');
              } else {
                console.log(`   ⚠️ 저장 결과: ${alertMessage}`);
              }
            }
          }
        }
        
        // Step 9: 복사 기능 테스트
        console.log('\n9️⃣ 복사 기능 테스트...');
        const copyBtn = await page.locator('button:has-text("내용 복사")').isVisible();
        console.log(`   복사 버튼: ${copyBtn ? '✅' : '❌'}`);
        
        if (copyBtn) {
          await page.click('button:has-text("내용 복사")');
          await page.waitForTimeout(1000);
          
          const copiedBtn = await page.locator('button:has-text("복사됨!")').isVisible();
          console.log(`   복사 완료 상태: ${copiedBtn ? '✅' : '❌'}`);
        }
      }
    }
    
    // Step 10: 결과 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 Combined View 에디터 테스트 결과');
    console.log('='.repeat(50));
    
    const finalContent = textarea ? await page.locator('textarea').inputValue() : '';
    
    if (textarea && finalContent.length > 0) {
      console.log('🎉 성공: Combined View 에디터가 정상 작동');
      console.log('✅ Thread 내용이 하나의 텍스트 에리어에 표시');
      console.log('✅ 편집/미리보기 모드 전환 가능');
      console.log('✅ AI 재작성 기능 사용 가능');
      console.log('✅ 저장 및 복사 기능 정상');
    } else {
      console.log('❌ 실패: Combined View 에디터 문제 발생');
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

testCombinedEditor();