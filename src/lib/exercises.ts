/**
 * Exercise catalogue — types, image URLs and client-side filtering.
 *
 * `GET /Exercise` only accepts pageNumber / resultsPerPage / searchQuery (no
 * filter parameters), so the picker loads the catalogue once per session and
 * filters in memory. That keeps search + muscle/equipment/level filters instant
 * and lets a single query match both English and Arabic names.
 */

import { exercisesApi } from "@/lib/api";

export interface MuscleGroupRef {
  id: string;
  nameEn: string;
  nameAr: string;
}

export interface CatalogueExercise {
  id: string;
  nameEn: string;
  nameAr: string;
  /** DifficultyLevelEnum: 0 = Beginner, 1 = Intermediate, 2 = Expert. */
  level: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isActive?: boolean;
  /** ForceEnum — see FORCE_KEYS. Null for exercises with no push/pull axis. */
  force?: number | null;
  /** MechanicEnum — see MECHANIC_KEYS. */
  mechanic?: number | null;
  /** CategoryEnum — see CATEGORY_KEYS. */
  category?: number | null;
  equipmentEn?: string | null;
  equipmentAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  instructionsEn?: string[] | null;
  instructionsAr?: string[] | null;
  primaryMuscleGroups?: MuscleGroupRef[];
  secondaryMuscleGroups?: MuscleGroupRef[];
}

/** Write shape of POST /Exercise and PUT /Exercise/{id}. Only the names are required. */
export interface ExerciseInput {
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  instructionsEn: string[] | null;
  instructionsAr: string[] | null;
  level: number | null;
  videoUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  force: number | null;
  mechanic: number | null;
  category: number | null;
  equipmentEn: string | null;
  equipmentAr: string | null;
  primaryMuscleGroupIds: string[];
  secondaryMuscleGroupIds: string[];
}

// ─── Classification enums ────────────────────────────────────────────────────

/**
 * The API types force/mechanic/category as bare integers, so the enum members
 * are not in the OpenAPI document. These orders were confirmed against all 873
 * catalogue rows and their free-exercise-db source records — the array index is
 * the wire value.
 */
export const FORCE_KEYS = ["pull", "push", "static"] as const;

export const MECHANIC_KEYS = ["compound", "isolation"] as const;

export const CATEGORY_KEYS = [
  "strength",
  "stretching",
  "plyometrics",
  "powerlifting",
  "olympicWeightlifting",
  "strongman",
  "cardio",
] as const;

export type ForceKey = (typeof FORCE_KEYS)[number];
export type MechanicKey = (typeof MECHANIC_KEYS)[number];
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** Enum value → i18n key, or null when unset or out of the known range. */
export function forceKey(value?: number | null): ForceKey | null {
  return value == null ? null : FORCE_KEYS[value] ?? null;
}

export function mechanicKey(value?: number | null): MechanicKey | null {
  return value == null ? null : MECHANIC_KEYS[value] ?? null;
}

export function categoryKey(value?: number | null): CategoryKey | null {
  return value == null ? null : CATEGORY_KEYS[value] ?? null;
}

/** Exercise images are relative paths into the free-exercise-db image set. */
export const EXERCISE_IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

export function exerciseImageUrl(path?: string | null): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${EXERCISE_IMAGE_BASE}${path}`;
}

// ─── Catalogue cache ─────────────────────────────────────────────────────────

const CATALOGUE_PAGE_SIZE = 1000; // the catalogue is ~873 exercises

let cache: CatalogueExercise[] | null = null;
let inFlight: Promise<CatalogueExercise[]> | null = null;

/**
 * Loads (and memoises for the session) the full exercise catalogue.
 * Concurrent callers share one request.
 */
export function loadExerciseCatalogue(): Promise<CatalogueExercise[]> {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;

  inFlight = exercisesApi
    .getAll({ pageNumber: 1, resultsPerPage: CATALOGUE_PAGE_SIZE })
    .then((res) => {
      const items = (res.data?.items ?? []) as CatalogueExercise[];
      cache = items;
      return items;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Drops the memoised catalogue so the next `loadExerciseCatalogue()` refetches.
 * Call after creating or updating an exercise — the schedule builder's picker
 * reads from this cache and would otherwise show the pre-edit row all session.
 */
export function invalidateExerciseCatalogue(): void {
  cache = null;
}

// ─── Filtering ───────────────────────────────────────────────────────────────

export interface ExerciseFilters {
  query: string;
  /** DifficultyLevelEnum value, or "" for all levels. */
  level: number | "";
  muscleId: string;
  equipment: string;
}

export const EMPTY_FILTERS: ExerciseFilters = {
  query: "",
  level: "",
  muscleId: "",
  equipment: "",
};

export function hasActiveFilters(filters: ExerciseFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.level !== "" ||
    filters.muscleId !== "" ||
    filters.equipment !== ""
  );
}

/** Distinct muscle groups and equipment present in the catalogue, sorted. */
export function catalogueFacets(exercises: CatalogueExercise[]) {
  const muscles = new Map<string, MuscleGroupRef>();
  const equipment = new Set<string>();

  for (const ex of exercises) {
    for (const m of ex.primaryMuscleGroups ?? []) {
      if (!muscles.has(m.id)) muscles.set(m.id, m);
    }
    if (ex.equipmentEn) equipment.add(ex.equipmentEn);
  }

  return {
    muscles: [...muscles.values()].sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
    equipment: [...equipment].sort((a, b) => a.localeCompare(b)),
  };
}

export function filterExercises(
  exercises: CatalogueExercise[],
  filters: ExerciseFilters
): CatalogueExercise[] {
  const query = filters.query.trim().toLowerCase();

  return exercises.filter((ex) => {
    if (query) {
      const haystack = `${ex.nameEn ?? ""} ${ex.nameAr ?? ""} ${ex.equipmentEn ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.level !== "" && ex.level !== filters.level) return false;
    if (filters.equipment && ex.equipmentEn !== filters.equipment) return false;
    if (filters.muscleId) {
      const muscles = [
        ...(ex.primaryMuscleGroups ?? []),
        ...(ex.secondaryMuscleGroups ?? []),
      ];
      if (!muscles.some((m) => m.id === filters.muscleId)) return false;
    }
    return true;
  });
}
