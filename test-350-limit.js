// 350자 제한 기능 집중 테스트
const { chromium } = require('playwright');

async function test350CharLimit() {
  console.log('🎯 350자 제한 기능 집중 테스트');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  const logs = [];
  page.on('console', msg => {
    const message = `[${msg.type()}] ${msg.text()}`;
    logs.push(message);
    if (message.includes('Applied 350-character limit') || message.includes('Thread') || message.includes('characters')) {
      console.log(`🔍 ${message}`);
    }
  });
  
  try {
    console.log('\n1️⃣ 홈페이지 접속 및 검색...');
    await page.goto('http://localhost:3008');
    await page.fill('input[placeholder*="Search"]', '바이브 코딩');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('[class*="group cursor-pointer"]');
    
    const firstVideo = await page.locator('[class*="group cursor-pointer"]').first();
    await firstVideo.click();
    await page.waitForSelector('.fixed.inset-0.z-50');
    console.log('✅ 비디오 선택 완료');
    
    console.log('\n2️⃣ Thread 생성 및 길이 검증...');
    const success = await page.waitForSelector('text="Thread generated successfully"', { 
      timeout: 60000 
    }).then(() => true).catch(() => false);
    
    if (!success) {
      console.log('❌ Thread 생성 실패');
      return;
    }
    
    // 콘솔 로그에서 Thread 길이 확인
    await page.waitForTimeout(2000);
    
    const threadLogs = logs.filter(log => 
      log.includes('Applied 350-character limit') || 
      log.includes('Thread') && log.includes('characters')
    );
    
    console.log('\n📊 Thread 생성 로그 분석:');
    threadLogs.forEach(log => console.log(`   ${log}`));
    
    console.log('\n3️⃣ 에디터에서 실제 길이 확인...');
    await page.click('button:has-text("View & Edit Thread")');
    await page.waitForURL('**/editor');
    await page.waitForTimeout(3000); // hydration 대기
    
    const textarea = await page.locator('textarea').isVisible();
    if (textarea) {
      const content = await page.locator('textarea').inputValue();
      const length = content.length;
      
      console.log(`   실제 에디터 내용 길이: ${length}자`);
      console.log(`   첫 100자: "${content.substring(0, 100)}..."`);
      
      // 길이 검증 메시지 확인
      const validationMsg = await page.locator('div[class*="text-green-400"], div[class*="text-red-400"]').textContent().catch(() => '');
      console.log(`   길이 검증 메시지: ${validationMsg}`);
      
      if (length <= 350) {
        console.log('✅ 350자 제한이 성공적으로 적용됨');
      } else {
        console.log(`❌ 350자 제한이 적용되지 않음 (${length}자)`);
        
        // 강제로 350자로 자르기 테스트
        console.log('\n4️⃣ 강제 350자 제한 테스트...');
        const truncated = content.substring(0, 350);
        await page.fill('textarea', truncated);
        await page.waitForTimeout(1000);
        
        const newValidationMsg = await page.locator('div[class*="text-green-400"], div[class*="text-red-400"]').textContent().catch(() => '');
        console.log(`   350자로 자른 후 검증: ${newValidationMsg}`);
        
        if (newValidationMsg.includes('유효한')) {
          console.log('✅ 350자로 자른 후 유효성 검증 통과');
        }
      }
      
      // AI 재작성으로 350자 제한 테스트
      console.log('\n5️⃣ AI 재작성 350자 제한 테스트...');
      const originalLength = await page.locator('textarea').inputValue().then(text => text.length);
      console.log(`   재작성 전 길이: ${originalLength}자`);
      
      await page.click('button:has-text("AI 재작성")');
      
      // 재작성 완료 대기
      const regenerateCompleted = await page.waitForSelector('button:has-text("AI 재작성")', { timeout: 30000 }).then(() => true).catch(() => false);
      
      if (regenerateCompleted) {
        await page.waitForTimeout(2000);
        const newContent = await page.locator('textarea').inputValue();
        const newLength = newContent.length;
        
        console.log(`   재작성 후 길이: ${newLength}자`);
        
        if (newLength <= 350) {
          console.log('✅ AI 재작성에서 350자 제한 적용됨');
        } else {
          console.log(`❌ AI 재작성에서 350자 제한 실패 (${newLength}자)`);
        }
        
        // 재작성 관련 로그 확인
        const regenLogs = logs.filter(log => log.includes('Applied 350-character limit'));
        if (regenLogs.length > 0) {
          console.log(`   재작성 로그: ${regenLogs[regenLogs.length - 1]}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 350자 제한 테스트 결과');
    console.log('='.repeat(50));
    
    const finalContent = await page.locator('textarea').inputValue().catch(() => '');
    const finalLength = finalContent.length;
    
    if (finalLength <= 350) {
      console.log('🎉 성공: 350자 제한이 정상 작동');
      console.log(`   최종 길이: ${finalLength}자`);
    } else {
      console.log('⚠️ 개선 필요: 350자 제한이 완전히 적용되지 않음');
      console.log(`   최종 길이: ${finalLength}자`);
      console.log('   추가 강화 로직이 필요함');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 에러:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 350자 제한 테스트 완료');
  }
}

test350CharLimit();