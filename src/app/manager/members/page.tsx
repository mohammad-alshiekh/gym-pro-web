"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Search,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { membersApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import {
  SUBSCRIPTION_STATUS,
  daysRemaining,
  type GymMember,
} from "@/lib/manager";
import { formatDate, getInitials, subscriptionStatusLabel } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ManagerMembersPage() {
  const { t, locale, isRtl } = useTranslation();
  const [members, setMembers] = useState<GymMember[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"startDate" | "endDate">("endDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [debounced, setDebounced] = useState("");

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

  const statusVariant = (status: number): "warning" | "success" | "danger" | "neutral" => {
    if (status === SUBSCRIPTION_STATUS.pending) return "warning";
    if (status === SUBSCRIPTION_STATUS.active) return "success";
    if (status === SUBSCRIPTION_STATUS.cancelRequested) return "warning";
    if (status === SUBSCRIPTION_STATUS.rejected) return "danger";
    if (status === SUBSCRIPTION_STATUS.cancelled) return "danger";
    return "neutral";
  };

  // Hex twin of statusVariant — Badge's fixed palette can't color the
  // avatar ring and left accent bar, which need the raw value.
  const STATUS_COLOR: Record<"warning" | "success" | "danger" | "neutral", string> = {
    warning: "#ffd04a",
    success: "#4ae176",
    danger: "#ff6e81",
    neutral: "#adaaaa",
  };
  const statusAccent = (status: number) => STATUS_COLOR[statusVariant(status)];

  return (
    <DashboardLayout title={t.members.title} requiredRole="gym_manager">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8a8888" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.members.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
              style={{ background: "#0e0e0e", borderColor: "#2a2a2a", color: "#ffffff", outline: "none" }}
            />
          </div>

          {/*
            Sorting — the endpoint supports startDate / endDate, asc / desc.
            Field and direction are one segmented control: they are a single
            decision, and pairing them keeps the row from looking like two
            unrelated widgets. The direction toggle is icon-only so it can't
            change width as the label flips.
          */}
          <div
            className="flex items-stretch rounded-xl border overflow-hidden flex-shrink-0 transition-colors focus-within:border-[#cafd00]"
            style={{ background: "#0e0e0e", borderColor: "#2a2a2a" }}
          >
            <span
              className="hidden sm:flex items-center ps-3.5 pe-1 text-[10px] uppercase tracking-widest select-none"
              style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
            >
              {t.members.sortBy}
            </span>

            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as "startDate" | "endDate");
                  setPage(1);
                }}
                aria-label={t.members.sortBy}
                className="appearance-none bg-transparent py-2.5 ps-2.5 pe-9 text-sm cursor-pointer outline-none"
                style={{ color: "#ffffff", fontFamily: "Manrope, sans-serif" }}
              >
                {/* Options render in the OS popup — they need their own dark background. */}
                <option value="endDate" style={{ background: "#131313", color: "#ffffff" }}>
                  {t.subscriptions.endDate}
                </option>
                <option value="startDate" style={{ background: "#131313", color: "#ffffff" }}>
                  {t.subscriptions.startDate}
                </option>
              </select>
              <ChevronDown
                className="absolute end-3 w-4 h-4 pointer-events-none"
                style={{ color: "#8a8888" }}
              />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              title={sortOrder === "asc" ? t.members.sortAsc : t.members.sortDesc}
              aria-label={sortOrder === "asc" ? t.members.sortAsc : t.members.sortDesc}
              className="flex items-center justify-center px-3 transition-colors hover:bg-[#20201f] hover:text-[#cafd00]"
              style={{ borderInlineStart: "1px solid #2a2a2a", color: "#adaaaa" }}
            >
              {sortOrder === "asc" ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[70px] rounded-2xl shimmer" />)}</div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl border py-20 text-center" style={{ borderColor: "#2a2a2a", background: "#131313" }}>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#20201f" }}
            >
              <Users className="w-7 h-7" style={{ color: "#cafd00", opacity: 0.5 }} />
            </div>
            <p className="text-sm" style={{ color: "#8a8888" }}>{t.common.noData}</p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2a2a2a", background: "#131313" }}>
            {members.map((member, i) => {
              const accent = statusAccent(member.status);
              const left = member.endDate ? daysRemaining(member.endDate) : null;
              const soon =
                member.status === SUBSCRIPTION_STATUS.active && left !== null && left >= 0 && left <= 7;

              return (
                <Link
                  key={member.traineeId}
                  href={`/manager/members/${member.traineeId}`}
                  className="relative flex items-center gap-3.5 pl-6 pr-5 py-3.5 transition-colors hover:bg-[#1a1a1a]"
                  style={{ borderBottom: i < members.length - 1 ? "1px solid #20201f" : "none" }}
                >
                  {/* Status accent bar */}
                  <span
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: accent }}
                    aria-hidden
                  />

                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-11 h-11 rounded-2xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: `${accent}18`, color: accent, fontFamily: "Lexend, sans-serif" }}
                    >
                      {getInitials(member.name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>{member.name}</p>
                      <Badge variant={statusVariant(member.status)} className="hidden sm:inline-flex flex-shrink-0">
                        {subscriptionStatusLabel(member.status, locale)}
                      </Badge>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#8a8888" }}>{member.email}</p>
                  </div>

                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className="text-xs font-medium" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                      {member.currentPlanName ?? "—"}
                    </p>
                    {member.endDate && (() => {
                      return (
                        <p className="text-xs mt-0.5 flex items-center justify-end gap-1" style={{ color: soon ? "#ffd04a" : "#8a8888" }}>
                          {soon && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                          {t.members.expires}: {formatDate(member.endDate, locale)}
                          {left !== null && left >= 0 && ` · ${left}${t.subscriptions.daySuffix}`}
                      </p>
                    );
                  })()}
                </div>

                <ChevronRight
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "#8a8888", transform: isRtl ? "scaleX(-1)" : undefined }}
                />
                </Link>
              );
            })}
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

    </DashboardLayout>
  );
}
