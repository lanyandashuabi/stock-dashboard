import { Router, Request, Response } from 'express';
import { fetchWithRetry } from '../utils/gbk';
import { cache, TTL } from '../cache';

const router = Router();

export interface SectorFlow {
  name: string;
  code: string;
  changePercent: number;
  netFlow: number;
  netFlowRatio: number;
  topStocks: { code: string; name: string; changePercent: number }[];
}

/**
 * 腾讯财经行业板块资金流
 * 接口：https://web.ifzq.gtimg.cn/appstock/app/board/index?p=1&n=30&t=hy
 */
async function fetchTencentSectorFlow(): Promise<SectorFlow[]> {
  try {
    const url =
      'https://web.ifzq.gtimg.cn/appstock/app/board/index?p=1&n=30&t=hy';

    const raw = await fetchWithRetry(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://gu.qq.com/',
      },
    });

    const data = JSON.parse(raw);
    if (data.code !== 0 || !data.data?.fundflow?.plate) return [];

    const { top, bottom } = data.data.fundflow.plate;
    const allPlates = [...(top || []), ...(bottom || [])];

    return allPlates.map((item: any) => ({
      name: item.name || '',
      code: item.code || '',
      changePercent: parseFloat(item.zdf) || 0,
      netFlow: parseFloat(item.zljlr || '0') / 1e4, // 万元 → 亿
      netFlowRatio: 0,
      topStocks: item.lzg
        ? [{ code: item.lzg.code || '', name: item.lzg.name || '', changePercent: parseFloat(item.lzg.zdf) || 0 }]
        : [],
    }));
  } catch (err) {
    console.error('[SectorFlow] Tencent failed:', err);
    return [];
  }
}

const SECTOR_FALLBACK: SectorFlow[] = [
  { name: '半导体', code: '', changePercent: 2.3, netFlow: 45.6, netFlowRatio: 8.5, topStocks: [] },
  { name: 'AI算力', code: '', changePercent: 1.8, netFlow: 32.1, netFlowRatio: 6.2, topStocks: [] },
  { name: '机器人', code: '', changePercent: -0.5, netFlow: -12.3, netFlowRatio: -3.1, topStocks: [] },
  { name: '创新药', code: '', changePercent: -1.2, netFlow: -25.8, netFlowRatio: -5.4, topStocks: [] },
  { name: '新能源', code: '', changePercent: 0.8, netFlow: 18.5, netFlowRatio: 3.8, topStocks: [] },
  { name: '银行', code: '', changePercent: 0.3, netFlow: 5.2, netFlowRatio: 1.1, topStocks: [] },
  { name: '军工', code: '', changePercent: 1.5, netFlow: 22.7, netFlowRatio: 4.5, topStocks: [] },
  { name: '消费电子', code: '', changePercent: 0.6, netFlow: 8.9, netFlowRatio: 2.2, topStocks: [] },
];

router.get('/sector-flow', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'sector-flow';
    const result = await cache.getOrSet(
      cacheKey,
      async () => {
        const sectors = await fetchTencentSectorFlow();
        const useData = sectors.length > 0 ? sectors : SECTOR_FALLBACK;
        const isFallback = sectors.length === 0;

        // 按净流入排序
        useData.sort((a, b) => b.netFlow - a.netFlow);

        const summary = {
          totalInflow: useData.filter(s => s.netFlow > 0).reduce((sum, s) => sum + s.netFlow, 0),
          totalOutflow: useData.filter(s => s.netFlow < 0).reduce((sum, s) => sum + Math.abs(s.netFlow), 0),
          hottestSector: useData[0]?.name || '--',
          coldestSector: useData[useData.length - 1]?.name || '--',
        };

        return {
          sectors: useData.slice(0, 15),
          summary,
          updatedAt: new Date().toISOString(),
          _fallback: isFallback,
        };
      },
      TTL.MACRO
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[SectorFlow] Error:', err);
    const summary = {
      totalInflow: SECTOR_FALLBACK.filter(s => s.netFlow > 0).reduce((s, i) => s + i.netFlow, 0),
      totalOutflow: SECTOR_FALLBACK.filter(s => s.netFlow < 0).reduce((s, i) => s + Math.abs(i.netFlow), 0),
      hottestSector: SECTOR_FALLBACK[0]?.name || '--',
      coldestSector: SECTOR_FALLBACK[SECTOR_FALLBACK.length - 1]?.name || '--',
    };
    res.json({
      success: true,
      data: { sectors: SECTOR_FALLBACK, summary, updatedAt: new Date().toISOString(), _fallback: true },
    });
  }
});

export default router;
