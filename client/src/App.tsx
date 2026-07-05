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
import ResearchModal from './components/ResearchModal';
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
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#fafafa', color: '#1a1a1a' }}>
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-4 flex-shrink-0 bg-gradient-red shadow-md" style={{ borderBottom: '2px solid #9b1a2e' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tracking-wider" style={{ fontFamily: '"KaiTi", "STKaiti", serif' }}>光明宗</span>
          <span className="text-xs text-red-100 opacity-80">股票研究看板 v2.4</span>
        </div>
        <div className="flex items-center gap-4">
          <MarketStatus />
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-y-auto">
          <PageComponent />
        </div>
        <RightPanel />
      </div>

      <KlineModal />
      <SettingsModal />
      <ResearchModal />
    </div>
  );
}
