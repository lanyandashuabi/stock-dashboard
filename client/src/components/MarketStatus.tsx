import { useEffect, useState } from 'react';
import { getMarketStatus, getMarketStatusLabel } from '../data/trading-calendar';

export default function MarketStatus() {
  const [status, setStatus] = useState(() => getMarketStatus(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setStatus(getMarketStatus(new Date())), 60000);
    return () => clearInterval(timer);
  }, []);

  const colorMap: Record<string, string> = { trading: '#22c55e', 'pre-open': '#f59e0b', 'lunch-break': '#f59e0b', 'after-close': '#94a3b8', closed: '#64748b' };

  return (
    <div className="flex items-center gap-1.5 text-xs text-white/80">
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colorMap[status] || '#94a3b8' }} />
      <span className="tracking-wide">{getMarketStatusLabel(status)}</span>
    </div>
  );
}
