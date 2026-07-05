/**
 * A股/港股交易日判断和交易时间
 */

// 2025-2026 中国法定节假日（非交易日）
const CN_HOLIDAYS = new Set([
  '2025-01-01', // 元旦
  '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04', // 春节
  '2025-04-04', '2025-04-05', '2025-04-06', // 清明
  '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05', // 劳动节
  '2025-05-31', '2025-06-01', '2025-06-02', // 端午
  '2025-09-15', '2025-09-16', '2025-09-17', // 中秋+国庆连休(预估)
  '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08',
  '2026-01-01',
  '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
]);

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 判断是否是 A 股交易日
 */
export function isTradingDay(date: Date = new Date()): boolean {
  const day = date.getDay();
  // 周六日
  if (day === 0 || day === 6) return false;
  // 法定节假日
  if (CN_HOLIDAYS.has(formatDate(date))) return false;
  return true;
}

/**
 * 获取交易时段状态
 */
export type MarketStatus = 'pre-open' | 'trading' | 'lunch-break' | 'after-close' | 'closed';

export function getMarketStatus(date: Date = new Date()): MarketStatus {
  if (!isTradingDay(date)) return 'closed';

  const h = date.getHours();
  const m = date.getMinutes();
  const t = h * 100 + m;

  if (t < 915) return 'pre-open';
  if (t < 930) return 'pre-open';
  if (t < 1130) return 'trading';
  if (t < 1300) return 'lunch-break';
  if (t < 1500) return 'trading';
  return 'after-close';
}

export function getMarketStatusLabel(status: MarketStatus): string {
  switch (status) {
    case 'pre-open':
      return '盘前';
    case 'trading':
      return '交易中';
    case 'lunch-break':
      return '午休';
    case 'after-close':
      return '已收盘';
    case 'closed':
      return '休市';
  }
}

export function getMarketStatusColor(status: MarketStatus): string {
  switch (status) {
    case 'trading':
      return '#22c55e';
    case 'pre-open':
    case 'lunch-break':
      return '#f59e0b';
    case 'after-close':
    case 'closed':
      return '#94a3b8';
  }
}
