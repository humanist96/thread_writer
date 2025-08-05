// 전체 시스템 E2E 테스트: Thread 350자 제한 + Google Sheets 저장
const { chromium } = require('playwright');

async function testFullSystem() {
  console.log('🎯 전체 시스템 E2E 테스트 (350자 제한 + 저장 기능)');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  const logs = [];
  page.on('console', msg => {
    const message = `[${msg.type()}] ${msg.text()}`;
    logs.push(message);
    console.log(`🌐 ${message}`);
  });
  
  // Alert 캡처
  let alertMessage = '';
  page.on('dialog', async (dialog) => {
    alertMessage = dialog.message();
    console.log(`📢 Alert: ${alertMessage}`);
    await dialog.accept();
  });
  
  let lengthValidationPassed = false;
  let textarea = false;
  let threadLimitLogs = [];
  
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
    
    // Step 3: Thread 생성 대기 및 검증
    console.log('\n3️⃣ Thread 생성 대기 및 350자 제한 검증...');
    const success = await page.waitForSelector('text="Thread generated successfully"', { 
      timeout: 60000 
    }).then(() => true).catch(() => false);
    
    if (!success) {
      console.log('❌ Thread 생성 실패');
      return;
    }
    
    console.log('✅ Thread 생성 성공');
    
    // Thread 길이 검증을 위한 로그 확인
    threadLimitLogs = logs.filter(log => log.includes('Applied 350-character limit'));
    if (threadLimitLogs.length > 0) {
      console.log(`✅ Thread 길이 제한 적용 확인: ${threadLimitLogs[0]}`);
    }
    
    // Step 4: 에디터로 이동
    console.log('\n4️⃣ 에디터로 이동...');
    await page.click('button:has-text("View & Edit Thread")');
    await page.waitForURL('**/editor');
    console.log(`✅ 에디터 페이지 이동: ${page.url()}`);
    
    // Step 5: Combined View 및 길이 검증 확인
    console.log('\n5️⃣ Combined View 및 길이 검증 확인...');
    await page.waitForTimeout(2000); // hydration 대기
    
    textarea = await page.locator('textarea').isVisible();
    console.log(`   Combined 텍스트 에리어: ${textarea ? '✅' : '❌'}`);
    
    if (textarea) {
      const textContent = await page.locator('textarea').inputValue();
      console.log(`   텍스트 길이: ${textContent.length}자`);
      
      // 길이 검증 메시지 확인
      const validationMessage = await page.locator('div[class*="text-green-400"], div[class*="text-red-400"]').textContent().catch(() => '');
      if (validationMessage) {
        console.log(`   검증 메시지: ${validationMessage}`);
      }
      
      // 350자 초과 텍스트로 테스트
      console.log('\n6️⃣ 350자 초과 텍스트 입력 테스트...');
      const longText = '가'.repeat(400) + ' 이 텍스트는 350자를 초과합니다.';
      
      await page.fill('textarea', longText);
      await page.waitForTimeout(500);
      
      const errorMessage = await page.locator('div[class*="text-red-400"]').textContent().catch(() => '');
      lengthValidationPassed = errorMessage.includes('너무 깁니다');
      if (lengthValidationPassed) {
        console.log(`   ✅ 350자 초과 경고 표시: ${errorMessage}`);
      } else {
        console.log(`   ❌ 350자 초과 경고 미표시: ${errorMessage}`);
      }
      
      // 원래 내용으로 복원
      await page.fill('textarea', textContent);
      await page.waitForTimeout(500);
      
      // Step 7: 저장 기능 테스트
      console.log('\n7️⃣ Google Sheets 저장 기능 테스트...');
      const saveBtn = await page.locator('button:has-text("Google Sheets에 저장")').isVisible();
      console.log(`   저장 버튼: ${saveBtn ? '✅' : '❌'}`);
      
      if (saveBtn) {
        console.log('   저장 버튼 클릭...');
        await page.click('button:has-text("Google Sheets에 저장")');
        
        // 로딩 상태 확인
        const loadingBtn = await page.waitForSelector('button:has-text("저장 중...")', { timeout: 5000 }).catch(() => null);
        if (loadingBtn) {
          console.log('   ✅ 저장 로딩 상태 확인');
          
          // 완료까지 대기
          await page.waitForSelector('button:has-text("Google Sheets에 저장")', { timeout: 20000 }).catch(() => {});
          
          // Alert 메시지 대기
          await page.waitForTimeout(3000);
          
          if (alertMessage) {
            if (alertMessage.includes('성공적으로 저장')) {
              console.log('   ✅ Google Sheets 저장 성공');
            } else if (alertMessage.includes('로컬에 저장')) {
              console.log('   ✅ 로컬 fallback 저장 성공');
            } else if (alertMessage.includes('저장')) {
              console.log(`   ✅ 저장 완료: ${alertMessage}`);
            } else {
              console.log(`   ⚠️ 저장 결과: ${alertMessage}`);
            }
          } else {
            console.log('   ⚠️ 저장 결과 메시지를 받지 못함');
          }
        }
      }
      
      // Step 8: AI 재작성 테스트 (350자 제한 적용 확인)
      console.log('\n8️⃣ AI 재작성 기능 테스트 (350자 제한)...');
      const aiRewriteBtn = await page.locator('button:has-text("AI 재작성")').isVisible();
      console.log(`   AI 재작성 버튼: ${aiRewriteBtn ? '✅' : '❌'}`);
      
      if (aiRewriteBtn) {
        const originalLength = textContent.length;
        console.log(`   원본 길이: ${originalLength}자`);
        
        await page.click('button:has-text("AI 재작성")');
        
        // 재작성 완료 대기
        const completed = await page.waitForSelector('button:has-text("AI 재작성")', { timeout: 30000 }).then(() => true).catch(() => false);
        if (completed) {
          await page.waitForTimeout(1000);
          const rewrittenContent = await page.locator('textarea').inputValue();
          const newLength = rewrittenContent.length;
          
          console.log(`   재작성 후 길이: ${newLength}자`);
          
          if (newLength <= 350) {
            console.log('   ✅ AI 재작성에서 350자 제한 적용됨');
          } else {
            console.log('   ⚠️ AI 재작성에서 350자 제한 초과');
          }
        }
      }
      
      // Step 9: 미리보기 모드 테스트
      console.log('\n9️⃣ 미리보기 모드 테스트...');
      await page.click('button:has-text("미리보기")');
      await page.waitForTimeout(1000);
      
      const previewDiv = await page.locator('.prose.prose-invert').isVisible();
      console.log(`   미리보기 표시: ${previewDiv ? '✅' : '❌'}`);
      
      // 편집 모드로 복원
      await page.click('button:has-text("편집 모드")');
      await page.waitForTimeout(500);
    }
    
    // Step 10: 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 전체 시스템 테스트 결과');
    console.log('='.repeat(60));
    
    const results = [];
    results.push(textarea ? '✅ Combined View 에디터 정상' : '❌ Combined View 에디터 문제');
    results.push(threadLimitLogs.length > 0 ? '✅ Thread 350자 제한 적용' : '❌ Thread 길이 제한 미적용');
    results.push(lengthValidationPassed ? '✅ 실시간 길이 검증 작동' : '❌ 실시간 길이 검증 문제');
    results.push(alertMessage.includes('저장') ? '✅ 저장 기능 작동' : '❌ 저장 기능 문제');
    
    console.log(results.join('\n'));
    
    if (results.every(r => r.startsWith('✅'))) {
      console.log('\n🎉 모든 테스트 통과! 시스템이 정상 작동합니다.');
    } else {
      console.log('\n⚠️ 일부 테스트 실패. 추가 검토가 필요합니다.');
    }
    
    console.log('\n⏰ 15초 후 브라우저 종료...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 에러:', error.message);
    console.error('스택 트레이스:', error.stack);
  } finally {
    await browser.close();
    console.log('\n🏁 전체 시스템 테스트 완료');
  }
}

testFullSystem();