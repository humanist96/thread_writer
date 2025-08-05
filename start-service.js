#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 포트 설정 (7000번대)
const PORT = 7010;

console.log(`
╔════════════════════════════════════════════╗
║     YouTube AI Thread Service Launcher     ║
╚════════════════════════════════════════════╝

Starting service on port ${PORT}...
`);

// 환경 변수 설정
const env = {
  ...process.env,
  PORT: PORT.toString(),
  NODE_ENV: 'development'
};

// Next.js 개발 서버 시작
const nextProcess = spawn('npm', ['run', 'dev'], {
  env,
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n\nShutting down service...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nTerminating service...');
  nextProcess.kill('SIGTERM');
  process.exit(0);
});

nextProcess.on('error', (error) => {
  console.error('Failed to start service:', error);
  process.exit(1);
});

nextProcess.on('close', (code) => {
  if (code !== null) {
    console.log(`Service exited with code ${code}`);
    process.exit(code);
  }
});

// 서비스 정보 출력
setTimeout(() => {
  console.log(`
╔════════════════════════════════════════════╗
║           Service Running Info             ║
╠════════════════════════════════════════════╣
║  Local URL:    http://localhost:${PORT}      ║
║  Network URL:  http://[your-ip]:${PORT}      ║
║                                            ║
║  Press Ctrl+C to stop the service          ║
╚════════════════════════════════════════════╝
`);
}, 3000);