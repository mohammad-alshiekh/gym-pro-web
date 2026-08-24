"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  Dumbbell,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { schedulesApi } from "@/lib/api";
import {
  countExercises,
  countSets,
  difficultyKey,
  difficultyVariant,
  type ExerciseSchedule,
} from "@/lib/schedules";
import toast from "react-hot-toast";

const PER_PAGE = 9;

export default function ExerciseSchedulesPage() {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState<ExerciseSchedule[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await schedulesApi.getAll({
        pageNumber: page,
        resultsPerPage: PER_PAGE,
        searchQuery: debounced || undefined,
      });
      setSchedules(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error(t.exerciseSchedules.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [debounced, page, t]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const stats = useMemo(() => {
    const active = schedules.filter((s) => s.isActive !== false).length;
    const days = schedules.reduce((n, s) => n + (s.days?.length ?? 0), 0);
    const exercises = schedules.reduce((n, s) => n + countExercises(s), 0);
    return { active, days, exercises };
  }, [schedules]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await schedulesApi.delete(deleteTarget.id);
      toast.success(t.exerciseSchedules.deleteSuccess);
      setDeleteTarget(null);
      // Step back a page when the last item on it was removed.
      if (schedules.length === 1 && page > 1) setPage(page - 1);
      else fetchSchedules();
    } catch {
      toast.error(t.exerciseSchedules.deleteFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title={t.exerciseSchedules.title} requiredRole="super_admin">
      <div className="space-y-6">
        {/* ── Stats ── */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title={t.exerciseSchedules.totalPlans}
            value={totalCount}
            icon={<CalendarDays className="w-5 h-5" />}
          />
          <StatCard
            title={t.exerciseSchedules.activePlans}
            value={stats.active}
            subtitle={t.exerciseSchedules.onThisPage}
            icon={<BarChart3 className="w-5 h-5" />}
            accentColor="#4ae176"
          />
          <StatCard
            title={t.exerciseSchedules.trainingDays}
            value={stats.days}
            subtitle={t.exerciseSchedules.onThisPage}
            icon={<CalendarDays className="w-5 h-5" />}
            accentColor="#7df6ff"
          />
          <StatCard
            title={t.exerciseSchedules.totalExercises}
            value={stats.exercises}
            subtitle={t.exerciseSchedules.onThisPage}
            icon={<Dumbbell className="w-5 h-5" />}
            accentColor="#ffd04a"
          />
        </div> */}

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#8a8888" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.exerciseSchedules.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
              style={{
                background: "#0e0e0e",
                borderColor: "#2a2a2a",
                color: "#ffffff",
                outline: "none",
              }}
            />
          </div>

          <Link href="/admin/exercise-schedules/new">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
              {t.exerciseSchedules.newPlan}
            </Button>
          </Link>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl shimmer" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div
            className="rounded-2xl border py-20 text-center"
            style={{ background: "#131313", borderColor: "#2a2a2a", color: "#8a8888" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#20201f" }}
            >
              <CalendarDays className="w-7 h-7" style={{ color: "#cafd00", opacity: 0.5 }} />
            </div>
            <p className="text-sm mb-5">{t.common.noData}</p>
            <Link href="/admin/exercise-schedules/new">
              <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                {t.exerciseSchedules.createPlan}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border overflow-hidden flex flex-col card-interactive"
                style={{ background: "#131313", borderColor: "#2a2a2a" }}
              >
                {/* Cover */}
                <div
                  className="relative w-full h-32 flex items-center justify-center"
                  style={{ background: "#20201f" }}
                >
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.imageUrl}
                      alt={s.nameEn}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <CalendarDays className="w-10 h-10" style={{ color: "#cafd00", opacity: 0.3 }} />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant={difficultyVariant(s.difficultyLevel)}>
                      {t.exerciseSchedules[difficultyKey(s.difficultyLevel)]}
                    </Badge>
                  </div>
                  {s.isActive === false && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="neutral">{t.common.inactive}</Badge>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div>
                    <Link
                      href={`/admin/exercise-schedules/${s.id}`}
                      className="text-sm font-semibold leading-tight hover:underline"
                      style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                    >
                      {s.nameEn}
                    </Link>
                    <p className="text-xs mt-1" style={{ color: "#8a8888" }} dir="rtl" lang="ar">
                      {s.nameAr}
                    </p>
                  </div>

                  {s.descriptionEn && (
                    <p className="text-xs line-clamp-2" style={{ color: "#adaaaa" }}>
                      {s.descriptionEn}
                    </p>
                  )}

                  <div
                    className="flex items-center gap-4 text-xs mt-auto pt-1"
                    style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
                  >
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" style={{ color: "#cafd00" }} />
                      {s.days?.length ?? 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5" style={{ color: "#cafd00" }} />
                      {countExercises(s)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" style={{ color: "#cafd00" }} />
                      {countSets(s)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2 pt-3 border-t"
                    style={{ borderColor: "#20201f" }}
                  >
                    <Link
                      href={`/admin/exercise-schedules/${s.id}/details`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border transition-colors hover:bg-[#20201f]"
                      style={{ borderColor: "#2a2a2a", color: "#adaaaa" }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t.common.view}
                    </Link>
                    <Link
                      href={`/admin/exercise-schedules/${s.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border transition-colors hover:bg-[#20201f]"
                      style={{ borderColor: "#2a2a2a", color: "#adaaaa" }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {t.common.edit}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(s)}
                      title={t.common.delete}
                      className="p-2 rounded-xl transition-colors hover:bg-[#5c1620]/20"
                      style={{ color: "#ff6e81" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalCount / PER_PAGE) || 1}
          onPageChange={setPage}
          totalCount={totalCount}
          resultsPerPage={PER_PAGE}
        />
      </div>

      {/* ── Delete confirmation ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !submitting && setDeleteTarget(null)}
        title={t.exerciseSchedules.deleteConfirm}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" loading={submitting} onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "#adaaaa" }}>
          <span style={{ color: "#ffffff", fontWeight: 600 }}>{deleteTarget?.nameEn}</span>
        </p>
        <p className="text-sm mt-2" style={{ color: "#8a8888" }}>
          {deleteTarget?.days?.length ?? 0} {t.exerciseSchedules.days} ·{" "}
          {deleteTarget ? countExercises(deleteTarget) : 0} {t.exerciseSchedules.exercises}
        </p>
      </Modal>
    </DashboardLayout>
  );
}
