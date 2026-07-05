import { useState } from 'react';

interface ExtractedInfo {
  summary: string;
  stocks: { code: string; name: string; action: string; reason: string }[];
  industryUpdates: { industry: string; content: string }[];
  riskWarnings: string[];
}

export default function ResearchPanel() {
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ExtractedInfo | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!input.trim()) { setError('请粘贴研报内容'); return; }
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
    let ok = 0, fail = 0;
    for (const stock of result.stocks) {
      try {
        const r = await fetch('/api/stock-pool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: stock.code,
            name: stock.name,
            industry: stock.action || '',
            tags: stock.reason || '',
          }),
        });
        const d = await r.json();
        if (d.success) ok++; else fail++;
      } catch { fail++; }
    }
    alert(`添加完成：成功 ${ok}，失败/已存在 ${fail}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#1a1a1a' }}>
          <span style={{ color: '#c41e3a' }}>🔍</span>
          研报智能分析
        </h2>
        <p className="mt-2 text-sm" style={{ color: '#666' }}>
          粘贴研报/新闻/会议纪要内容，AI 自动提取股票、行业、催化剂、风险，一键更新到个股池和行业板块
        </p>
      </div>

      {/* 输入区 */}
      <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: '#fff', border: '1px solid #f0d0d4', boxShadow: '0 1px 3px rgba(196,30,58,0.06)' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="在此粘贴研报内容..."
          rows={8}
          className="w-full rounded-lg p-3 text-sm resize-y focus:outline-none"
          style={{ border: '1px solid #f0d0d4', backgroundColor: '#fefefe', color: '#333' }}
        />

        <div className="flex gap-3 mt-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-5 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
            style={{ backgroundColor: '#c41e3a' }}
          >
            <span>🔍</span>
            <span>{analyzing ? '分析中...' : '开始分析'}</span>
          </button>
          <button
            onClick={() => { setInput(''); setResult(null); setError(''); }}
            className="px-5 py-2 text-sm rounded-lg transition-colors"
            style={{ border: '1px solid #f0d0d4', color: '#666' }}
          >清空</button>
        </div>
        {error && <div className="mt-2 text-sm" style={{ color: '#c41e3a' }}>{error}</div>}
      </div>

      {/* 提示列表 */}
      <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: '#fef9f9', border: '1px dashed #f0d0d4' }}>
        <div className="text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>支持自动识别：</div>
        <ul className="text-sm space-y-1.5" style={{ color: '#666' }}>
          <li>• 股票代码和名称（如：寒武纪(688256)、贵州茅台(600519.SH)）</li>
          <li>• 行业标签（AI算力/机器人/创新药/油运/半导体/新能源）</li>
          <li>• 催化剂和风险句子</li>
          <li>• 产业链上下游信息</li>
        </ul>
      </div>

      {/* 分析结果 */}
      {result && (
        <div className="space-y-4">
          {/* 核心摘要 */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: '1px solid #f0d0d4' }}>
            <h4 className="text-base font-bold mb-2 flex items-center gap-1.5" style={{ color: '#c41e3a' }}>
              <span>📝</span><span>核心摘要</span>
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: '#333' }}>{result.summary}</p>
          </div>

          {/* 涉及个股 */}
          {result.stocks.length > 0 && (
            <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: '1px solid #f0d0d4' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-bold flex items-center gap-1.5" style={{ color: '#c41e3a' }}>
                  <span>📈</span><span>涉及个股</span>
                </h4>
                <button
                  onClick={handleUpdateStockPool}
                  className="px-4 py-1.5 text-white rounded text-xs hover:opacity-90"
                  style={{ backgroundColor: '#c41e3a' }}
                >一键加入个股池</button>
              </div>
              <div className="space-y-2">
                {result.stocks.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ border: '1px solid #f0d0d4' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{s.name}</span>
                      <span className="text-xs font-mono" style={{ color: '#999' }}>{s.code}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded" style={{ backgroundColor: '#fef2f2', color: '#c41e3a' }}>
                      {s.action} · {s.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 行业影响 */}
          {result.industryUpdates.length > 0 && (
            <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: '1px solid #f0d0d4' }}>
              <h4 className="text-base font-bold mb-3 flex items-center gap-1.5" style={{ color: '#c41e3a' }}>
                <span>🏭</span><span>行业影响</span>
              </h4>
              <div className="space-y-2">
                {result.industryUpdates.map((u, i) => (
                  <div key={i} className="p-3 rounded-lg text-sm" style={{ border: '1px solid #f0d0d4', color: '#333' }}>
                    <span className="font-medium" style={{ color: '#c41e3a' }}>{u.industry}：</span>{u.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 风险提示 */}
          {result.riskWarnings.length > 0 && (
            <div className="rounded-xl p-5" style={{ backgroundColor: '#fff8f0', border: '1px solid #f5d0a0' }}>
              <h4 className="text-base font-bold mb-2 flex items-center gap-1.5" style={{ color: '#b8860b' }}>
                <span>⚠</span><span>风险提示</span>
              </h4>
              {result.riskWarnings.map((r, i) => (
                <div key={i} className="text-sm" style={{ color: '#8b6914' }}>• {r}</div>
              ))}
            </div>
          )}

          {/* 无识别结果 */}
          {result.stocks.length === 0 && result.industryUpdates.length === 0 && (
            <div className="rounded-xl p-5 text-center text-sm" style={{ backgroundColor: '#fafafa', border: '1px solid #f0d0d4', color: '#999' }}>
              未识别到具体个股或行业信息。请尝试粘贴更详细的研报内容。
            </div>
          )}
        </div>
      )}
    </div>
  );
}
