// Test specific video "7f0dJPXs-28" that was failing
const { chromium } = require('playwright');

async function testSpecificVideo() {
  console.log('🎯 Testing specific video: 7f0dJPXs-28\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'info') {
      console.log('Browser log:', msg.text());
    }
  });
  
  try {
    // Navigate to the app
    console.log('1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded\n');
    
    // Search for the specific video
    console.log('2. Searching for "바이브 코딩"...');
    await page.locator('input[placeholder="Search YouTube videos..."]').fill('바이브 코딩');
    await page.locator('button:has-text("Search")').click();
    
    // Wait for results
    await page.waitForSelector('[class*="grid"]', { timeout: 10000 });
    console.log('✅ Search results loaded\n');
    
    // Look for the specific video by checking video IDs
    console.log('3. Looking for video ID 7f0dJPXs-28...');
    
    // Find video with matching ID in the thumbnail URL
    const videos = await page.locator('[class*="group cursor-pointer"]').all();
    let targetVideo = null;
    
    for (const video of videos) {
      const thumbnail = await video.locator('img').getAttribute('src');
      if (thumbnail && thumbnail.includes('7f0dJPXs-28')) {
        targetVideo = video;
        const title = await video.locator('h3').textContent();
        console.log(`✅ Found target video: ${title}\n`);
        break;
      }
    }
    
    if (!targetVideo) {
      console.log('❌ Could not find the specific video in search results');
      return;
    }
    
    // Click the video
    console.log('4. Clicking on the video...');
    await targetVideo.click();
    
    // Wait for modal
    await page.waitForSelector('.fixed.inset-0.z-50', { timeout: 5000 });
    console.log('✅ Modal opened\n');
    
    // Monitor extraction process
    console.log('5. Monitoring transcript extraction...');
    
    // Check if extraction starts
    const extractingIndicator = page.locator('text=Processing video captions...');
    if (await extractingIndicator.isVisible({ timeout: 3000 })) {
      console.log('   ⏳ Transcript extraction in progress...');
    }
    
    // Wait for either success or error
    const success = await page.waitForSelector('text=Transcript extracted successfully', { 
      timeout: 35000 
    }).then(() => true).catch(() => false);
    
    if (success) {
      console.log('   ✅ Transcript extracted successfully!\n');
      
      // Wait for thread generation
      console.log('6. Waiting for thread generation...');
      await page.waitForSelector('text=Thread generated successfully', { timeout: 30000 });
      console.log('   ✅ Thread generated successfully!\n');
      
      // Success!
      console.log('🎉 Test PASSED! The video transcript was successfully extracted.');
    } else {
      // Check for error
      const errorElement = await page.locator('[class*="bg-red-500/10"]');
      if (await errorElement.isVisible()) {
        const errorTitle = await page.locator('[class*="text-red-400"]').first().textContent();
        const errorMessage = await page.locator('[class*="text-red-300"]').first().textContent();
        
        console.log(`   ❌ Error occurred:\n`);
        console.log(`   Title: ${errorTitle}`);
        console.log(`   Message: ${errorMessage}\n`);
        
        console.log('❌ Test FAILED! The video transcript extraction failed.');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('🏁 Test completed.');
  }
}

// Run the test
testSpecificVideo().catch(console.error);