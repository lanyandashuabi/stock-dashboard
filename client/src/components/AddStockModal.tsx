import { useState } from 'react';
import { addStockPoolItem } from '../api';
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

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');

    // 格式校验
    const codeRegex = /^\d{5,6}\.(SH|SZ|BJ|HK)$/i;
    if (!codeRegex.test(code.trim())) {
      setError('代码格式错误，示例：600519.SH / 00700.HK');
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
      onAdded();
      onClose();
    } else {
      setError(res.error || '添加失败');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">➕ 添加个股</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">股票代码 *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="600519.SH / 00700.HK"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">股票名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：贵州茅台"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">所属行业</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
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
            <label className="block text-sm text-gray-400 mb-1">标签（逗号分隔）</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="如：龙头,高股息"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? '添加中...' : '确认添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
