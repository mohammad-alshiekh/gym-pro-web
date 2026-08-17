"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Dumbbell, Edit2, Plus, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ExerciseFormModal from "@/components/exercises/ExerciseFormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { exercisesApi } from "@/lib/api";
import { exerciseImageUrl, type CatalogueExercise } from "@/lib/exercises";
import { difficultyKey, difficultyVariant } from "@/lib/schedules";
import toast from "react-hot-toast";

// Shared with the schedule builder's exercise picker.
type Exercise = CatalogueExercise;

export default function AdminExercisesPage() {
  const { t, isRtl } = useTranslation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);

  const perPage = 12;

  // Debounced so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exercisesApi.getAll({
        pageNumber: page,
        resultsPerPage: perPage,
        searchQuery: debounced || undefined,
      });
      setExercises(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error(t.exercises.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [debounced, page, t]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const openEdit = (e: React.MouseEvent, exercise: Exercise) => {
    // The card is a Link — keep the click from navigating to the detail page.
    e.preventDefault();
    e.stopPropagation();
    setEditTarget(exercise);
    setFormOpen(true);
  };

  return (
    <DashboardLayout title={t.exercises.title} requiredRole="super_admin">
      <div className="space-y-6">
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
              placeholder={t.exercises.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
              style={{
                background: "#0e0e0e",
                borderColor: "#2a2a2a",
                color: "#ffffff",
                outline: "none",
              }}
            />
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div
              className="text-sm"
              style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
            >
              {totalCount} {t.exercises.title}
            </div>
            <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              {t.exercises.createExercise}
            </Button>
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-64 shimmer" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div
            className="rounded-2xl border py-20 text-center"
            style={{ background: "#131313", borderColor: "#2a2a2a", color: "#8a8888" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#20201f" }}
            >
              <Dumbbell className="w-7 h-7" style={{ color: "#cafd00", opacity: 0.5 }} />
            </div>
            <p className="text-sm">{t.common.noData}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {exercises.map((ex) => {
              const thumb = exerciseImageUrl(ex.imageUrl);
              return (
                <Link
                  key={ex.id}
                  href={`/admin/exercises/${ex.id}`}
                  className="group rounded-2xl border p-4 flex flex-col gap-3 card-interactive"
                  style={{ background: "#131313", borderColor: "#2a2a2a" }}
                >
                  <div
                    className="w-full h-32 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ background: "#20201f" }}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={ex.nameEn}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.visibility = "hidden";
                        }}
                      />
                    ) : (
                      <Dumbbell className="w-8 h-8" style={{ color: "#cafd00", opacity: 0.3 }} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className="font-semibold text-sm leading-tight truncate"
                      style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                      dir="ltr"
                      title={ex.nameEn}
                    >
                      {ex.nameEn}
                    </p>
                    {ex.nameAr && (
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "#8a8888" }}
                        dir="rtl"
                        lang="ar"
                      >
                        {ex.nameAr}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={difficultyVariant(ex.level)}>
                      {t.exercises[difficultyKey(ex.level)]}
                    </Badge>
                    {ex.equipmentEn && (
                      <span className="text-xs truncate" style={{ color: "#8a8888" }} dir="ltr">
                        {ex.equipmentEn}
                      </span>
                    )}
                  </div>

                  {ex.primaryMuscleGroups && ex.primaryMuscleGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ex.primaryMuscleGroups.slice(0, 2).map((m) => (
                        <span
                          key={m.id}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(202,253,0,0.1)",
                            color: "#cafd00",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                          dir={isRtl && m.nameAr ? "rtl" : "ltr"}
                        >
                          {isRtl ? m.nameAr || m.nameEn : m.nameEn}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                    <span
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors group-hover:text-[#cafd00]"
                      style={{ color: "#8a8888", fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {t.common.details}
                      <ArrowRight
                        className="w-3.5 h-3.5"
                        style={{ transform: isRtl ? "scaleX(-1)" : undefined }}
                      />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => openEdit(e, ex)}
                      title={t.common.edit}
                      aria-label={`${t.common.edit} — ${isRtl ? ex.nameAr || ex.nameEn : ex.nameEn}`}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[#2a2a28]"
                      style={{ color: "#adaaaa" }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
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

      <ExerciseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        exercise={editTarget}
        onSaved={fetchExercises}
      />
    </DashboardLayout>
  );
}
