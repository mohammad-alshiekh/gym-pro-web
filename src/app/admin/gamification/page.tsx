"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy, Users, EyeOff, ShieldAlert, Crown } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { adminGamificationApi } from "@/lib/api";
import type { AdminLeaderboard } from "@/lib/gamification";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

/** yyyy-MM-dd for the given date, in local time. */
function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Current Monday–Sunday week, matching the API's own default. */
function currentWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toDateOnly(monday), to: toDateOnly(sunday) };
}

const rankColor = (rank: number) =>
  rank === 1 ? "#ffd04a" : rank === 2 ? "#adaaaa" : rank === 3 ? "#cd8a4a" : "#8a8888";

export default function AdminGamificationPage() {
  const { t, isRtl } = useTranslation();
  const defaultRange = currentWeekRange();

  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [limit, setLimit] = useState(50);
  const [board, setBoard] = useState<AdminLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  const rangeValid = !from || !to || from <= to;

  const fetchBoard = useCallback(async () => {
    if (!rangeValid) return;
    setLoading(true);
    try {
      const res = await adminGamificationApi.getLeaderboard({
        from,
        to,
        limit: Math.min(200, Math.max(1, limit)),
      });
      setBoard(res.data);
    } catch {
      toast.error(t.gamification.toastFailedLoad);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, limit, rangeValid]);

  useEffect(() => {
    if (!rangeValid) {
      toast.error(t.gamification.invalidRange);
      return;
    }
    fetchBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, limit]);

  const resetToThisWeek = () => {
    const range = currentWeekRange();
    setFrom(range.from);
    setTo(range.to);
  };

  const inputStyle = {
    background: "#0e0e0e",
    borderColor: "#2a2a2a",
    color: "#ffffff",
    outline: "none",
    fontFamily: "JetBrains Mono, monospace",
  };

  const labelStyle = {
    fontFamily: "JetBrains Mono, monospace",
    color: "#adaaaa",
    fontSize: "11px",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  };

  return (
    <DashboardLayout title={t.gamification.title} requiredRole="super_admin">
      <div className="space-y-6">
        <p className="text-sm" style={{ color: "#8a8888" }}>{t.gamification.subtitle}</p>

        {/* Internal-only notice — no share/export action exists on this screen. */}
       

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div>
            <label style={labelStyle} className="block mb-1.5">{t.gamification.from}</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border text-sm input-accent"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} className="block mb-1.5">{t.gamification.to}</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border text-sm input-accent"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} className="block mb-1.5">{t.gamification.limit}</label>
            <input
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 1)}
              className="w-24 px-3.5 py-2.5 rounded-xl border text-sm input-accent"
              style={inputStyle}
            />
          </div>
          <button
            onClick={resetToThisWeek}
            className="px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors hover:border-[#cafd00] hover:text-[#cafd00]"
            style={{ borderColor: "#2a2a2a", color: "#adaaaa", fontFamily: "JetBrains Mono, monospace" }}
          >
            {t.gamification.thisWeek}
          </button>
        </div>

        {!rangeValid && (
          <p className="text-sm" style={{ color: "#ff6e81" }}>{t.gamification.invalidRange}</p>
        )}

        {/* Context counts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title={t.gamification.totalParticipants}
            value={loading ? "..." : board?.totalParticipants ?? 0}
            icon={<Users className="w-6 h-6" />}
            accentColor="#7df6ff"
          />
          <StatCard
            title={t.gamification.hiddenParticipants}
            value={loading ? "..." : board?.hiddenParticipants ?? 0}
            icon={<EyeOff className="w-6 h-6" />}
            accentColor="#adaaaa"
          />
        </div>

        {/* Standings */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
          {loading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl shimmer" />
              ))}
            </div>
          ) : !board || board.entries.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "#cafd00" }} />
              <p style={{ color: "#8a8888" }}>{t.gamification.noEntries}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table dir={isRtl ? "rtl" : "ltr"} className="w-full min-w-[560px]">
                <thead>
                  <tr style={{ background: "#1a1a1a" }}>
                    {[t.gamification.rank, t.gamification.trainee, t.gamification.points, t.gamification.visibility].map((head, i) => (
                      <th
                        key={i}
                        className={`text-[10px] font-medium uppercase tracking-widest px-5 py-3.5 ${isRtl ? "text-right" : "text-left"}`}
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Hidden rows are rendered and flagged, never dropped —
                      otherwise ranks stop being continuous. */}
                  {board.entries.map((entry) => {
                    const cell = `px-5 py-3.5 ${isRtl ? "text-right" : "text-left"}`;
                    return (
                      <tr
                        key={entry.traineeId}
                        className="border-t"
                        style={{
                          borderColor: "#20201f",
                          opacity: entry.isVisibleOnLeaderboard ? 1 : 0.6,
                        }}
                      >
                        <td className={cell}>
                          <span
                            className="inline-flex items-center gap-1 text-sm font-bold"
                            style={{ fontFamily: "Space Grotesk, sans-serif", color: rankColor(entry.rank) }}
                          >
                            {entry.rank <= 3 && <Crown className="w-3.5 h-3.5" />}
                            #{entry.rank}
                          </span>
                        </td>
                        <td className={cell}>
                          <div className="flex items-center gap-3 min-w-0">
                            {entry.profilePictureUrl ? (
                              <img src={entry.profilePictureUrl} alt={entry.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                style={{ background: "rgba(202,253,0,0.1)", color: "#cafd00", fontFamily: "Lexend, sans-serif" }}
                              >
                                {getInitials(entry.name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[180px]" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                                {entry.name}
                              </p>
                              <p className="text-xs truncate max-w-[180px]" style={{ color: "#8a8888" }}>{entry.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={cell}>
                          <span className="text-sm font-semibold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#4ae176" }}>
                            {entry.points}
                          </span>
                        </td>
                        <td className={cell}>
                          {entry.isVisibleOnLeaderboard ? (
                            <Badge variant="success">{t.gamification.visible}</Badge>
                          ) : (
                            <Badge variant="neutral">
                              <EyeOff className="w-3 h-3 inline-block me-1 -mt-0.5" />
                              {t.gamification.hidden}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
