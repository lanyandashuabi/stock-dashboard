import { useState } from 'react';
import { useAppStore } from '../store';

interface ExtractedInfo {
  summary: string;
  stocks: { code: string; name: string; action: string; reason: string }[];
  industryUpdates: { industry: string; content: string }[];
  riskWarnings: string[];
}

export default function ResearchModal() {
  const { researchOpen, closeResearch } = useAppStore();
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ExtractedInfo | null>(null);
  const [error, setError] = useState('');

  if (!researchOpen) return null;

  const handleAnalyze = async () => {
    if (!input.trim()) { setError('请输入研报内容'); return; }
    setAnalyzing(true);
    setError('');

    try {
      const res = await fetch('/api/research/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || '分析失败');
      }
    } catch {
      setError('请求失败，请检查网络');
    }
    setAnalyzing(false);
  };

  const handleUpdateStockPool = async () => {
    if (!result?.stocks.length) return;
    for (const stock of result.stocks) {
      try {
        await fetch('/api/stock-pool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: stock.code,
            name: stock.name,
            industry: stock.action || '',
            tags: stock.reason || '',
          }),
        });
      } catch {}
    }
    alert('已尝试添加个股到个股池（已存在的会跳过）');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeResearch}>
      <div className="rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" style={{ backgroundColor: '#fff' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-red text-white">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h3 className="text-lg font-bold">研报智能分析</h3>
          </div>
          <button onClick={closeResearch} className="text-white/80 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {/* 输入区 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#666' }}>
              粘贴券商研报内容，AI 自动提取关键信息
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="粘贴券商研报内容，AI 自动提取关键信息"
              rows={6}
              className="w-full rounded-lg p-3 text-sm resize-none focus:outline-none"
              style={{ border: '1px solid #f0d0d4', backgroundColor: '#fefefe' }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 bg-gradient-red text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {analyzing ? '⏳ 分析中...' : '🔍 智能分析'}
              </button>
              <button
                onClick={() => { setInput(''); setResult(null); setError(''); }}
                className="px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ border: '1px solid #f0d0d4', color: '#999' }}
              >清空</button>
            </div>
            {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
          </div>

          {/* 分析结果 */}
          {result && (
            <div className="space-y-4">
              {/* 核心摘要 */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #f0d0d4' }}>
                <h4 className="text-sm font-bold mb-2" style={{ color: '#c41e3a' }}>📝 核心摘要</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#333' }}>{result.summary}</p>
              </div>

              {/* 涉及个股 */}
              {result.stocks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold" style={{ color: '#c41e3a' }}>📈 涉及个股</h4>
                    <button
                      onClick={handleUpdateStockPool}
                      className="px-3 py-1 bg-gradient-red text-white rounded text-xs hover:opacity-90"
                    >一键加入个股池</button>
                  </div>
                  <div className="space-y-1">
                    {result.stocks.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ border: '1px solid #f0d0d4' }}>
                        <div>
                          <span className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{s.name}</span>
                          <span className="text-xs ml-2 font-mono" style={{ color: '#999' }}>{s.code}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#fef2f2', color: '#c41e3a' }}>
                          {s.action} · {s.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 行业更新 */}
              {result.industryUpdates.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold mb-2" style={{ color: '#c41e3a' }}>🏭 行业影响</h4>
                  <div className="space-y-1">
                    {result.industryUpdates.map((u, i) => (
                      <div key={i} className="p-2.5 rounded-lg text-sm" style={{ border: '1px solid #f0d0d4', color: '#333' }}>
                        <span className="font-medium">{u.industry}：</span>{u.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 风险提示 */}
              {result.riskWarnings.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#fff8f0', border: '1px solid #f5d0a0' }}>
                  <h4 className="text-sm font-bold mb-1" style={{ color: '#b8860b' }}>⚠ 风险提示</h4>
                  {result.riskWarnings.map((r, i) => (
                    <div key={i} className="text-xs" style={{ color: '#8b6914' }}>• {r}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
