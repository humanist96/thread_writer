// UI Test Script using Playwright
const { chromium } = require('playwright');

async function testYouTubeAIThread() {
  console.log('🚀 Starting YouTube AI Thread Generator UI Test...\n');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false, // Show the browser
    slowMo: 500 // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Navigate to the app
    console.log('1. Navigating to http://localhost:3007...');
    await page.goto('http://localhost:3008');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded successfully\n');
    
    // 2. Search for videos - using content more likely to have captions
    console.log('2. Searching for "how to learn programming"...');
    const searchInput = await page.locator('input[placeholder="Search YouTube videos..."]');
    await searchInput.fill('how to learn programming');
    await page.locator('button:has-text("Search")').click();
    
    // Wait for search results
    await page.waitForSelector('[class*="grid"]', { timeout: 10000 });
    console.log('✅ Search results loaded\n');
    
    // 3. Click on the first video
    console.log('3. Clicking on the first video result...');
    const firstVideo = await page.locator('[class*="group cursor-pointer"]').first();
    const videoTitle = await firstVideo.locator('h3').textContent();
    console.log(`   Selected video: ${videoTitle}`);
    await firstVideo.click();
    
    // 4. Wait for modal and monitor transcript extraction
    console.log('\n4. Waiting for transcript extraction...');
    await page.waitForSelector('.fixed.inset-0.z-50', { state: 'visible', timeout: 5000 });
    
    // Monitor the extraction process
    const extractingText = await page.locator('text=Extracting Transcript');
    if (await extractingText.isVisible()) {
      console.log('   ⏳ Transcript extraction started...');
    }
    
    // Wait for either success or error
    try {
      // Wait for success (green checkmark)
      await page.waitForSelector('text=Transcript extracted successfully', { timeout: 30000 });
      console.log('   ✅ Transcript extracted successfully!\n');
      
      // Wait for thread generation
      console.log('5. Waiting for AI thread generation...');
      await page.waitForSelector('text=Thread generated successfully', { timeout: 30000 });
      console.log('   ✅ Thread generated successfully!\n');
      
      // Click View & Edit Thread
      console.log('6. Navigating to thread editor...');
      await page.locator('button:has-text("View & Edit Thread")').click();
      await page.waitForURL('**/editor', { timeout: 10000 });
      console.log('   ✅ Successfully navigated to editor\n');
      
      // Check if threads are displayed
      const threads = await page.locator('[class*="group relative bg-white/5"]').count();
      console.log(`7. Found ${threads} thread items in the editor`);
      
      // Copy all threads
      console.log('\n8. Testing copy functionality...');
      await page.locator('button:has-text("Copy All Threads")').click();
      await page.waitForSelector('text=Copied!', { timeout: 3000 });
      console.log('   ✅ Successfully copied all threads\n');
      
    } catch (error) {
      // Check for error message
      const errorElement = await page.locator('[class*="bg-red-500/10"]');
      if (await errorElement.isVisible()) {
        console.log('   ❌ Error occurred during extraction:\n');
        
        const errorTitle = await page.locator('[class*="text-red-400"]').first().textContent();
        const errorMessage = await page.locator('[class*="text-red-300"]').first().textContent();
        
        console.log(`   Error: ${errorTitle}`);
        console.log(`   Message: ${errorMessage}`);
        
        // Get suggestions
        const suggestions = await page.locator('li[class*="text-red-300/70"]').allTextContents();
        console.log('\n   Suggestions:');
        suggestions.forEach(s => console.log(`   - ${s}`));
        
        // Try again
        console.log('\n   Clicking "Try Again"...');
        await page.locator('button:has-text("Try Again")').click();
      }
    }
    
    console.log('\n✨ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Keep browser open for 10 seconds to see the result
    console.log('\n⏰ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
    await browser.close();
    console.log('🏁 Browser closed. Test finished.');
  }
}

// Alternative test with a video that might not have captions
async function testVideoWithoutCaptions() {
  console.log('\n\n🧪 Testing video without captions...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3008');
    await page.waitForLoadState('networkidle');
    
    // Search for a video that might not have captions
    await page.locator('input[placeholder="Search YouTube videos..."]').fill('test video no captions');
    await page.locator('button:has-text("Search")').click();
    
    await page.waitForSelector('[class*="grid"]', { timeout: 10000 });
    
    // Click first result
    await page.locator('[class*="group cursor-pointer"]').first().click();
    
    // Wait for error
    await page.waitForSelector('[class*="bg-red-500/10"]', { timeout: 35000 });
    
    const errorTitle = await page.locator('[class*="text-red-400"]').first().textContent();
    console.log(`✅ Error handling works correctly: ${errorTitle}`);
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run tests
(async () => {
  // Test 1: Normal flow with a popular video
  await testYouTubeAIThread();
  
  // Test 2: Video without captions (optional)
  // await testVideoWithoutCaptions();
})();