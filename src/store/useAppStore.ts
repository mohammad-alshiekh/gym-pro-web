"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/i18n";

interface AppState {
  locale: Locale;
  sidebarOpen: boolean;
  setLocale: (locale: Locale) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: "en",
      sidebarOpen: true,
      setLocale: (locale) => set({ locale }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "gymbro-app-store",
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
