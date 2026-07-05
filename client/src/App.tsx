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
import ResearchPanel from './components/ResearchModal';
import ResearchButton from './components/ResearchButton';
import { useAppStore } from './store';

const pages: Record<string, React.FC> = {
  macro: MacroPage,
  industry: IndustryPage,
  'stock-pool': StockPoolPage,
  watchlist: WatchlistPage,
  research: ResearchPanel,
};

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage);
  const PageComponent = pages[currentPage] || MacroPage;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div className="topbar h-14 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="光明宗" className="w-8 h-8" />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-white brand-title">光明宗</span>
            <span className="text-[10px] text-white/70 tracking-wider">研究看板</span>
          </div>
        </div>
        <MarketStatus />
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
      <ResearchButton />
    </div>
  );
}
