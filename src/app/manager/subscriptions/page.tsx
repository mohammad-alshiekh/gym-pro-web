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

const CARD: React.CSSProperties = { background: "#171a1e", borderColor: "#2f3742" };
const MONO: React.CSSProperties = { fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" };

type Action = "approve" | "reject" | "cancel";

function statusVariant(status: number): "warning" | "success" | "danger" | "neutral" {
  if (status === SUBSCRIPTION_STATUS.pending) return "warning";
  if (status === SUBSCRIPTION_STATUS.active) return "success";
  if (status === SUBSCRIPTION_STATUS.rejected) return "danger";
  return "neutral";
}

export default function ManagerSubscriptionsPage() {
  const { t } = useTranslation();
  const [subs, setSubs] = useState<GymSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [actionTarget, setActionTarget] = useState<
    { sub: GymSubscription; action: Action } | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

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
        // A manager-initiated cancellation is always ByManager.
        await subscriptionsApi.cancel(sub.id, CANCELLATION_TYPE.byManager);
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
      label: subscriptionStatusLabel(value),
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
              color: "#c8f323",
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
                  style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
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
                    background: on ? "#c8f323" : "#23272e",
                    color: on ? "#293500" : "#c3cad6",
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
            className="p-2 rounded-xl border transition-colors hover:border-[#c8f323] hover:text-[#c8f323] flex-shrink-0"
            style={{ borderColor: "#2f3742", color: "#8b93a1" }}
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
              style={{ background: "#23272e" }}
            >
              <ClipboardList className="w-7 h-7" style={{ color: "#c8f323", opacity: 0.5 }} />
            </div>
            <p className="text-sm" style={{ color: "#8b93a1" }}>
              {t.common.noData}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map((sub) => {
              const remaining = daysRemaining(sub.endDate);
              const isPending = sub.status === SUBSCRIPTION_STATUS.pending;
              const isActive = sub.status === SUBSCRIPTION_STATUS.active;
              const isCash = sub.paymentMethod === PAYMENT_METHOD.cash;

              return (
                <div key={sub.id} className="rounded-2xl border p-5" style={CARD}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: "#23272e",
                          color: "#c8f323",
                          fontFamily: "Lexend, sans-serif",
                        }}
                      >
                        {getInitials(sub.traineeName)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                        >
                          {sub.traineeName}
                        </p>
                        <p className="text-xs truncate" style={{ color: "#8b93a1" }}>
                          {sub.planName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={isCash ? "neutral" : "info"}>
                        {paymentMethodLabel(sub.paymentMethod)}
                      </Badge>
                      <Badge variant={statusVariant(sub.status)}>
                        {subscriptionStatusLabel(sub.status)}
                      </Badge>
                    </div>
                  </div>

                  <div
                    className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    <div>
                      <p style={{ color: "#8b93a1" }}>{t.common.price}</p>
                      <p style={{ color: "#c8f323", fontWeight: 600 }}>
                        {formatCurrency(sub.price)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#8b93a1" }}>{t.common.duration}</p>
                      <p style={{ color: "#e9ecf1" }}>
                        {sub.durationDays} {t.common.days}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#8b93a1" }}>{t.subscriptions.startDate}</p>
                      <p style={{ color: "#e9ecf1" }}>
                        {sub.startDate ? formatDate(sub.startDate) : "—"}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#8b93a1" }}>{t.subscriptions.endDate}</p>
                      <p style={{ color: "#e9ecf1" }}>
                        {sub.endDate ? formatDate(sub.endDate) : "—"}
                        {isActive && remaining !== null && remaining >= 0 && (
                          <span style={{ color: remaining <= 7 ? "#ffd04a" : "#8b93a1" }}>
                            {" "}
                            · {remaining}d
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {sub.cancellationType != null && (
                    <p className="mt-3 text-xs" style={{ color: "#ffb4ab" }}>
                      {t.subscriptions.cancelledBy}: {cancellationTypeLabel(sub.cancellationType)}
                    </p>
                  )}

                  {/* Actions */}
                  {(isPending || isActive) && (
                    <div
                      className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t"
                      style={{ borderColor: "#23272e" }}
                    >
                      {isPending && isCash && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActionTarget({ sub, action: "approve" })}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                            style={{
                              background: "rgba(200,243,35,0.1)",
                              color: "#c8f323",
                              border: "1px solid rgba(200,243,35,0.25)",
                            }}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {t.subscriptions.approve}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionTarget({ sub, action: "reject" })}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                            style={{
                              background: "rgba(255,180,171,0.1)",
                              color: "#ffb4ab",
                              border: "1px solid rgba(255,180,171,0.25)",
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {t.subscriptions.reject}
                          </button>
                        </>
                      )}

                      {/* Card payments are settled by Stripe, not by the manager. */}
                      {isPending && !isCash && (
                        <p
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: "#8b93a1" }}
                        >
                          <Info className="w-3.5 h-3.5" />
                          {t.subscriptions.awaitingPayment}
                        </p>
                      )}

                      {isActive && (
                        <button
                          type="button"
                          onClick={() => setActionTarget({ sub, action: "cancel" })}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                          style={{
                            background: "rgba(255,180,171,0.1)",
                            color: "#ffb4ab",
                            border: "1px solid rgba(255,180,171,0.25)",
                          }}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {t.subscriptions.cancel}
                        </button>
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
          <p className="text-sm" style={{ color: "#c3cad6" }}>
            {actionTarget?.action === "approve" && t.subscriptions.approveConfirm}
            {actionTarget?.action === "reject" && t.subscriptions.rejectConfirm}
            {actionTarget?.action === "cancel" && t.subscriptions.cancelConfirm}
          </p>
          {actionTarget && (
            <div className="p-3 rounded-xl" style={{ background: "#0f1013" }}>
              <p className="text-sm font-medium" style={{ color: "#e9ecf1" }}>
                {actionTarget.sub.traineeName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8b93a1" }}>
                {actionTarget.sub.planName} — {formatCurrency(actionTarget.sub.price)} ·{" "}
                {actionTarget.sub.durationDays} {t.common.days}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
