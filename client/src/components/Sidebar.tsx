import { useAppStore, Page } from '../store';

const navItems: { key: Page; label: string }[] = [
  { key: 'macro', label: '宏观' },
  { key: 'industry', label: '行业' },
  { key: 'stock-pool', label: '个股池' },
  { key: 'watchlist', label: '观察清单' },
];

export default function Sidebar() {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar, openSettings } = useAppStore();

  if (sidebarCollapsed) {
    return (
      <div className="w-14 flex flex-col items-center py-3 gap-2 flex-shrink-0" style={{ backgroundColor: '#fff', borderRight: '1px solid #f0d0d4' }}>
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-red-600 p-2 text-lg" title="展开菜单">☰</button>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`w-12 h-9 rounded-lg text-sm transition-colors ${
              currentPage === item.key ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
            }`}
            title={item.label}
          >{item.label}</button>
        ))}
        <div className="flex-1" />
        <button onClick={openSettings} className="text-gray-400 hover:text-red-500 p-2 text-sm" title="设置">⚙</button>
      </div>
    );
  }

  return (
    <div className="w-48 flex flex-col py-4 flex-shrink-0" style={{ backgroundColor: '#fff', borderRight: '1px solid #f0d0d4' }}>
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
              currentPage === item.key
                ? 'bg-red-50 text-red-600 font-medium'
                : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
            }`}
          >{item.label}</button>
        ))}
      </nav>

      <div className="px-3 space-y-0.5" style={{ borderTop: '1px solid #f0d0d4', paddingTop: '8px' }}>
        <button onClick={openSettings} className="w-full text-left px-4 py-2 rounded-lg text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors">
          设置
        </button>
        <button onClick={toggleSidebar} className="w-full text-left px-4 py-2 rounded-lg text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          收起菜单
        </button>
      </div>
    </div>
  );
}
