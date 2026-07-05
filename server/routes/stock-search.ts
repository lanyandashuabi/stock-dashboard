import { Router, Request, Response } from 'express';

const router = Router();

/**
 * 股票搜索 API
 * GET /api/stock-search?keyword=茅台
 *
 * 使用腾讯财经接口搜索股票，支持名称/代码模糊匹配
 * 返回标准化格式的股票列表
 */
router.get('/stock-search', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 1) {
      return res.json({ success: true, data: [] });
    }

    const kw = keyword.trim();
    const results = await searchStock(kw);

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('[StockSearch] Error:', err);
    res.status(500).json({ success: false, error: '搜索失败' });
  }
});

/**
 * 批量股票代码查询
 * POST /api/stock-search/batch
 * Body: { names: ["拓普集团", "三花智控", ...] }
 *
 * 用于研报分析时批量验证股票名称
 */
router.post('/stock-search/batch', async (req: Request, res: Response) => {
  try {
    const { names } = req.body;
    if (!Array.isArray(names) || names.length === 0) {
      return res.json({ success: true, data: {} });
    }

    // 去重，限制数量
    const unique = [...new Set(names.filter((n: any) => typeof n === 'string' && n.trim()))].slice(0, 50);
    const result: Record<string, { code: string; name: string; market: string }> = {};

    // 并发搜索
    const searches = unique.map(async (name: string) => {
      try {
        const matches = await searchStock(name, 3);
        // 精确匹配优先
        const exact = matches.find(m => m.name === name);
        if (exact) {
          result[name] = exact;
        } else if (matches.length > 0 && matches[0].name.includes(name)) {
          result[name] = matches[0];
        }
      } catch {
        // 单个搜索失败不影响整体
      }
    });

    await Promise.all(searches);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[StockSearch] Batch error:', err);
    res.status(500).json({ success: false, error: '批量查询失败' });
  }
});

/**
 * 核心搜索函数：调用腾讯财经接口
 */
async function searchStock(
  keyword: string,
  limit = 10
): Promise<{ code: string; name: string; market: string }[]> {
  // 如果看起来像代码，直接构造
  const codePattern = /^\d{5,6}$/;
  if (codePattern.test(keyword)) {
    return searchByCode(keyword);
  }

  // 腾讯财经搜索接口
  try {
    const url = `https://smartbox.gtimg.cn/s3/?q=${encodeURIComponent(keyword)}&t=all&count=${limit}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const text = await resp.text();

    const results: { code: string; name: string; market: string }[] = [];
    const seen = new Set<string>();

    // 格式: v_hint="sh~601689~拓普集团~tpjt~GP-A"
    const hintMatches = text.matchAll(/v_hint="([^"]+)"/g);
    for (const m of hintMatches) {
      const parts = m[1].split('~');
      if (parts.length < 3) continue;

      const marketPrefix = parts[0]; // sh / sz / bj / hk
      const rawCode = parts[1];      // 601689
      const name = decodeUnicode(parts[2]); // 拓普集团 (decode \uXXXX)

      if (!name || !rawCode) continue;

      let code = '';
      if (marketPrefix === 'sh') code = `${rawCode}.SH`;
      else if (marketPrefix === 'sz') code = `${rawCode}.SZ`;
      else if (marketPrefix === 'bj') code = `${rawCode}.BJ`;
      else if (marketPrefix === 'hk') code = `${rawCode}.HK`;
      else continue;

      if (seen.has(code)) continue;
      seen.add(code);

      const market = code.endsWith('.HK') ? 'HK' : 'A';
      results.push({ code, name, market });
    }

    // 也尝试匹配旧格式 v_shXXXX="..."
    const oldMatches = text.matchAll(/v_(\w+)="([^"]+)"/g);
    for (const m of oldMatches) {
      const key = m[1];
      const val = m[2];
      const parts = val.split('~');
      const name = parts[1];
      const rawCode = parts[2];

      if (!name || !rawCode) continue;

      let code = '';
      if (/^(sh|sz|bj)\d{6}$/i.test(key)) {
        code = `${rawCode}.${key.substring(0, 2).toUpperCase()}`;
      } else if (/^r_?hk\d{5}$/i.test(key)) {
        code = `${rawCode}.HK`;
      } else {
        continue;
      }

      if (seen.has(code)) continue;
      seen.add(code);

      const market = code.endsWith('.HK') ? 'HK' : 'A';
      results.push({ code, name, market });
    }

    // 按名称匹配度排序：完全匹配优先
    results.sort((a, b) => {
      const aExact = a.name === keyword ? 0 : 1;
      const bExact = b.name === keyword ? 0 : 1;
      return aExact - bExact;
    });

    return results.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * 纯数字代码直接构造结果
 */
function searchByCode(
  codeStr: string
): { code: string; name: string; market: string }[] {
  if (codeStr.length === 6) {
    let suffix = 'SZ';
    if (codeStr.startsWith('6')) suffix = 'SH';
    else if (codeStr.startsWith('4') || codeStr.startsWith('8')) suffix = 'BJ';
    return [{ code: `${codeStr}.${suffix}`, name: codeStr, market: 'A' }];
  }
  if (codeStr.length === 5) {
    return [{ code: `${codeStr}.HK`, name: codeStr, market: 'HK' }];
  }
  return [];
}

/**
 * 解码 \uXXXX Unicode 转义序列
 */
function decodeUnicode(str: string): string {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

export default router;
