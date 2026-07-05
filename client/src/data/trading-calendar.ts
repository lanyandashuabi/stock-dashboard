/**
 * A股/港股交易时间判断（前端版）
 * 与 server/utils/trading-calendar.ts 保持同步
 */

const CN_HOLIDAYS = new Set([
  '2025-01-01',
  '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04',
  '2025-04-04', '2025-04-05', '2025-04-06',
  '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05',
  '2025-05-31', '2025-06-01', '2025-06-02',
  '2025-09-15', '2025-09-16', '2025-09-17',
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

export type MarketStatus = 'pre-open' | 'trading' | 'lunch-break' | 'after-close' | 'closed';

export function isTradingDay(date: Date = new Date()): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  if (CN_HOLIDAYS.has(formatDate(date))) return false;
  return true;
}

export function getMarketStatus(date: Date = new Date()): MarketStatus {
  if (!isTradingDay(date)) return 'closed';
  const h = date.getHours();
  const m = date.getMinutes();
  const t = h * 100 + m;
  if (t < 915) return 'pre-open';
  if (t < 1130) return 'trading';
  if (t < 1300) return 'lunch-break';
  if (t < 1500) return 'trading';
  return 'after-close';
}

export function getMarketStatusLabel(status: MarketStatus): string {
  const map: Record<MarketStatus, string> = {
    'pre-open': '盘前',
    trading: '交易中',
    'lunch-break': '午休',
    'after-close': '已收盘',
    closed: '休市',
  };
  return map[status];
}
