const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  try {
    console.log('Navigating to http://localhost:3010');
    await page.goto('http://localhost:3010');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Search for a video
    console.log('Searching for video...');
    const searchInput = await page.locator('input[placeholder*="YouTube"], input[type="search"]').first();
    await searchInput.fill('test video');
    await searchInput.press('Enter');

    // Wait for video results
    console.log('Waiting for search results...');
    await page.waitForSelector('.video-card, [data-testid="video-item"], .grid > div', { timeout: 10000 });
    
    // Click on the first video
    console.log('Clicking on first video...');
    const videoCard = await page.locator('.video-card, [data-testid="video-item"], .grid > div').first();
    await videoCard.click();

    // Wait for modal
    console.log('Waiting for modal to open...');
    await page.waitForSelector('button:has-text("Generate AI Thread")', { timeout: 5000 });

    // Click Generate AI Thread
    console.log('Clicking Generate AI Thread button...');
    const generateButton = await page.locator('button:has-text("Generate AI Thread")');
    await generateButton.click();

    // Wait for transcript extraction to fail (or succeed)
    console.log('Waiting for transcript extraction result...');
    await page.waitForTimeout(5000);

    // Check if we have the "Generate AI Thread Anyway" button
    const anywaButtonExists = await page.locator('button:has-text("Generate AI Thread Anyway")').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (anywaButtonExists) {
      console.log('Found "Generate AI Thread Anyway" button - clicking it...');
      const anywayButton = await page.locator('button:has-text("Generate AI Thread Anyway")');
      
      // Add event listener to track navigation
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          console.log('Navigation detected to:', frame.url());
        }
      });

      await anywayButton.click();
      
      // Wait for navigation or any changes
      console.log('Waiting for navigation to editor page...');
      
      try {
        await page.waitForURL('**/editor', { timeout: 10000 });
        console.log('✅ Successfully navigated to editor page!');
        console.log('Current URL:', page.url());
      } catch (error) {
        console.log('❌ Failed to navigate to editor page');
        console.log('Current URL:', page.url());
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'navigation-failure.png' });
        console.log('Screenshot saved as navigation-failure.png');
        
        // Check what's currently visible on the page
        const visibleText = await page.evaluate(() => document.body.innerText);
        console.log('Current page content:', visibleText.substring(0, 500));
      }
    } else {
      console.log('No "Generate AI Thread Anyway" button found - checking if transcript succeeded...');
      
      // Check if we're already on the editor page
      if (page.url().includes('/editor')) {
        console.log('✅ Already on editor page (transcript extraction succeeded)');
      } else {
        console.log('Current URL:', page.url());
        
        // Take a screenshot
        await page.screenshot({ path: 'no-anyway-button.png' });
        console.log('Screenshot saved as no-anyway-button.png');
      }
    }

    // Keep browser open for manual inspection
    console.log('\nPress Ctrl+C to close the browser...');
    await new Promise(() => {}); // Keep running

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
})();