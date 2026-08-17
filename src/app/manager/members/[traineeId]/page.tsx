"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CreditCard,
  History,
  Mail,
  Phone,
  Timer,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { membersApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import {
  SUBSCRIPTION_STATUS,
  daysRemaining,
  sessionDuration,
  type GymMemberDetail,
  type GymSubscription,
} from "@/lib/manager";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getInitials,
  paymentMethodLabel,
  subscriptionStatusLabel,
} from "@/lib/utils";

const CARD: React.CSSProperties = { background: "#131313", borderColor: "#2a2a2a" };
const MONO = "JetBrains Mono, monospace";

function statusVariant(status: number): "warning" | "success" | "danger" | "neutral" {
  if (status === SUBSCRIPTION_STATUS.pending) return "warning";
  if (status === SUBSCRIPTION_STATUS.active) return "success";
  if (status === SUBSCRIPTION_STATUS.cancelRequested) return "warning";
  if (status === SUBSCRIPTION_STATUS.rejected) return "danger";
  if (status === SUBSCRIPTION_STATUS.cancelled) return "danger";
  return "neutral";
}

function Section({
  icon: Icon,
  title,
  accent = "#cafd00",
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border p-5 sm:p-6" style={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg flex-shrink-0"
            style={{ background: `${accent}15`, color: accent }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ fontFamily: MONO, color: "#adaaaa" }}
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: MONO, color: "#8a8888" }}>
        {label}
      </p>
      <div className="text-sm" style={{ color: "#ffffff" }}>
        {children}
      </div>
    </div>
  );
}

