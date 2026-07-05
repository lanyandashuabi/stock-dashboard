import { useAppStore, Page } from '../store';

const navItems: { key: Page; label: string; icon: string }[] = [
  { key: 'macro', label: '宏观', icon: '◉' },
  { key: 'industry', label: '行业', icon: '◇' },
  { key: 'stock-pool', label: '个股池', icon: '◎' },
  { key: 'watchlist', label: '观察清单', icon: '▣' },
];

export default function Sidebar() {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar, openSettings } = useAppStore();

  if (sidebarCollapsed) {
    return (
      <div className="w-14 flex flex-col items-center py-3 gap-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)' }}>
        <button onClick={toggleSidebar} className="text-[var(--text-tertiary)] hover:text-[var(--color-brand)] p-2 text-base transition-colors duration-150" title="展开菜单">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`w-10 h-9 rounded-lg text-sm flex items-center justify-center transition-all duration-150 ${
              currentPage === item.key
                ? 'text-[var(--color-brand)] font-semibold'
                : 'text-[var(--text-tertiary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-bg)]'
            }`}
            title={item.label}
          >{item.icon}</button>
        ))}
        <div className="flex-1" />
        <button onClick={openSettings} className="text-[var(--text-tertiary)] hover:text-[var(--color-brand)] p-2 text-sm transition-colors duration-150" title="设置">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-48 flex flex-col py-4 flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)' }}>
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
          >
            <span className="mr-2.5 text-sm">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 space-y-0.5" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
        <button onClick={openSettings} className="w-full text-left px-4 py-2 rounded-md text-xs text-[var(--text-tertiary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-bg)] transition-colors duration-150">
          ⚙ 设置
        </button>
        <button onClick={toggleSidebar} className="w-full text-left px-4 py-2 rounded-md text-xs text-[var(--text-tertiary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-bg)] transition-colors duration-150">
          ◀ 收起菜单
        </button>
      </div>
    </div>
  );
}
