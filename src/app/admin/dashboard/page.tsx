"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  UserCheck,
  Users,
  TrendingUp,
  Dumbbell,
  Activity,
  CalendarDays,
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
} from "@/lib/api";
import { formatCurrency, gymTypeLabel } from "@/lib/utils";
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
    totalExercises: 0,
    totalSchedules: 0,
  });
  // The enum value is stored, not its label — the label is derived at render so
  // switching language relabels the chart instead of keeping the text captured
  // when the data was fetched.
  const [gymTypeData, setGymTypeData] = useState<{ type: number; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [gymsRes, coachesRes, traineesRes, subsRes, exercisesRes, schedulesRes] =
        await Promise.allSettled([
          // One page large enough to bucket gym types locally — the platform
          // has no aggregate endpoint for this.
          gymsApi.getAll({ "pageInfo.pageNumber": 1, "pageInfo.resultsPerPage": 200 }),
          coachesApi.getAll({ PageNumber: 1, ResultsPerPage: 1 }),
          traineesApi.getAll({ "pageInfo.PageNumber": 1, "pageInfo.ResultsPerPage": 1 }),
          subscriptionsApi.getStats(),
          exercisesApi.getAll({ pageNumber: 1, resultsPerPage: 1 }),
          schedulesApi.getAll({ pageNumber: 1, resultsPerPage: 1 }),
        ]);

      const gymsData = gymsRes.status === "fulfilled" ? gymsRes.value.data : null;
      const subStats = subsRes.status === "fulfilled" ? subsRes.value.data : null;

      setStats({
        totalGyms: gymsData?.totalCount ?? 0,
        totalCoaches:
          coachesRes.status === "fulfilled" ? coachesRes.value.data?.totalCount ?? 0 : 0,
        totalTrainees:
          traineesRes.status === "fulfilled" ? traineesRes.value.data?.totalCount ?? 0 : 0,
        activeSubscriptions: subStats?.activeSubscriptionsCount ?? 0,
        totalRevenue: subStats?.totalRevenue ?? 0,
        totalExercises:
          exercisesRes.status === "fulfilled" ? exercisesRes.value.data?.totalCount ?? 0 : 0,
        totalSchedules:
          schedulesRes.status === "fulfilled" ? schedulesRes.value.data?.totalCount ?? 0 : 0,
      });

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

    fetchStats();
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

  // Live platform totals — the API exposes no historical series to trend against.
  const platformData = [
    { name: t.dashboard.totalGyms, value: stats.totalGyms, color: "#cafd00" },
    { name: t.dashboard.totalCoaches, value: stats.totalCoaches, color: "#4ae176" },
    { name: t.dashboard.totalTrainees, value: stats.totalTrainees, color: "#7df6ff" },
    { name: t.dashboard.activeSubscriptions, value: stats.activeSubscriptions, color: "#ffd04a" },
    { name: t.nav.exerciseSchedules, value: stats.totalSchedules, color: "#00b954" },
  ];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title={t.dashboard.totalRevenue}
            value={loading ? "..." : formatCurrency(stats.totalRevenue)}
            icon={<TrendingUp className="w-6 h-6" />}
            accentColor="#00b954"
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
          {/* Platform overview */}
          <div
            className="lg:col-span-2 rounded-2xl border p-6"
            style={{ background: "#131313", borderColor: "#2a2a2a" }}
          >
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
              >
                {t.dashboard.platformOverview}
              </h3>
              <span
                className="text-xs"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
              >
                {t.dashboard.liveTotals}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={platformData} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20201f" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8a8888", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#8a8888", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(202,253,0,0.05)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {platformData.map((entry) => (
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
      </div>
    </DashboardLayout>
  );
}
