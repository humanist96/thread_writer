module.exports = {
  apps: [{
    name: 'youtube-ai-thread',
    script: 'npm',
    args: 'run dev',
    env: {
      PORT: 7010,
      NODE_ENV: 'development'
    },
    env_production: {
      PORT: 7010,
      NODE_ENV: 'production'
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    time: true
  }]
};