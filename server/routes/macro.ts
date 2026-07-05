import { Router, Request, Response } from 'express';
import { fetchSinaIndices } from '../providers/sina';
import { fetchNorthBound } from '../providers/eastmoney';
import { MACRO_FALLBACK } from '../providers/static-fallback';
import { cache, TTL } from '../cache';
import { isTradingDay, getMarketStatus, getMarketStatusLabel } from '../utils/trading-calendar';

const router = Router();

// A股7大指数
const MAJOR_INDICES = [
  '000001.SH', // 上证指数
  '399001.SZ', // 深证成指
  '399006.SZ', // 创业板指
  '000300.SH', // 沪深300
  '000688.SH', // 科创50
  '000016.SH', // 上证50
  '399005.SZ', // 中小100
];

router.get('/macro', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'macro:full';
    const data = await cache.getOrSet(
      cacheKey,
      async () => {
        // 并行获取
        const [indicesMap, northBound] = await Promise.all([
          fetchSinaIndices(MAJOR_INDICES),
          fetchNorthBound(),
        ]);

        // 构建指数数据
        const indices = MAJOR_INDICES.map((code) => {
          const idx = indicesMap.get(code);
          if (idx) {
            return {
              code,
              name: idx.name,
              price: idx.price,
              change: idx.change,
              changePercent: idx.changePercent,
              open: idx.open,
              high: idx.high,
              low: idx.low,
            };
          }
          // 回退到静态数据
          const fallback = MACRO_FALLBACK.indices.find((i) => i.code === code);
          return fallback || { code, name: code, price: 0, change: 0, changePercent: 0 };
        });

        // 计算两市成交额（仅上证+深证）
        const shIndex = indicesMap.get('000001.SH');
        const szIndex = indicesMap.get('399001.SZ');
        const totalAmount = (shIndex?.amount || 0) + (szIndex?.amount || 0);

        return {
          indices,
          marketSentiment: {
            northBound: {
              label: '北向资金(已停发)',
              value: northBound ? `${northBound.sgtQuota + northBound.hgtQuota}亿额度` : '--',
              note: '交易所2024年8月起已停止发布实时净流入数据',
            },
            totalAmount: {
              label: '两市成交额',
              value: totalAmount > 0 ? (totalAmount / 1e8).toFixed(0) : '--',
              unit: '亿',
            },
          },
          economy: MACRO_FALLBACK.economy,
          monetary: MACRO_FALLBACK.monetary,
          global: MACRO_FALLBACK.global,
          marketStatus: {
            status: getMarketStatus(),
            label: getMarketStatusLabel(getMarketStatus()),
            isTradingDay: isTradingDay(),
          },
          updatedAt: new Date().toISOString(),
        };
      },
      TTL.MACRO
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error('[Macro] Error:', err);
    // 完全失败时返回静态数据
    res.json({
      success: true,
      data: {
        ...MACRO_FALLBACK,
        marketStatus: {
          status: getMarketStatus(),
          label: getMarketStatusLabel(getMarketStatus()),
          isTradingDay: isTradingDay(),
        },
        updatedAt: new Date().toISOString(),
        _fallback: true,
      },
    });
  }
});

export default router;
