"use client";

import { useEffect, useState } from "react";
import { Users, Clock, TrendingUp, Activity, BarChart3, Zap } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import { useTranslation } from "@/hooks/useTranslation";
import { analyticsApi, subscriptionsApi } from "@/lib/api";
import type { GymStatistics } from "@/lib/manager";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#cafd00", "#4ae176", "#7df6ff", "#ffd04a", "#ff6e81"];

const mockWeeklyData = [
  { day: "Sun", count: 35 },
  { day: "Mon", count: 58 },
  { day: "Tue", count: 42 },
  { day: "Wed", count: 71 },
  { day: "Thu", count: 48 },
  { day: "Fri", count: 92 },
  { day: "Sat", count: 110 },
];

export default function ManagerDashboardPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<GymStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await analyticsApi.getStats();
        setAnalytics(res.data);
      } catch {
        // Use mock data if API fails
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const tooltipStyle = {
    contentStyle: { background: "#131313", border: "1px solid #2a2a2a", borderRadius: "12px", color: "#ffffff" },
    labelStyle: { color: "#adaaaa" },
  };

  const planData = analytics?.plans?.planMemberCounts?.map((p) => ({
    name: p.planName,
    value: p.activeMembersCount,
  })) ?? [{ name: t.gyms.noPlans, value: 1 }];

  return (
    <DashboardLayout title={t.dashboard.title} requiredRole="gym_manager">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t.dashboard.todayAttendance}
            value={loading ? "..." : analytics?.attendance?.todayCount ?? 0}
            icon={<Users className="w-6 h-6" />}
            accentColor="#cafd00"
          />
          <StatCard
            title={t.dashboard.weeklyAttendance}
            value={loading ? "..." : analytics?.attendance?.weekCount ?? 0}
            icon={<BarChart3 className="w-6 h-6" />}
            accentColor="#4ae176"
          />
          <StatCard
            title={t.dashboard.monthlyAttendance}
            value={loading ? "..." : analytics?.attendance?.monthCount ?? 0}
            icon={<Activity className="w-6 h-6" />}
            accentColor="#7df6ff"
          />
          <StatCard
            title={t.dashboard.newSubscriptions}
            value={loading ? "..." : analytics?.subscriptions?.newCount ?? 0}
            icon={<TrendingUp className="w-6 h-6" />}
            accentColor="#ffd04a"
          />
        </div>

        {/* Peak Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: "#cafd00" }} />
              <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}>{t.dashboard.peakHourLabel}</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#cafd00" }}>
              {loading ? "..." : analytics?.attendance?.peakHour ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" style={{ color: "#4ae176" }} />
              <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}>{t.dashboard.peakDayLabel}</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#4ae176" }}>
              {loading ? "..." : analytics?.attendance?.peakDay ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4" style={{ color: "#7df6ff" }} />
              <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}>{t.dashboard.avgDailyLabel}</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#7df6ff" }}>
              {loading ? "..." : analytics?.attendance?.averageDailyAttendance?.toFixed(1) ?? "—"}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border p-6" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
            <h3 className="text-base font-semibold mb-6" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
              {t.dashboard.weeklyAttendance}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockWeeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20201f" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#8a8888", fontSize: 12, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8a8888", fontSize: 12, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {mockWeeklyData.map((_, i) => (
                    <Cell key={i} fill={i === mockWeeklyData.length - 1 ? "#cafd00" : "#2a2a28"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border p-6" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
            <h3 className="text-base font-semibold mb-4" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
              {t.dashboard.planDistribution}
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                  {planData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#131313", border: "1px solid #2a2a2a", borderRadius: "12px", color: "#ffffff" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {planData.slice(0, 4).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-[120px]" style={{ color: "#adaaaa" }}>{p.name}</span>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#ffffff" }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.dashboard.newSubscriptions, value: analytics?.subscriptions?.newCount ?? 0, color: "#4ae176" },
            { label: t.dashboard.cancelledSubscriptions, value: analytics?.subscriptions?.cancelledCount ?? 0, color: "#ff6e81" },
            { label: t.dashboard.expiredSubscriptions, value: analytics?.subscriptions?.expiredCount ?? 0, color: "#ffd04a" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border p-5 text-center" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
              <p className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif", color }}>{loading ? "..." : value}</p>
              <p className="text-xs mt-1" style={{ color: "#8a8888" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
