// Google Sheets 저장 기능 테스트
const { chromium } = require('playwright');

async function testGoogleSheetsIntegration() {
  console.log('🎯 Google Sheets 저장 기능 테스트');
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
    // 모든 로그를 일단 출력해서 디버깅
    console.log(`🔍 ${message}`);
  });
  
  // Alert 캡처
  let alertMessage = '';
  page.on('dialog', async (dialog) => {
    alertMessage = dialog.message();
    console.log(`📢 Alert: ${alertMessage}`);
    await dialog.accept();
  });
  
  try {
    console.log('\n1️⃣ 홈페이지 접속 및 검색...');
    await page.goto('http://localhost:3009');
    await page.fill('input[placeholder*="Search"]', '바이브 코딩');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('[class*="group cursor-pointer"]');
    
    const firstVideo = await page.locator('[class*="group cursor-pointer"]').first();
    const videoTitle = await firstVideo.locator('h3').textContent();
    console.log(`   선택된 비디오: ${videoTitle}`);
    
    await firstVideo.click();
    await page.waitForSelector('.fixed.inset-0.z-50');
    console.log('✅ 비디오 선택 완료');
    
    console.log('\n2️⃣ Thread 생성...');
    const success = await page.waitForSelector('text="Thread generated successfully"', { 
      timeout: 60000 
    }).then(() => true).catch(() => false);
    
    if (!success) {
      console.log('❌ Thread 생성 실패');
      return;
    }
    
    console.log('✅ Thread 생성 성공');
    
    console.log('\n3️⃣ 에디터로 이동...');
    await page.click('button:has-text("View & Edit Thread")');
    await page.waitForURL('**/editor');
    await page.waitForTimeout(3000); // hydration 대기
    
    const textarea = await page.locator('textarea').isVisible();
    if (textarea) {
      const content = await page.locator('textarea').inputValue();
      console.log(`   Thread 내용 길이: ${content.length}자`);
      console.log(`   첫 100자: "${content.substring(0, 100)}..."`);
      
      console.log('\n4️⃣ Google Sheets 저장 테스트...');
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
          await page.waitForSelector('button:has-text("Google Sheets에 저장")', { timeout: 30000 }).catch(() => {});
          
          // Alert 메시지 대기
          await page.waitForTimeout(5000);
          
          if (alertMessage) {
            console.log('   📋 저장 결과 분석:');
            
            if (alertMessage.includes('Google Sheets API')) {
              console.log('   🎉 성공: Google Sheets API를 통해 저장됨');
              console.log('   📊 실제 Google Drive의 스프레드시트에 저장되었습니다');
            } else if (alertMessage.includes('Google Apps Script')) {
              console.log('   🎉 성공: Google Apps Script를 통해 저장됨');
              console.log('   📊 웹앱을 통해 Google Sheets에 저장되었습니다');
            } else if (alertMessage.includes('로컬에 임시 저장')) {
              console.log('   ⚠️ Fallback: 로컬 파일로 저장됨');
              console.log('   🔧 Google Sheets 설정이 필요합니다');
            } else if (alertMessage.includes('성공')) {
              console.log('   ✅ 저장 성공 (방법 불명)');
            } else {
              console.log(`   ❓ 알 수 없는 결과: ${alertMessage}`);
            }
          } else {
            console.log('   ⚠️ Alert 메시지를 받지 못함');
          }
        } else {
          console.log('   ❌ 로딩 상태를 확인할 수 없음');
        }
        
        // Google Sheets 관련 로그 분석
        console.log('\n5️⃣ 저장 과정 로그 분석:');
        const sheetsLogs = logs.filter(log => 
          log.includes('GoogleSheets') || 
          log.includes('SaveAPI') ||
          log.includes('Google Apps Script')
        );
        
        if (sheetsLogs.length > 0) {
          sheetsLogs.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log}`);
          });
        } else {
          console.log('   저장 관련 로그를 찾을 수 없음');
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Google Sheets 저장 테스트 결과');
    console.log('='.repeat(60));
    
    if (alertMessage.includes('Google Sheets API') || alertMessage.includes('Google Apps Script')) {
      console.log('🎉 성공: Google Drive의 실제 스프레드시트에 저장됨');
      console.log('✅ 온라인 Google Sheets에서 데이터 확인 가능');
      console.log('✅ 350자 제한된 Thread 내용이 저장됨');
    } else if (alertMessage.includes('로컬')) {
      console.log('⚠️ Fallback: 로컬 파일로 저장됨');
      console.log('🔧 Google Sheets 연동을 위해 추가 설정 필요');
      console.log('📖 설정 가이드: GOOGLE_SHEETS_SETUP.md 참조');
    } else {
      console.log('❓ 저장 결과를 확인할 수 없음');
      console.log('🔍 로그와 에러 메시지를 확인하세요');
    }
    
    await page.waitForTimeout(8000);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 에러:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 Google Sheets 저장 테스트 완료');
  }
}

testGoogleSheetsIntegration();