"use client";

import { useEffect, useState, useCallback } from "react";
import { Dumbbell, Search, Eye } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { exercisesApi } from "@/lib/api";
import type { CatalogueExercise } from "@/lib/exercises";
import toast from "react-hot-toast";

// Shared with the schedule builder's exercise picker.
type Exercise = CatalogueExercise;

export default function AdminExercisesPage() {
  const { t } = useTranslation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewTarget, setViewTarget] = useState<Exercise | null>(null);

  const perPage = 12;

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exercisesApi.getAll({
        pageNumber: page,
        resultsPerPage: perPage,
        searchQuery: search || undefined,
      });
      setExercises(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error("Failed to load exercises");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const levelLabel = (l: number) => {
    if (l === 0) return "Beginner";
    if (l === 1) return "Intermediate";
    return "Expert";
  };

  const levelVariant = (l: number): "success" | "warning" | "danger" => {
    if (l === 0) return "success";
    if (l === 1) return "warning";
    return "danger";
  };

  return (
    <DashboardLayout title={t.exercises.title} requiredRole="super_admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8b93a1" }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
              style={{ background: "#0f1013", borderColor: "#2f3742", color: "#e9ecf1", outline: "none" }}
            />
          </div>
          <div className="text-sm" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}>
            {totalCount} exercises
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-40 shimmer" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8b93a1" }}>
            <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t.common.noData}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className="rounded-2xl border p-4 flex flex-col gap-3 card-interactive cursor-pointer"
                style={{ background: "#171a1e", borderColor: "#2f3742" }}
                onClick={() => setViewTarget(ex)}
              >
                {ex.imageUrl && (
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-[#23272e]">
                    <img
                      src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.imageUrl}`}
                      alt={ex.nameEn}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                {!ex.imageUrl && (
                  <div className="w-full h-32 rounded-xl bg-[#23272e] flex items-center justify-center">
                    <Dumbbell className="w-8 h-8 opacity-30" style={{ color: "#c8f323" }} />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm leading-tight" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>
                    {ex.nameEn}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8b93a1", direction: "rtl", textAlign: "left" }}>
                    {ex.nameAr}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={levelVariant(ex.level)}>{levelLabel(ex.level)}</Badge>
                  {ex.equipmentEn && (
                    <span className="text-xs" style={{ color: "#8b93a1" }}>{ex.equipmentEn}</span>
                  )}
                </div>
                {ex.primaryMuscleGroups && ex.primaryMuscleGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ex.primaryMuscleGroups.slice(0, 2).map((m) => (
                      <span key={m.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c8f32315", color: "#c8f323", fontFamily: "JetBrains Mono, monospace" }}>
                        {m.nameEn}
                      </span>
                    ))}
                  </div>
                )}
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

      {/* View Exercise Modal */}
      {viewTarget && (
        <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget.nameEn} size="lg">
          <div className="space-y-4">
            {viewTarget.imageUrl && (
              <div className="w-full h-48 rounded-xl overflow-hidden bg-[#23272e]">
                <img
                  src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${viewTarget.imageUrl}`}
                  alt={viewTarget.nameEn}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelVariant(viewTarget.level)}>{levelLabel(viewTarget.level)}</Badge>
              {viewTarget.equipmentEn && <Badge variant="neutral">{viewTarget.equipmentEn}</Badge>}
            </div>
            {viewTarget.primaryMuscleGroups && viewTarget.primaryMuscleGroups.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#c8f323", fontFamily: "JetBrains Mono, monospace" }}>PRIMARY MUSCLES</p>
                <div className="flex flex-wrap gap-2">
                  {viewTarget.primaryMuscleGroups.map((m) => (
                    <span key={m.id} className="px-3 py-1 rounded-full text-xs" style={{ background: "#c8f32315", color: "#c8f323" }}>{m.nameEn}</span>
                  ))}
                </div>
              </div>
            )}
            {viewTarget.secondaryMuscleGroups && viewTarget.secondaryMuscleGroups.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#4ae176", fontFamily: "JetBrains Mono, monospace" }}>SECONDARY MUSCLES</p>
                <div className="flex flex-wrap gap-2">
                  {viewTarget.secondaryMuscleGroups.map((m) => (
                    <span key={m.id} className="px-3 py-1 rounded-full text-xs" style={{ background: "#4ae17615", color: "#4ae176" }}>{m.nameEn}</span>
                  ))}
                </div>
              </div>
            )}
            {viewTarget.instructionsEn && viewTarget.instructionsEn.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#c3cad6", fontFamily: "JetBrains Mono, monospace" }}>INSTRUCTIONS</p>
                <ol className="space-y-2">
                  {viewTarget.instructionsEn.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm" style={{ color: "#c3cad6" }}>
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#c8f323", color: "#293500" }}>
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
