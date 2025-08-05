// Open browser and wait for manual testing
const { chromium } = require('playwright');

(async () => {
  console.log('🌐 Opening browser for manual testing...\n');
  console.log('Instructions:');
  console.log('1. Search for a video');
  console.log('2. Click on a video to test transcript extraction');
  console.log('3. Look for videos with "CC" icon on YouTube');
  console.log('4. Browser will stay open for 5 minutes\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  
  console.log('✅ Page loaded. You can now test manually.\n');
  console.log('Suggested searches:');
  console.log('- "javascript tutorial with captions"');
  console.log('- "python programming for beginners cc"');
  console.log('- "freeCodeCamp tutorial"');
  console.log('- "Google developers"');
  console.log('- "Microsoft learn"');
  
  // Keep browser open for 5 minutes
  await page.waitForTimeout(300000);
  
  console.log('\n⏰ Time\'s up! Closing browser...');
  await browser.close();
})();