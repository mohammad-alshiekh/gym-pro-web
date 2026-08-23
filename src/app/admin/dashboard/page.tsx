"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  UserCheck,
  Users,
  Wallet,
  Banknote,
  Dumbbell,
  Activity,
  CalendarDays,
  Trophy,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  gymsApi,
  coachesApi,
  traineesApi,
  subscriptionsApi,
  exercisesApi,
  schedulesApi,
  financeApi,
  adminGamificationApi,
} from "@/lib/api";
import { FinanceStream, type FinanceStreamBreakdown } from "@/lib/finance";
import type { AdminLeaderboardEntry } from "@/lib/gamification";
import { formatCurrency, getInitials, gymTypeLabel } from "@/lib/utils";
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

const COLORS = ["#cafd00", "#4ae176", "#7df6ff", "#ff6e81", "#ffd04a", "#00b954"];

interface GymListItem {
  id: string;
  gymType: number;
}

export default function AdminDashboardPage() {
  const { t, locale } = useTranslation();
  const [stats, setStats] = useState({
    totalGyms: 0,
    totalCoaches: 0,
    totalTrainees: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    manualPaymentsAmount: 0,
    manualPaymentsCount: 0,
    totalExercises: 0,
    totalSchedules: 0,
  });
  // The enum value is stored, not its label — the label is derived at render so
  // switching language relabels the chart instead of keeping the text captured
  // when the data was fetched.
  const [gymTypeData, setGymTypeData] = useState<{ type: number; value: number }[]>([]);
  const [streamData, setStreamData] = useState<FinanceStreamBreakdown[]>([]);
  const [topPerformers, setTopPerformers] = useState<AdminLeaderboardEntry[]>([]);
  const [leaderboardParticipants, setLeaderboardParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        gymsRes,
        coachesRes,
        traineesRes,
        subsRes,
        exercisesRes,
        schedulesRes,
        financeRes,
      ] = await Promise.allSettled([
        // One page large enough to bucket gym types locally — the platform
        // has no aggregate endpoint for this.
        gymsApi.getAll({ "pageInfo.pageNumber": 1, "pageInfo.resultsPerPage": 200 }),
        coachesApi.getAll({ PageNumber: 1, ResultsPerPage: 1 }),
        traineesApi.getAll({ "pageInfo.PageNumber": 1, "pageInfo.ResultsPerPage": 1 }),
        subscriptionsApi.getStats(),
        exercisesApi.getAll({ pageNumber: 1, resultsPerPage: 1 }),
        schedulesApi.getAll({ pageNumber: 1, resultsPerPage: 1 }),
        // Defaults to the current calendar month — same window the Finance
        // page opens on, so the two numbers agree at a glance.
        financeApi.getOverview(),
      ]);

      const gymsData = gymsRes.status === "fulfilled" ? gymsRes.value.data : null;
      const subStats = subsRes.status === "fulfilled" ? subsRes.value.data : null;
      const finance = financeRes.status === "fulfilled" ? financeRes.value.data : null;

      setStats({
        totalGyms: gymsData?.totalCount ?? 0,
        totalCoaches:
          coachesRes.status === "fulfilled" ? coachesRes.value.data?.totalCount ?? 0 : 0,
        totalTrainees:
          traineesRes.status === "fulfilled" ? traineesRes.value.data?.totalCount ?? 0 : 0,
        activeSubscriptions: subStats?.activeSubscriptionsCount ?? 0,
        // Stripe-settled only, from the finance overview — replaces the old
        // subscriptions-stats revenue figure, which didn't account for AI
        // plans or manual payments and disagreed with the Finance page.
        totalRevenue: finance?.totalRevenue ?? 0,
        manualPaymentsAmount: finance?.manualPayments.amount ?? 0,
        manualPaymentsCount: finance?.manualPayments.count ?? 0,
        totalExercises:
          exercisesRes.status === "fulfilled" ? exercisesRes.value.data?.totalCount ?? 0 : 0,
        totalSchedules:
          schedulesRes.status === "fulfilled" ? schedulesRes.value.data?.totalCount ?? 0 : 0,
      });
      setStreamData(finance?.byStream ?? []);

      // Real distribution, counted from the returned gyms.
      const gyms: GymListItem[] = gymsData?.items ?? [];
      const byType = new Map<number, number>();
      for (const gym of gyms) byType.set(gym.gymType, (byType.get(gym.gymType) ?? 0) + 1);
      setGymTypeData(
        [...byType.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([type, value]) => ({ type, value }))
      );

      setLoading(false);
    };

    const fetchLeaderboard = async () => {
      try {
        // No date params → server default of the current Monday–Sunday week.
        const res = await adminGamificationApi.getLeaderboard({ limit: 5 });
        setTopPerformers(res.data?.entries ?? []);
        setLeaderboardParticipants(res.data?.totalParticipants ?? 0);
      } catch {
        setTopPerformers([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchStats();
    fetchLeaderboard();
  }, []);

  const tooltipStyle = {
    contentStyle: {
      background: "#131313",
      border: "1px solid #2a2a2a",
      borderRadius: "12px",
      color: "#ffffff",
      fontFamily: "Manrope, sans-serif",
    },
    labelStyle: { color: "#adaaaa" },
  };

  const streamLabel = (stream: number) =>
    stream === FinanceStream.AiPlan
      ? t.finance.streamAiPlan
      : stream === FinanceStream.GymSubscription
      ? t.finance.streamGymSubscription
      : t.finance.streamCoachSubscription;

  // Always the fixed three streams, even at zero — mirrors the Finance page.
  const revenueByStream = [
    { key: FinanceStream.AiPlan, color: "#7df6ff" },
    { key: FinanceStream.GymSubscription, color: "#cafd00" },
    { key: FinanceStream.CoachSubscription, color: "#4ae176" },
  ].map(({ key, color }) => ({
    name: streamLabel(key),
    value: streamData.find((s) => s.stream === key)?.revenue ?? 0,
    color,
  }));

  return (
    <DashboardLayout title={t.dashboard.title} requiredRole="super_admin">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t.dashboard.totalGyms}
            value={loading ? "..." : stats.totalGyms}
            icon={<Building2 className="w-6 h-6" />}
            accentColor="#cafd00"
          />
          <StatCard
            title={t.dashboard.totalCoaches}
            value={loading ? "..." : stats.totalCoaches}
            icon={<UserCheck className="w-6 h-6" />}
            accentColor="#4ae176"
          />
          <StatCard
            title={t.dashboard.totalTrainees}
            value={loading ? "..." : stats.totalTrainees}
            icon={<Users className="w-6 h-6" />}
            accentColor="#7df6ff"
          />
          <StatCard
            title={t.dashboard.activeSubscriptions}
            value={loading ? "..." : stats.activeSubscriptions}
            icon={<Activity className="w-6 h-6" />}
            accentColor="#ffd04a"
          />
        </div>

        {/* Revenue + library totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t.dashboard.totalRevenue}
            subtitle={`${t.finance.totalRevenueHint} · ${t.dashboard.thisMonth}`}
            value={loading ? "..." : formatCurrency(stats.totalRevenue)}
            icon={<Wallet className="w-6 h-6" />}
            accentColor="#00b954"
          />
          <StatCard
            title={t.finance.manualPayments}
            subtitle={`${stats.manualPaymentsCount} · ${t.dashboard.thisMonth}`}
            value={loading ? "..." : formatCurrency(stats.manualPaymentsAmount)}
            icon={<Banknote className="w-6 h-6" />}
            accentColor="#ffd04a"
          />
          <StatCard
            title={t.nav.exercises}
            value={loading ? "..." : stats.totalExercises}
            icon={<Dumbbell className="w-6 h-6" />}
            accentColor="#cafd00"
          />
          <StatCard
            title={t.nav.exerciseSchedules}
            value={loading ? "..." : stats.totalSchedules}
            icon={<CalendarDays className="w-6 h-6" />}
            accentColor="#7df6ff"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by stream — real finance data, not a re-plot of the
              stat cards above. */}
          <div
            className="lg:col-span-2 rounded-2xl border p-6"
            style={{ background: "#131313", borderColor: "#2a2a2a" }}
          >
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
              >
                {t.dashboard.revenueByStream}
              </h3>
              <Link
                href="/admin/finance"
                className="text-xs inline-flex items-center gap-1 transition-colors hover:text-[#cafd00]"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
              >
                {t.dashboard.viewFinance}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueByStream} barSize={64}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20201f" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8a8888", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fill: "#8a8888", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  {...tooltipStyle}
                  cursor={{ fill: "rgba(202,253,0,0.05)" }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {revenueByStream.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gym Type Pie — counted from the live gym list */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#131313", borderColor: "#2a2a2a" }}
          >
            <h3
              className="text-base font-semibold mb-6"
              style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
            >
              {t.dashboard.gymTypeDistribution}
            </h3>
            {gymTypeData.length === 0 ? (
              <p className="text-sm py-12 text-center" style={{ color: "#8a8888" }}>
                {loading ? t.common.loading : t.common.noData}
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={gymTypeData.map((d) => ({
                        name: gymTypeLabel(d.type, locale),
                        value: d.value,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {gymTypeData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {gymTypeData.map((entry, index) => (
                    <div key={entry.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm" style={{ color: "#adaaaa" }}>
                          {gymTypeLabel(entry.type, locale)}
                        </span>
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#ffffff" }}
                      >
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top performers — current-week leaderboard preview */}
        <div className="rounded-2xl border p-6" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <h3 className="text-base font-semibold flex items-center gap-2" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
              <Trophy className="w-4 h-4" style={{ color: "#ffd04a" }} />
              {t.dashboard.topPerformers}
              <span className="text-xs font-normal" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}>
                · {t.dashboard.thisWeek}
              </span>
            </h3>
            <Link
              href="/admin/gamification"
              className="text-xs inline-flex items-center gap-1 transition-colors hover:text-[#cafd00]"
              style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
            >
              {t.dashboard.viewFullLeaderboard}
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {leaderboardLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl shimmer" />
              ))}
            </div>
          ) : topPerformers.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "#8a8888" }}>
              {t.dashboard.noScoresYet}
            </p>
          ) : (
            <div className="space-y-1">
              {topPerformers.map((entry) => (
                <div key={entry.traineeId} className="flex items-center gap-3 py-2">
                  <span
                    className="w-6 text-sm font-bold flex items-center gap-0.5 flex-shrink-0"
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      color: entry.rank === 1 ? "#ffd04a" : entry.rank === 2 ? "#adaaaa" : entry.rank === 3 ? "#cd8a4a" : "#8a8888",
                    }}
                  >
                    {entry.rank === 1 && <Crown className="w-3.5 h-3.5" />}
                    {entry.rank}
                  </span>
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
                  <span className="text-sm flex-1 truncate" style={{ color: "#ffffff" }}>{entry.name}</span>
                  <span className="text-sm font-semibold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#4ae176" }}>
                    {entry.points}
                  </span>
                </div>
              ))}
              <p className="text-xs pt-2" style={{ color: "#8a8888" }}>
                {leaderboardParticipants} {t.gamification.totalParticipants.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
