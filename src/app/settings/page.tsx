"use client";

import { useRouter } from "next/navigation";
import { Globe, LogOut, Moon, Sparkles, Sun } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore, type Theme } from "@/store/useAppStore";
import { clearAuth, getAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

const CARD: React.CSSProperties = { background: "#131313", borderColor: "#2a2a2a" };
const MONO: React.CSSProperties = { fontFamily: "JetBrains Mono, monospace", color: "#8a8888" };

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: "rgba(202,253,0,0.1)", color: "#cafd00" }}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ ...MONO, color: "#adaaaa" }}>
        {title}
      </h2>
    </div>
  );
}

export default function SettingsPage() {
  const { t, locale, isRtl } = useTranslation();
  const router = useRouter();
  const { theme, setTheme, setLocale } = useAppStore();
  const auth = getAuth();

  const handleLogout = () => {
    clearAuth();
    toast.success(t.auth.logoutSuccess);
    router.push("/");
  };

  const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: "dark", label: t.settings.dark, icon: Moon },
    { value: "light", label: t.settings.light, icon: Sun },
  ];

  return (
    // No requiredRole — both super admins and gym managers land here.
    <DashboardLayout title={t.settings.title}>
      <div className="max-w-lg mx-auto space-y-5 pb-6">
        {/* ── Account ── */}
        <div className="rounded-2xl border p-6 flex flex-col items-center gap-3 text-center" style={CARD}>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: "#20201f", color: "#cafd00", fontFamily: "Lexend, sans-serif", border: "3px solid #2a2a2a" }}
          >
            {getInitials(auth?.name ?? "?")}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
              {auth?.name ?? "—"}
            </p>
            <p className="text-sm" style={{ color: "#8a8888" }}>{auth?.email ?? "—"}</p>
            <div className="mt-2 px-3 py-1 rounded-full inline-block" style={{ background: "rgba(202,253,0,0.1)" }}>
              <span className="text-xs font-medium" style={{ fontFamily: "JetBrains Mono, monospace", color: "#cafd00" }}>
                {auth?.role === "super_admin" ? t.auth.superAdmin : t.auth.gymManager}
              </span>
            </div>
          </div>
        </div>

        {/* ── Appearance ── */}
        <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
          <SectionHeader icon={Sparkles} title={t.settings.appearance} />

          <div className="space-y-5">
            {/* Theme */}
            <div>
              <p className="text-sm font-medium mb-2.5" style={{ color: "#ffffff" }}>{t.settings.theme}</p>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((opt) => {
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTheme(opt.value)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        background: active ? "rgba(202,253,0,0.08)" : "#0e0e0e",
                        borderColor: active ? "rgba(202,253,0,0.35)" : "#2a2a2a",
                        color: active ? "#cafd00" : "#adaaaa",
                      }}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs mt-2.5 leading-relaxed" style={{ color: "#8a8888" }}>
                {t.settings.themeComingSoon}
              </p>
            </div>

            {/* Language */}
            <div>
              <p className="text-sm font-medium mb-2.5" style={{ color: "#ffffff" }}>{t.settings.language}</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "en", label: "English" },
                    { value: "ar", label: "العربية" },
                  ] as const
                ).map((opt) => {
                  const active = locale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLocale(opt.value)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        background: active ? "rgba(202,253,0,0.08)" : "#0e0e0e",
                        borderColor: active ? "rgba(202,253,0,0.35)" : "#2a2a2a",
                        color: active ? "#cafd00" : "#adaaaa",
                      }}
                    >
                      <Globe className="w-4 h-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs mt-2.5" style={{ color: "#8a8888" }}>
                {t.settings.languageHint}
              </p>
            </div>
          </div>
        </div>

        {/* ── Account actions ── */}
        <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
          <SectionHeader icon={LogOut} title={t.settings.account} />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border transition-colors hover:border-[#ff6e81]"
            style={{ background: "#0e0e0e", borderColor: "#2a2a2a" }}
          >
            <span className="flex items-center gap-3">
              <span
                className="p-2 rounded-xl flex-shrink-0"
                style={{ background: "rgba(255,110,129,0.1)", color: "#ff6e81" }}
              >
                <LogOut className="w-4 h-4" style={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
              </span>
              <span className="text-left">
                <span className="block text-sm font-medium" style={{ color: "#ff6e81" }}>{t.auth.logout}</span>
                <span className="block text-xs mt-0.5" style={{ color: "#8a8888" }}>{t.settings.logoutHint}</span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
