import { useEffect, useState, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchKline, KlineItem } from '../api';
import { useAppStore } from '../store';

export default function KlineModal() {
  const { klineModal, closeKline } = useAppStore();
  const { open, code, name } = klineModal;
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [klines, setKlines] = useState<KlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setError('');
    const res = await fetchKline(code, period);
    if (res.success && res.data) {
      setKlines(res.data.klines);
    } else {
      setError(res.error || '加载失败');
    }
    setLoading(false);
  }, [code, period]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // 点击外部关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeKline();
  };

  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeKline();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeKline]);

  if (!open) return null;

  // 计算 MA
  const calcMA = (data: KlineItem[], n: number) => {
    return data.map((_, i) => {
      if (i < n - 1) return null;
      let sum = 0;
      for (let j = i - n + 1; j <= i; j++) sum += data[j].close;
      return +(sum / n).toFixed(2);
    });
  };

  // 计算 MACD
  const calcMACD = (data: KlineItem[]) => {
    const ema12: number[] = [];
    const ema26: number[] = [];
    const dif: number[] = [];
    const dea: number[] = [];
    const macd: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const c = data[i].close;
      if (i === 0) {
        ema12.push(c);
        ema26.push(c);
      } else {
        ema12.push((2 * c) / 13 + (11 * ema12[i - 1]) / 13);
        ema26.push((2 * c) / 27 + (25 * ema26[i - 1]) / 27);
      }
      dif.push(ema12[i] - ema26[i]);
      if (i === 0) {
        dea.push(dif[i]);
      } else {
        dea.push((2 * dif[i]) / 10 + (8 * dea[i - 1]) / 10);
      }
      macd.push((dif[i] - dea[i]) * 2);
    }
    return { dif, dea, macd };
  };

  const dates = klines.map((k) => k.date);
  const ohlc = klines.map((k) => [k.open, k.close, k.low, k.high]);
  const volumes = klines.map((k) => k.volume);
  const ma5 = calcMA(klines, 5);
  const ma10 = calcMA(klines, 10);
  const ma20 = calcMA(klines, 20);
  const macdData = calcMACD(klines);

  const option = {
    backgroundColor: '#ffffff',
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: '#ffffff',
      borderColor: '#f0d0d4',
      textStyle: { color: '#333', fontSize: 12 },
    },
    axisPointer: {
      link: [{ xAxisIndex: 'all' }],
    },
    grid: [
      { left: '8%', right: '2%', top: '5%', height: '55%' },
      { left: '8%', right: '2%', top: '68%', height: '12%' },
      { left: '8%', right: '2%', top: '83%', height: '12%' },
    ],
    xAxis: [
      { type: 'category', data: dates, gridIndex: 0, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#f0d0d4' } } },
      { type: 'category', data: dates, gridIndex: 1, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#f0d0d4' } } },
      { type: 'category', data: dates, gridIndex: 2, axisLabel: { color: '#999', fontSize: 10 }, axisLine: { lineStyle: { color: '#f0d0d4' } } },
    ],
    yAxis: [
      { type: 'value', gridIndex: 0, scale: true, splitLine: { lineStyle: { color: '#f5f5f5' } }, axisLabel: { color: '#999', fontSize: 10 } },
      { type: 'value', gridIndex: 1, axisLabel: { show: false }, splitLine: { show: false } },
      { type: 'value', gridIndex: 2, splitLine: { lineStyle: { color: '#f5f5f5' } }, axisLabel: { color: '#999', fontSize: 10 } },
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1, 2], start: 50, end: 100 },
      { type: 'slider', xAxisIndex: [0, 1, 2], start: 50, end: 100, height: 20, bottom: 5, borderColor: '#f0d0d4', backgroundColor: '#fafafa', dataBackground: { lineStyle: { color: '#ddd' }, areaStyle: { color: '#f0d0d4' } }, selectedDataBackground: { lineStyle: { color: '#c41e3a' }, areaStyle: { color: '#c41e3a33' } } },
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: ohlc,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: {
          color: '#ef4444',
          color0: '#22c55e',
          borderColor: '#ef4444',
          borderColor0: '#22c55e',
        },
      },
      { name: 'MA5', type: 'line', data: ma5, xAxisIndex: 0, yAxisIndex: 0, smooth: true, lineStyle: { width: 1, color: '#f59e0b' }, symbol: 'none' },
      { name: 'MA10', type: 'line', data: ma10, xAxisIndex: 0, yAxisIndex: 0, smooth: true, lineStyle: { width: 1, color: '#3b82f6' }, symbol: 'none' },
      { name: 'MA20', type: 'line', data: ma20, xAxisIndex: 0, yAxisIndex: 0, smooth: true, lineStyle: { width: 1, color: '#a855f7' }, symbol: 'none' },
      {
        name: '成交量',
        type: 'bar',
        data: volumes,
        xAxisIndex: 1,
        yAxisIndex: 1,
        itemStyle: {
          color: (params: any) => {
            const k = klines[params.dataIndex];
            return k?.close >= k?.open ? '#22c55e44' : '#ef444444';
          },
        },
      },
      { name: 'DIF', type: 'line', data: macdData.dif, xAxisIndex: 2, yAxisIndex: 2, lineStyle: { width: 1, color: '#f59e0b' }, symbol: 'none' },
      { name: 'DEA', type: 'line', data: macdData.dea, xAxisIndex: 2, yAxisIndex: 2, lineStyle: { width: 1, color: '#3b82f6' }, symbol: 'none' },
      {
        name: 'MACD',
        type: 'bar',
        data: macdData.macd,
        xAxisIndex: 2,
        yAxisIndex: 2,
        itemStyle: {
          color: (params: any) => (macdData.macd[params.dataIndex] >= 0 ? '#ef444488' : '#22c55e88'),
        },
      },
    ],
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gradient-red text-white">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            <span className="text-sm text-white/70 font-mono">{code}</span>
          </div>
          <div className="flex items-center gap-2">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  period === p
                    ? 'bg-gradient-red text-white'
                    : 'bg-gray-100 text-gray-500 hover:text-red-500'
                }`}
              >
                {{ day: '日K', week: '周K', month: '月K' }[p]}
              </button>
            ))}
            <button
              onClick={closeKline}
              className="ml-3 text-white/70 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <span className="animate-pulse-glow">加载中...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96 text-red-400">{error}</div>
          ) : (
            <ReactECharts
              option={option}
              style={{ height: '100%', minHeight: '480px' }}
              notMerge
            />
          )}
        </div>
      </div>
    </div>
  );
}
