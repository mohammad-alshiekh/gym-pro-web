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

const COLORS = ["#c8f323", "#4ae176", "#adc6ff", "#ffd04a", "#ffb4ab"];

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
    contentStyle: { background: "#171a1e", border: "1px solid #2f3742", borderRadius: "12px", color: "#e9ecf1" },
    labelStyle: { color: "#c3cad6" },
  };

  const planData = analytics?.plans?.planMemberCounts?.map((p) => ({
    name: p.planName,
    value: p.activeMembersCount,
  })) ?? [{ name: "No plans", value: 1 }];

  return (
    <DashboardLayout title={t.dashboard.title} requiredRole="gym_manager">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t.dashboard.todayAttendance}
            value={loading ? "..." : analytics?.attendance?.todayCount ?? 0}
            icon={<Users className="w-6 h-6" />}
            accentColor="#c8f323"
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
            accentColor="#adc6ff"
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
          <div className="rounded-2xl border p-5" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: "#c8f323" }} />
              <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}>PEAK HOUR</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#c8f323" }}>
              {loading ? "..." : analytics?.attendance?.peakHour ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" style={{ color: "#4ae176" }} />
              <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}>PEAK DAY</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#4ae176" }}>
              {loading ? "..." : analytics?.attendance?.peakDay ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4" style={{ color: "#adc6ff" }} />
              <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}>AVG DAILY</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#adc6ff" }}>
              {loading ? "..." : analytics?.attendance?.averageDailyAttendance?.toFixed(1) ?? "—"}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border p-6" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
            <h3 className="text-base font-semibold mb-6" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>
              Weekly Attendance
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockWeeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#23272e" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#8b93a1", fontSize: 12, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8b93a1", fontSize: 12, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {mockWeeklyData.map((_, i) => (
                    <Cell key={i} fill={i === mockWeeklyData.length - 1 ? "#c8f323" : "#2d323a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border p-6" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
            <h3 className="text-base font-semibold mb-4" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>
              {t.dashboard.planDistribution}
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                  {planData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#171a1e", border: "1px solid #2f3742", borderRadius: "12px", color: "#e9ecf1" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {planData.slice(0, 4).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-[120px]" style={{ color: "#c3cad6" }}>{p.name}</span>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#e9ecf1" }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t.dashboard.newSubscriptions, value: analytics?.subscriptions?.newCount ?? 0, color: "#4ae176" },
            { label: t.dashboard.cancelledSubscriptions, value: analytics?.subscriptions?.cancelledCount ?? 0, color: "#ffb4ab" },
            { label: t.dashboard.expiredSubscriptions, value: analytics?.subscriptions?.expiredCount ?? 0, color: "#ffd04a" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border p-5 text-center" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
              <p className="text-2xl font-bold" style={{ fontFamily: "Lexend, sans-serif", color }}>{loading ? "..." : value}</p>
              <p className="text-xs mt-1" style={{ color: "#8b93a1" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
