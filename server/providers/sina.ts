import { fetchWithRetry } from '../utils/gbk';
import { toSinaCode, getMarket } from '../utils/code-utils';

/**
 * 新浪财经实时行情数据源
 *
 * 接口格式：https://hq.sinajs.cn/list=sh600519,sz000001
 * 返回格式：var hq_str_sh600519="股票名称,今开,昨收,现价,最高,最低,竞买价,竞卖价,成交量,成交额,..."
 */

export interface SinaQuote {
  code: string;
  name: string;
  open: number;
  prevClose: number;
  price: number;
  high: number;
  low: number;
  volume: number; // 成交量(股)
  amount: number; // 成交额(元)
  change: number;
  changePercent: number;
  time: string;
  market: 'sh' | 'sz' | 'bj' | 'hk';
}

export interface SinaIndex {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  amount: number;
}

/**
 * 解析新浪个股行情数据
 * 支持 A 股和港股
 */
export function parseSinaQuote(raw: string, code: string): SinaQuote | null {
  try {
    const match = raw.match(/"([^"]*)"/);
    if (!match) return null;

    const fields = match[1].split(',');
    if (fields.length < 3) return null;

    const market = getMarket(code);

    if (market === 'hk') {
      // 港股字段 (rt_hk00700):
      // 0:英文名, 1:中文名, 2:今开, 3:昨收, 4:最高, 5:最低, 6:现价, 7:涨跌额, 8:涨跌幅,
      // 9:竞买价, 10:竞卖价, 11:成交额, 12:成交量, 13:?, 14:?, 15:52周高, 16:52周低, 17:日期
      if (fields.length < 18) return null;

      const name = fields[1] || fields[0];
      const price = parseFloat(fields[6]) || 0;
      const prevClose = parseFloat(fields[3]) || 0;
      const change = price - prevClose;
      const changePercent = prevClose ? (change / prevClose) * 100 : 0;

      return {
        code,
        name,
        open: parseFloat(fields[2]) || 0,
        prevClose,
        price,
        high: parseFloat(fields[4]) || 0,
        low: parseFloat(fields[5]) || 0,
        volume: parseFloat(fields[12]) || 0,
        amount: parseFloat(fields[11]) || 0,
        change: Math.round(change * 1000) / 1000,
        changePercent: Math.round(changePercent * 100) / 100,
        time: fields[17] || '',
        market: 'hk',
      };
    }

    // A股字段（至少需要 32 个字段）：
    // 0:名称, 1:今开, 2:昨收, 3:现价, 4:最高, 5:最低, 6:竞买价, 7:竞卖价,
    // 8:成交量, 9:成交额, ..., 31:时间
    if (fields.length < 10) return null;

    const price = parseFloat(fields[3]) || 0;
    const prevClose = parseFloat(fields[2]) || 0;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    return {
      code,
      name: fields[0],
      open: parseFloat(fields[1]) || 0,
      prevClose,
      price,
      high: parseFloat(fields[4]) || 0,
      low: parseFloat(fields[5]) || 0,
      volume: parseFloat(fields[8]) || 0,
      amount: parseFloat(fields[9]) || 0,
      change: Math.round(change * 1000) / 1000,
      changePercent: Math.round(changePercent * 100) / 100,
      time: fields.length > 31 ? fields[31] : '',
      market: market as 'sh' | 'sz' | 'bj',
    };
  } catch {
    return null;
  }
}

/**
 * 解析新浪指数数据
 */
export function parseSinaIndex(raw: string, code: string): SinaIndex | null {
  try {
    const match = raw.match(/"([^"]*)"/);
    if (!match) return null;

    const fields = match[1].split(',');
    if (fields.length < 6) return null;

    // 指数字段：0:名称, 1:今开, 2:昨收, 3:现价, 4:最高, 5:最低
    const price = parseFloat(fields[3]) || 0;
    const prevClose = parseFloat(fields[2]) || 0;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    return {
      code,
      name: fields[0],
      price,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      open: parseFloat(fields[1]) || 0,
      high: parseFloat(fields[4]) || 0,
      low: parseFloat(fields[5]) || 0,
      prevClose,
      volume: parseFloat(fields[8]) || 0,
      amount: parseFloat(fields[9]) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * 获取新浪实时行情（批量）
 */
export async function fetchSinaQuotes(codes: string[]): Promise<Map<string, SinaQuote>> {
  const result = new Map<string, SinaQuote>();
  const sinaCodes = codes.map(toSinaCode);

  try {
    const url = `https://hq.sinajs.cn/list=${sinaCodes.join(',')}`;
    const raw = await fetchWithRetry(url, { encoding: 'gbk', timeout: 15000 });

    // 按行分割，用 sinaCode 匹配而非索引
    const lines = raw.split('\n').filter((l) => l.trim());

    // 建立 sinaCode → 行内容 的映射
    const lineMap = new Map<string, string>();
    for (const line of lines) {
      const codeMatch = line.match(/hq_str_(\w+)=/);
      if (codeMatch) {
        lineMap.set(codeMatch[1], line);
      }
    }

    for (let i = 0; i < codes.length; i++) {
      const sc = sinaCodes[i];
      const line = lineMap.get(sc);
      if (line) {
        const quote = parseSinaQuote(line, codes[i]);
        if (quote) result.set(codes[i], quote);
      }
    }
  } catch (err) {
    console.error('[Sina] Failed to fetch quotes:', err);
  }

  return result;
}

/**
 * 获取新浪指数数据（批量）
 */
export async function fetchSinaIndices(codes: string[]): Promise<Map<string, SinaIndex>> {
  const result = new Map<string, SinaIndex>();
  const sinaCodes = codes.map(toSinaCode);

  try {
    const url = `https://hq.sinajs.cn/list=${sinaCodes.join(',')}`;
    const raw = await fetchWithRetry(url, { encoding: 'gbk', timeout: 15000 });

    const lines = raw.split('\n').filter((l) => l.trim());

    // 建立 sinaCode → 行内容 的映射
    const lineMap = new Map<string, string>();
    for (const line of lines) {
      const codeMatch = line.match(/hq_str_(\w+)=/);
      if (codeMatch) {
        lineMap.set(codeMatch[1], line);
      }
    }

    for (let i = 0; i < codes.length; i++) {
      const sc = sinaCodes[i];
      const line = lineMap.get(sc);
      if (line) {
        const index = parseSinaIndex(line, codes[i]);
        if (index) result.set(codes[i], index);
      }
    }
  } catch (err) {
    console.error('[Sina] Failed to fetch indices:', err);
  }

  return result;
}

/**
 * 获取单个股票行情
 */
export async function fetchSinaQuote(code: string): Promise<SinaQuote | null> {
  const results = await fetchSinaQuotes([code]);
  return results.get(code) || null;
}
