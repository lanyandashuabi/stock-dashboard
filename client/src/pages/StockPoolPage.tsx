import { useEffect, useState, useCallback } from 'react';
import { fetchStockPool, deleteStockPoolItem, fetchRealtime, StockPoolItem } from '../api';
import { useAppStore } from '../store';
import AddStockModal from '../components/AddStockModal';
import { industries } from '../data/industries';

export default function StockPoolPage() {
  const [stocks, setStocks] = useState<StockPoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [industryFilter, setIndustryFilter] = useState('全部');
  const [showAdd, setShowAdd] = useState(false);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const openKline = useAppStore((s) => s.openKline);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchStockPool();
    if (res.success && res.data) {
      setStocks(res.data);
      // 批量获取实时行情
      if (res.data.length > 0) {
        const codes = res.data.map((s) => s.code);
        const qRes = await fetchRealtime(codes);
        if (qRes.success && qRes.data) {
          setQuotes(qRes.data);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const handleDelete = async (stock: StockPoolItem) => {
    if (!stock.is_custom) return;
    if (!window.confirm(`确定删除 ${stock.name} (${stock.code})？`)) return;

    const res = await deleteStockPoolItem(stock.id);
    if (res.success) {
      setStocks((prev) => prev.filter((s) => s.id !== stock.id));
    } else {
      alert(res.error || '删除失败');
    }
  };

  // 获取所有行业
  const allIndustries = ['全部', ...new Set(stocks.map((s) => s.industry).filter(Boolean))];

  // 筛选
  const filtered =
    industryFilter === '全部'
      ? stocks
      : stocks.filter((s) => s.industry === industryFilter);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold "> 个股池</h2>
          <p className="text-sm 4 mt-1">共 {stocks.length} 只股票</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-gradient-red hover:opacity-90 rounded-lg text-sm transition-colors"
        >
           添加个股
        </button>
      </div>

      {/* 行业筛选 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {allIndustries.map((ind) => (
          <button
            key={ind}
            onClick={() => setIndustryFilter(ind)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              industryFilter === ind
                ? 'bg-gradient-red '
                : 'bg-white 3 hover:'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* 股票卡片 */}
      {loading && stocks.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse-glow bg-white rounded-lg h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((stock) => {
            const quote = quotes[stock.code];
            const price = quote?.price ?? stock.price;
            const changePercent = quote?.changePercent ?? stock.change_percent;
            const change = quote?.change ?? 0;

            return (
              <div
                key={stock.id}
                className="bg-white card-shadow border border-red-100 hover:border-blue-500/50 rounded-lg p-4 relative group cursor-pointer transition-colors"
                onClick={() => openKline(stock.code, stock.name)}
              >
                {/* 删除按钮 */}
                {stock.is_custom === 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(stock);
                    }}
                    className="absolute top-2 right-2 text-gray-600 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除"
                  >
                    
                  </button>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{stock.name}</div>
                    <div className="text-xs 4 font-mono mt-0.5">{stock.code}</div>
                  </div>
                  {stock.industry && (
                    <span className="text-xs bg-red-50 px-2 py-0.5 rounded 3">
                      {stock.industry}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-lg font-mono font-bold ">
                    {price > 0 ? price.toFixed(2) : '--'}
                  </span>
                  <span
                    className={`text-sm font-mono ${
                      change >= 0 ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {change !== 0
                      ? `${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
                      : '--'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 添加弹窗 */}
      <AddStockModal open={showAdd} onClose={() => setShowAdd(false)} onAdded={load} />
    </div>
  );
}
