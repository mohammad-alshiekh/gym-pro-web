"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/i18n";

export type Theme = "dark" | "light";

interface AppState {
  locale: Locale;
  sidebarOpen: boolean;
  // Saved for the Settings page toggle. No page reads this to re-skin
  // itself yet — every screen still hardcodes dark colors directly — so
  // this is a persisted preference waiting on that follow-up, not a live
  // theme switch.
  theme: Theme;
  setLocale: (locale: Locale) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: "en",
      sidebarOpen: true,
      theme: "dark",
      setLocale: (locale) => set({ locale }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "gymbro-app-store",
      partialize: (state) => ({ locale: state.locale, theme: state.theme }),
    }
  )
);
