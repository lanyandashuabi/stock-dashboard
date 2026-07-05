import { useAppStore } from '../store';

export default function SettingsModal() {
  const { settingsOpen, closeSettings, theme, toggleTheme, refreshInterval, setRefreshInterval } =
    useAppStore();

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={closeSettings}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">设置</h3>
          <button onClick={closeSettings} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* 主题 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">主题</label>
            <div className="flex gap-2">
              <button
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                🌙 深色
              </button>
              <button
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                ☀️ 浅色
              </button>
            </div>
          </div>

          {/* 刷新间隔 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">数据刷新间隔</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 30, label: '30秒' },
                { value: 60, label: '1分钟' },
                { value: 300, label: '5分钟' },
                { value: 0, label: '手动' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRefreshInterval(opt.value)}
                  className={`py-2 px-2 rounded-lg text-xs transition-colors ${
                    refreshInterval === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 默认市场 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">默认市场</label>
            <div className="flex gap-2">
              {['A股', '港股'].map((m) => (
                <button
                  key={m}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors bg-gray-800 text-gray-400`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 关于 */}
          <div className="pt-3 border-t border-gray-800">
            <p className="text-xs text-gray-600">
              数据来源：新浪财经、东方财富（免费接口）
              <br />
              定时更新：每个工作日 15:00 自动抓取收盘数据
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
