const { chromium } = require('playwright');

async function testGoogleSheetsSave() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true // DevTools 열기
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Console 로그 캡처
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });
  
  // 네트워크 요청 모니터링
  page.on('request', request => {
    if (request.url().includes('sheets/save') || request.url().includes('script.google.com')) {
      console.log(`[Network Request] ${request.method()} ${request.url()}`);
      console.log('[Request Headers]', request.headers());
      if (request.postData()) {
        console.log('[Request Body]', request.postData());
      }
    }
  });
  
  // 네트워크 응답 모니터링
  page.on('response', response => {
    if (response.url().includes('sheets/save') || response.url().includes('script.google.com')) {
      console.log(`[Network Response] ${response.status()} ${response.url()}`);
      response.text().then(text => {
        console.log('[Response Body]', text);
      }).catch(err => {
        console.log('[Response Error]', err);
      });
    }
  });
  
  try {
    console.log('1. Navigating to localhost:3010...');
    await page.goto('http://localhost:3010');
    await page.waitForLoadState('networkidle');
    
    // Mock API responses for quick navigation
    await page.route('**/api/youtube/search*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          videos: [{
            id: 'test_sheets_' + Date.now(),
            title: 'Google Sheets Save Test Video',
            channelTitle: 'Test Channel',
            description: 'Testing Google Sheets save functionality',
            thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            duration: '10:00'
          }]
        }
      });
    });
    
    await page.route('**/api/transcript', async route => {
      await route.fulfill({
        status: 200,
        json: {
          transcript: 'Test transcript for Google Sheets save.'
        }
      });
    });
    
    await page.route('**/api/generate-thread', async route => {
      await route.fulfill({
        status: 200,
        json: {
          summary: 'Test summary for Google Sheets',
          threads: [
            { content: 'Thread 1: Testing Google Sheets save', order: 1 },
            { content: 'Thread 2: Verifying functionality', order: 2 }
          ]
        }
      });
    });
    
    // Search and generate thread
    console.log('2. Searching for video...');
    await page.fill('input[type="text"]', 'test');
    await page.press('input[type="text"]', 'Enter');
    
    await page.waitForTimeout(1000);
    
    console.log('3. Clicking on video...');
    await page.click('img[alt]');
    
    console.log('4. Generating AI thread...');
    await page.waitForSelector('text="Generate AI Thread"');
    await page.click('button:has-text("Generate AI Thread")');
    
    // Wait for navigation to editor
    console.log('5. Waiting for editor page...');
    await page.waitForURL('**/editor', { timeout: 10000 });
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    console.log('6. Clicking "Google Sheets에 저장" button...');
    
    // Find and click the save button
    const saveButton = await page.waitForSelector('button:has-text("Google Sheets에 저장")', { timeout: 5000 });
    
    // Capture network activity during save
    console.log('\n=== Starting Google Sheets save process ===\n');
    
    await saveButton.click();
    
    // Wait for any response or alert
    await page.waitForTimeout(5000);
    
    // Check for alerts
    page.on('dialog', async dialog => {
      console.log('[Alert]', dialog.message());
      await dialog.accept();
    });
    
    // Take screenshot
    await page.screenshot({ path: 'google-sheets-save-result.png', fullPage: true });
    
    console.log('\n=== Save process completed ===\n');
    
    // Check if Google Sheets opened
    const pages = context.pages();
    if (pages.length > 1) {
      console.log('New tab opened (possibly Google Sheets)');
      const newPage = pages[pages.length - 1];
      console.log('New tab URL:', newPage.url());
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'google-sheets-save-error.png' });
  } finally {
    console.log('\nPress any key to close browser...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    await browser.close();
  }
}

// Run the test
testGoogleSheetsSave();