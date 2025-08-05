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

  // Mock the YouTube search API
  await page.route('**/api/youtube/search*', async route => {
    console.log('Mocking YouTube search API...');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        videos: [{
          id: 'test-video-123',
          title: 'Test Video for Navigation Issue',
          description: 'This is a test video to check navigation',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          channelTitle: 'Test Channel',
          duration: '3:45',
          publishedAt: '2024-01-01T00:00:00Z',
          channelId: 'test-channel-id',
          viewCount: '1000000'
        }]
      })
    });
  });

  // Mock the transcript API to always fail
  await page.route('**/api/transcript', async route => {
    console.log('Mocking transcript API to fail...');
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ 
        error: 'Failed to extract transcript. The video may not have captions enabled.' 
      })
    });
  });

  // Mock the generate-thread API
  await page.route('**/api/generate-thread', async route => {
    console.log('Mocking generate-thread API...');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        threads: [
          { id: '1', content: 'Generated thread content for testing', order: 0 }
        ],
        summary: 'Test summary for navigation testing'
      })
    });
  });

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

    // Wait for video results - look for the grid structure
    console.log('Waiting for search results...');
    await page.waitForSelector('.grid', { timeout: 10000 });
    
    // Click on the first video in the grid
    console.log('Clicking on first video...');
    const videoCard = await page.locator('.grid > div').first();
    await videoCard.click();

    // Wait for modal
    console.log('Waiting for modal to open...');
    await page.waitForSelector('button:has-text("Generate AI Thread")', { timeout: 5000 });

    // Click Generate AI Thread
    console.log('Clicking Generate AI Thread button...');
    const generateButton = await page.locator('button:has-text("Generate AI Thread")');
    await generateButton.click();

    // Wait for the transcript extraction to process and fail
    console.log('Waiting for transcript extraction to fail...');
    await page.waitForSelector('text=Failed to extract transcript', { timeout: 10000 });
    console.log('✅ Transcript extraction failed as expected');

    // Wait a bit for the UI to stabilize
    await page.waitForTimeout(1000);

    // Check if we have the "Generate AI Thread Anyway" button
    const anywayButtonSelector = 'button:has-text("Generate AI Thread Anyway")';
    console.log('Looking for "Generate AI Thread Anyway" button...');
    
    const anywayButton = await page.locator(anywayButtonSelector);
    const isVisible = await anywayButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      console.log('✅ Found "Generate AI Thread Anyway" button');
      
      // Add navigation tracking
      let navigationOccurred = false;
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          console.log('🔄 Navigation detected to:', frame.url());
          navigationOccurred = true;
        }
      });

      // Click the button
      console.log('Clicking "Generate AI Thread Anyway" button...');
      await anywayButton.click();
      
      // Wait for potential navigation
      console.log('Waiting for navigation to editor page...');
      
      try {
        // Wait for URL change or timeout
        await Promise.race([
          page.waitForURL('**/editor', { timeout: 5000 }),
          page.waitForTimeout(5000)
        ]);
        
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);
        
        if (currentUrl.includes('/editor')) {
          console.log('✅ Successfully navigated to editor page!');
        } else {
          console.log('❌ Navigation to editor did not occur');
          console.log('Navigation occurred:', navigationOccurred);
          
          // Check if we're still in the modal
          const modalStillVisible = await page.locator('.fixed.inset-0').isVisible().catch(() => false);
          console.log('Modal still visible:', modalStillVisible);
          
          // Check for any error messages
          const errorMessages = await page.locator('.text-red-400, .text-red-500').allTextContents();
          if (errorMessages.length > 0) {
            console.log('Error messages found:', errorMessages);
          }
        }
      } catch (error) {
        console.log('Error during navigation wait:', error.message);
      }
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'navigation-test-result.png' });
      console.log('Screenshot saved as navigation-test-result.png');
      
    } else {
      console.log('❌ "Generate AI Thread Anyway" button not found or not visible');
      
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'no-anyway-button-found.png' });
      console.log('Screenshot saved as no-anyway-button-found.png');
      
      // Log what buttons are available
      const visibleButtons = await page.locator('button').allTextContents();
      console.log('Visible buttons:', visibleButtons);
    }

    // Keep browser open for manual inspection
    console.log('\nPress Ctrl+C to close the browser...');
    await new Promise(() => {});

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
})();