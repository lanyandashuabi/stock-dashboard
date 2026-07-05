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
      <div className="p-6 animate-fade-in">
        <div className="space-y-6">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="grid grid-cols-7 gap-3">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="skeleton h-28 rounded-lg" />
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

  const indices = data?.indices || (error ? MACRO_FALLBACK.indices : []);
  const sentiment = data?.marketSentiment;
  const economy = data?.economy || (error ? MACRO_FALLBACK.economy : []);
  const monetary = data?.monetary || (error ? MACRO_FALLBACK.monetary : []);
  const global = data?.global || (error ? MACRO_FALLBACK.global : []);
  const isFallback = !!data?._fallback;

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">宏观数据</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {lastUpdate ? `上次更新: ${lastUpdate} (北京时间)` : '加载中...'}
            {isFallback && (
              <span className="text-[var(--color-warning)] ml-2">实时数据获取失败，使用缓存数据</span>
            )}
            {error && !isFallback && (
              <span className="text-[var(--color-down)] ml-2">{error}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { loadMacro(); loadSectorFlow(); }}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? '刷新中...' : '↻ 刷新'}
        </button>
      </div>

      {/* 实时市场 */}
      <Section title="实时市场">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {indices.map((idx) => (
            <div key={idx.code} className="card-accent p-4 animate-fade-in">
              <div className="text-xs text-[var(--text-tertiary)] mb-1.5 truncate">{idx.name}</div>
              <div className="text-lg data-number font-bold text-[var(--text-primary)]">{formatPrice(idx.price)}</div>
              <div className={`text-sm data-number mt-1 ${idx.change >= 0 ? 'text-up' : 'text-down'}`}>
                {formatChange(idx.change)} {formatChangePercent(idx.changePercent)}
              </div>
            </div>
          ))}
        </div>

        {/* 市场情绪 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="card-static p-4">
            <div className="text-xs text-[var(--text-tertiary)]">
              {sentiment?.northBound?.label || '北向资金'}
            </div>
            <div className="text-lg data-number font-bold text-[var(--text-primary)] mt-1.5">
              {sentiment?.northBound?.value || '--'}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              {sentiment?.northBound?.note || ''}
            </div>
          </div>
          <div className="card-static p-4">
            <div className="text-xs text-[var(--text-tertiary)]">两市成交额</div>
            <div className="text-lg data-number font-bold text-[var(--text-primary)] mt-1.5">
              {sentiment?.totalAmount?.value || '--'}
              <span className="text-sm text-[var(--text-tertiary)] ml-1 font-normal font-[var(--font-body)]">
                {sentiment?.totalAmount?.unit || '亿'}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* 行业轮动与资金方向 */}
      <Section title="行业轮动与资金方向">
        {sectorLoading && !sectorData ? (
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* 资金总览 */}
            {sectorData && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="card-static p-3">
                  <div className="text-xs text-[var(--text-tertiary)]">主力净流入</div>
                  <div className="text-lg data-number font-bold text-up mt-1">
                    +{sectorData.summary.totalInflow.toFixed(1)}亿
                  </div>
                </div>
                <div className="card-static p-3">
                  <div className="text-xs text-[var(--text-tertiary)]">主力净流出</div>
                  <div className="text-lg data-number font-bold text-down mt-1">
                    -{sectorData.summary.totalOutflow.toFixed(1)}亿
                  </div>
                </div>
                <div className="card-accent p-3">
                  <div className="text-xs text-[var(--text-tertiary)]">最热板块</div>
                  <div className="text-base font-bold text-up mt-1">
                    {sectorData.summary.hottestSector}
                  </div>
                </div>
                <div className="card-static p-3" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
                  <div className="text-xs text-[var(--text-tertiary)]">最冷板块</div>
                  <div className="text-base font-bold text-down mt-1">
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
                  className={`card-static p-3 ${sector.netFlow > 0 ? '' : ''}`}
                  style={{ borderColor: sector.netFlow > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[var(--text-primary)] font-medium truncate">{sector.name}</span>
                    <span className={`text-xs data-number ${sector.changePercent >= 0 ? 'text-up' : 'text-down'}`}>
                      {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-tertiary)]">主力资金</span>
                    <span className={`text-xs data-number font-medium ${sector.netFlow >= 0 ? 'text-up' : 'text-down'}`}>
                      {sector.netFlow >= 0 ? '+' : ''}{formatFlow(sector.netFlow)}
                    </span>
                  </div>
                  {/* 资金流向条 */}
                  <div className="mt-2 h-1 bg-[var(--border-light)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${sector.netFlow >= 0 ? 'bg-[var(--color-down)]' : 'bg-[var(--color-up)]'}`}
                      style={{ width: `${Math.min(Math.abs(sector.netFlowRatio) * 3, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {sectorData?._fallback && (
              <p className="text-xs text-[var(--color-warning)] mt-2">行业资金数据为静态回退，非实时</p>
            )}
          </>
        )}
      </Section>

      {/* 宏观经济 */}
      <Section title="宏观经济">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {economy.map((item) => (
            <div key={item.name} className="card-static p-4">
              <div className="text-xs text-[var(--text-tertiary)]">{item.name}</div>
              <div className="text-lg data-number font-bold text-[var(--text-primary)] mt-1.5">{item.value}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1.5">
                更新: {item.date} · 来源: {item.source}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">{item.nextUpdate}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 货币政策 + 全球市场 并排 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Section title="货币政策" compact>
          <div className="space-y-2">
            {monetary.map((item) => (
              <div key={item.name} className="card-static flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{item.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">下次: {item.nextMeeting}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg data-number font-bold text-[var(--text-primary)]">{item.value}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{item.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="全球市场" compact>
          <div className="space-y-2">
            {global.map((item) => (
              <div key={item.name} className="card-static flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{item.name}</div>
                  {item.nextMeeting && (
                    <div className="text-xs text-[var(--text-tertiary)]">下次: {item.nextMeeting}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg data-number font-bold text-[var(--text-primary)]">
                    {item.value}
                    {item.unit && <span className="text-xs text-[var(--text-tertiary)] ml-1 font-normal font-[var(--font-body)]">{item.unit}</span>}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">{item.date}</div>
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
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">{title}</h3>
        {children}
      </div>
    );
  }
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">{title}</h3>
      {children}
    </div>
  );
}
