"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  CreditCard,
  Info,
  RefreshCw,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
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

export default function ManagerSubscriptionsPage() {
  const { t, locale } = useTranslation();
  const [subs, setSubs] = useState<GymSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [actionTarget, setActionTarget] = useState<
    { sub: GymSubscription; action: Action } | null
  >(null);
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
    return { pending, active, revenue };
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

  const tabs = [
    { value: undefined as number | undefined, label: t.common.all },
    ...SUBSCRIPTION_STATUSES.map((value) => ({
      value: value as number | undefined,
      label: subscriptionStatusLabel(value, locale),
    })),
  ];

  return (
    <DashboardLayout title={t.subscriptions.title} requiredRole="gym_manager">
      <div className="space-y-5">
        {/* ── Summary ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: t.subscriptions.pendingRequests,
              value: summary.pending,
              icon: ClipboardList,
              color: "#ffd04a",
            },
            {
              label: t.dashboard.activeSubscriptions,
              value: summary.active,
              icon: CheckCircle,
              color: "#4ae176",
            },
            {
              label: t.subscriptions.activeValue,
              value: formatCurrency(summary.revenue),
              icon: CreditCard,
              color: "#cafd00",
            },
          ].map((tile) => (
            <div
              key={tile.label}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
              style={CARD}
            >
              <div
                className="p-2 rounded-xl flex-shrink-0"
                style={{ background: `${tile.color}15`, color: tile.color }}
              >
                <tile.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-widest truncate" style={MONO}>
                  {tile.label}
                </p>
                <p
                  className="text-sm font-bold truncate mt-0.5"
                  style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                >
                  {tile.value}
                </p>
              </div>
            </div>
          ))}
        </div>

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

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl shimmer" />
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
          <div className="space-y-3">
            {subs.map((sub) => {
              const remaining = daysRemaining(sub.endDate);
              const isPending = sub.status === SUBSCRIPTION_STATUS.pending;
              const isActive = sub.status === SUBSCRIPTION_STATUS.active;
              const isManual = sub.paymentMethod === PAYMENT_METHOD.manual;
              // Only manual requests are the manager's to approve (§6.2), but any
              // pending one can be rejected (§6.3), and a membership the trainee has
              // asked to end still needs the manager to close it out (§6.4).
              const canCancel = isActive || sub.status === SUBSCRIPTION_STATUS.cancelRequested;

              return (
                <div key={sub.id} className="rounded-2xl border p-5" style={CARD}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: "#20201f",
                          color: "#cafd00",
                          fontFamily: "Lexend, sans-serif",
                        }}
                      >
                        {getInitials(sub.traineeName)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                        >
                          {sub.traineeName}
                        </p>
                        <p className="text-xs truncate" style={{ color: "#8a8888" }}>
                          {sub.planName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={isManual ? "neutral" : "info"}>
                        {paymentMethodLabel(sub.paymentMethod)}
                      </Badge>
                      <Badge variant={statusVariant(sub.status)}>
                        {subscriptionStatusLabel(sub.status, locale)}
                      </Badge>
                    </div>
                  </div>

                  <div
                    className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    <div>
                      <p style={{ color: "#8a8888" }}>{t.common.price}</p>
                      <p style={{ color: "#cafd00", fontWeight: 600 }}>
                        {formatCurrency(sub.price)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#8a8888" }}>{t.common.duration}</p>
                      <p style={{ color: "#ffffff" }}>
                        {sub.durationDays} {t.common.days}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#8a8888" }}>{t.subscriptions.startDate}</p>
                      <p style={{ color: "#ffffff" }}>
                        {sub.startDate ? formatDate(sub.startDate) : "—"}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#8a8888" }}>{t.subscriptions.endDate}</p>
                      <p style={{ color: "#ffffff" }}>
                        {sub.endDate ? formatDate(sub.endDate) : "—"}
                        {isActive && remaining !== null && remaining >= 0 && (
                          <span style={{ color: remaining <= 7 ? "#ffd04a" : "#8a8888" }}>
                            {" "}
                            · {remaining}d
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {sub.cancellationType != null && (
                    <p className="mt-3 text-xs" style={{ color: "#ff6e81" }}>
                      {t.subscriptions.cancellationType}:{" "}
                      {cancellationTypeLabel(sub.cancellationType, locale)}
                    </p>
                  )}

                  {/* Actions */}
                  {(isPending || canCancel) && (
                    <div
                      className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t"
                      style={{ borderColor: "#20201f" }}
                    >
                      {isPending && isManual && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                          onClick={() => openAction(sub, "approve")}
                        >
                          {t.subscriptions.approve}
                        </Button>
                      )}

                      {isPending && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<XCircle className="w-3.5 h-3.5" />}
                          onClick={() => openAction(sub, "reject")}
                        >
                          {t.subscriptions.reject}
                        </Button>
                      )}

                      {/* Stripe approves itself once the checkout settles. */}
                      {isPending && !isManual && (
                        <p
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: "#8a8888" }}
                        >
                          <Info className="w-3.5 h-3.5" />
                          {t.subscriptions.awaitingPayment}
                        </p>
                      )}

                      {canCancel && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Ban className="w-3.5 h-3.5" />}
                          onClick={() => openAction(sub, "cancel")}
                        >
                          {t.subscriptions.cancel}
                        </Button>
                      )}

                      <span className="ml-auto flex items-center gap-1.5 text-[11px]" style={MONO}>
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(sub.creationTime)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
