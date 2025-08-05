const { chromium } = require('playwright');
const http = require('http');
const net = require('net');

async function testLocalhostAccess() {
  console.log('=== Localhost 접속 문제 진단 ===\n');
  
  // 1. 포트 확인
  console.log('1. 포트 7010 상태 확인...');
  const portInUse = await checkPort(7010);
  console.log(`   포트 7010: ${portInUse ? '사용 중 ✅' : '사용 안 함 ❌'}`);
  
  // 2. HTTP 요청 테스트
  console.log('\n2. HTTP 요청 테스트...');
  await testHttpRequest('http://localhost:7010');
  await testHttpRequest('http://127.0.0.1:7010');
  await testHttpRequest('http://[::1]:7010');
  
  // 3. 브라우저 테스트
  console.log('\n3. 브라우저로 접속 테스트...');
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Console 로그 캡처
  page.on('console', msg => console.log(`[브라우저 콘솔] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.log(`[페이지 에러] ${error.message}`));
  
  try {
    console.log('\n   localhost:7010 접속 시도...');
    const response = await page.goto('http://localhost:7010', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    if (response) {
      console.log(`   응답 상태: ${response.status()}`);
      console.log(`   응답 URL: ${response.url()}`);
      
      if (response.status() === 200) {
        console.log('   ✅ 페이지 로드 성공!');
        const title = await page.title();
        console.log(`   페이지 제목: ${title}`);
      }
    }
    
    await page.screenshot({ path: 'localhost-test.png' });
    console.log('   스크린샷 저장: localhost-test.png');
    
  } catch (error) {
    console.error(`   ❌ 접속 실패: ${error.message}`);
    
    // 대체 URL 테스트
    console.log('\n   127.0.0.1:7010 접속 시도...');
    try {
      const response2 = await page.goto('http://127.0.0.1:7010', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      if (response2 && response2.status() === 200) {
        console.log('   ✅ 127.0.0.1로 접속 성공!');
        await page.screenshot({ path: 'localhost-127-test.png' });
      }
    } catch (error2) {
      console.error(`   ❌ 127.0.0.1 접속도 실패: ${error2.message}`);
    }
  }
  
  // 4. Windows 방화벽 확인
  console.log('\n4. 가능한 원인 분석...');
  console.log('   - Windows 방화벽이 포트를 차단하고 있을 수 있습니다');
  console.log('   - IPv6/IPv4 바인딩 문제일 수 있습니다');
  console.log('   - Next.js 개발 서버 설정 문제일 수 있습니다');
  
  // 5. netstat 확인
  console.log('\n5. 네트워크 연결 상태 확인...');
  const { exec } = require('child_process');
  exec('netstat -an | findstr :7010', (error, stdout, stderr) => {
    if (!error && stdout) {
      console.log('   네트워크 상태:');
      console.log(stdout);
    }
  });
  
  await page.waitForTimeout(3000);
  await browser.close();
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

function testHttpRequest(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`   ${url} - 상태: ${res.statusCode} ✅`);
      res.resume();
      resolve();
    }).on('error', (err) => {
      console.log(`   ${url} - 에러: ${err.code} ❌`);
      resolve();
    });
  });
}

testLocalhostAccess();