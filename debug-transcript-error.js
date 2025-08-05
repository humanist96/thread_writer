const { chromium } = require('playwright');

async function debugTranscriptError() {
  console.log('=== Debugging Transcript Error ===\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log(`[Browser] ${msg.text()}`));
  page.on('pageerror', error => console.log(`[Page Error] ${error.message}`));
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`[API Request] ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`[API Response] ${response.status()} ${response.url()}`);
      if (response.status() !== 200) {
        response.text().then(text => {
          console.log('[Response Body]', text.substring(0, 200));
        }).catch(() => {});
      }
    }
  });
  
  try {
    // Try connecting to port 7010
    console.log('1. Attempting to connect to http://localhost:7010...');
    try {
      await page.goto('http://localhost:7010', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      console.log('✅ Connected to port 7010');
    } catch (error) {
      console.log('❌ Failed to connect to port 7010:', error.message);
      
      // Try port 3000
      console.log('\n2. Attempting to connect to http://localhost:3000...');
      await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      console.log('✅ Connected to port 3000');
    }
    
    // Mock the APIs to ensure we can test the flow
    await page.route('**/api/youtube/search*', async route => {
      console.log('[Mock] Intercepting YouTube search API');
      await route.fulfill({
        status: 200,
        json: {
          videos: [{
            id: 'debug_video_' + Date.now(),
            title: 'Debug Test Video - 서울 아파트',
            channelTitle: 'Test Channel',
            description: 'Testing transcript extraction',
            thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            duration: '10:00'
          }]
        }
      });
    });
    
    // Don't mock transcript API to see actual error
    console.log('\n3. Searching for video...');
    await page.fill('input[type="text"]', 'test');
    await page.press('input[type="text"]', 'Enter');
    
    console.log('4. Waiting for search results...');
    await page.waitForTimeout(2000);
    
    console.log('5. Clicking on video...');
    const videoElement = await page.waitForSelector('img[alt]', { timeout: 5000 });
    await videoElement.click();
    
    console.log('6. Waiting for modal...');
    await page.waitForSelector('text="Generate AI Thread"', { timeout: 5000 });
    
    console.log('7. Clicking Generate AI Thread button...');
    await page.click('button:has-text("Generate AI Thread")');
    
    console.log('8. Waiting for transcript extraction...');
    await page.waitForTimeout(10000);
    
    // Check current state
    const errorText = await page.locator('text="Failed to extract transcript"').isVisible().catch(() => false);
    if (errorText) {
      console.log('\n❌ Transcript extraction failed as expected');
      
      // Check if retry options are available
      const tryAgainButton = await page.locator('button:has-text("Try Again")').isVisible().catch(() => false);
      if (tryAgainButton) {
        console.log('✅ Try Again button is available');
      }
      
      // Check for alternative options
      const manualOption = await page.locator('text="Enter Manual Transcript"').isVisible().catch(() => false);
      const continueOption = await page.locator('text="Generate AI Thread Anyway"').isVisible().catch(() => false);
      
      if (manualOption) {
        console.log('✅ Manual transcript option is available');
      }
      if (continueOption) {
        console.log('✅ Continue anyway option is available');
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'transcript-error-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved: transcript-error-debug.png');
    
  } catch (error) {
    console.error('\n❌ Error during debugging:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    console.log('\nPress Enter to close browser...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    await browser.close();
  }
}

debugTranscriptError();