export default function MemberDetailPage() {
  const { t, isRtl, locale } = useTranslation();
  const params = useParams<{ traineeId: string }>();
  const traineeId = params?.traineeId;

  const [member, setMember] = useState<GymMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    if (!traineeId) return;
    setLoading(true);
    try {
      const res = await membersApi.getById(traineeId);
      setMember(res.data);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, t.members.memberNotFound));
    } finally {
      setLoading(false);
    }
  }, [traineeId, t]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const backLink = (
    <Link
      href="/manager/members"
      className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#cafd00]"
      style={{ color: "#8a8888" }}
    >
      <ArrowLeft className="w-4 h-4" style={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
      {t.members.backToMembers}
    </Link>
  );

  if (loading) {
    return (
      <DashboardLayout title={t.members.memberProfile} requiredRole="gym_manager">
        <div className="space-y-4">
          <div className="h-28 rounded-2xl shimmer" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer" />
            ))}
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl shimmer" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !member) {
    return (
      <DashboardLayout title={t.members.memberProfile} requiredRole="gym_manager">
        <div className="space-y-4">
          {backLink}
          <div
            className="p-6 rounded-2xl border text-sm"
            style={{ background: "rgba(92,22,32,0.12)", borderColor: "#5c1620", color: "#ff6e81" }}
          >
            {error ?? t.members.memberNotFound}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const current = member.currentSubscription;
  const previous = member.previousSubscriptions ?? [];
  const attendance = member.attendanceHistory ?? [];
  const daysLeft = daysRemaining(current?.endDate);
  const expiringSoon =
    current?.status === SUBSCRIPTION_STATUS.active &&
    daysLeft !== null &&
    daysLeft >= 0 &&
    daysLeft <= 7;

  const tiles = [
    {
      label: t.members.currentPlan,
      value: current?.planName ?? "—",
      icon: CreditCard,
      color: "#cafd00",
    },
    {
      label: t.members.daysLeft,
      value: daysLeft === null ? "—" : String(Math.max(daysLeft, 0)),
      icon: CalendarClock,
      color: expiringSoon ? "#ffd04a" : "#4ae176",
    },
    {
      label: t.members.totalVisits,
      value: String(member.totalAttendanceCount),
      icon: Users,
      color: "#7df6ff",
    },
    {
      label: t.members.lastVisit,
      value: member.lastAttendanceTime ? formatDate(member.lastAttendanceTime, locale) : "—",
      icon: Timer,
      color: "#adaaaa",
    },
  ];

  /**
   * A subscription that never activated (rejected / still pending) carries no
   * start or end date — the API leaves both null. Showing "— → —" for those is
   * noise, so they fall back to when the request was made.
   */
  const subscriptionPeriod = (sub: GymSubscription) =>
    sub.startDate || sub.endDate ? (
      <>
        {formatDate(sub.startDate, locale)} → {formatDate(sub.endDate, locale)}
      </>
    ) : (
      <>
        {t.members.requestedOn}: {formatDate(sub.creationTime, locale)}
      </>
    );

  return (
    <DashboardLayout title={member.name} requiredRole="gym_manager">
      <div className="space-y-5 pb-6">
        {backLink}

        {/* ── Identity ── */}
        <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {member.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photoUrl}
                alt={member.name}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{ background: "#20201f", color: "#cafd00", fontFamily: "Lexend, sans-serif" }}
              >
                {getInitials(member.name)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "Space Grotesk, sans-serif", color: "#ffffff" }}
                >
                  {member.name}
                </h1>
                {current && (
                  <Badge variant={statusVariant(current.status)}>
                    {subscriptionStatusLabel(current.status, locale)}
                  </Badge>
                )}
              </div>

              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5 text-sm"
                style={{ color: "#adaaaa" }}
              >
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#8a8888" }} />
                  <span className="truncate" dir="ltr">{member.email}</span>
                </span>
                {member.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#8a8888" }} />
                    <span dir="ltr">{member.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tiles ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map((tile) => (
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
                <p
                  className="text-[10px] font-medium uppercase tracking-widest truncate"
                  style={{ fontFamily: MONO, color: "#8a8888" }}
                >
                  {tile.label}
                </p>
                <p
                  className="text-sm font-bold truncate mt-0.5"
                  style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                  title={tile.value}
                >
                  {tile.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Current subscription ── */}
        <Section
          icon={CreditCard}
          title={t.members.currentSubscription}
          action={
            current ? (
              <Badge variant={statusVariant(current.status)}>
                {subscriptionStatusLabel(current.status, locale)}
              </Badge>
            ) : undefined
          }
        >
          {!current ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>
              {t.members.noCurrentSubscription}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
              <Field label={t.subscriptions.plan}>{current.planName}</Field>
              <Field label={t.common.price}>
                <span style={{ color: "#cafd00", fontWeight: 600 }}>
                  {formatCurrency(current.price)}
                </span>
              </Field>
              <Field label={t.subscriptions.paymentMethod}>
                {paymentMethodLabel(current.paymentMethod, locale)}
              </Field>
              <Field label={t.common.duration}>
                {current.durationDays} {t.common.days}
              </Field>
              <Field label={t.subscriptions.startDate}>
                {formatDate(current.startDate, locale)}
              </Field>
              <Field label={t.subscriptions.endDate}>
                <span style={{ color: expiringSoon ? "#ffd04a" : undefined }}>
                  {formatDate(current.endDate, locale)}
                </span>
              </Field>
            </div>
          )}
        </Section>

        {/* ── Subscription history ── */}
        <Section icon={History} title={t.members.previousSubscriptions} accent="#7df6ff">
          {previous.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>
              {t.members.noPreviousSubscriptions}
            </p>
          ) : (
            <div className="space-y-2">
              {previous.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl"
                  style={{ background: "#0e0e0e" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: "#ffffff" }}>
                      {sub.planName}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ fontFamily: MONO, color: "#8a8888" }}>
                      {subscriptionPeriod(sub)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs" style={{ fontFamily: MONO, color: "#adaaaa" }}>
                      {formatCurrency(sub.price)}
                    </span>
                    <Badge variant={statusVariant(sub.status)}>
                      {subscriptionStatusLabel(sub.status, locale)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Attendance ── */}
        <Section icon={CalendarDays} title={t.members.attendanceHistory} accent="#4ae176">
          {attendance.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>
              {t.members.noAttendanceYet}
            </p>
          ) : (
            <div className="space-y-2">
              {attendance.map((log) => {
                const duration = sessionDuration(log);
                return (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl"
                    style={{ background: "#0e0e0e" }}
                  >
                    <span className="text-xs" style={{ fontFamily: MONO, color: "#ffffff" }}>
                      {formatDateTime(log.checkInTime, locale)}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: log.checkOutTime ? "#8a8888" : "#4ae176" }}
                    >
                      {log.checkOutTime ? duration ?? "—" : t.attendance.stillInside}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}
