import { useEffect, useState } from 'react';
import { fetchRealtime } from '../api';
import { useAppStore } from '../store';

interface WatchItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  note: string;
  alertPrice: number;
}

const DEFAULT_WATCHLIST: WatchItem[] = [
  { code: '600519.SH', name: '贵州茅台', price: 0, change: 0, changePercent: 0, note: '消费龙头', alertPrice: 0 },
  { code: '000858.SZ', name: '五粮液', price: 0, change: 0, changePercent: 0, note: '白酒', alertPrice: 0 },
  { code: '300750.SZ', name: '宁德时代', price: 0, change: 0, changePercent: 0, note: '新能源', alertPrice: 0 },
  { code: '00700.HK', name: '腾讯控股', price: 0, change: 0, changePercent: 0, note: '互联网', alertPrice: 0 },
  { code: '300308.SZ', name: '中际旭创', price: 0, change: 0, changePercent: 0, note: '光模块', alertPrice: 0 },
];

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
  });
  const openKline = useAppStore((s) => s.openKline);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(items));
  }, [items]);

  // 获取实时行情
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const codes = items.map((i) => i.code);
      const res = await fetchRealtime(codes);
      if (cancelled || !res.success || !res.data) return;

      setItems((prev) =>
        prev.map((item) => {
          const q = res.data?.[item.code];
          if (q) {
            return {
              ...item,
              name: q.name || item.name,
              price: q.price || 0,
              change: q.change || 0,
              changePercent: q.changePercent || 0,
            };
          }
          return item;
        })
      );
    }

    load();
    const timer = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const updateNote = (code: string, note: string) => {
    setItems((prev) => prev.map((i) => (i.code === code ? { ...i, note } : i)));
  };

  const updateAlertPrice = (code: string, price: number) => {
    setItems((prev) => prev.map((i) => (i.code === code ? { ...i, alertPrice: price } : i)));
  };

  return (
    <div className="p-6 animate-fade-in">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">观察清单</h2>

      <div className="overflow-x-auto card-static">
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>代码</th>
              <th style={{ textAlign: 'right' }}>现价</th>
              <th style={{ textAlign: 'right' }}>涨跌</th>
              <th>备注</th>
              <th style={{ textAlign: 'right' }}>预警价</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.code}
                className="cursor-pointer"
                onClick={() => openKline(item.code, item.name)}
              >
                <td>
                  <span className="font-semibold text-[var(--text-primary)]">{item.name}</span>
                </td>
                <td>
                  <span className="data-number text-xs text-[var(--text-tertiary)]">{item.code}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="data-number font-medium text-[var(--text-primary)]">
                    {item.price > 0 ? item.price.toFixed(2) : '--'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className={`data-number font-medium ${item.change >= 0 ? 'text-up' : 'text-down'}`}>
                    {item.change !== 0
                      ? `${item.change >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`
                      : '--'}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) => updateNote(item.code, e.target.value)}
                    className="table-input w-28"
                    placeholder="备注"
                  />
                </td>
                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    value={item.alertPrice || ''}
                    onChange={(e) => updateAlertPrice(item.code, parseFloat(e.target.value) || 0)}
                    className="table-input w-20 text-right data-number"
                    placeholder="预警价"
                    step="0.01"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-[var(--text-tertiary)]">
        点击行查看 K 线图 · 直接在表格中编辑备注和预警价 · 数据自动保存
      </div>
    </div>
  );
}
