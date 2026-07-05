import { create } from 'zustand';

export type Page = 'macro' | 'industry' | 'stock-pool' | 'watchlist';

interface AppState {
  // 导航
  currentPage: Page;
  setPage: (page: Page) => void;

  // 主题
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // K线弹窗
  klineModal: { open: boolean; code: string; name: string };
  openKline: (code: string, name: string) => void;
  closeKline: () => void;

  // 设置弹窗
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // 刷新间隔
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;

  // 侧边栏
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'macro',
  setPage: (page) => set({ currentPage: page }),

  theme: 'dark',
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    }),

  klineModal: { open: false, code: '', name: '' },
  openKline: (code, name) => set({ klineModal: { open: true, code, name } }),
  closeKline: () => set({ klineModal: { open: false, code: '', name: '' } }),

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  refreshInterval: 30,
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
