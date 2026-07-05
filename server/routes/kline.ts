import { Router, Request, Response } from 'express';
import { fetchKline } from '../providers/eastmoney';
import { cache, TTL } from '../cache';

const router = Router();

router.get('/kline', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const period = (req.query.period as string) || 'day';

    if (!code) {
      return res.status(400).json({ success: false, error: '缺少股票代码' });
    }

    // 验证 period
    if (!['day', 'week', 'month'].includes(period)) {
      return res.status(400).json({ success: false, error: '周期参数无效，支持 day/week/month' });
    }

    const cacheKey = `kline:${code}:${period}`;
    const data = await cache.getOrSet(
      cacheKey,
      async () => {
        const kline = await fetchKline(code, period as 'day' | 'week' | 'month', 200);
        if (!kline) throw new Error('Failed to fetch kline data');
        return kline;
      },
      TTL.KLINE
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error('[Kline] Error:', err);
    res.status(500).json({ success: false, error: '获取K线数据失败' });
  }
});

export default router;
