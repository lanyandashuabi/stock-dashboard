import React from 'react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import KlineModal from './components/KlineModal';
import SettingsModal from './components/SettingsModal';
import MarketStatus from './components/MarketStatus';
import MacroPage from './pages/MacroPage';
import IndustryPage from './pages/IndustryPage';
import StockPoolPage from './pages/StockPoolPage';
import WatchlistPage from './pages/WatchlistPage';
import { useAppStore } from './store';

const pages: Record<string, React.FC> = {
  macro: MacroPage,
  industry: IndustryPage,
  'stock-pool': StockPoolPage,
  watchlist: WatchlistPage,
};

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage);
  const PageComponent = pages[currentPage] || MacroPage;

  return (
    <div className="h-screen flex bg-gray-950 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-10 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900/50 flex-shrink-0">
          <MarketStatus />
          <div className="text-xs text-gray-600">
            股票研究看板 v2.0
          </div>
        </div>
        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <PageComponent />
        </div>
      </div>
      <RightPanel />
      <KlineModal />
      <SettingsModal />
    </div>
  );
}
