"use client";

import { useEffect, useState } from "react";
import { CreditCard, TrendingUp, Activity } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import { useTranslation } from "@/hooks/useTranslation";
import { subscriptionsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface SubscriptionStats {
  activeSubscriptionsCount: number;
  totalSubscriptionsCount: number;
  totalRevenue: number;
}

export default function TransactionsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await subscriptionsApi.getStats();
        setStats(res.data);
      } catch {
        toast.error("Failed to load transaction stats");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <DashboardLayout title={t.nav.transactions} requiredRole="super_admin">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={t.dashboard.activeSubscriptions}
            value={loading ? "..." : stats?.activeSubscriptionsCount ?? 0}
            icon={<Activity className="w-6 h-6" />}
            accentColor="#4ae176"
          />
          <StatCard
            title={t.subscriptions.totalSubscriptions}
            value={loading ? "..." : stats?.totalSubscriptionsCount ?? 0}
            icon={<CreditCard className="w-6 h-6" />}
            accentColor="#cafd00"
          />
          <StatCard
            title={t.dashboard.totalRevenue}
            value={loading ? "..." : formatCurrency(stats?.totalRevenue ?? 0)}
            icon={<TrendingUp className="w-6 h-6" />}
            accentColor="#7df6ff"
          />
        </div>

        <div
          className="rounded-2xl border p-8 flex flex-col items-center justify-center gap-4 text-center"
          style={{ background: "#131313", borderColor: "#2a2a2a", minHeight: 300 }}
        >
          <CreditCard className="w-16 h-16 opacity-20" style={{ color: "#cafd00" }} />
          <div>
            <p className="font-semibold text-lg" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
              {t.subscriptions.transactionLedger}
            </p>
            <p className="text-sm mt-2" style={{ color: "#8a8888" }}>
              {t.subscriptions.transactionDescription}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
            <div className="p-4 rounded-xl text-center" style={{ background: "#20201f" }}>
              <p className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#4ae176" }}>
                {loading ? "..." : stats?.activeSubscriptionsCount ?? 0}
              </p>
              <p className="text-xs mt-1" style={{ color: "#8a8888" }}>{t.subscriptions.activeNow}</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: "#20201f" }}>
              <p className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#cafd00" }}>
                {loading ? "..." : `${Math.round(((stats?.activeSubscriptionsCount ?? 0) / (stats?.totalSubscriptionsCount || 1)) * 100)}%`}
              </p>
              <p className="text-xs mt-1" style={{ color: "#8a8888" }}>{t.subscriptions.activeRate}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
