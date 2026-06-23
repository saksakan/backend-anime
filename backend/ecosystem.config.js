module.exports = {
  apps: [
    {
      name: 'nimecore-api',
      script: 'server.js',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/log/pm2/nimecore-api-error.log',
      out_file: '/var/log/pm2/nimecore-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      watch: false,
      kill_timeout: 5000,
      listen_timeout: 5000,
    },
  ],
};
