import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (val: boolean) => void;
  setMobileSidebarOpen: (val: boolean) => void;
}

export const useAdminStore = create<AdminUIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

      setMobileSidebarOpen: (val) => set({ mobileSidebarOpen: val }),
    }),
    {
      name: 'admin-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
