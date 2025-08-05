const { chromium } = require('playwright');

async function testGoogleSheetsInBrowser() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Google Apps Script URL 직접 접속 테스트
    console.log('1. Testing Google Apps Script URL directly...');
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwP_Kwkjm4b4jna7dPi18UhWzN2Y_n_duLomRKxwZhFQg0XbMwaQIu_0hfmH8a3zDoc/exec';
    
    await page.goto(scriptUrl);
    await page.waitForTimeout(3000);
    
    // 페이지 내용 확인
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    
    if (pageContent.includes('doGet')) {
      console.log('✅ Google Apps Script is accessible');
    } else if (pageContent.includes('로그인') || pageContent.includes('Sign in')) {
      console.log('❌ Authentication required - Script needs "Anyone" access');
    } else if (pageContent.includes('찾을 수 없음') || pageContent.includes('not found')) {
      console.log('❌ Script not found or not deployed');
    }
    
    await page.screenshot({ path: 'google-apps-script-test.png' });
    
    // 2. 서비스 재시작 후 테스트
    console.log('\n2. Starting service on port 7010...');
    const { exec } = require('child_process');
    
    // 서비스 시작
    const service = exec('node start-service.js', { 
      cwd: __dirname,
      env: { ...process.env, PORT: '7010' }
    });
    
    service.stdout.on('data', (data) => {
      console.log(`[Service] ${data}`);
    });
    
    // 서비스가 시작될 때까지 대기
    console.log('Waiting for service to start...');
    await page.waitForTimeout(10000);
    
    // 3. 새 탭에서 서비스 테스트
    const page2 = await browser.newPage();
    
    console.log('\n3. Testing service on http://localhost:7010...');
    await page2.goto('http://localhost:7010');
    await page2.waitForLoadState('networkidle');
    
    // Mock APIs
    await page2.route('**/api/youtube/search*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          videos: [{
            id: 'test_new_' + Date.now(),
            title: 'New Service Test Video',
            channelTitle: 'Test Channel',
            description: 'Testing on port 7010',
            thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            duration: '5:00'
          }]
        }
      });
    });
    
    await page2.route('**/api/transcript', async route => {
      await route.fulfill({
        status: 200,
        json: { transcript: 'Test transcript on new port.' }
      });
    });
    
    await page2.route('**/api/generate-thread', async route => {
      await route.fulfill({
        status: 200,
        json: {
          summary: 'Test summary on port 7010',
          threads: [{ content: 'Thread content for new service', order: 1 }]
        }
      });
    });
    
    // Network monitoring
    page2.on('response', response => {
      if (response.url().includes('sheets/save') || response.url().includes('script.google.com')) {
        console.log(`[Response] ${response.status()} ${response.url()}`);
      }
    });
    
    // 테스트 실행
    await page2.fill('input[type="text"]', 'test');
    await page2.press('input[type="text"]', 'Enter');
    await page2.waitForTimeout(2000);
    
    await page2.click('img[alt]');
    await page2.waitForSelector('text="Generate AI Thread"');
    await page2.click('button:has-text("Generate AI Thread")');
    await page2.waitForURL('**/editor');
    
    console.log('\n4. Testing Google Sheets save...');
    await page2.click('button:has-text("Google Sheets에 저장")');
    
    // 응답 대기
    await page2.waitForTimeout(5000);
    
    // 결과 스크린샷
    await page2.screenshot({ path: 'new-service-test-result.png', fullPage: true });
    
    console.log('\n✅ Test completed. Check screenshots for results.');
    
    // 서비스 종료
    service.kill();
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nPress any key to close browser...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    await browser.close();
  }
}

testGoogleSheetsInBrowser();