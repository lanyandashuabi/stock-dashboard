import { useState } from 'react';
import { addIndustryTerm } from '../api';

interface ExtractedInfo {
  summary: string;
  stocks: { code: string; name: string; action: string; reason: string }[];
  industryUpdates: { industry: string; content: string }[];
  riskWarnings: string[];
  suggestedTerms?: { keyword: string; context: string }[];
  catalystType?: string;
  stats?: {
    candidateNames: number;
    verifiedStocks: number;
    matchedIndustries: number;
  };
}

export default function ResearchPanel() {
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ExtractedInfo | null>(null);
  const [error, setError] = useState('');
  const [addingTerms, setAddingTerms] = useState<Set<string>>(new Set());

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

  const handleAddSuggestedTerm = async (keyword: string, context: string) => {
    setAddingTerms(prev => new Set(prev).add(keyword));
    const res = await addIndustryTerm({
      name: keyword,
      keywords: keyword,
    });
    if (res.success) {
      setAddingTerms(prev => {
        const next = new Set(prev);
        next.delete(keyword);
        return next;
      });
    } else {
      alert(res.error || '添加失败');
      setAddingTerms(prev => {
        const next = new Set(prev);
        next.delete(keyword);
        return next;
      });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span className="text-[var(--color-brand)]">◆</span>
          研报智能分析
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          粘贴研报/新闻/会议纪要内容，AI 自动提取股票、行业、催化剂、风险，一键更新到个股池和行业板块
        </p>
      </div>

      {/* 输入区 */}
      <div className="card-static p-5 mb-4">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="在此粘贴研报内容..."
          rows={10}
          className="input w-full resize-y"
        />

        <div className="flex gap-3 mt-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-primary"
          >
            <span>◆</span>
            <span>{analyzing ? '分析中...' : '开始分析'}</span>
          </button>
          <button
            onClick={() => { setInput(''); setResult(null); setError(''); }}
            className="btn-secondary"
          >清空</button>
        </div>
        {error && (
          <div className="mt-3 text-sm text-[var(--color-down)] bg-red-50 px-3 py-2 rounded-md">{error}</div>
        )}
      </div>

      {/* 提示列表 */}
      <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: 'var(--color-brand-bg)', border: '1px dashed var(--color-brand-border)' }}>
        <div className="text-sm font-medium text-[var(--text-primary)] mb-2">支持自动识别：</div>
        <ul className="text-sm space-y-1.5 text-[var(--text-secondary)]">
          <li>· 股票名称和代码（自动调用API验证，覆盖全市场）</li>
          <li>· 行业标签（从词条库动态匹配，支持自定义增删）</li>
          <li>· 催化剂和风险句子</li>
          <li>· 自动建议新行业词条</li>
        </ul>
      </div>

      {/* 分析结果 */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* 统计信息 */}
          {result.stats && (
            <div className="card-static p-3 flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
              <span>候选名称: <strong className="text-[var(--text-primary)]">{result.stats.candidateNames}</strong></span>
              <span>验证通过: <strong className="text-[var(--color-up)]">{result.stats.verifiedStocks}</strong></span>
              <span>匹配行业: <strong className="text-[var(--color-brand)]">{result.stats.matchedIndustries}</strong></span>
              <span>报告类型: <strong className="text-[var(--text-primary)]">{result.catalystType === '行业' ? '行业研报' : '个股研报'}</strong></span>
            </div>
          )}

          {/* 核心摘要 */}
          <div className="card-static p-5">
            <h4 className="text-base font-bold mb-2 flex items-center gap-1.5 text-[var(--color-brand)]">
              <span>◆</span><span>核心摘要</span>
            </h4>
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">{result.summary}</p>
          </div>

          {/* 涉及个股 */}
          {result.stocks.length > 0 && (
            <div className="card-static p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-bold flex items-center gap-1.5 text-[var(--color-brand)]">
                  <span>◆</span><span>涉及个股 ({result.stocks.length})</span>
                </h4>
                <button onClick={handleUpdateStockPool} className="btn-primary text-xs py-1.5">
                  一键加入个股池
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.stocks.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">{s.name}</span>
                      <span className="text-xs data-number text-[var(--text-tertiary)] flex-shrink-0">{s.code}</span>
                    </div>
                    <span className="badge flex-shrink-0 ml-2">{s.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 行业影响 */}
          {result.industryUpdates.length > 0 && (
            <div className="card-static p-5">
              <h4 className="text-base font-bold mb-3 flex items-center gap-1.5 text-[var(--color-brand)]">
                <span>◆</span><span>行业影响 ({result.industryUpdates.length})</span>
              </h4>
              <div className="space-y-2">
                {result.industryUpdates.map((u, i) => (
                  <div key={i} className="p-3 rounded-lg text-sm text-[var(--text-primary)]" style={{ border: '1px solid var(--border-light)' }}>
                    <span className="badge mr-2">{u.industry}</span>
                    <span className="text-[var(--text-secondary)]">{u.content.length > 120 ? u.content.substring(0, 120) + '...' : u.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 建议新词条 */}
          {result.suggestedTerms && result.suggestedTerms.length > 0 && (
            <div className="rounded-xl p-5" style={{ backgroundColor: 'rgba(59,130,246,0.04)', border: '1px dashed rgba(59,130,246,0.3)' }}>
              <h4 className="text-base font-bold mb-3 flex items-center gap-1.5 text-[var(--color-info)]">
                <span>+</span><span>建议添加行业词条</span>
                <span className="text-xs font-normal text-[var(--text-tertiary)] ml-2">（这些关键词尚未在词条库中）</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.suggestedTerms.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddSuggestedTerm(t.keyword, t.context)}
                    disabled={addingTerms.has(t.keyword)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:shadow-sm disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                    title={t.context}
                  >
                    + {t.keyword}
                    {addingTerms.has(t.keyword) && ' ...'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 风险提示 */}
          {result.riskWarnings.length > 0 && (
            <div className="rounded-xl p-5" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <h4 className="text-base font-bold mb-2 flex items-center gap-1.5 text-[var(--color-warning)]">
                <span>▲</span><span>风险提示</span>
              </h4>
              {result.riskWarnings.map((r, i) => (
                <div key={i} className="text-sm text-[var(--text-secondary)]">· {r}</div>
              ))}
            </div>
          )}

          {/* 无识别结果 */}
          {result.stocks.length === 0 && result.industryUpdates.length === 0 && (
            <div className="card-static p-5 text-center text-sm text-[var(--text-tertiary)]">
              未识别到具体个股或行业信息。请尝试粘贴更详细的研报内容。
            </div>
          )}
        </div>
      )}
    </div>
  );
}
