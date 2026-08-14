"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowDownUp, ChevronRight, Search, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { membersApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import {
  SUBSCRIPTION_STATUS,
  daysRemaining,
  sessionDuration,
  type GymMember,
  type GymMemberDetail,
} from "@/lib/manager";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getInitials,
  paymentMethodLabel,
  subscriptionStatusLabel,
} from "@/lib/utils";
import toast from "react-hot-toast";

export default function ManagerMembersPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<GymMember[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewTarget, setViewTarget] = useState<GymMemberDetail | null>(null);
  const [sortBy, setSortBy] = useState<"startDate" | "endDate">("endDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [debounced, setDebounced] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  const perPage = 10;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await membersApi.getAll({
        searchQuery: debounced || undefined,
        sortBy,
        sortOrder,
        "pageInfo.pageNumber": page,
        "pageInfo.resultsPerPage": perPage,
      });
      setMembers(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch (err) {
      toast.error(apiErrorMessage(err, t.members.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [debounced, sortBy, sortOrder, page, t]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleView = async (traineeId: string) => {
    setLoadingDetail(true);
    try {
      const res = await membersApi.getById(traineeId);
      setViewTarget(res.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, t.members.detailFailed));
    } finally {
      setLoadingDetail(false);
    }
  };

  const statusVariant = (status: number): "warning" | "success" | "danger" | "neutral" => {
    if (status === SUBSCRIPTION_STATUS.pending) return "warning";
    if (status === SUBSCRIPTION_STATUS.active) return "success";
    if (status === SUBSCRIPTION_STATUS.cancelRequested) return "warning";
    if (status === SUBSCRIPTION_STATUS.rejected) return "danger";
    if (status === SUBSCRIPTION_STATUS.cancelled) return "danger";
    return "neutral";
  };

  const expiringSoon = useMemo(
    () =>
      members.filter((m) => {
        const left = daysRemaining(m.endDate);
        return m.status === SUBSCRIPTION_STATUS.active && left !== null && left >= 0 && left <= 7;
      }).length,
    [members]
  );

  return (
    <DashboardLayout title={t.members.title} requiredRole="gym_manager">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8b93a1" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.members.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
              style={{ background: "#0f1013", borderColor: "#2f3742", color: "#e9ecf1", outline: "none" }}
            />
          </div>

          {/* Sorting — the endpoint supports startDate / endDate, asc / desc. */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as "startDate" | "endDate"); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border text-sm cursor-pointer"
              style={{ background: "#0f1013", borderColor: "#2f3742", color: "#e9ecf1", outline: "none" }}
            >
              <option value="endDate" style={{ background: "#0f1013" }}>{t.subscriptions.endDate}</option>
              <option value="startDate" style={{ background: "#0f1013" }}>{t.subscriptions.startDate}</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              title={sortOrder === "asc" ? t.members.sortAsc : t.members.sortDesc}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs transition-colors hover:border-[#c8f323] hover:text-[#c8f323]"
              style={{ borderColor: "#2f3742", color: "#c3cad6", fontFamily: "JetBrains Mono, monospace" }}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              {sortOrder === "asc" ? t.members.sortAsc : t.members.sortDesc}
            </button>
          </div>

          <div className="sm:ml-auto flex items-center gap-3 text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}>
            <span>{totalCount} {t.members.title}</span>
            {expiringSoon > 0 && (
              <span style={{ color: "#ffd04a" }}>
                {expiringSoon} {t.members.expiringSoon}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer" />)}</div>
        ) : members.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8b93a1" }}>
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t.common.noData}</p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2f3742", background: "#171a1e" }}>
            {members.map((member, i) => (
              <div
                key={member.traineeId}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#23272e] transition-colors"
                style={{ borderBottom: i < members.length - 1 ? "1px solid #23272e" : "none" }}
                onClick={() => handleView(member.traineeId)}
              >
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: "#23272e", color: "#c8f323", fontFamily: "Lexend, sans-serif" }}>
                    {getInitials(member.name)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>{member.name}</p>
                    <Badge variant={statusVariant(member.status)} className="hidden sm:inline-flex">
                      {subscriptionStatusLabel(member.status)}
                    </Badge>
                  </div>
                  <p className="text-xs" style={{ color: "#8b93a1" }}>{member.email}</p>
                </div>

                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>
                    {member.currentPlanName ?? "—"}
                  </p>
                  {member.endDate && (() => {
                    const left = daysRemaining(member.endDate);
                    const soon = left !== null && left >= 0 && left <= 7;
                    return (
                      <p className="text-xs" style={{ color: soon ? "#ffd04a" : "#8b93a1" }}>
                        {t.members.expires}: {formatDate(member.endDate)}
                        {left !== null && left >= 0 && ` · ${left}d`}
                      </p>
                    );
                  })()}
                </div>

                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#8b93a1" }} />
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalCount / perPage) || 1}
          onPageChange={setPage}
          totalCount={totalCount}
          resultsPerPage={perPage}
        />
      </div>

      {/* Member Detail Modal */}
      <Modal open={!!viewTarget || loadingDetail} onClose={() => setViewTarget(null)} title="Member Profile" size="lg">
        {loadingDetail ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}</div>
        ) : viewTarget ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              {viewTarget.photoUrl ? (
                <img src={viewTarget.photoUrl} alt={viewTarget.name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{ background: "#23272e", color: "#c8f323", fontFamily: "Lexend, sans-serif" }}>
                  {getInitials(viewTarget.name)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>{viewTarget.name}</h3>
                <p className="text-sm" style={{ color: "#8b93a1" }}>{viewTarget.email}</p>
                {viewTarget.phone && <p className="text-sm" style={{ color: "#c3cad6" }}>{viewTarget.phone}</p>}
              </div>
            </div>

            {/* Current Subscription */}
            {viewTarget.currentSubscription && (
              <div className="p-4 rounded-xl" style={{ background: "#0f1013" }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-xs font-semibold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#c8f323" }}>
                    {t.members.currentSubscription}
                  </p>
                  <Badge variant={statusVariant(viewTarget.currentSubscription.status)}>
                    {subscriptionStatusLabel(viewTarget.currentSubscription.status)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p style={{ color: "#8b93a1" }}>{t.subscriptions.plan}</p>
                    <p style={{ color: "#e9ecf1" }}>{viewTarget.currentSubscription.planName}</p>
                  </div>
                  <div>
                    <p style={{ color: "#8b93a1" }}>{t.common.price}</p>
                    <p style={{ color: "#c8f323", fontWeight: 600 }}>{formatCurrency(viewTarget.currentSubscription.price)}</p>
                  </div>
                  <div>
                    <p style={{ color: "#8b93a1" }}>{t.subscriptions.paymentMethod}</p>
                    <p style={{ color: "#e9ecf1" }}>{paymentMethodLabel(viewTarget.currentSubscription.paymentMethod)}</p>
                  </div>
                  <div>
                    <p style={{ color: "#8b93a1" }}>{t.subscriptions.startDate}</p>
                    <p style={{ color: "#e9ecf1" }}>{formatDate(viewTarget.currentSubscription.startDate)}</p>
                  </div>
                  <div>
                    <p style={{ color: "#8b93a1" }}>{t.subscriptions.endDate}</p>
                    <p style={{ color: "#e9ecf1" }}>{formatDate(viewTarget.currentSubscription.endDate)}</p>
                  </div>
                  {(() => {
                    const left = daysRemaining(viewTarget.currentSubscription.endDate);
                    return left === null ? null : (
                      <div>
                        <p style={{ color: "#8b93a1" }}>{t.members.daysLeft}</p>
                        <p style={{ color: left <= 7 ? "#ffd04a" : "#e9ecf1", fontWeight: 600 }}>
                          {left >= 0 ? left : 0}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Previous subscriptions — returned by the API but never shown before. */}
            {viewTarget.previousSubscriptions && viewTarget.previousSubscriptions.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ fontFamily: "JetBrains Mono, monospace", color: "#c3cad6" }}>
                  {t.members.previousSubscriptions}
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {viewTarget.previousSubscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg" style={{ background: "#0f1013" }}>
                      <div className="min-w-0">
                        <p className="text-xs truncate" style={{ color: "#e9ecf1" }}>{sub.planName}</p>
                        <p className="text-[11px]" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}>
                          {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                        </p>
                      </div>
                      <Badge variant={statusVariant(sub.status)}>{subscriptionStatusLabel(sub.status)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl text-center" style={{ background: "#23272e" }}>
                <p className="text-2xl font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#4ae176" }}>{viewTarget.totalAttendanceCount}</p>
                <p className="text-xs mt-1" style={{ color: "#8b93a1" }}>Total Visits</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: "#23272e" }}>
                <p className="text-sm font-semibold" style={{ fontFamily: "Lexend, sans-serif", color: "#adc6ff" }}>
                  {viewTarget.lastAttendanceTime ? formatDate(viewTarget.lastAttendanceTime) : "—"}
                </p>
                <p className="text-xs mt-1" style={{ color: "#8b93a1" }}>Last Visit</p>
              </div>
            </div>

            {/* Recent Attendance */}
            {viewTarget.attendanceHistory && viewTarget.attendanceHistory.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-3" style={{ fontFamily: "JetBrains Mono, monospace", color: "#c3cad6" }}>RECENT VISITS</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {viewTarget.attendanceHistory.slice(0, 10).map((att) => {
                    const duration = sessionDuration(att);
                    return (
                      <div key={att.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg" style={{ background: "#0f1013" }}>
                        <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#e9ecf1" }}>
                          {formatDateTime(att.checkInTime)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: att.checkOutTime ? "#8b93a1" : "#4ae176" }}
                        >
                          {att.checkOutTime ? (duration ?? "—") : t.attendance.stillInside}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
