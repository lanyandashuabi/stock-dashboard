import { useAppStore } from '../store';

export default function SettingsModal() {
  const { settingsOpen, closeSettings, refreshInterval, setRefreshInterval } = useAppStore();
  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeSettings}>
      <div className="rounded-xl w-full max-w-md p-6 shadow-2xl" style={{ backgroundColor: '#fff' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: '#c41e3a' }}>⚙️ 设置</h3>
          <button onClick={closeSettings} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#666' }}>数据刷新间隔</label>
            <div className="grid grid-cols-4 gap-2">
              {[{ value: 30, label: '30秒' },{ value: 60, label: '1分钟' },{ value: 300, label: '5分钟' },{ value: 0, label: '手动' }].map(opt => (
                <button key={opt.value} onClick={() => setRefreshInterval(opt.value)}
                  className={`py-2 px-2 rounded-lg text-xs transition-colors ${
                    refreshInterval === opt.value ? 'bg-gradient-red text-white' : 'text-gray-500 hover:text-red-500'
                  }`} style={refreshInterval !== opt.value ? { border: '1px solid #f0d0d4' } : {}}
                >{opt.label}</button>
              ))}
            </div>
          </div>
          <div className="pt-3" style={{ borderTop: '1px solid #f0d0d4' }}>
            <p className="text-xs" style={{ color: '#bbb' }}>
              光明宗 · 股票研究看板 v2.4<br />
              数据来源：新浪财经、腾讯财经（免费接口）<br />
              定时更新：每个工作日 15:00 自动抓取收盘数据
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
