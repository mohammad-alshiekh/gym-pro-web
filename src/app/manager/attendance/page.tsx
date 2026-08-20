"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, LogIn, Search, Timer, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { attendanceApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import { sessionDuration, type AttendanceLog } from "@/lib/manager";
import { formatDateTime, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

const CARD: React.CSSProperties = { background: "#131313", borderColor: "#2a2a2a" };
const INPUT: React.CSSProperties = {
  background: "#0e0e0e",
  borderColor: "#2a2a2a",
  color: "#ffffff",
  outline: "none",
};
const MONO: React.CSSProperties = { fontFamily: "JetBrains Mono, monospace", color: "#8a8888" };

function timeOnly(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
}

/**
 * Today in UTC, matching how the API stores and filters `checkInTime` — the
 * `date` query parameter is compared against the UTC date, so the picker has
 * to speak the same calendar. Deriving this from the browser's local date
 * instead would query the wrong day for part of every day.
 */
function todayForFilter(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AttendancePage() {
  const { t, locale, isRtl } = useTranslation();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(todayForFilter());
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getHistory(dateFilter || undefined);
      setLogs(res.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err, t.attendance.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [dateFilter, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = query
      ? logs.filter((l) => l.traineeName?.toLowerCase().includes(query))
      : logs;
    return [...rows].sort(
      (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
    );
  }, [logs, search]);

  const stats = useMemo(() => {
    const insideNow = logs.filter((l) => !l.checkOutTime).length;
    const unique = new Set(logs.map((l) => l.traineeId)).size;

    const completed = logs.filter((l) => l.checkOutTime);
    const avgMinutes = completed.length
      ? Math.round(
          completed.reduce(
            (sum, l) =>
              sum + (new Date(l.checkOutTime!).getTime() - new Date(l.checkInTime).getTime()),
            0
          ) /
            completed.length /
            60_000
        )
      : 0;

    return { total: logs.length, insideNow, unique, avgMinutes };
  }, [logs]);

  const tiles = [
    { label: t.attendance.checkIns, value: stats.total, icon: LogIn, color: "#cafd00" },
    { label: t.attendance.insideNow, value: stats.insideNow, icon: Users, color: "#4ae176" },
    { label: t.attendance.uniqueMembers, value: stats.unique, icon: Users, color: "#7df6ff" },
    {
      label: t.attendance.avgSession,
      value: stats.avgMinutes ? `${stats.avgMinutes}m` : "—",
      icon: Timer,
      color: "#ffd04a",
    },
  ];

  return (
    <DashboardLayout title={t.attendance.title} requiredRole="gym_manager">
      <div className="space-y-5">
        {/* ── Tiles ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
              style={CARD}
            >
              <div
                className="p-2 rounded-xl flex-shrink-0"
                style={{ background: `${tile.color}15`, color: tile.color }}
              >
                <tile.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-widest truncate" style={MONO}>
                  {tile.label}
                </p>
                <p
                  className="text-sm font-bold truncate mt-0.5"
                  style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                >
                  {tile.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative">
            <Calendar
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#8a8888" }}
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title={t.attendance.filterByDate}
              className="pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
              style={INPUT}
            />
          </div>

          {/* The `date` param is optional — clearing it returns the full history. */}
          <button
            type="button"
            onClick={() => setDateFilter(dateFilter ? "" : todayForFilter())}
            className="px-3 py-2.5 rounded-xl border text-xs whitespace-nowrap transition-colors hover:border-[#cafd00] hover:text-[#cafd00]"
            style={{
              borderColor: dateFilter ? "#2a2a2a" : "#cafd00",
              color: dateFilter ? "#adaaaa" : "#cafd00",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {dateFilter ? t.attendance.allDates : t.attendance.today}
          </button>

          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#8a8888" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.attendance.searchMember}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
              style={INPUT}
            />
          </div>

          {/*
            Only a live claim when the log on screen is today's. On a past date
            these are sessions that were never closed out, not people currently
            in the building.
          */}
          {stats.insideNow > 0 && dateFilter === todayForFilter() && (
            <span className="flex items-center gap-2 text-xs" style={{ color: "#4ae176" }}>
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#4ae176" }}
              />
              {stats.insideNow} {t.attendance.insideNow}
            </span>
          )}
        </div>

        {/* ── Log ── */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border py-20 text-center" style={CARD}>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#20201f" }}
            >
              <Clock className="w-7 h-7" style={{ color: "#cafd00", opacity: 0.5 }} />
            </div>
            <p className="text-sm" style={{ color: "#8a8888" }}>
              {t.attendance.noRecords}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={CARD}>
            <div className="overflow-x-auto">
              {/* `dir` is pinned explicitly (not just inherited from the RTL
                  page shell) so the table's own column order and each
                  cell's text-align always agree — otherwise the browser
                  flips column order for a `dir=rtl` ancestor while a
                  physical `text-left` utility class stays put, and headers
                  drift away from the data underneath them. */}
              <table dir={isRtl ? "rtl" : "ltr"} className="w-full min-w-[640px]">
                <thead>
                  <tr style={{ background: "#1a1a1a" }}>
                    {[
                      t.subscriptions.member,
                      t.attendance.checkIn,
                      t.attendance.checkOut,
                      t.attendance.duration,
                    ].map((head) => (
                      <th
                        key={head}
                        className={`text-[10px] font-medium uppercase tracking-widest px-5 py-3 ${isRtl ? "text-right" : "text-left"}`}
                        style={MONO}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((log) => {
                    const duration = sessionDuration(log);
                    const inside = !log.checkOutTime;
                    const cell = `px-5 py-3.5 ${isRtl ? "text-right" : "text-left"}`;
                    return (
                      <tr
                        key={log.id}
                        className="border-t transition-colors hover:bg-[#1a1a1a]"
                        style={{ borderColor: "#20201f" }}
                      >
                        <td className={cell}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: "#20201f",
                                color: "#cafd00",
                                fontFamily: "Lexend, sans-serif",
                              }}
                            >
                              {getInitials(log.traineeName)}
                            </div>
                            <span
                              className="text-sm font-medium truncate"
                              style={{ color: "#ffffff" }}
                            >
                              {log.traineeName}
                            </span>
                          </div>
                        </td>
                        <td className={cell}>
                          <span
                            className="text-xs"
                            style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}
                            title={formatDateTime(log.checkInTime, locale)}
                          >
                            {timeOnly(log.checkInTime, locale)}
                          </span>
                        </td>
                        <td className={cell}>
                          {inside ? (
                            <span
                              className="flex items-center gap-1.5 text-xs"
                              style={{ color: "#4ae176" }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full animate-pulse"
                                style={{ background: "#4ae176" }}
                              />
                              {t.attendance.stillInside}
                            </span>
                          ) : (
                            <span
                              className="text-xs"
                              style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}
                              title={formatDateTime(log.checkOutTime!, locale)}
                            >
                              {timeOnly(log.checkOutTime!, locale)}
                            </span>
                          )}
                        </td>
                        <td className={cell}>
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: inside
                                ? "rgba(74,225,118,0.1)"
                                : "rgba(202,253,0,0.1)",
                              color: inside ? "#4ae176" : "#cafd00",
                              fontFamily: "JetBrains Mono, monospace",
                            }}
                          >
                            {duration ?? "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
