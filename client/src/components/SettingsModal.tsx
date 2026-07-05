import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { fetchIndustryTerms, addIndustryTerm, updateIndustryTerm, deleteIndustryTerm, IndustryTermItem } from '../api';

type SettingsTab = 'general' | 'industry-terms';

export default function SettingsModal() {
  const { settingsOpen, closeSettings, refreshInterval, setRefreshInterval, theme, toggleTheme } = useAppStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  if (!settingsOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeSettings}>
      <div className="modal-panel w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-[var(--color-brand)]">设置</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'general'
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--color-brand)]'
                }`}
              >通用</button>
              <button
                onClick={() => setActiveTab('industry-terms')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'industry-terms'
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--color-brand)]'
                }`}
              >行业词条</button>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' ? (
            <GeneralSettings
              theme={theme}
              toggleTheme={toggleTheme}
              refreshInterval={refreshInterval}
              setRefreshInterval={setRefreshInterval}
            />
          ) : (
            <IndustryTermsManager />
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({
  theme,
  toggleTheme,
  refreshInterval,
  setRefreshInterval,
}: {
  theme: string;
  toggleTheme: () => void;
  refreshInterval: number;
  setRefreshInterval: (v: number) => void;
}) {
  return (
    <div className="space-y-5">
      {/* 主题切换 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">外观主题</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
              theme === 'light'
                ? 'bg-[var(--color-brand)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--color-brand)]'
            }`}
            style={theme !== 'light' ? { border: '1px solid var(--border-default)' } : {}}
          >
            ☀ 浅色
          </button>
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
              theme === 'dark'
                ? 'bg-[var(--color-brand)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--color-brand)]'
            }`}
            style={theme !== 'dark' ? { border: '1px solid var(--border-default)' } : {}}
          >
            ☾ 深色
          </button>
        </div>
      </div>

      {/* 刷新间隔 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">数据刷新间隔</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 30, label: '30秒' },
            { value: 60, label: '1分钟' },
            { value: 300, label: '5分钟' },
            { value: 0, label: '手动' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setRefreshInterval(opt.value)}
              className={`py-2 px-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                refreshInterval === opt.value
                  ? 'bg-[var(--color-brand)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--color-brand)]'
              }`}
              style={refreshInterval !== opt.value ? { border: '1px solid var(--border-default)' } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
          光明宗 · 股票研究看板 v2.5<br />
          数据来源：新浪财经、腾讯财经（免费接口）<br />
          定时更新：每个工作日 15:00 自动抓取收盘数据
        </p>
      </div>
    </div>
  );
}

function IndustryTermsManager() {
  const [terms, setTerms] = useState<IndustryTermItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // 新增表单
  const [newName, setNewName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');

  // 编辑表单
  const [editName, setEditName] = useState('');
  const [editKeywords, setEditKeywords] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetchIndustryTerms();
    if (res.success && res.data) {
      setTerms(res.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !newKeywords.trim()) return;
    const res = await addIndustryTerm({ name: newName.trim(), keywords: newKeywords.trim() });
    if (res.success) {
      setNewName('');
      setNewKeywords('');
      setShowAdd(false);
      load();
    } else {
      alert(res.error || '添加失败');
    }
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim() || !editKeywords.trim()) return;
    const res = await updateIndustryTerm(id, { name: editName.trim(), keywords: editKeywords.trim() });
    if (res.success) {
      setEditingId(null);
      load();
    } else {
      alert(res.error || '更新失败');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`确定删除行业词条「${name}」？`)) return;
    const res = await deleteIndustryTerm(id);
    if (res.success) {
      load();
    } else {
      alert(res.error || '删除失败');
    }
  };

  const startEdit = (term: IndustryTermItem) => {
    setEditingId(term.id);
    setEditName(term.name);
    setEditKeywords(term.keywords);
  };

  if (loading) {
    return <div className="text-sm text-[var(--text-tertiary)]">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">行业词条管理</h4>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">共 {terms.length} 个词条，用于研报分析时匹配行业</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-xs py-1.5">+ 添加词条</button>
      </div>

      {/* 新增表单 */}
      {showAdd && (
        <div className="card-static p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">词条名称</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="如：液冷" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">关键词（逗号分隔）</label>
              <input value={newKeywords} onChange={e => setNewKeywords(e.target.value)} placeholder="如：液冷,冷却,散热" className="input w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary text-xs py-1.5">确认添加</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-xs py-1.5">取消</button>
          </div>
        </div>
      )}

      {/* 词条列表 */}
      <div className="space-y-1.5">
        {terms.map(term => (
          <div key={term.id} className="card-static p-3">
            {editingId === term.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="input w-full" />
                  <input value={editKeywords} onChange={e => setEditKeywords(e.target.value)} className="input w-full" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(term.id)} className="btn-primary text-xs py-1">保存</button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1">取消</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{term.name}</span>
                  <span className="text-xs text-[var(--text-tertiary)] ml-2 truncate">{term.keywords}</span>
                </div>
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  <button onClick={() => startEdit(term)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--color-brand)] px-2 py-1 transition-colors">编辑</button>
                  <button onClick={() => handleDelete(term.id, term.name)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--color-down)] px-2 py-1 transition-colors">删除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
