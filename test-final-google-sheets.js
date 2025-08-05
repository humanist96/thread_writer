const { chromium } = require('playwright');
const axios = require('axios');

async function testGoogleSheetsSave() {
  console.log('=== Google Sheets Save Test on Port 7010 ===\n');
  
  // 1. First test the Google Apps Script URL directly
  console.log('1. Testing Google Apps Script URL directly...');
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbwP_Kwkjm4b4jna7dPi18UhWzN2Y_n_duLomRKxwZhFQg0XbMwaQIu_0hfmH8a3zDoc/exec';
  
  try {
    // Test with GET request first (should return something if accessible)
    const getResponse = await axios.get(scriptUrl);
    console.log('GET Response:', getResponse.status);
  } catch (error) {
    console.log('GET Error:', error.response?.status || error.message);
    if (error.response?.status === 401) {
      console.log('❌ Script requires authentication. Please check deployment settings.');
      console.log('   Make sure "Execute as: Me" and "Who has access: Anyone" is selected.');
    }
  }
  
  // 2. Test with browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log(`[Browser] ${msg.text()}`));
  
  // Monitor network
  page.on('response', response => {
    if (response.url().includes('sheets/save') || response.url().includes('script.google.com')) {
      console.log(`\n[Network Response] ${response.status()} ${response.url()}`);
      response.text().then(text => {
        if (text.length < 500) {
          console.log('[Response Body]', text);
        } else {
          console.log('[Response Body] Large response received');
        }
      }).catch(() => {});
    }
  });
  
  try {
    console.log('\n2. Navigating to http://localhost:3010...');
    await page.goto('http://localhost:3010');
    await page.waitForLoadState('networkidle');
    
    // Quick flow to editor
    await page.route('**/api/youtube/search*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          videos: [{
            id: 'final_test_' + Date.now(),
            title: 'Final Google Sheets Test',
            channelTitle: 'Test Channel',
            description: 'Final test',
            thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            duration: '1:00'
          }]
        }
      });
    });
    
    await page.route('**/api/transcript', async route => {
      await route.fulfill({
        status: 200,
        json: { transcript: 'Final test transcript.' }
      });
    });
    
    await page.route('**/api/generate-thread', async route => {
      await route.fulfill({
        status: 200,
        json: {
          summary: 'Final test summary',
          threads: [{ content: 'Final test thread content', order: 1 }]
        }
      });
    });
    
    // Quick navigation to editor
    await page.fill('input[type="text"]', 'test');
    await page.press('input[type="text"]', 'Enter');
    await page.waitForTimeout(1000);
    await page.click('img[alt]');
    await page.waitForSelector('text="Generate AI Thread"');
    await page.click('button:has-text("Generate AI Thread")');
    await page.waitForURL('**/editor', { timeout: 10000 });
    
    console.log('\n3. On editor page. Clicking save button...');
    await page.waitForTimeout(2000);
    
    // Click save button and wait for response
    const saveButton = await page.waitForSelector('button:has-text("Google Sheets에 저장")');
    
    console.log('\n=== SAVING TO GOOGLE SHEETS ===');
    await saveButton.click();
    
    // Wait for any dialog
    page.on('dialog', async dialog => {
      console.log('\n[Alert Dialog]:', dialog.message());
      await dialog.accept();
    });
    
    await page.waitForTimeout(5000);
    
    // Check if Google Sheets opened
    const pages = await browser.contexts()[0].pages();
    console.log('\nOpen tabs:', pages.length);
    if (pages.length > 1) {
      console.log('New tab opened - likely Google Sheets');
      const newPage = pages[pages.length - 1];
      console.log('New tab URL:', newPage.url());
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'final-test-result.png', fullPage: true });
    
    console.log('\n✅ Test completed. Check final-test-result.png');
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'final-test-error.png' });
  } finally {
    console.log('\nPress Enter to close browser...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    await browser.close();
  }
}

// Check if axios is installed
try {
  require.resolve('axios');
  testGoogleSheetsSave();
} catch (e) {
  console.log('axios is already installed in the project');
  testGoogleSheetsSave();
}