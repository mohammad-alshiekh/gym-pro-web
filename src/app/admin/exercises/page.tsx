"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Dumbbell, Edit2, Plus, Search } from "lucide-react";
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
  const router = useRouter();
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
    // The row navigates to the detail page on click — keep this from doing that too.
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

        {/* ── Table ── */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
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
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2a2a2a", background: "#131313" }}>
            <div className="overflow-x-auto">
              {/* `dir` is pinned explicitly (not just inherited from the RTL
                  page shell) so the table's own column order and each
                  cell's text-align always agree — otherwise the browser
                  flips column order for a `dir=rtl` ancestor while a
                  physical `text-left` utility class stays put, and headers
                  drift away from the data underneath them. */}
              <table dir={isRtl ? "rtl" : "ltr"} className="w-full min-w-[800px]">
                <thead>
                  <tr style={{ background: "#1a1a1a" }}>
                    {[
                      t.exercises.exerciseName,
                      t.exercises.level,
                      t.exercises.equipment,
                      t.exercises.primaryMuscles,
                      "",
                    ].map((head, i) => (
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
                  {exercises.map((ex) => {
                    const thumb = exerciseImageUrl(ex.imageUrl);
                    const cell = `px-5 py-3 ${isRtl ? "text-right" : "text-left"}`;
                    return (
                      <tr
                        key={ex.id}
                        onClick={() => router.push(`/admin/exercises/${ex.id}`)}
                        className="border-t transition-colors hover:bg-[#1a1a1a] cursor-pointer"
                        style={{ borderColor: "#20201f" }}
                      >
                        <td className={cell}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
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
                                <Dumbbell className="w-4 h-4" style={{ color: "#cafd00", opacity: 0.4 }} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-medium truncate max-w-[200px]"
                                style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                                dir="ltr"
                                title={ex.nameEn}
                              >
                                {ex.nameEn}
                              </p>
                              {ex.nameAr && (
                                <p className="text-xs truncate max-w-[200px] mt-0.5" style={{ color: "#8a8888" }} dir="rtl" lang="ar">
                                  {ex.nameAr}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={cell}>
                          <Badge variant={difficultyVariant(ex.level)}>
                            {t.exercises[difficultyKey(ex.level)]}
                          </Badge>
                        </td>
                        <td className={cell}>
                          <span className="text-sm truncate max-w-[160px] inline-block" style={{ color: "#adaaaa" }} dir="ltr">
                            {ex.equipmentEn || "—"}
                          </span>
                        </td>
                        <td className={cell}>
                          {ex.primaryMuscleGroups && ex.primaryMuscleGroups.length > 0 ? (
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
                          ) : (
                            <span className="text-sm" style={{ color: "#8a8888" }}>—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => openEdit(e, ex)}
                              title={t.common.edit}
                              aria-label={`${t.common.edit} — ${isRtl ? ex.nameAr || ex.nameEn : ex.nameEn}`}
                              className="p-2 rounded-lg transition-colors hover:bg-[#20201f] hover:text-[#cafd00]"
                              style={{ color: "#adaaaa" }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <ChevronRight
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: "#8a8888", transform: isRtl ? "scaleX(-1)" : undefined }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
