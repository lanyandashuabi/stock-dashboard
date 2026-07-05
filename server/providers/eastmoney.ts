import { fetchWithRetry } from '../utils/gbk';
import { toEastMoneyCode, toSinaCode, getMarket } from '../utils/code-utils';

/**
 * K线数据源
 * 优先使用新浪财经 K线接口（沙箱环境更稳定），东方财富作为备选
 */

export interface KlineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
  changePercent: number;
  turnoverRate: number;
}

export interface KlineResponse {
  code: string;
  name: string;
  market: string;
  klines: KlineData[];
}

/**
 * 新浪财经 K线接口（日K）
 * 接口：https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData
 * 参数：symbol=sh600519, scale=240(日K), datalen=200
 */
export async function fetchSinaKline(
  code: string,
  limit: number = 200
): Promise<KlineResponse | null> {
  try {
    const sinaCode = toSinaCode(code);
    const url =
      `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?` +
      `symbol=${sinaCode}&scale=240&ma=no&datalen=${limit}`;

    const raw = await fetchWithRetry(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.sina.com.cn/',
      },
    });

    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return null;

    const klines: KlineData[] = data.map((item: any) => ({
      date: item.day,
      open: parseFloat(item.open),
      close: parseFloat(item.close),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      volume: parseFloat(item.volume),
      amount: 0, // 新浪日K不包含成交额
      changePercent: 0,
      turnoverRate: 0,
    }));

    return {
      code,
      name: code,
      market: 'CN',
      klines,
    };
  } catch (err) {
    console.error('[SinaKline] Failed:', err);
    return null;
  }
}

/**
 * 东方财富 K线（备选，含更多字段）
 */
export async function fetchEastMoneyKline(
  code: string,
  period: 'day' | 'week' | 'month' = 'day',
  limit: number = 200
): Promise<KlineResponse | null> {
  try {
    const secid = toEastMoneyCode(code);
    const periodMap = { day: 101, week: 102, month: 103 };
    const klt = periodMap[period];

    const url =
      `https://push2his.eastmoney.com/api/qt/stock/kline/get?` +
      `secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&` +
      `fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&` +
      `klt=${klt}&fqt=1&lmt=${limit}`;

    const raw = await fetchWithRetry(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://quote.eastmoney.com/',
      },
    });
    const data = JSON.parse(raw);

    if (!data?.data?.klines) return null;

    const klines: KlineData[] = data.data.klines.map((line: string) => {
      const parts = line.split(',');
      return {
        date: parts[0],
        open: parseFloat(parts[1]),
        close: parseFloat(parts[2]),
        high: parseFloat(parts[3]),
        low: parseFloat(parts[4]),
        volume: parseFloat(parts[5]),
        amount: parseFloat(parts[6]),
        changePercent: parseFloat(parts[8]) || 0,
        turnoverRate: parseFloat(parts[10]) || 0,
      };
    });

    return {
      code,
      name: data.data.name || code,
      market: data.data.market || 'CN',
      klines,
    };
  } catch (err) {
    console.error('[EastMoney] Failed to fetch kline:', err);
    return null;
  }
}

/**
 * 腾讯港股 K线接口
 * 接口：https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=hk00700,day,,,200,qfq
 * 返回：{code:0, data:{hk00700:{day:[...], qt:{hk00700:[...]}}}}
 */
export async function fetchTencentHKKline(
  code: string,
  limit: number = 200
): Promise<KlineResponse | null> {
  try {
    // 从 00700.HK 提取 00700
    const hkCode = code.replace(/[^0-9]/g, '');
    const url =
      `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?` +
      `param=hk${hkCode},day,,,${limit},qfq`;

    const raw = await fetchWithRetry(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://gu.qq.com/',
      },
    });

    const data = JSON.parse(raw);
    if (data.code !== 0 || !data.data?.[`hk${hkCode}`]) return null;

    const stockData = data.data[`hk${hkCode}`];
    const klines: KlineData[] = (stockData.day || []).map((item: any) => ({
      date: item[0],
      open: parseFloat(item[1]),
      close: parseFloat(item[2]),
      high: parseFloat(item[3]),
      low: parseFloat(item[4]),
      volume: parseFloat(item[5]),
      amount: 0,
      changePercent: 0,
      turnoverRate: 0,
    }));

    // 从 qt 中获取名称
    const qt = stockData.qt?.[`hk${hkCode}`];
    const name = qt?.[1] || code;

    return {
      code,
      name,
      market: 'HK',
      klines,
    };
  } catch (err) {
    console.error('[TencentHK] Failed:', err);
    return null;
  }
}

/**
 * 统一 K线获取
 * A股: 优先新浪，回退东方财富
 * 港股: 腾讯接口
 */
export async function fetchKline(
  code: string,
  period: 'day' | 'week' | 'month' = 'day',
  limit: number = 200
): Promise<KlineResponse | null> {
  const market = getMarket(code);

  // 港股用腾讯接口
  if (market === 'hk') {
    if (period === 'day') {
      return fetchTencentHKKline(code, limit);
    }
    // 周K/月K 尝试东方财富
    return fetchEastMoneyKline(code, period, limit);
  }

  // A股：新浪日K → 东方财富备选
  if (period === 'day') {
    const result = await fetchSinaKline(code, limit);
    if (result) return result;
  }
  return fetchEastMoneyKline(code, period, limit);
}

/**
 * 北向资金/沪深股通额度
 */
export interface NorthBoundData {
  hgtBalance: number;
  sgtBalance: number;
  hgtQuota: number;
  sgtQuota: number;
  time: string;
}

export async function fetchNorthBound(): Promise<NorthBoundData | null> {
  return {
    hgtBalance: 0,
    sgtBalance: 0,
    hgtQuota: 520,
    sgtQuota: 520,
    time: new Date().toLocaleString('zh-CN'),
  };
}
