import cron from 'node-cron';
import { fetchSinaIndices } from './providers/sina';
import { fetchSinaQuotes } from './providers/sina';
import { getAllStocks } from './db';
import { setMacroCache } from './db';

/**
 * 定时任务：每个工作日 15:00 自动抓取收盘行情
 *
 * 执行内容：
 * 1. 抓取 7 大指数收盘数据并缓存到 SQLite
 * 2. 抓取个股池所有股票收盘价
 */

const MAJOR_INDICES = [
  '000001.SH', '399001.SZ', '399006.SZ', '000300.SH',
  '000688.SH', '000016.SH', '399005.SZ',
];

async function snapshotClose() {
  console.log('[Cron] 收盘数据抓取开始...');
  const start = Date.now();

  try {
    // 抓取指数
    const indices = await fetchSinaIndices(MAJOR_INDICES);
    const indexData: Record<string, unknown> = {};
    for (const [code, idx] of indices) {
      indexData[code] = {
        name: idx.name,
        price: idx.price,
        change: idx.change,
        changePercent: idx.changePercent,
        volume: idx.volume,
        amount: idx.amount,
      };
    }
    setMacroCache('close_snapshot', JSON.stringify(indexData));
    console.log(`[Cron] 指数收盘数据已缓存 (${indices.size}/7)`);

    // 抓取个股池
    const stocks = getAllStocks();
    if (stocks.length > 0) {
      const codes = stocks.map((s) => s.code);
      const quotes = await fetchSinaQuotes(codes);
      console.log(`[Cron] 个股池收盘数据已抓取 (${quotes.size}/${codes.length})`);
    }

    const elapsed = Date.now() - start;
    console.log(`[Cron] 收盘数据抓取完成，耗时 ${elapsed}ms`);
  } catch (err) {
    console.error('[Cron] 收盘数据抓取失败:', err);
  }
}

/**
 * 初始化定时任务
 */
export function startCronJobs() {
  // 每个工作日下午 3:00 执行（北京时间）
  // cron 表达式：分 时 日 月 星期
  // 0 15 * * 1-5 = 周一到周五 15:00
  cron.schedule('0 15 * * 1-5', () => {
    console.log('[Cron] 触发收盘数据抓取 (15:00 工作日)');
    snapshotClose();
  }, {
    timezone: 'Asia/Shanghai',
  });

  console.log('[Cron] 定时任务已启动：每个工作日 15:00 抓取收盘数据');
}
