"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Activity } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import { useTranslation } from "@/hooks/useTranslation";
import { analyticsApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import type { GymStatistics } from "@/lib/manager";
import toast from "react-hot-toast";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const mockHourlyData = [
  { hour: "6am", visits: 12 },
  { hour: "8am", visits: 28 },
  { hour: "10am", visits: 18 },
  { hour: "12pm", visits: 22 },
  { hour: "2pm", visits: 16 },
  { hour: "4pm", visits: 35 },
  { hour: "6pm", visits: 52 },
  { hour: "8pm", visits: 40 },
  { hour: "10pm", visits: 15 },
];

const mockRadarData = [
  { subject: "Mon", A: 65 },
  { subject: "Tue", A: 42 },
  { subject: "Wed", A: 78 },
  { subject: "Thu", A: 55 },
  { subject: "Fri", A: 88 },
  { subject: "Sat", A: 110 },
  { subject: "Sun", A: 35 },
];

export default function ManagerAnalyticsPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<GymStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await analyticsApi.getStats();
        setAnalytics(res.data);
      } catch (err) {
        toast.error(apiErrorMessage(err, t.analytics.loadFailed));
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

  return (
    <DashboardLayout title={t.analytics.title} requiredRole="gym_manager">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today" value={loading ? "..." : analytics?.attendance?.todayCount ?? 0} icon={<Activity className="w-6 h-6" />} accentColor="#c8f323" />
          <StatCard title="This Week" value={loading ? "..." : analytics?.attendance?.weekCount ?? 0} icon={<BarChart3 className="w-6 h-6" />} accentColor="#4ae176" />
          <StatCard title="This Month" value={loading ? "..." : analytics?.attendance?.monthCount ?? 0} icon={<BarChart3 className="w-6 h-6" />} accentColor="#adc6ff" />
          <StatCard title="Daily Average" value={loading ? "..." : analytics?.attendance?.averageDailyAttendance?.toFixed(1) ?? 0} icon={<TrendingUp className="w-6 h-6" />} accentColor="#ffd04a" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Distribution */}
          <div className="rounded-2xl border p-6" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
            <h3 className="text-base font-semibold mb-6" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>Hourly Traffic Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockHourlyData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#23272e" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "#8b93a1", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8b93a1", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                  {mockHourlyData.map((_, i) => (
                    <Cell key={i} fill={i === 6 ? "#c8f323" : "#2d323a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Radar */}
          <div className="rounded-2xl border p-6" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
            <h3 className="text-base font-semibold mb-6" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>Weekly Pattern</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={mockRadarData}>
                <PolarGrid stroke="#23272e" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#8b93a1", fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Radar name="Visits" dataKey="A" stroke="#c8f323" fill="#c8f323" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Membership */}
        {analytics?.plans?.planMemberCounts && analytics.plans.planMemberCounts.length > 0 && (
          <div className="rounded-2xl border p-6" style={{ background: "#171a1e", borderColor: "#2f3742" }}>
            <h3 className="text-base font-semibold mb-6" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>Members by Plan</h3>
            <div className="space-y-3">
              {analytics.plans.planMemberCounts.map((p, i) => {
                const maxCount = Math.max(...analytics.plans!.planMemberCounts!.map(x => x.activeMembersCount));
                const pct = maxCount > 0 ? (p.activeMembersCount / maxCount) * 100 : 0;
                const colors = ["#c8f323", "#4ae176", "#adc6ff", "#ffd04a"];
                return (
                  <div key={p.planId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: "#e9ecf1" }}>{p.planName}</span>
                      <span className="text-sm font-semibold" style={{ fontFamily: "JetBrains Mono, monospace", color: colors[i % colors.length] }}>
                        {p.activeMembersCount} members
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#23272e" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subscription Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "New This Month", value: analytics?.subscriptions?.newCount ?? 0, color: "#4ae176" },
            { label: "Cancelled", value: analytics?.subscriptions?.cancelledCount ?? 0, color: "#ffb4ab" },
            { label: "Expired", value: analytics?.subscriptions?.expiredCount ?? 0, color: "#ffd04a" },
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
