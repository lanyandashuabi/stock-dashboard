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
    <div className="w-64 flex flex-col flex-shrink-0" style={{ backgroundColor: '#fff', borderLeft: '1px solid #f0d0d4' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #f0d0d4' }}>
        <h2 className="text-sm font-medium" style={{ color: '#c41e3a' }}>⭐ 重点资产</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && assets.every(a => a.price === 0) ? (
          <div className="p-3 space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="animate-pulse-glow rounded h-12" style={{backgroundColor:'#fef2f2'}} />)}
          </div>
        ) : (
          <div className="p-1 space-y-0.5">
            {assets.map(asset => (
              <button
                key={asset.code}
                onClick={() => openKline(asset.code, asset.name)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{color:'#1a1a1a'}}>{asset.name}</div>
                    <div className="text-xs" style={{color:'#999'}}>{asset.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono" style={{color:'#1a1a1a'}}>
                      {asset.price > 0 ? asset.price.toFixed(2) : '--'}
                    </div>
                    <div className={`text-xs font-mono ${asset.change >= 0 ? 'text-green-500' : ''}`} style={asset.change < 0 ? {color:'#c41e3a'} : {}}>
                      {asset.change !== 0 ? `${asset.change >= 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%` : '--'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3" style={{ borderTop: '1px solid #f0d0d4' }}>
        <div className="text-xs" style={{color:'#999'}}>
          <div className="flex items-center justify-between">
            <span>数据状态</span>
            <span style={{color:'#22c55e'}}>● 正常</span>
          </div>
        </div>
      </div>
    </div>
  );
}
