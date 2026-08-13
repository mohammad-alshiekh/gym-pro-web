"use client";

import { useMemo, useState } from "react";
import { Check, Dumbbell, Plus, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { useExerciseCatalogue } from "@/hooks/useExerciseCatalogue";
import {
  EMPTY_FILTERS,
  catalogueFacets,
  exerciseImageUrl,
  filterExercises,
  hasActiveFilters,
  type CatalogueExercise,
  type ExerciseFilters,
} from "@/lib/exercises";
import { DIFFICULTY_LEVELS, difficultyColor, difficultyKey } from "@/lib/schedules";

export interface PickedExercise {
  id: string;
  nameEn: string;
  nameAr: string;
}

interface ExercisePickerProps {
  /** "multi" adds several exercises at once; "single" swaps one slot. */
  mode: "single" | "multi";
  onClose: () => void;
  onSelect: (exercises: PickedExercise[]) => void;
  /** Highlighted as the current pick (single mode). */
  selectedId?: string;
  /** Already present in the day — marked as added. */
  existingIds?: string[];
}

const PER_PAGE = 10;

const selectStyle: React.CSSProperties = {
  background: "#0f1013",
  borderColor: "#2f3742",
  color: "#e9ecf1",
  outline: "none",
  fontFamily: "Inter, sans-serif",
};

export default function ExercisePicker({
  mode,
  onClose,
  onSelect,
  selectedId,
  existingIds = [],
}: ExercisePickerProps) {
  const { t } = useTranslation();
  const { exercises, loading, failed, reload } = useExerciseCatalogue();

  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<CatalogueExercise[]>([]);

  const facets = useMemo(() => catalogueFacets(exercises), [exercises]);
  const results = useMemo(() => filterExercises(exercises, filters), [exercises, filters]);

  const totalPages = Math.ceil(results.length / PER_PAGE) || 1;
  const safePage = Math.min(page, totalPages);
  const pageItems = results.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const patchFilters = (values: Partial<ExerciseFilters>) => {
    setFilters((prev) => ({ ...prev, ...values }));
    setPage(1);
  };

  const isPicked = (id: string) => picked.some((p) => p.id === id);

  const handleRowClick = (ex: CatalogueExercise) => {
    if (mode === "single") {
      onSelect([{ id: ex.id, nameEn: ex.nameEn, nameAr: ex.nameAr }]);
      onClose();
      return;
    }
    setPicked((prev) =>
      prev.some((p) => p.id === ex.id) ? prev.filter((p) => p.id !== ex.id) : [...prev, ex]
    );
  };

  const confirmMulti = () => {
    onSelect(picked.map((p) => ({ id: p.id, nameEn: p.nameEn, nameAr: p.nameAr })));
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t.exerciseSchedules.selectExercise}
      size="xl"
      footer={
        mode === "multi" ? (
          <div className="flex items-center justify-between gap-4 w-full">
            <span
              className="text-xs"
              style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
            >
              {picked.length} {t.exerciseSchedules.selectedCount}
            </span>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button
                variant="primary"
                onClick={confirmMulti}
                disabled={picked.length === 0}
                icon={<Plus className="w-4 h-4" />}
              >
                {t.exerciseSchedules.addSelected}
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* ── Search ── */}
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "#8b93a1" }}
          />
          <input
            autoFocus
            value={filters.query}
            onChange={(e) => patchFilters({ query: e.target.value })}
            placeholder={t.exerciseSchedules.searchExercises}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm input-accent"
            style={selectStyle}
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => patchFilters({ query: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-[#23272e]"
              style={{ color: "#8b93a1" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Filters ── */}
        <div
          className="rounded-xl border p-3 space-y-3"
          style={{ background: "#0f1013", borderColor: "#2f3742" }}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest"
              style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t.exerciseSchedules.filters}
            </span>
            {hasActiveFilters(filters) && (
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setPage(1);
                }}
                className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#c8f323]"
                style={{ color: "#8b93a1" }}
              >
                <RotateCcw className="w-3 h-3" />
                {t.exerciseSchedules.clearFilters}
              </button>
            )}
          </div>

          {/* Level chips */}
          <div className="flex flex-wrap gap-1.5">
            {(["", ...DIFFICULTY_LEVELS] as const).map((level) => {
              const isActive = filters.level === level;
              const label =
                level === ""
                  ? t.exerciseSchedules.allLevels
                  : t.exerciseSchedules[difficultyKey(level)];
              const accent = level === "" ? "#c8f323" : difficultyColor(level);
              return (
                <button
                  key={String(level)}
                  type="button"
                  onClick={() => patchFilters({ level })}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    background: isActive ? `${accent}18` : "transparent",
                    borderColor: isActive ? accent : "#2f3742",
                    color: isActive ? accent : "#c3cad6",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Muscle + equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={filters.muscleId}
              onChange={(e) => patchFilters({ muscleId: e.target.value })}
              className="w-full py-2 px-3 rounded-lg border text-sm cursor-pointer"
              style={selectStyle}
            >
              <option value="">{t.exerciseSchedules.allMuscles}</option>
              {facets.muscles.map((m) => (
                <option key={m.id} value={m.id} style={{ background: "#0f1013" }}>
                  {m.nameEn}
                </option>
              ))}
            </select>

            <select
              value={filters.equipment}
              onChange={(e) => patchFilters({ equipment: e.target.value })}
              className="w-full py-2 px-3 rounded-lg border text-sm cursor-pointer"
              style={selectStyle}
            >
              <option value="">{t.exerciseSchedules.allEquipment}</option>
              {facets.equipment.map((eq) => (
                <option key={eq} value={eq} style={{ background: "#0f1013" }}>
                  {eq}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Result count ── */}
        {!loading && !failed && (
          <p
            className="text-xs"
            style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
          >
            {results.length} {t.exerciseSchedules.resultsCount}
          </p>
        )}

        {/* ── Results ── */}
        {loading ? (
          <div className="space-y-2">
            <p className="text-xs text-center pb-1" style={{ color: "#8b93a1" }}>
              {t.exerciseSchedules.loadingCatalogue}
            </p>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[68px] rounded-xl shimmer" />
            ))}
          </div>
        ) : failed ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-sm" style={{ color: "#ffb4ab" }}>
              {t.exerciseSchedules.catalogueFailed}
            </p>
            <Button variant="secondary" size="sm" onClick={reload}>
              {t.exerciseSchedules.retry}
            </Button>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#8b93a1" }}>
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t.exerciseSchedules.noExercisesFound}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pageItems.map((ex) => {
              const chosen = mode === "multi" ? isPicked(ex.id) : ex.id === selectedId;
              const alreadyAdded = existingIds.includes(ex.id);
              const accent = difficultyColor(ex.level);
              const thumb = exerciseImageUrl(ex.imageUrl);

              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleRowClick(ex)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all hover:border-[#c8f323]"
                  style={{
                    background: chosen ? "rgba(200,243,35,0.07)" : "#0f1013",
                    borderColor: chosen ? "#c8f323" : "#2f3742",
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: "#23272e" }}
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
                      <Dumbbell className="w-5 h-5" style={{ color: "#c8f323", opacity: 0.4 }} />
                    )}
                  </div>

                  {/* Names + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                      >
                        {ex.nameEn}
                      </p>
                      {alreadyAdded && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0"
                          style={{
                            background: "rgba(195,202,214,0.12)",
                            color: "#c3cad6",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs truncate"
                      style={{ color: "#8b93a1" }}
                      dir="rtl"
                      lang="ar"
                    >
                      {ex.nameAr}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md"
                        style={{
                          background: `${accent}18`,
                          color: accent,
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {t.exerciseSchedules[difficultyKey(ex.level)]}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md"
                        style={{
                          background: "rgba(195,202,214,0.08)",
                          color: "#8b93a1",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {ex.equipmentEn || t.exerciseSchedules.noEquipment}
                      </span>
                      {(ex.primaryMuscleGroups ?? []).slice(0, 2).map((m) => (
                        <span
                          key={m.id}
                          className="text-[10px] px-1.5 py-0.5 rounded-md"
                          style={{ background: "rgba(173,198,255,0.1)", color: "#adc6ff" }}
                        >
                          {m.nameEn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pick indicator */}
                  <div
                    className="w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: chosen ? "#c8f323" : "#2f3742",
                      background: chosen ? "#c8f323" : "transparent",
                      color: chosen ? "#293500" : "#2f3742",
                    }}
                  >
                    {chosen ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && !failed && (
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            totalCount={results.length}
            resultsPerPage={PER_PAGE}
          />
        )}
      </div>
    </Modal>
  );
}
