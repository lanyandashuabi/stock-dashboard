// PM2 配置文件
module.exports = {
  apps: [
    {
      name: 'stock-dashboard',
      script: 'npx',
      args: 'tsx server/index.ts',
      cwd: '/workspace/stock-dashboard',
      interpreter: 'none', // 使用 npx 作为解释器
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // 自动重启
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      // 日志
      error_file: '/workspace/stock-dashboard/logs/error.log',
      out_file: '/workspace/stock-dashboard/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 内存限制
      max_memory_restart: '500M',
      // 监听文件变化（开发时用）
      watch: false,
    },
  ],
};
