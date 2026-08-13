"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Flame,
  Hash,
  Pencil,
  Plus,
  Shield,
  Timer,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useExerciseCatalogue } from "@/hooks/useExerciseCatalogue";
import { schedulesApi } from "@/lib/api";
import { exerciseImageUrl } from "@/lib/exercises";
import {
  countDaySets,
  countExercises,
  countSets,
  difficultyColor,
  difficultyKey,
  difficultyVariant,
  formatSeconds,
  type ExerciseSchedule,
} from "@/lib/schedules";
import toast from "react-hot-toast";

export default function ExerciseScheduleDetailPage() {
  const { t, isRtl } = useTranslation();
  const { byId: catalogue } = useExerciseCatalogue();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [schedule, setSchedule] = useState<ExerciseSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSchedule = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await schedulesApi.getById(id);
      setSchedule(res.data);
      setExpandedDays(new Set((res.data.days ?? []).map((d) => d.id)));
      setError(null);
    } catch {
      setError(t.exerciseSchedules.planNotFound);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const sortedDays = useMemo(
    () => [...(schedule?.days ?? [])].sort((a, b) => a.dayNumber - b.dayNumber),
    [schedule]
  );

  const allExpanded = sortedDays.length > 0 && expandedDays.size === sortedDays.length;

  const toggleDay = (dayId: string) =>
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });

  const toggleAll = () =>
    setExpandedDays(allExpanded ? new Set() : new Set(sortedDays.map((d) => d.id)));

  const handleDelete = async () => {
    if (!schedule) return;
    setDeleting(true);
    try {
      await schedulesApi.delete(schedule.id);
      toast.success(t.exerciseSchedules.deleteSuccess);
      router.push("/admin/exercise-schedules");
    } catch {
      toast.error(t.exerciseSchedules.deleteFailed);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading / error states ──
  if (loading) {
    return (
      <DashboardLayout title={t.exerciseSchedules.title} requiredRole="super_admin">
        <div className="space-y-4">
          <div className="h-32 rounded-2xl shimmer" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl shimmer" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !schedule) {
    return (
      <DashboardLayout title={t.exerciseSchedules.title} requiredRole="super_admin">
        <div className="space-y-4">
          <Link
            href="/admin/exercise-schedules"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#c8f323]"
            style={{ color: "#8b93a1" }}
          >
            <ArrowLeft className="w-4 h-4" style={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
            {t.exerciseSchedules.backToPlans}
          </Link>
          <div
            className="p-6 rounded-2xl border text-sm"
            style={{
              background: "rgba(147,0,10,0.12)",
              borderColor: "#93000a",
              color: "#ffb4ab",
            }}
          >
            {error ?? t.exerciseSchedules.planNotFound}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      label: t.exerciseSchedules.trainingDays,
      value: sortedDays.length,
      icon: CalendarDays,
      color: "#c8f323",
    },
    {
      label: t.exerciseSchedules.totalExercises,
      value: countExercises(schedule),
      icon: Dumbbell,
      color: "#adc6ff",
    },
    {
      label: t.exerciseSchedules.totalSets,
      value: countSets(schedule),
      icon: BarChart3,
      color: "#4ae176",
    },
    {
      label: t.exerciseSchedules.difficultyLevel,
      value: t.exerciseSchedules[difficultyKey(schedule.difficultyLevel)],
      icon: Flame,
      color: difficultyColor(schedule.difficultyLevel),
    },
  ];

  return (
    <DashboardLayout title={schedule.nameEn} requiredRole="super_admin">
      <div className="space-y-6 pb-6">
        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <Link
              href="/admin/exercise-schedules"
              title={t.exerciseSchedules.backToPlans}
              className="mt-1 p-2.5 rounded-xl border transition-colors flex-shrink-0 hover:border-[#c8f323] hover:text-[#c8f323]"
              style={{ borderColor: "#2f3742", color: "#8b93a1" }}
            >
              <ArrowLeft
                className="w-4 h-4"
                style={{ transform: isRtl ? "scaleX(-1)" : undefined }}
              />
            </Link>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                >
                  {schedule.nameEn}
                </h1>
                <Badge variant={difficultyVariant(schedule.difficultyLevel)}>
                  {t.exerciseSchedules[difficultyKey(schedule.difficultyLevel)]}
                </Badge>
                <Badge variant={schedule.isActive !== false ? "success" : "neutral"}>
                  {schedule.isActive !== false ? t.common.active : t.common.inactive}
                </Badge>
              </div>

              <p className="text-base font-medium" style={{ color: "#8b93a1" }} dir="rtl" lang="ar">
                {schedule.nameAr}
              </p>

              {schedule.descriptionEn && (
                <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "#c3cad6" }}>
                  {schedule.descriptionEn}
                </p>
              )}
              {schedule.descriptionAr && (
                <p
                  className="text-sm max-w-2xl leading-relaxed"
                  style={{ color: "#8b93a1" }}
                  dir="rtl"
                  lang="ar"
                >
                  {schedule.descriptionAr}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <Link href={`/admin/exercise-schedules/${schedule.id}/edit`}>
              <Button variant="secondary" icon={<Pencil className="w-4 h-4" />}>
                {t.exerciseSchedules.editPlan}
              </Button>
            </Link>
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setDeleteOpen(true)}
            >
              {t.common.delete}
            </Button>
          </div>
        </div>

        {/* ── Cover ── */}
        {schedule.imageUrl && (
          <div
            className="w-full h-44 sm:h-56 rounded-2xl overflow-hidden border"
            style={{ background: "#23272e", borderColor: "#2f3742" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={schedule.imageUrl}
              alt={schedule.nameEn}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
              style={{ background: "#171a1e", borderColor: "#2f3742" }}
            >
              <div
                className="p-2 rounded-xl flex-shrink-0"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                <s.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-medium uppercase tracking-widest truncate"
                  style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
                >
                  {s.label}
                </p>
                <p
                  className="text-sm font-bold truncate mt-0.5"
                  style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                >
                  {s.value}
                </p>
              </div>
            </div>
          ))}

          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border col-span-2 lg:col-span-1"
            style={{ background: "#171a1e", borderColor: "#2f3742" }}
          >
            <div
              className="p-2 rounded-xl flex-shrink-0"
              style={{ background: "rgba(195,202,214,0.1)", color: "#c3cad6" }}
            >
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[10px] font-medium uppercase tracking-widest truncate"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
              >
                {t.exerciseSchedules.createdBy}
              </p>
              <p
                className="text-sm font-bold truncate mt-0.5"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#e9ecf1" }}
                title={schedule.createdByAdminId}
              >
                {schedule.createdByAdminId
                  ? `${schedule.createdByAdminId.slice(0, 8)}…`
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Days ── */}
        {sortedDays.length === 0 ? (
          <div
            className="rounded-2xl border py-16 text-center"
            style={{ background: "#171a1e", borderColor: "#2f3742" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#23272e" }}
            >
              <CalendarDays className="w-7 h-7" style={{ color: "#c8f323", opacity: 0.4 }} />
            </div>
            <p className="text-sm mb-4" style={{ color: "#8b93a1" }}>
              {t.exerciseSchedules.noDays}
            </p>
            <Link href={`/admin/exercise-schedules/${schedule.id}/edit`}>
              <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                {t.exerciseSchedules.addDay}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-semibold uppercase tracking-widest"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
              >
                {t.exerciseSchedules.days}
              </h2>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs transition-colors hover:text-[#c8f323]"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
              >
                {allExpanded ? t.exerciseSchedules.collapseAll : t.exerciseSchedules.expandAll}
              </button>
            </div>

            {sortedDays.map((day) => {
              const isExpanded = expandedDays.has(day.id);
              const totalSets = countDaySets(day);

              return (
                <div
                  key={day.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: "#171a1e", borderColor: "#2f3742" }}
                >
                  {/* Day header */}
                  <button
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#1c2025]"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="flex flex-col items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
                        style={{ background: "#c8f323", color: "#293500" }}
                      >
                        <span className="text-[8px] font-bold uppercase tracking-widest leading-none opacity-80">
                          {t.exerciseSchedules.day}
                        </span>
                        <span
                          className="text-sm font-extrabold leading-none mt-0.5"
                          style={{ fontFamily: "Lexend, sans-serif" }}
                        >
                          {day.dayNumber}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p
                          className="text-base font-bold truncate"
                          style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                        >
                          {day.nameEn}
                        </p>
                        {day.nameAr && (
                          <p
                            className="text-xs truncate"
                            style={{ color: "#8b93a1" }}
                            dir="rtl"
                            lang="ar"
                          >
                            {day.nameAr}
                          </p>
                        )}
                        <p
                          className="text-xs mt-1 truncate"
                          style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
                        >
                          {day.exercises.length} {t.exerciseSchedules.exercises}
                          <span className="mx-1.5" style={{ color: "#2f3742" }}>
                            ·
                          </span>
                          {totalSets} {t.exerciseSchedules.sets}
                        </p>
                      </div>
                    </div>

                    <div
                      className="p-1.5 rounded-lg flex-shrink-0"
                      style={{
                        background: isExpanded ? "rgba(200,243,35,0.1)" : "transparent",
                        color: isExpanded ? "#c8f323" : "#8b93a1",
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {/* Exercises */}
                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: "#23272e" }}>
                      {day.descriptionEn && (
                        <p
                          className="px-5 pt-4 text-sm leading-relaxed"
                          style={{ color: "#c3cad6" }}
                        >
                          {day.descriptionEn}
                        </p>
                      )}

                      {day.exercises.length === 0 ? (
                        <div
                          className="py-10 text-center text-sm italic"
                          style={{ color: "#8b93a1" }}
                        >
                          {t.exerciseSchedules.restDay}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[680px]">
                            <thead>
                              <tr className="border-b" style={{ borderColor: "#23272e" }}>
                                <th
                                  className="text-left text-[10px] font-medium uppercase tracking-widest px-5 py-3 w-12"
                                  style={{
                                    fontFamily: "JetBrains Mono, monospace",
                                    color: "#8b93a1",
                                  }}
                                >
                                  <Hash className="w-3 h-3 inline" />
                                </th>
                                {[
                                  t.exerciseSchedules.exercise,
                                  t.exerciseSchedules.sets,
                                  t.exerciseSchedules.notes,
                                ].map((head) => (
                                  <th
                                    key={head}
                                    className="text-left text-[10px] font-medium uppercase tracking-widest px-4 py-3"
                                    style={{
                                      fontFamily: "JetBrains Mono, monospace",
                                      color: "#8b93a1",
                                    }}
                                  >
                                    {head}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[...day.exercises]
                                .sort((a, b) => a.order - b.order)
                                .map((ex, exIdx) => (
                                  <tr
                                    key={ex.id}
                                    className="border-b transition-colors hover:bg-[#1c2025]"
                                    style={{ borderColor: "#1c2025" }}
                                  >
                                    <td className="px-5 py-4 align-top">
                                      <span
                                        className="flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
                                        style={{
                                          background: "#23272e",
                                          color: "#c8f323",
                                          fontFamily: "JetBrains Mono, monospace",
                                        }}
                                      >
                                        {exIdx + 1}
                                      </span>
                                    </td>

                                    <td className="px-4 py-4 align-top">
                                      <div className="flex items-start gap-3">
                                        <div
                                          className="w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                                          style={{ background: "#23272e" }}
                                        >
                                          {(() => {
                                            const thumb = exerciseImageUrl(
                                              catalogue.get(ex.exerciseId)?.imageUrl
                                            );
                                            return thumb ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                src={thumb}
                                                alt={ex.exerciseNameEn}
                                                loading="lazy"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  (
                                                    e.target as HTMLImageElement
                                                  ).style.visibility = "hidden";
                                                }}
                                              />
                                            ) : (
                                              <Dumbbell
                                                className="w-4 h-4"
                                                style={{ color: "#c8f323", opacity: 0.4 }}
                                              />
                                            );
                                          })()}
                                        </div>

                                        <div className="min-w-0">
                                          <p
                                            className="text-sm font-semibold leading-snug"
                                            style={{
                                              fontFamily: "Lexend, sans-serif",
                                              color: "#e9ecf1",
                                            }}
                                          >
                                            {ex.exerciseNameEn}
                                          </p>
                                          {ex.exerciseNameAr && (
                                            <p
                                              className="text-xs mt-0.5"
                                              style={{ color: "#8b93a1" }}
                                              dir="rtl"
                                              lang="ar"
                                            >
                                              {ex.exerciseNameAr}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </td>

                                    <td className="px-4 py-4 align-top">
                                      <div className="flex flex-wrap gap-1.5">
                                        {[...ex.sets]
                                          .sort((a, b) => a.setNumber - b.setNumber)
                                          .map((st) => (
                                            <div
                                              key={st.id}
                                              className="inline-flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg border min-w-[64px]"
                                              style={{
                                                background: "rgba(200,243,35,0.06)",
                                                borderColor: "rgba(200,243,35,0.2)",
                                              }}
                                              title={`${t.exerciseSchedules.rest}: ${formatSeconds(
                                                st.restSeconds
                                              )}`}
                                            >
                                              <span
                                                className="text-[11px] font-bold leading-none"
                                                style={{
                                                  color: "#c8f323",
                                                  fontFamily: "JetBrains Mono, monospace",
                                                }}
                                              >
                                                {st.reps} × {st.weight}kg
                                              </span>
                                              <span
                                                className="flex items-center gap-1 text-[9px] leading-none"
                                                style={{ color: "#8b93a1" }}
                                              >
                                                <Timer className="w-2.5 h-2.5" />
                                                {formatSeconds(st.restSeconds)}
                                                {st.durationSeconds > 0 && (
                                                  <> · {formatSeconds(st.durationSeconds)}</>
                                                )}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    </td>

                                    <td
                                      className="px-4 py-4 align-top text-sm max-w-[200px]"
                                      style={{ color: ex.notes ? "#c3cad6" : "#8b93a1" }}
                                    >
                                      {ex.notes || <span className="italic">—</span>}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: "#1c2025" }}>
                                <td colSpan={4} className="px-5 py-3">
                                  <div
                                    className="flex items-center gap-4 text-xs"
                                    style={{
                                      fontFamily: "JetBrains Mono, monospace",
                                      color: "#8b93a1",
                                    }}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Dumbbell className="w-3 h-3" style={{ color: "#c8f323" }} />
                                      {day.exercises.length} {t.exerciseSchedules.exercises}
                                    </span>
                                    <span style={{ color: "#2f3742" }}>·</span>
                                    <span className="flex items-center gap-1.5">
                                      <BarChart3 className="w-3 h-3" style={{ color: "#c8f323" }} />
                                      {totalSets} {t.exerciseSchedules.sets}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete confirmation ── */}
      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title={t.exerciseSchedules.deleteConfirm}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "#c3cad6" }}>
          <span style={{ color: "#e9ecf1", fontWeight: 600 }}>{schedule.nameEn}</span>
        </p>
        <p className="text-sm mt-2" style={{ color: "#8b93a1" }}>
          {sortedDays.length} {t.exerciseSchedules.days} · {countExercises(schedule)}{" "}
          {t.exerciseSchedules.exercises}
        </p>
      </Modal>
    </DashboardLayout>
  );
}
