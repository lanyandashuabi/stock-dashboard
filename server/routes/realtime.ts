import { Router, Request, Response } from 'express';
import { fetchSinaQuotes } from '../providers/sina';
import { cache, TTL } from '../cache';

const router = Router();

router.get('/realtime', async (req: Request, res: Response) => {
  try {
    const codesParam = req.query.codes as string;
    if (!codesParam) {
      return res.status(400).json({ success: false, error: '缺少股票代码参数' });
    }

    const codes = codesParam.split(',').map((c) => c.trim()).filter(Boolean);
    if (codes.length === 0) {
      return res.status(400).json({ success: false, error: '股票代码为空' });
    }

    if (codes.length > 50) {
      return res.status(400).json({ success: false, error: '单次最多查询50只股票' });
    }

    const cacheKey = `realtime:${codes.sort().join(',')}`;
    const data = await cache.getOrSet(
      cacheKey,
      async () => {
        const quotes = await fetchSinaQuotes(codes);
        const result: Record<string, unknown> = {};

        for (const code of codes) {
          const quote = quotes.get(code);
          if (quote) {
            result[code] = {
              code: quote.code,
              name: quote.name,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              open: quote.open,
              high: quote.high,
              low: quote.low,
              prevClose: quote.prevClose,
              volume: quote.volume,
              amount: quote.amount,
              market: quote.market,
            };
          } else {
            result[code] = null;
          }
        }

        return result;
      },
      TTL.REALTIME
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error('[Realtime] Error:', err);
    res.status(500).json({ success: false, error: '获取实时行情失败' });
  }
});

export default router;
