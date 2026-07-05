import { useEffect, useState, useCallback } from 'react';
import { fetchMacro, MacroData } from '../api';
import { MACRO_FALLBACK } from '../data/fallback';

// 行业资金流数据类型
interface SectorFlowItem {
  name: string;
  code: string;
  changePercent: number;
  netFlow: number;
  netFlowRatio: number;
}

interface SectorFlowData {
  sectors: SectorFlowItem[];
  summary: {
    totalInflow: number;
    totalOutflow: number;
    hottestSector: string;
    coldestSector: string;
  };
  updatedAt: string;
  _fallback?: boolean;
}

export default function MacroPage() {
  const [data, setData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  // 行业资金流
  const [sectorData, setSectorData] = useState<SectorFlowData | null>(null);
  const [sectorLoading, setSectorLoading] = useState(true);

  const loadMacro = useCallback(async () => {
    if (!firstLoad) setLoading(true);
    const res = await fetchMacro();
    if (res.success && res.data) {
      setData(res.data);
      setLastUpdate(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
      setError('');
    } else {
      setError(res.error || '加载失败');
    }
    setLoading(false);
    setFirstLoad(false);
  }, [firstLoad]);

  const loadSectorFlow = useCallback(async () => {
    setSectorLoading(true);
    try {
      const res = await fetch('/api/sector-flow');
      const json = await res.json();
      if (json.success && json.data) {
        setSectorData(json.data);
      }
    } catch {
      // 静默失败，使用 fallback
    }
    setSectorLoading(false);
  }, []);

  useEffect(() => {
    loadMacro();
    loadSectorFlow();
    const timer = setInterval(() => {
      loadMacro();
      loadSectorFlow();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadMacro, loadSectorFlow]);

  // 首次加载中显示骨架屏
  if (firstLoad && loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse-glow space-y-6">
          <div className="h-8 bg-white rounded w-48" />
          <div className="grid grid-cols-7 gap-3">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="h-24 bg-white rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (v: number) => v?.toFixed(2) || '--';
  const formatChange = (v: number) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2));
  const formatChangePercent = (v: number) => (v >= 0 ? `+${v.toFixed(2)}%` : `${v.toFixed(2)}%`);
  const formatFlow = (v: number) => {
    const abs = Math.abs(v);
    return abs >= 1 ? abs.toFixed(1) + '亿' : (abs * 10000).toFixed(0) + '万';
  };

  // 使用真实数据或回退数据（仅当数据加载失败时用 fallback）
  const indices = data?.indices || (error ? MACRO_FALLBACK.indices : []);
  const sentiment = data?.marketSentiment;
  const economy = data?.economy || (error ? MACRO_FALLBACK.economy : []);
  const monetary = data?.monetary || (error ? MACRO_FALLBACK.monetary : []);
  const global = data?.global || (error ? MACRO_FALLBACK.global : []);
  const isFallback = !!data?._fallback;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold ">🌐 宏观数据</h2>
          <p className="text-sm 4 mt-1">
            {lastUpdate ? `上次更新: ${lastUpdate} (北京时间)` : '加载中...'}
            {isFallback && (
              <span className="text-yellow-600 ml-2">⚠ 实时数据获取失败，使用缓存数据</span>
            )}
            {error && !isFallback && (
              <span className="text-red-400 ml-2">⚠ {error}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { loadMacro(); loadSectorFlow(); }}
          disabled={loading}
          className="px-4 py-2 bg-gradient-red hover:opacity-90 disabled:opacity-50 rounded-lg text-sm transition-colors"
        >
          {loading ? '刷新中...' : '🔄 刷新'}
        </button>
      </div>

      {/* 实时市场 */}
      <Section title="📊 实时市场">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {indices.map((idx) => (
            <div key={idx.code} className="bg-white card-shadow border border-red-100 rounded-lg p-3">
              <div className="text-xs 3 mb-1">{idx.name}</div>
              <div className="text-lg font-mono font-bold ">{formatPrice(idx.price)}</div>
              <div
                className={`text-sm font-mono ${
                  idx.change >= 0 ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {formatChange(idx.change)} {formatChangePercent(idx.changePercent)}
              </div>
            </div>
          ))}
        </div>

        {/* 市场情绪 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white card-shadow border border-red-100 rounded-lg p-3">
            <div className="text-xs 3">
              {sentiment?.northBound?.label || '北向资金'}
            </div>
            <div className="text-lg font-mono font-bold  mt-1">
              {sentiment?.northBound?.value || '--'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {sentiment?.northBound?.note || ''}
            </div>
          </div>
          <div className="bg-white card-shadow border border-red-100 rounded-lg p-3">
            <div className="text-xs 3">两市成交额</div>
            <div className="text-lg font-mono font-bold  mt-1">
              {sentiment?.totalAmount?.value || '--'}
              <span className="text-sm 4 ml-1">
                {sentiment?.totalAmount?.unit || '亿'}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== 行业轮动与资金方向监控（新增） ===== */}
      <Section title="🔄 行业轮动与资金方向">
        {sectorLoading && !sectorData ? (
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="animate-pulse-glow bg-white rounded-lg h-16" />
            ))}
          </div>
        ) : (
          <>
            {/* 资金总览 */}
            {sectorData && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-white card-shadow border border-red-100 rounded-lg p-3">
                  <div className="text-xs 3">主力净流入</div>
                  <div className="text-lg font-mono font-bold text-red-400">
                    +{sectorData.summary.totalInflow.toFixed(1)}亿
                  </div>
                </div>
                <div className="bg-white card-shadow border border-red-100 rounded-lg p-3">
                  <div className="text-xs 3">主力净流出</div>
                  <div className="text-lg font-mono font-bold text-green-400">
                    -{sectorData.summary.totalOutflow.toFixed(1)}亿
                  </div>
                </div>
                <div className="bg-white card-shadow border border-red-300 rounded-lg p-3">
                  <div className="text-xs 3">🔥 最热板块</div>
                  <div className="text-base font-bold text-red-400 mt-1">
                    {sectorData.summary.hottestSector}
                  </div>
                </div>
                <div className="bg-white card-shadow border border-green-300 rounded-lg p-3">
                  <div className="text-xs 3">❄️ 最冷板块</div>
                  <div className="text-base font-bold text-green-400 mt-1">
                    {sectorData.summary.coldestSector}
                  </div>
                </div>
              </div>
            )}

            {/* 行业列表 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {(sectorData?.sectors || []).map((sector) => (
                <div
                  key={sector.code}
                  className={`bg-white card-shadow border rounded-lg p-3 ${
                    sector.netFlow > 0 ? 'border-red-200' : 'border-green-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-200 font-medium">{sector.name}</span>
                    <span
                      className={`text-xs font-mono ${
                        sector.changePercent >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs 4">主力资金</span>
                    <span
                      className={`text-xs font-mono font-medium ${
                        sector.netFlow >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {sector.netFlow >= 0 ? '+' : ''}{formatFlow(sector.netFlow)}
                    </span>
                  </div>
                  {/* 资金流向条 */}
                  <div className="mt-2 h-1 bg-red-50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        sector.netFlow >= 0 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(Math.abs(sector.netFlowRatio) * 3, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {sectorData?._fallback && (
              <p className="text-xs text-yellow-600 mt-2">⚠ 行业资金数据为静态回退，非实时</p>
            )}
          </>
        )}
      </Section>

      {/* 宏观经济 */}
      <Section title="📈 宏观经济">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {economy.map((item) => (
            <div key={item.name} className="bg-white card-shadow border border-red-100 rounded-lg p-3">
              <div className="text-xs 3">{item.name}</div>
              <div className="text-lg font-mono font-bold  mt-1">{item.value}</div>
              <div className="text-xs text-gray-600 mt-1">
                更新: {item.date} | 来源: {item.source}
              </div>
              <div className="text-xs text-gray-700">{item.nextUpdate}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 货币政策 + 全球市场 并排 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Section title="🏦 货币政策" compact>
          <div className="space-y-2">
            {monetary.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between bg-white card-shadow border border-red-100 rounded-lg p-3"
              >
                <div>
                  <div className="text-sm 2">{item.name}</div>
                  <div className="text-xs text-gray-600">下次: {item.nextMeeting}</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-bold ">{item.value}</div>
                  <div className="text-xs text-gray-600 text-right">{item.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="🌍 全球市场" compact>
          <div className="space-y-2">
            {global.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between bg-white card-shadow border border-red-100 rounded-lg p-3"
              >
                <div>
                  <div className="text-sm 2">{item.name}</div>
                  {item.nextMeeting && (
                    <div className="text-xs text-gray-600">下次: {item.nextMeeting}</div>
                  )}
                </div>
                <div>
                  <div className="text-lg font-mono font-bold ">
                    {item.value}
                    {item.unit && <span className="text-xs 4 ml-1">{item.unit}</span>}
                  </div>
                  <div className="text-xs text-gray-600 text-right">{item.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div>
        <h3 className="text-base font-semibold  mb-3">{title}</h3>
        {children}
      </div>
    );
  }
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold  mb-3">{title}</h3>
      {children}
    </div>
  );
}
