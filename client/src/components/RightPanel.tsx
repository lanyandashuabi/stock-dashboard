import { useEffect, useState } from 'react';
import { fetchRealtime } from '../api';
import { useAppStore } from '../store';
import { FOCUS_ASSETS } from '../data/fallback';

interface AssetQuote {
  code: string; name: string; price: number; change: number; changePercent: number; note: string;
}

export default function RightPanel() {
  const [assets, setAssets] = useState<AssetQuote[]>(() =>
    FOCUS_ASSETS.map(a => ({ code: a.code, name: a.name, price: 0, change: 0, changePercent: 0, note: a.note }))
  );
  const [loading, setLoading] = useState(true);
  const openKline = useAppStore(s => s.openKline);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const codes = FOCUS_ASSETS.map(a => a.code);
      const res = await fetchRealtime(codes);
      if (cancelled) return;
      if (res.success && res.data) {
        setAssets(prev => prev.map(a => {
          const q = res.data?.[a.code];
          if (q) return { ...a, name: q.name || a.name, price: q.price || 0, change: q.change || 0, changePercent: q.changePercent || 0 };
          return a;
        }));
      }
      setLoading(false);
    }
    load();
    const timer = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  return (
    <div className="w-64 flex flex-col flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--border-light)' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h2 className="text-sm font-semibold text-[var(--color-brand)]">★ 重点资产</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && assets.every(a => a.price === 0) ? (
          <div className="p-2 space-y-1.5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="p-1.5 space-y-0.5">
            {assets.map(asset => (
              <button
                key={asset.code}
                onClick={() => openKline(asset.code, asset.name)}
                className="w-full text-left p-2.5 rounded-lg transition-all duration-150 hover:bg-[var(--bg-surface-hover)] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{asset.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{asset.note}</div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm data-number font-semibold text-[var(--text-primary)]">
                      {asset.price > 0 ? asset.price.toFixed(2) : '--'}
                    </div>
                    <div className={`text-xs data-number mt-0.5 ${asset.change >= 0 ? 'text-up' : 'text-down'}`}>
                      {asset.change !== 0 ? `${asset.change >= 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%` : '--'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-light)' }}>
        <div className="text-xs text-[var(--text-tertiary)]">
          <div className="flex items-center justify-between">
            <span>数据状态</span>
            <span className="flex items-center gap-1 text-up">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-up)]" /> 正常
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
