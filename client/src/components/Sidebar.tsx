import { useAppStore, Page } from '../store';

const navItems: { key: Page; label: string; icon: string }[] = [
  { key: 'macro', label: '宏观', icon: '🌐' },
  { key: 'industry', label: '行业', icon: '🏭' },
  { key: 'stock-pool', label: '个股池', icon: '📈' },
  { key: 'watchlist', label: '观察清单', icon: '👁' },
];

export default function Sidebar() {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar, openSettings, openResearch } = useAppStore();

  if (sidebarCollapsed) {
    return (
      <div className="w-14 flex flex-col items-center py-3 gap-2 flex-shrink-0" style={{ backgroundColor: '#fff', borderRight: '1px solid #f0d0d4' }}>
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-red-600 p-2 text-lg" title="展开菜单">☰</button>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`p-2 rounded-lg text-lg transition-colors ${
              currentPage === item.key
                ? 'bg-red-50 text-red-600'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            title={item.label}
          >{item.icon}</button>
        ))}
        <div className="flex-1" />
        <button onClick={openResearch} className="text-gray-400 hover:text-red-500 p-2 text-lg" title="研报分析">📋</button>
        <button onClick={openSettings} className="text-gray-400 hover:text-red-500 p-2 text-lg" title="设置">⚙️</button>
      </div>
    );
  }

  return (
    <div className="w-48 flex flex-col py-3 flex-shrink-0" style={{ backgroundColor: '#fff', borderRight: '1px solid #f0d0d4' }}>
      <div className="px-4 mb-4 flex items-center justify-between">
        <h1 className="text-sm font-bold tracking-wide" style={{ color: '#c41e3a', fontFamily: '"KaiTi","STKaiti",serif' }}>📊 光明宗</h1>
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-red-500 text-xs" title="收起菜单">✕</button>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              currentPage === item.key
                ? 'bg-red-50 text-red-600 font-medium'
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
            }`}
          ><span>{item.icon}</span><span>{item.label}</span></button>
        ))}
      </nav>

      <div className="px-3 space-y-0.5">
        <button onClick={openResearch} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors">
          📋 研报分析
        </button>
        <button onClick={openSettings} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors">
          ⚙️ 设置
        </button>
      </div>
    </div>
  );
}
