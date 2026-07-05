import { create } from 'zustand';

export type Page = 'macro' | 'industry' | 'stock-pool' | 'watchlist';

interface AppState {
  currentPage: Page;
  setPage: (page: Page) => void;

  theme: 'dark' | 'light';
  toggleTheme: () => void;

  klineModal: { open: boolean; code: string; name: string };
  openKline: (code: string, name: string) => void;
  closeKline: () => void;

  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  researchOpen: boolean;
  openResearch: () => void;
  closeResearch: () => void;

  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'macro',
  setPage: (page) => set({ currentPage: page }),

  theme: 'light',
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      return { theme: next };
    }),

  klineModal: { open: false, code: '', name: '' },
  openKline: (code, name) => set({ klineModal: { open: true, code, name } }),
  closeKline: () => set({ klineModal: { open: false, code: '', name: '' } }),

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  researchOpen: false,
  openResearch: () => set({ researchOpen: true }),
  closeResearch: () => set({ researchOpen: false }),

  refreshInterval: 30,
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
