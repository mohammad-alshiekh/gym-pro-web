"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Info,
  RefreshCw,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { useTranslation } from "@/hooks/useTranslation";
import { subscriptionsApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import {
  CANCELLATION_TYPE,
  CANCELLATION_TYPES,
  PAYMENT_METHOD,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUSES,
  cancellationTypeLabel,
  daysRemaining,
  type GymSubscription,
} from "@/lib/manager";
import {
  formatCurrency,
  formatDate,
  getInitials,
  paymentMethodLabel,
  subscriptionStatusLabel,
} from "@/lib/utils";
import toast from "react-hot-toast";

const CARD: React.CSSProperties = { background: "#131313", borderColor: "#2a2a2a" };
const MONO: React.CSSProperties = { fontFamily: "JetBrains Mono, monospace", color: "#8a8888" };

type Action = "approve" | "reject" | "cancel";

function statusVariant(status: number): "warning" | "success" | "danger" | "neutral" {
  if (status === SUBSCRIPTION_STATUS.pending) return "warning";
  if (status === SUBSCRIPTION_STATUS.active) return "success";
  if (status === SUBSCRIPTION_STATUS.cancelRequested) return "warning";
  if (status === SUBSCRIPTION_STATUS.rejected) return "danger";
  if (status === SUBSCRIPTION_STATUS.cancelled) return "danger";
  return "neutral";
}

// Hex twin of statusVariant — used where a Badge's fixed palette isn't
// enough (the card's accent bar and progress fill need the raw color).
const STATUS_COLOR: Record<"warning" | "success" | "danger" | "neutral", string> = {
  warning: "#ffd04a",
  success: "#4ae176",
  danger: "#ff6e81",
  neutral: "#adaaaa",
};

function statusAccent(status: number): string {
  return STATUS_COLOR[statusVariant(status)];
}

export default function ManagerSubscriptionsPage() {
  const { t, locale, isRtl } = useTranslation();
  const [subs, setSubs] = useState<GymSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  // No "All" tab — Pending is the queue a manager actually works from, so
  // it's the default view rather than an unfiltered dump.
  const [statusFilter, setStatusFilter] = useState<number>(SUBSCRIPTION_STATUS.pending);
  const [actionTarget, setActionTarget] = useState<
    { sub: GymSubscription; action: Action } | null
  >(null);
  const [detailTarget, setDetailTarget] = useState<GymSubscription | null>(null);
  const [cancelType, setCancelType] = useState<number>(CANCELLATION_TYPE.immediate);
  const [submitting, setSubmitting] = useState(false);

  const openAction = (sub: GymSubscription, action: Action) => {
    setCancelType(CANCELLATION_TYPE.immediate);
    setActionTarget({ sub, action });
  };

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionsApi.getRequests(statusFilter);
      setSubs(res.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err, t.subscriptions.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const summary = useMemo(() => {
    const pending = subs.filter((s) => s.status === SUBSCRIPTION_STATUS.pending).length;
    const active = subs.filter((s) => s.status === SUBSCRIPTION_STATUS.active).length;
    const revenue = subs
      .filter((s) => s.status === SUBSCRIPTION_STATUS.active)
      .reduce((sum, s) => sum + (s.price ?? 0), 0);
    return { pending, active, revenue, total: subs.length };
  }, [subs]);

  const handleAction = async () => {
    if (!actionTarget) return;
    const { sub, action } = actionTarget;

    setSubmitting(true);
    try {
      if (action === "approve") {
        await subscriptionsApi.approve(sub.id);
        toast.success(t.subscriptions.approveSuccess);
      } else if (action === "reject") {
        await subscriptionsApi.reject(sub.id);
        toast.success(t.subscriptions.rejectSuccess);
      } else {
        await subscriptionsApi.cancel(sub.id, cancelType);
        toast.success(t.subscriptions.cancelSuccess);
      }
      setActionTarget(null);
      fetchSubs();
    } catch (err) {
      toast.error(apiErrorMessage(err, t.subscriptions.actionFailed));
    } finally {
      setSubmitting(false);
    }
  };

  // Shared per-row derivation — the table and the details popup both need it.
  const deriveSub = (sub: GymSubscription) => {
    const remaining = daysRemaining(sub.endDate);
    const isPending = sub.status === SUBSCRIPTION_STATUS.pending;
    const isActive = sub.status === SUBSCRIPTION_STATUS.active;
    const isManual = sub.paymentMethod === PAYMENT_METHOD.manual;
    // Only manual requests are the manager's to approve (§6.2), but any
    // pending one can be rejected (§6.3), and a membership the trainee has
    // asked to end still needs the manager to close it out (§6.4).
    const canCancel = isActive || sub.status === SUBSCRIPTION_STATUS.cancelRequested;
    const accent = statusAccent(sub.status);
    const urgent = isActive && remaining !== null && remaining >= 0 && remaining <= 7;
    const progressPct =
      isActive && remaining !== null && sub.durationDays > 0
        ? Math.min(100, Math.max(0, ((sub.durationDays - Math.max(remaining, 0)) / sub.durationDays) * 100))
        : null;
    return { remaining, isPending, isActive, isManual, canCancel, accent, urgent, progressPct };
  };

  // Closes the details popup and hands off to the existing confirm flow.
  const openActionFromDetails = (sub: GymSubscription, action: Action) => {
    setDetailTarget(null);
    openAction(sub, action);
  };

  // Pending-first, no "All" tab — a manager works this as a queue, not a dump.
  const tabs = SUBSCRIPTION_STATUSES.map((value) => ({
    value,
    label: subscriptionStatusLabel(value, locale),
  }));

  return (
    <DashboardLayout title={t.subscriptions.title} requiredRole="gym_manager">
      <div className="space-y-5">
     

        {/* ── Status filter ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const on = statusFilter === tab.value;
              return (
                <button
                  key={String(tab.value)}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    background: on ? "#cafd00" : "#20201f",
                    color: on ? "#3a4a00" : "#adaaaa",
                    fontFamily: "Lexend, sans-serif",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={fetchSubs}
            title={t.common.refresh}
            className="p-2 rounded-xl border transition-colors hover:border-[#cafd00] hover:text-[#cafd00] flex-shrink-0"
            style={{ borderColor: "#2a2a2a", color: "#8a8888" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl shimmer" />
            ))}
          </div>
        ) : subs.length === 0 ? (
          <div className="rounded-2xl border py-20 text-center" style={CARD}>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#20201f" }}
            >
              <ClipboardList className="w-7 h-7" style={{ color: "#cafd00", opacity: 0.5 }} />
            </div>
            <p className="text-sm" style={{ color: "#8a8888" }}>
              {t.common.noData}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={CARD}>
            <div className="overflow-x-auto">
              {/* `dir` is pinned explicitly (not just inherited from the RTL
                  page shell) so the table's own column order and each cell's
                  text-align always agree — otherwise the browser flips
                  column order for a `dir=rtl` ancestor while our physical
                  `text-left` utility classes stay put, and headers drift
                  away from the data underneath them. */}
              <table dir={isRtl ? "rtl" : "ltr"} className="w-full min-w-[760px]">
                <thead>
                  <tr style={{ background: "#1a1a1a" }}>
                    {[
                      t.subscriptions.member,
                      t.subscriptions.paymentMethod,
                      t.common.status,
                      t.common.price,
                      t.subscriptions.endDate,
                      t.subscriptions.requestedOn,
                      "",
                    ].map((head, i) => (
                      <th
                        key={i}
                        className={`text-[10px] font-medium uppercase tracking-widest px-5 py-3 ${isRtl ? "text-right" : "text-left"}`}
                        style={MONO}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.map((sub) => {
                    const { remaining, urgent, accent } = deriveSub(sub);
                    const cell = `px-5 py-3.5 ${isRtl ? "text-right" : "text-left"}`;
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => setDetailTarget(sub)}
                        className="border-t transition-colors hover:bg-[#1a1a1a] cursor-pointer"
                        style={{ borderColor: "#20201f" }}
                      >
                        <td className={cell}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: `${accent}18`,
                                color: accent,
                                fontFamily: "Lexend, sans-serif",
                              }}
                            >
                              {getInitials(sub.traineeName)}
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: "#ffffff" }}
                              >
                                {sub.traineeName}
                              </p>
                              <p className="text-xs truncate" style={{ color: "#8a8888" }}>
                                {sub.planName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={cell}>
                          <Badge variant={sub.paymentMethod === PAYMENT_METHOD.manual ? "neutral" : "info"}>
                            {paymentMethodLabel(sub.paymentMethod, locale)}
                          </Badge>
                        </td>
                        <td className={cell}>
                          <Badge variant={statusVariant(sub.status)}>
                            {subscriptionStatusLabel(sub.status, locale)}
                          </Badge>
                        </td>
                        <td className={cell}>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "#cafd00", fontFamily: "JetBrains Mono, monospace" }}
                          >
                            {formatCurrency(sub.price)}
                          </span>
                        </td>
                        <td className={cell}>
                          <span
                            className="text-xs"
                            style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}
                          >
                            {sub.endDate ? formatDate(sub.endDate, locale) : "—"}
                            {remaining !== null && remaining >= 0 && (
                              <span style={{ color: urgent ? "#ffd04a" : "#8a8888" }}>
                                {" "}
                                · {remaining}{t.subscriptions.daySuffix}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className={cell}>
                          <span
                            className="text-xs"
                            style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
                          >
                            {formatDate(sub.creationTime, locale)}
                          </span>
                        </td>
                        <td className={cell}>
                          <ChevronRight
                            className="w-4 h-4 inline-block"
                            style={{ color: "#8a8888", transform: isRtl ? "scaleX(-1)" : undefined }}
                          />
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

      {/* ── Details ── */}
      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.traineeName ?? t.subscriptions.requests}
        size="md"
        footer={
          detailTarget &&
          (() => {
            const { isPending, isManual, canCancel } = deriveSub(detailTarget);
            return (
              <>
                <Button variant="ghost" onClick={() => setDetailTarget(null)}>
                  {t.common.close}
                </Button>
                {isPending && isManual && (
                  <Button
                    variant="primary"
                    icon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => openActionFromDetails(detailTarget, "approve")}
                  >
                    {t.subscriptions.approve}
                  </Button>
                )}
                {isPending && (
                  <Button
                    variant="danger"
                    icon={<XCircle className="w-4 h-4" />}
                    onClick={() => openActionFromDetails(detailTarget, "reject")}
                  >
                    {t.subscriptions.reject}
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="danger"
                    icon={<Ban className="w-4 h-4" />}
                    onClick={() => openActionFromDetails(detailTarget, "cancel")}
                  >
                    {t.subscriptions.cancel}
                  </Button>
                )}
              </>
            );
          })()
        }
      >
        {detailTarget &&
          (() => {
            const sub = detailTarget;
            const { remaining, isPending, isManual, urgent, accent, progressPct } = deriveSub(sub);
            // Start/end only exist once the subscription has actually been
            // approved — a pending or rejected request has neither, so the
            // chip is left out entirely instead of showing a bare "—".
            const stats = [
              { label: t.common.price, value: formatCurrency(sub.price), icon: CreditCard, color: "#cafd00" },
              {
                label: t.common.duration,
                value: `${sub.durationDays} ${t.common.days}`,
                icon: Clock,
                color: "#7df6ff",
              },
              sub.startDate
                ? {
                    label: t.subscriptions.startDate,
                    value: formatDate(sub.startDate, locale),
                    icon: CalendarDays,
                    color: "#adaaaa",
                  }
                : null,
              sub.endDate
                ? {
                    label: t.subscriptions.endDate,
                    value: formatDate(sub.endDate, locale),
                    icon: CalendarDays,
                    color: "#adaaaa",
                  }
                : null,
            ].filter((s): s is NonNullable<typeof s> => s !== null);

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-base flex-shrink-0"
                    style={{ background: `${accent}18`, color: accent, fontFamily: "Lexend, sans-serif" }}
                  >
                    {getInitials(sub.traineeName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate" style={{ color: "#ffffff" }}>
                      {sub.traineeName}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "#8a8888" }}>
                      {sub.planName}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={isManual ? "neutral" : "info"}>
                    <Wallet className="w-3 h-3 mr-1" />
                    {paymentMethodLabel(sub.paymentMethod, locale)}
                  </Badge>
                  <Badge variant={statusVariant(sub.status)}>
                    {subscriptionStatusLabel(sub.status, locale)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl min-w-0"
                      style={{ background: "#0e0e0e" }}
                    >
                      <s.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.color }} />
                      <div className="min-w-0">
                        <p className="text-[9px] font-medium uppercase tracking-widest truncate" style={MONO}>
                          {s.label}
                        </p>
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: "#ffffff", fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {s.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {progressPct !== null && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1.5" style={MONO}>
                      <span className="uppercase tracking-widest">{t.subscriptions.periodProgress}</span>
                      <span style={{ color: urgent ? "#ffd04a" : "#8a8888", fontWeight: 600 }}>
                        {remaining !== null && remaining >= 0
                          ? `${remaining} ${t.subscriptions.daysLeft}`
                          : t.subscriptions.expiredLabel}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#20201f" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%`, background: urgent ? "#ffd04a" : "#4ae176" }}
                      />
                    </div>
                  </div>
                )}

                {sub.cancellationType != null && (
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: "#ff6e81" }}>
                    <Ban className="w-3.5 h-3.5 flex-shrink-0" />
                    {t.subscriptions.cancellationType}: {cancellationTypeLabel(sub.cancellationType, locale)}
                  </p>
                )}

                {isPending && !isManual && (
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: "#8a8888" }}>
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    {t.subscriptions.awaitingPayment}
                  </p>
                )}

                <div className="pt-3 border-t flex items-center gap-1.5 text-[11px]" style={{ ...MONO, borderColor: "#20201f" }}>
                  <CalendarDays className="w-3 h-3" />
                  {t.subscriptions.requestedOn} {formatDate(sub.creationTime, locale)}
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* ── Confirmation ── */}
      <Modal
        open={!!actionTarget}
        onClose={() => !submitting && setActionTarget(null)}
        title={
          actionTarget?.action === "approve"
            ? t.subscriptions.approve
            : actionTarget?.action === "reject"
              ? t.subscriptions.reject
              : t.subscriptions.cancel
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setActionTarget(null)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button
              variant={actionTarget?.action === "approve" ? "primary" : "danger"}
              loading={submitting}
              onClick={handleAction}
            >
              {t.common.confirm}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "#adaaaa" }}>
            {actionTarget?.action === "approve" && t.subscriptions.approveConfirm}
            {actionTarget?.action === "reject" && t.subscriptions.rejectConfirm}
            {actionTarget?.action === "cancel" && t.subscriptions.cancelConfirm}
          </p>
          {actionTarget && (
            <div className="p-3 rounded-xl" style={{ background: "#0e0e0e" }}>
              <p className="text-sm font-medium" style={{ color: "#ffffff" }}>
                {actionTarget.sub.traineeName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8a8888" }}>
                {actionTarget.sub.planName} — {formatCurrency(actionTarget.sub.price)} ·{" "}
                {actionTarget.sub.durationDays} {t.common.days}
              </p>
            </div>
          )}

          {/* CancellationTypeEnum — immediate, or let the paid period run out. */}
          {actionTarget?.action === "cancel" && (
            <div className="space-y-2">
              <p
                className="text-[11px] font-medium uppercase tracking-widest"
                style={MONO}
              >
                {t.subscriptions.cancellationType}
              </p>
              {CANCELLATION_TYPES.map((value) => {
                const on = cancelType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCancelType(value)}
                    disabled={submitting}
                    className="w-full flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors"
                    style={{
                      background: on ? "rgba(202,253,0,0.08)" : "#0e0e0e",
                      borderColor: on ? "rgba(202,253,0,0.35)" : "#2a2a2a",
                    }}
                  >
                    <span
                      className="mt-0.5 w-3.5 h-3.5 rounded-full border flex-shrink-0"
                      style={{
                        borderColor: on ? "#cafd00" : "#2a2a2a",
                        background: on ? "#cafd00" : "transparent",
                      }}
                    />
                    <span className="min-w-0">
                      <span
                        className="block text-sm font-medium"
                        style={{ color: on ? "#cafd00" : "#ffffff" }}
                      >
                        {cancellationTypeLabel(value, locale)}
                      </span>
                      <span className="block text-xs mt-0.5" style={{ color: "#8a8888" }}>
                        {value === CANCELLATION_TYPE.immediate
                          ? t.subscriptions.immediateHint
                          : t.subscriptions.cancelAtEndHint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
