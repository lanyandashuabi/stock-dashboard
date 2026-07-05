import { useEffect, useState } from 'react';
import { fetchRealtime } from '../api';
import { useAppStore } from '../store';
import { FOCUS_ASSETS } from '../data/fallback';

interface AssetQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  note: string;
}

export default function RightPanel() {
  const [assets, setAssets] = useState<AssetQuote[]>(() =>
    FOCUS_ASSETS.map((a) => ({
      code: a.code,
      name: a.name,
      price: 0,
      change: 0,
      changePercent: 0,
      note: a.note,
    }))
  );
  const [loading, setLoading] = useState(true);
  const openKline = useAppStore((s) => s.openKline);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const codes = FOCUS_ASSETS.map((a) => a.code);
      const res = await fetchRealtime(codes);

      if (cancelled) return;
      if (res.success && res.data) {
        setAssets((prev) =>
          prev.map((a) => {
            const quote = res.data?.[a.code];
            if (quote) {
              return {
                ...a,
                name: quote.name || a.name,
                price: quote.price || 0,
                change: quote.change || 0,
                changePercent: quote.changePercent || 0,
              };
            }
            return a;
          })
        );
      }
      setLoading(false);
    }

    load();
    const timer = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-medium text-gray-300">重点资产</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && assets.every((a) => a.price === 0) ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse-glow bg-gray-800 rounded h-14" />
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {assets.map((asset) => (
              <button
                key={asset.code}
                onClick={() => openKline(asset.code, asset.name)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{asset.name}</div>
                    <div className="text-xs text-gray-500">{asset.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-gray-200">
                      {asset.price > 0 ? asset.price.toFixed(2) : '--'}
                    </div>
                    <div
                      className={`text-xs font-mono ${
                        asset.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {asset.change !== 0
                        ? `${asset.change >= 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%`
                        : '--'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 缺失数据监控 */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>数据状态</span>
            <span className="text-green-400">● 正常</span>
          </div>
          <div className="mt-1 text-gray-600">
            自动刷新 30s
          </div>
        </div>
      </div>
    </div>
  );
}
