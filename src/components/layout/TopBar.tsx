"use client";

import { Menu, Bell, Globe } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import { getAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { toggleSidebar, setLocale, locale } = useAppStore();
  const { t } = useTranslation();
  const auth = getAuth();
  const userName = auth?.name ?? "User";

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b"
      style={{
        background: "rgba(14,14,14,0.9)",
        backdropFilter: "blur(12px)",
        borderColor: "#2a2a2a",
        minHeight: "72px",
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl transition-colors hover:bg-[#20201f] flex-shrink-0"
          style={{ color: "#adaaaa" }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1
          className="text-base sm:text-lg font-semibold truncate min-w-0"
          style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Language Toggle */}
        <button
          onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:border-[#cafd00]"
          style={{
            borderColor: "#2a2a2a",
            color: "#adaaaa",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          <Globe className="w-3.5 h-3.5" />
          {locale === "en" ? "AR" : "EN"}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl transition-colors hover:bg-[#20201f] flex-shrink-0"
          style={{ color: "#adaaaa" }}
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#cafd00" }}
          />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: "#20201f",
              border: "2px solid #2a2a2a",
              color: "#cafd00",
              fontFamily: "Lexend, sans-serif",
            }}
          >
            {getInitials(userName)}
          </div>
          <div className="hidden sm:block">
            <p
              className="text-sm font-medium leading-tight"
              style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
            >
              {userName}
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
            >
              {auth?.role === "super_admin" ? t.auth.superAdmin : t.auth.gymManager}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
