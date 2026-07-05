import { useEffect, useState } from 'react';
import { getMarketStatus, getMarketStatusLabel } from '../data/trading-calendar';

export default function MarketStatus() {
  const [status, setStatus] = useState(() => getMarketStatus(new Date()));

  useEffect(() => {
    const timer = setInterval(() => setStatus(getMarketStatus(new Date())), 60000);
    return () => clearInterval(timer);
  }, []);

  const colorMap: Record<string, string> = {
    trading: 'bg-green-500',
    'pre-open': 'bg-yellow-500',
    'lunch-break': 'bg-yellow-500',
    'after-close': 'bg-gray-500',
    closed: 'bg-gray-600',
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-2 h-2 rounded-full ${colorMap[status] || 'bg-gray-500'} animate-pulse`} />
      <span className="text-gray-400">{getMarketStatusLabel(status)}</span>
    </div>
  );
}
