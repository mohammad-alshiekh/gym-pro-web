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
import { gymTypeLabel } from "@/lib/utils";
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

const COLORS = ["#c8f323", "#4ae176", "#adc6ff", "#ffb4ab", "#ffd04a", "#00b954"];

interface GymListItem {
  id: string;
  gymType: number;
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalGyms: 0,
    totalCoaches: 0,
    totalTrainees: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalExercises: 0,
    totalSchedules: 0,
  });
  const [gymTypeData, setGymTypeData] = useState<{ name: string; value: number }[]>([]);
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
          .map(([type, value]) => ({ name: gymTypeLabel(type), value }))
      );

      setLoading(false);
    };

    fetchStats();
  }, []);

  const tooltipStyle = {
    contentStyle: {
      background: "#171a1e",
      border: "1px solid #2f3742",
      borderRadius: "12px",
      color: "#e9ecf1",
      fontFamily: "Inter, sans-serif",
    },
    labelStyle: { color: "#c3cad6" },
  };

  // Live platform totals — the API exposes no historical series to trend against.
  const platformData = [
    { name: t.dashboard.totalGyms, value: stats.totalGyms, color: "#c8f323" },
    { name: t.dashboard.totalCoaches, value: stats.totalCoaches, color: "#4ae176" },
    { name: t.dashboard.totalTrainees, value: stats.totalTrainees, color: "#adc6ff" },
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
            accentColor="#c8f323"
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
            accentColor="#adc6ff"
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
            value={loading ? "..." : `EGP ${stats.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6" />}
            accentColor="#00b954"
          />
          <StatCard
            title={t.nav.exercises}
            value={loading ? "..." : stats.totalExercises}
            icon={<Dumbbell className="w-6 h-6" />}
            accentColor="#c8f323"
          />
          <StatCard
            title={t.nav.exerciseSchedules}
            value={loading ? "..." : stats.totalSchedules}
            icon={<CalendarDays className="w-6 h-6" />}
            accentColor="#adc6ff"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform overview */}
          <div
            className="lg:col-span-2 rounded-2xl border p-6"
            style={{ background: "#171a1e", borderColor: "#2f3742" }}
          >
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
              >
                {t.dashboard.platformOverview}
              </h3>
              <span
                className="text-xs"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
              >
                {t.dashboard.liveTotals}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={platformData} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="#23272e" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8b93a1", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#8b93a1", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(200,243,35,0.05)" }} />
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
            style={{ background: "#171a1e", borderColor: "#2f3742" }}
          >
            <h3
              className="text-base font-semibold mb-6"
              style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
            >
              {t.dashboard.gymTypeDistribution}
            </h3>
            {gymTypeData.length === 0 ? (
              <p className="text-sm py-12 text-center" style={{ color: "#8b93a1" }}>
                {loading ? t.common.loading : t.common.noData}
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={gymTypeData}
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
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm" style={{ color: "#c3cad6" }}>
                          {entry.name}
                        </span>
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#e9ecf1" }}
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
