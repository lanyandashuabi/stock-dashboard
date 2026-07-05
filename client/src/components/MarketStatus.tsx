import { useEffect, useState } from 'react';
import { getMarketStatus, getMarketStatusLabel } from '../data/trading-calendar';

export default function MarketStatus() {
  const [status, setStatus] = useState(() => getMarketStatus(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setStatus(getMarketStatus(new Date())), 60000);
    return () => clearInterval(timer);
  }, []);

  const colorMap: Record<string, string> = { trading: '#22c55e', 'pre-open': '#f59e0b', 'lunch-break': '#f59e0b', 'after-close': '#999', closed: '#bbb' };
  const textMap: Record<string, string> = { trading: '交易中', 'pre-open': '盘前', 'lunch-break': '午休', 'after-close': '已收盘', closed: '休市' };

  return (
    <div className="flex items-center gap-1.5 text-xs text-white/80">
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colorMap[status] || '#999' }} />
      <span>{textMap[status] || status}</span>
    </div>
  );
}
