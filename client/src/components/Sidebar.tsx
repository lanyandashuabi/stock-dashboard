import React from 'react';
import { useAppStore, Page } from '../store';
import { getMarketStatusLabel, getMarketStatusColor } from '../../server/utils/trading-calendar';

const navItems: { key: Page; label: string; icon: string }[] = [
  { key: 'macro', label: '宏观', icon: '🌐' },
  { key: 'industry', label: '行业', icon: '🏭' },
  { key: 'stock-pool', label: '个股池', icon: '📈' },
  { key: 'watchlist', label: '观察清单', icon: '👁' },
];

export default function Sidebar() {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar, openSettings } = useAppStore();

  if (sidebarCollapsed) {
    return (
      <div className="w-14 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-3">
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white p-2 text-lg"
          title="展开菜单"
        >
          ☰
        </button>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`p-2 rounded-lg text-lg transition-colors ${
              currentPage === item.key
                ? 'bg-blue-600/30 text-blue-400'
                : 'text-gray-500 hover:text-white hover:bg-gray-800'
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={openSettings}
          className="text-gray-400 hover:text-white p-2 text-lg"
          title="设置"
        >
          ⚙️
        </button>
      </div>
    );
  }

  return (
    <div className="w-48 bg-gray-900 border-r border-gray-800 flex flex-col py-4">
      <div className="px-4 mb-6 flex items-center justify-between">
        <h1 className="text-sm font-bold text-blue-400 tracking-wide">
          📊 股票看板
        </h1>
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-white text-xs"
          title="收起菜单"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              currentPage === item.key
                ? 'bg-blue-600/20 text-blue-400 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-3 mt-auto">
        <button
          onClick={openSettings}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          ⚙️ 设置
        </button>
      </div>
    </div>
  );
}
