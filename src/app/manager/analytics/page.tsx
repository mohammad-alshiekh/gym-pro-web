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
    contentStyle: { background: "#131313", border: "1px solid #2a2a2a", borderRadius: "12px", color: "#ffffff" },
    labelStyle: { color: "#adaaaa" },
  };

  return (
    <DashboardLayout title={t.analytics.title} requiredRole="gym_manager">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t.analytics.today} value={loading ? "..." : analytics?.attendance?.todayCount ?? 0} icon={<Activity className="w-6 h-6" />} accentColor="#cafd00" />
          <StatCard title={t.analytics.thisWeek} value={loading ? "..." : analytics?.attendance?.weekCount ?? 0} icon={<BarChart3 className="w-6 h-6" />} accentColor="#4ae176" />
          <StatCard title={t.analytics.thisMonth} value={loading ? "..." : analytics?.attendance?.monthCount ?? 0} icon={<BarChart3 className="w-6 h-6" />} accentColor="#7df6ff" />
          <StatCard title={t.analytics.dailyAverage} value={loading ? "..." : analytics?.attendance?.averageDailyAttendance?.toFixed(1) ?? 0} icon={<TrendingUp className="w-6 h-6" />} accentColor="#ffd04a" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Distribution */}
          <div className="rounded-2xl border p-6" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
            <h3 className="text-base font-semibold mb-6" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>{t.analytics.hourlyTraffic}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockHourlyData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20201f" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "#8a8888", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8a8888", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                  {mockHourlyData.map((_, i) => (
                    <Cell key={i} fill={i === 6 ? "#cafd00" : "#2a2a28"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Radar */}
          <div className="rounded-2xl border p-6" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
            <h3 className="text-base font-semibold mb-6" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>{t.analytics.weeklyPattern}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={mockRadarData}>
                <PolarGrid stroke="#20201f" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#8a8888", fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Radar name="Visits" dataKey="A" stroke="#cafd00" fill="#cafd00" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Membership */}
        {analytics?.plans?.planMemberCounts && analytics.plans.planMemberCounts.length > 0 && (
          <div className="rounded-2xl border p-6" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
            <h3 className="text-base font-semibold mb-6" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>{t.analytics.membersByPlan}</h3>
            <div className="space-y-3">
              {analytics.plans.planMemberCounts.map((p, i) => {
                const maxCount = Math.max(...analytics.plans!.planMemberCounts!.map(x => x.activeMembersCount));
                const pct = maxCount > 0 ? (p.activeMembersCount / maxCount) * 100 : 0;
                const colors = ["#cafd00", "#4ae176", "#7df6ff", "#ffd04a"];
                return (
                  <div key={p.planId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: "#ffffff" }}>{p.planName}</span>
                      <span className="text-sm font-semibold" style={{ fontFamily: "JetBrains Mono, monospace", color: colors[i % colors.length] }}>
                        {p.activeMembersCount} {t.analytics.membersCount.replace("{count}", String(p.activeMembersCount))}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#20201f" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subscription Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.analytics.newThisMonth, value: analytics?.subscriptions?.newCount ?? 0, color: "#4ae176" },
            { label: t.analytics.cancelled, value: analytics?.subscriptions?.cancelledCount ?? 0, color: "#ff6e81" },
            { label: t.analytics.expired, value: analytics?.subscriptions?.expiredCount ?? 0, color: "#ffd04a" },
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
