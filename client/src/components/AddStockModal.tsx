import { useState, useRef, useEffect, useCallback } from 'react';
import { addStockPoolItem, searchStock, StockSearchResult } from '../api';
import { industries } from '../data/industries';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddStockModal({ open, onClose, onAdded }: Props) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 智能搜索
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (kw: string) => {
    if (kw.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    const res = await searchStock(kw.trim());
    if (res.success && res.data) {
      setSearchResults(res.data.slice(0, 8));
      setShowDropdown(res.data.length > 0);
    }
    setSearching(false);
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSelectStock = (stock: StockSearchResult) => {
    setName(stock.name);
    setCode(stock.code);
    setShowDropdown(false);
    // 尝试自动匹配行业
    const matchedIndustry = industries.find(ind =>
      ind.segments.some(seg => seg.leaders.some(l => l.code === stock.code))
    );
    if (matchedIndustry) {
      setIndustry(matchedIndustry.name);
    }
  };

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');

    if (!code.trim()) {
      setError('请选择或输入股票');
      return;
    }
    if (!name.trim()) {
      setError('请输入股票名称');
      return;
    }

    setSubmitting(true);
    const res = await addStockPoolItem({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      industry,
      tags,
    });

    if (res.success) {
      setCode('');
      setName('');
      setIndustry('');
      setTags('');
      setSearchResults([]);
      onAdded();
      onClose();
    } else {
      setError(res.error || '添加失败');
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">添加个股</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* 名称搜索（主要输入） */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              股票名称 <span className="text-[var(--color-down)]">*</span>
              <span className="text-[var(--text-tertiary)] font-normal ml-1">（输入名称自动搜索）</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              placeholder="如：贵州茅台 / 拓普集团"
              className="input w-full"
            />
            {searching && (
              <div className="absolute right-3 top-9 text-xs text-[var(--text-tertiary)]">搜索中...</div>
            )}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                {searchResults.map(stock => (
                  <button
                    key={stock.code}
                    onClick={() => handleSelectStock(stock)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--bg-surface-hover)] transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">{stock.name}</span>
                      <span className="text-xs text-[var(--text-tertiary)] ml-2">{stock.code}</span>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">{stock.market === 'HK' ? '港股' : 'A股'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 代码 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              股票代码 <span className="text-[var(--color-down)]">*</span>
              <span className="text-[var(--text-tertiary)] font-normal ml-1">（自动填入，也可手动修改）</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="600519.SH / 00700.HK"
              className="input w-full data-number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">所属行业</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="input w-full"
            >
              <option value="">-- 选择行业 --</option>
              {industries.map((ind) => (
                <option key={ind.key} value={ind.name}>
                  {ind.icon} {ind.name}
                </option>
              ))}
              <option value="其他">其他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">标签（逗号分隔）</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="如：龙头,高股息"
              className="input w-full"
            />
          </div>

          {error && (
            <div className="text-sm text-[var(--color-down)] bg-red-50 px-3 py-2 rounded-md">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full justify-center py-2.5"
          >
            {submitting ? '添加中...' : '确认添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
