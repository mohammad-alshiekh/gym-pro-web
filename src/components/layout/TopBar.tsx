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
  const { isRtl } = useTranslation();
  const auth = getAuth();
  const userName = auth?.name ?? "User";

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
      style={{
        background: "rgba(15,16,19,0.9)",
        backdropFilter: "blur(12px)",
        borderColor: "#2f3742",
        minHeight: "72px",
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl transition-colors hover:bg-[#23272e]"
          style={{ color: "#c3cad6" }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <button
          onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:border-[#c8f323]"
          style={{
            borderColor: "#2f3742",
            color: "#c3cad6",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          <Globe className="w-3.5 h-3.5" />
          {locale === "en" ? "AR" : "EN"}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl transition-colors hover:bg-[#23272e]"
          style={{ color: "#c3cad6" }}
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#c8f323" }}
          />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: "#23272e",
              border: "2px solid #2f3742",
              color: "#c8f323",
              fontFamily: "Lexend, sans-serif",
            }}
          >
            {getInitials(userName)}
          </div>
          <div className="hidden sm:block">
            <p
              className="text-sm font-medium leading-tight"
              style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
            >
              {userName}
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
            >
              {auth?.role === "super_admin" ? "Super Admin" : "Gym Manager"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
