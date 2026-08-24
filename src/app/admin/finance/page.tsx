"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  Banknote,
  Receipt,
  AlertTriangle,
  Users,
  UserCheck,
  Sparkles,
  CreditCard,
  Building2,
  CalendarRange,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { financeApi } from "@/lib/api";
import { FinanceStream, type FinanceOverview, type FinanceTransaction } from "@/lib/finance";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

const CARD: React.CSSProperties = { background: "#131313", borderColor: "#2a2a2a" };
const MONO = "JetBrains Mono, monospace";

/** yyyy-MM-dd for the given date, in local time. */
function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toDateOnly(first), to: toDateOnly(last) };
}

const perPage = 15;

export default function AdminFinancePage() {
  const { t, locale, isRtl } = useTranslation();
  const defaultRange = currentMonthRange();

  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);

  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [txLoading, setTxLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stream, setStream] = useState<string>("");
  const [includeManual, setIncludeManual] = useState(true);

  const rangeValid = !from || !to || from <= to;

  const fetchOverview = useCallback(async () => {
    if (!rangeValid) return;
    setOverviewLoading(true);
    try {
      const res = await financeApi.getOverview({ from, to });
      setOverview(res.data);
    } catch {
      toast.error(t.finance.toastFailedLoadOverview);
    } finally {
      setOverviewLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, rangeValid]);

  const fetchTransactions = useCallback(async () => {
    if (!rangeValid) return;
    setTxLoading(true);
    try {
      const res = await financeApi.getTransactions({
        from,
        to,
        stream: stream === "" ? undefined : Number(stream),
        includeManual,
        pageNumber: page,
        resultsPerPage: perPage,
      });
      setTransactions(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error(t.finance.toastFailedLoadTransactions);
    } finally {
      setTxLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, stream, includeManual, page, rangeValid]);

  useEffect(() => {
    if (!rangeValid) {
      toast.error(t.finance.invalidRange);
      return;
    }
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  useEffect(() => {
    if (!rangeValid) return;
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, stream, includeManual, page]);

  const resetToThisMonth = () => {
    const range = currentMonthRange();
    setFrom(range.from);
    setTo(range.to);
    setPage(1);
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

  // Fixed set of three stream tiles, always rendered even at zero — order
  // matches FinanceStream, not whatever order the API happens to send.
  const streamOrder: { key: number; label: string; color: string; icon: React.ReactNode }[] = [
    { key: FinanceStream.AiPlan, label: t.finance.streamAiPlan, color: "#7df6ff", icon: <Sparkles className="w-6 h-6" /> },
    { key: FinanceStream.GymSubscription, label: t.finance.streamGymSubscription, color: "#cafd00", icon: <Building2 className="w-6 h-6" /> },
    { key: FinanceStream.CoachSubscription, label: t.finance.streamCoachSubscription, color: "#4ae176", icon: <UserCheck className="w-6 h-6" /> },
  ];

  const streamBreakdown = (key: number) =>
    overview?.byStream.find((s) => s.stream === key) ?? { transactionCount: 0, revenue: 0 };

  const streamBadgeVariant = (s: number): "info" | "default" | "success" =>
    s === FinanceStream.AiPlan ? "info" : s === FinanceStream.GymSubscription ? "default" : "success";

  const streamLabel = (s: number) =>
    s === FinanceStream.AiPlan
      ? t.finance.streamAiPlan
      : s === FinanceStream.GymSubscription
      ? t.finance.streamGymSubscription
      : t.finance.streamCoachSubscription;

  return (
    <DashboardLayout title={t.finance.title} requiredRole="super_admin">
      <div className="space-y-6">
        {/* Date range */}
        <div
          className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end gap-4"
          style={CARD}
        >
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "rgba(202,253,0,0.1)", color: "#cafd00" }}>
            <CalendarRange className="w-5 h-5" />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 sm:flex sm:items-end sm:gap-4">
            <div className="min-w-0">
              <label style={labelStyle} className="block mb-1.5">{t.finance.from}</label>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
            <div className="min-w-0">
              <label style={labelStyle} className="block mb-1.5">{t.finance.to}</label>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1); }}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
          </div>
          <Button variant="secondary" size="md" onClick={resetToThisMonth}>
            {t.finance.thisMonth}
          </Button>
        </div>

        {!rangeValid && (
          <p className="text-sm" style={{ color: "#ff6e81" }}>{t.finance.invalidRange}</p>
        )}

        {/* Revenue + manual payments — every card carries a one-line
            subtitle so the row stays a uniform height regardless of content
            (a wrapped subtitle on just one card was the previous bug). */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={t.finance.totalRevenue}
            subtitle={t.finance.totalRevenueHint}
            value={overviewLoading ? "..." : formatCurrency(overview?.totalRevenue ?? 0)}
            icon={<Wallet className="w-6 h-6" />}
            accentColor="#00b954"
          />
          <StatCard
            title={t.finance.transactionCount}
            subtitle={t.finance.inSelectedRange}
            value={overviewLoading ? "..." : overview?.transactionCount ?? 0}
            icon={<Receipt className="w-6 h-6" />}
            accentColor="#7df6ff"
          />
          <StatCard
            title={t.finance.manualPayments}
            subtitle={overviewLoading ? t.finance.manualPaymentsSub : `${t.finance.manualPaymentsSub} · ${overview?.manualPayments.count ?? 0}${t.finance.paymentsSuffix}`}
            value={overviewLoading ? "..." : formatCurrency(overview?.manualPayments.amount ?? 0)}
            icon={<Banknote className="w-6 h-6" />}
            accentColor="#ffd04a"
          />
        </div>

      
        {/* Revenue by stream — one card with proportional bars instead of
            three disconnected boxes, so the split against total revenue
            reads at a glance. */}
        <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
          <h3 className="text-base font-semibold mb-5" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
            {t.dashboard.revenueByStream}
          </h3>
          <div className="space-y-5">
            {streamOrder.map((s) => {
              const data = streamBreakdown(s.key);
              const total = overview?.totalRevenue ?? 0;
              const pct = total > 0 ? Math.min(100, (data.revenue / total) * 100) : 0;
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${s.color}15`, color: s.color }}
                      >
                        {s.icon}
                      </div>
                      <span className="text-sm font-medium truncate" style={{ color: "#ffffff" }}>
                        {s.label}
                      </span>
                      <span className="text-xs flex-shrink-0" style={{ fontFamily: MONO, color: "#8a8888" }}>
                        {overviewLoading ? "" : `${data.transactionCount} ${t.finance.transactionCount.toLowerCase()}`}
                      </span>
                    </div>
                    <span className="text-sm font-semibold flex-shrink-0" style={{ fontFamily: MONO, color: "#ffffff" }}>
                      {overviewLoading ? "..." : formatCurrency(data.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#0e0e0e" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscriber snapshot */}
        <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
          <h3 className="text-base font-semibold mb-5" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
            {t.finance.subscriberSnapshot}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t.finance.activeGymMembers, value: overview?.subscribers.activeGymMembers, color: "#cafd00", icon: <Users className="w-5 h-5" /> },
              { label: t.finance.activeCoachTrainees, value: overview?.subscribers.activeCoachTrainees, color: "#7df6ff", icon: <UserCheck className="w-5 h-5" /> },
              { label: t.finance.activeCoachTraineesPaid, value: overview?.subscribers.activeCoachTraineesPaid, color: "#4ae176", icon: <CreditCard className="w-5 h-5" /> },
              { label: t.finance.aiPlanBuyersInPeriod, value: overview?.subscribers.aiPlanBuyersInPeriod, color: "#ffd04a", icon: <Sparkles className="w-5 h-5" /> },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#0e0e0e" }}>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#ffffff" }}>
                    {overviewLoading ? "..." : item.value ?? 0}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#8a8888" }}>{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
          <div className="p-5 flex flex-col sm:flex-row sm:items-end gap-3 border-b" style={{ borderColor: "#2a2a2a" }}>
            <h3 className="text-base font-semibold flex-1" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
              {t.finance.transactionsTitle}
            </h3>
            <div className="w-full sm:w-56">
              <Select
                value={stream}
                onChange={(e) => { setStream(e.target.value); setPage(1); }}
                placeholder={t.finance.allStreams}
                options={[
                  { value: FinanceStream.AiPlan, label: t.finance.streamAiPlan },
                  { value: FinanceStream.GymSubscription, label: t.finance.streamGymSubscription },
                  { value: FinanceStream.CoachSubscription, label: t.finance.streamCoachSubscription },
                ]}
              />
            </div>
            <button
              type="button"
              onClick={() => { setIncludeManual((v) => !v); setPage(1); }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium"
              style={{ borderColor: "#2a2a2a", color: "#adaaaa", fontFamily: "JetBrains Mono, monospace" }}
            >
              <span
                className="w-9 h-5 rounded-full transition-all flex-shrink-0 relative"
                style={{ background: includeManual ? "#cafd00" : "#2a2a28" }}
              >
                <span
                  className="absolute top-0.5 block w-4 h-4 rounded-full transition-all"
                  style={{
                    background: includeManual ? "#3a4a00" : "#8a8888",
                    [isRtl ? "right" : "left"]: includeManual ? "18px" : "2px",
                  }}
                />
              </span>
              {t.finance.includeManual}
            </button>
          </div>

          {txLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl shimmer" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "#cafd00" }} />
              <p style={{ color: "#8a8888" }}>{t.finance.noTransactions}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table dir={isRtl ? "rtl" : "ltr"} className="w-full min-w-[760px]">
                <thead>
                  <tr style={{ background: "#1a1a1a" }}>
                    {[t.common.date, t.finance.streamColumn, t.finance.traineeColumn, t.common.price, t.finance.referenceColumn].map((head, i) => (
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
                  {transactions.map((tx) => {
                    const cell = `px-5 py-4 ${isRtl ? "text-right" : "text-left"}`;
                    return (
                      <tr key={tx.id} className="border-t" style={{ borderColor: "#20201f" }}>
                        <td className={cell}>
                          <span className="text-sm" style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}>
                            {formatDateTime(tx.occurredAt, locale)}
                          </span>
                        </td>
                        <td className={cell}>
                          <Badge variant={streamBadgeVariant(tx.stream)}>{streamLabel(tx.stream)}</Badge>
                        </td>
                        <td className={cell}>
                          <p className="text-sm font-medium truncate max-w-[200px]" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                            {tx.traineeName}
                          </p>
                          <p className="text-xs truncate max-w-[200px]" style={{ color: "#8a8888" }}>{tx.traineeEmail}</p>
                        </td>
                        <td className={cell}>
                          <span className="text-sm font-medium" style={{ fontFamily: "JetBrains Mono, monospace", color: "#4ae176" }}>
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className={cell}>
                          {tx.isManualPayment ? (
                            <Badge variant="warning">{t.finance.manualBadge}</Badge>
                          ) : (
                            <Badge variant="neutral">{t.finance.stripeBadge}</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 pb-5">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(totalCount / perPage) || 1}
              onPageChange={setPage}
              totalCount={totalCount}
              resultsPerPage={perPage}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
