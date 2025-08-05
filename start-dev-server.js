const { spawn } = require('child_process');
const path = require('path');

console.log('Starting YouTube AI Thread Service...\n');

// Kill any existing Node processes on port 7010
const killPort = spawn('npx', ['kill-port', '7010'], {
  shell: true,
  stdio: 'inherit'
});

killPort.on('close', () => {
  console.log('Port 7010 cleared.\n');
  
  // Start the dev server
  const env = {
    ...process.env,
    PORT: '7010',
    NODE_ENV: 'development'
  };
  
  console.log('Starting Next.js dev server on port 7010...\n');
  
  const server = spawn('npm', ['run', 'dev'], {
    env,
    cwd: path.join(__dirname),
    shell: true,
    stdio: 'inherit'
  });
  
  server.on('error', (error) => {
    console.error('Failed to start server:', error);
  });
  
  server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
  });
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.kill('SIGINT');
    process.exit(0);
  });
});