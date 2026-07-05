import { useAppStore } from '../store';

export default function ResearchButton() {
  const { currentPage, setPage } = useAppStore();
  const isActive = currentPage === 'research';

  return (
    <button
      onClick={() => setPage('research')}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-3 py-4 rounded-r-xl transition-all"
      style={{
        backgroundColor: isActive ? '#c41e3a' : '#fff',
        color: isActive ? '#fff' : '#c41e3a',
        border: '1px solid #f0d0d4',
        borderLeft: 'none',
        boxShadow: '0 2px 8px rgba(196,30,58,0.15)',
        writingMode: 'vertical-rl',
      }}
      title="研报智能分析"
    >
      <span className="text-sm font-medium tracking-wider">🔍 研报分析</span>
    </button>
  );
}
