import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db';
import { startCronJobs } from './cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import macroRouter from './routes/macro';
import klineRouter from './routes/kline';
import realtimeRouter from './routes/realtime';
import stockPoolRouter from './routes/stock-pool';
import sectorFlowRouter from './routes/sector-flow';
import researchRouter from './routes/research';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, _res, next) => {
  const start = Date.now();
  next();
  const elapsed = Date.now() - start;
  if (req.url.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.url} ${elapsed}ms`);
  }
});

// API 路由
app.use('/api', macroRouter);
app.use('/api', klineRouter);
app.use('/api', realtimeRouter);
app.use('/api', stockPoolRouter);
app.use('/api', sectorFlowRouter);
app.use('/api', researchRouter);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 生产环境：服务前端静态文件
const clientDistPath = path.join(__dirname, '..', 'dist', 'client');
app.use(express.static(clientDistPath));

// SPA fallback (Express 5 compatible)
app.use((_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).json({ message: 'Stock Dashboard API Server Running' });
    }
  });
});

// 启动
app.listen(PORT, () => {
  console.log(`\n🚀 股票研究看板已启动: http://localhost:${PORT}`);
  console.log(`📊 API 地址: http://localhost:${PORT}/api\n`);

  // 初始化数据库
  getDb();
  console.log('✅ SQLite 数据库已初始化');

  // 启动定时任务
  startCronJobs();
});

export default app;
