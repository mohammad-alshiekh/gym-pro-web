/**
 * Exercise Schedules — shared types & helpers
 *
 * API: /ExerciseSchedule  (see src/lib/api.ts → schedulesApi)
 *
 * `difficultyLevel` uses the API's DifficultyLevelEnum, the same enum as
 * Exercise.level: 0 = Beginner, 1 = Intermediate, 2 = Expert (verified against
 * the live /Exercise catalogue). Change `difficultyKey` if that ever moves.
 */

// ─── API shapes ──────────────────────────────────────────────────────────────

export interface ScheduleSet {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
  restSeconds: number;
  durationSeconds: number;
}

export interface ScheduleExercise {
  id: string;
  exerciseId: string;
  exerciseNameEn: string;
  exerciseNameAr: string;
  order: number;
  notes?: string;
  sets: ScheduleSet[];
}

export interface ScheduleDay {
  id: string;
  dayNumber: number;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  exercises: ScheduleExercise[];
}

export interface ExerciseSchedule {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  imageUrl?: string;
  difficultyLevel: number;
  isActive: boolean;
  createdByAdminId: string;
  days: ScheduleDay[];
}

// ─── Request payloads ────────────────────────────────────────────────────────

export interface ScheduleSetInput {
  setNumber: number;
  reps: number;
  weight: number;
  restSeconds: number;
  durationSeconds: number;
}

export interface ScheduleExerciseInput {
  exerciseId: string;
  order: number;
  notes: string;
  sets: ScheduleSetInput[];
}

export interface ScheduleDayInput {
  dayNumber: number;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  exercises: ScheduleExerciseInput[];
}

/** POST body — the create DTO carries `createdByAdminId` but no `isActive`. */
export interface ScheduleInput {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string;
  difficultyLevel: number;
  createdByAdminId: string;
  days: ScheduleDayInput[];
}

/** PUT body — the update DTO carries `isActive` but no `createdByAdminId`. */
export interface ScheduleUpdateInput {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string;
  difficultyLevel: number;
  isActive: boolean;
  days: ScheduleDayInput[];
}

// ─── Difficulty ──────────────────────────────────────────────────────────────

export const DIFFICULTY_LEVELS = [0, 1, 2] as const;

export type DifficultyKey = "beginner" | "intermediate" | "expert";

export function difficultyKey(level: number): DifficultyKey {
  if (level <= 0) return "beginner";
  if (level === 1) return "intermediate";
  return "expert";
}

export function difficultyVariant(level: number): "success" | "warning" | "danger" {
  const key = difficultyKey(level);
  if (key === "beginner") return "success";
  if (key === "intermediate") return "warning";
  return "danger";
}

/** Accent colour used for difficulty pills / rings across the feature. */
export function difficultyColor(level: number): string {
  const key = difficultyKey(level);
  if (key === "beginner") return "#4ae176";
  if (key === "intermediate") return "#ffd04a";
  return "#ff6e81";
}

// ─── Aggregations ────────────────────────────────────────────────────────────

export function countExercises(schedule: Pick<ExerciseSchedule, "days">): number {
  return (schedule.days ?? []).reduce((n, d) => n + (d.exercises?.length ?? 0), 0);
}

export function countSets(schedule: Pick<ExerciseSchedule, "days">): number {
  return (schedule.days ?? []).reduce(
    (n, d) => n + (d.exercises ?? []).reduce((m, e) => m + (e.sets?.length ?? 0), 0),
    0
  );
}

export function countDaySets(day: Pick<ScheduleDay, "exercises">): number {
  return (day.exercises ?? []).reduce((n, e) => n + (e.sets?.length ?? 0), 0);
}

/** "90s" / "2m 30s" — used for rest & set duration chips. */
export function formatSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

// ─── Builder form state ──────────────────────────────────────────────────────
// Numeric fields are kept as strings so inputs can be cleared while editing.

export interface SetForm {
  key: string;
  reps: string;
  weight: string;
  restSeconds: string;
  durationSeconds: string;
}

export interface ExerciseForm {
  key: string;
  exerciseId: string;
  exerciseNameEn: string;
  exerciseNameAr: string;
  notes: string;
  sets: SetForm[];
}

export interface DayForm {
  key: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  exercises: ExerciseForm[];
}

export interface ScheduleForm {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string;
  difficultyLevel: number;
  /** Only sent on update — the create DTO has no isActive field. */
  isActive: boolean;
  days: DayForm[];
}

let keySeed = 0;
export function uid(prefix = "k"): string {
  keySeed += 1;
  return `${prefix}_${keySeed}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptySet(): SetForm {
  return { key: uid("set"), reps: "10", weight: "0", restSeconds: "60", durationSeconds: "0" };
}

export function emptyExercise(): ExerciseForm {
  return {
    key: uid("ex"),
    exerciseId: "",
    exerciseNameEn: "",
    exerciseNameAr: "",
    notes: "",
    sets: [emptySet()],
  };
}

export function emptyDay(): DayForm {
  return {
    key: uid("day"),
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    exercises: [],
  };
}

export function emptyScheduleForm(): ScheduleForm {
  return {
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    imageUrl: "",
    difficultyLevel: 0,
    isActive: true,
    days: [emptyDay()],
  };
}

export function toScheduleForm(schedule: ExerciseSchedule): ScheduleForm {
  return {
    nameEn: schedule.nameEn ?? "",
    nameAr: schedule.nameAr ?? "",
    descriptionEn: schedule.descriptionEn ?? "",
    descriptionAr: schedule.descriptionAr ?? "",
    imageUrl: schedule.imageUrl ?? "",
    difficultyLevel: schedule.difficultyLevel ?? 0,
    isActive: schedule.isActive !== false,
    days: [...(schedule.days ?? [])]
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map((day) => ({
        key: uid("day"),
        nameEn: day.nameEn ?? "",
        nameAr: day.nameAr ?? "",
        descriptionEn: day.descriptionEn ?? "",
        descriptionAr: day.descriptionAr ?? "",
        exercises: [...(day.exercises ?? [])]
          .sort((a, b) => a.order - b.order)
          .map((ex) => ({
            key: uid("ex"),
            exerciseId: ex.exerciseId,
            exerciseNameEn: ex.exerciseNameEn ?? "",
            exerciseNameAr: ex.exerciseNameAr ?? "",
            notes: ex.notes ?? "",
            sets: [...(ex.sets ?? [])]
              .sort((a, b) => a.setNumber - b.setNumber)
              .map((st) => ({
                key: uid("set"),
                reps: String(st.reps ?? 0),
                weight: String(st.weight ?? 0),
                restSeconds: String(st.restSeconds ?? 0),
                durationSeconds: String(st.durationSeconds ?? 0),
              })),
          })),
      })),
  };
}

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toBasePayload(form: ScheduleForm) {
  return {
    nameEn: form.nameEn.trim(),
    nameAr: form.nameAr.trim(),
    descriptionEn: form.descriptionEn.trim(),
    descriptionAr: form.descriptionAr.trim(),
    imageUrl: form.imageUrl.trim(),
    difficultyLevel: form.difficultyLevel,
    days: form.days.map((day, dayIdx) => ({
      dayNumber: dayIdx + 1,
      nameEn: day.nameEn.trim(),
      nameAr: day.nameAr.trim(),
      descriptionEn: day.descriptionEn.trim(),
      descriptionAr: day.descriptionAr.trim(),
      exercises: day.exercises.map((ex, exIdx) => ({
        exerciseId: ex.exerciseId,
        order: exIdx + 1,
        notes: ex.notes.trim(),
        sets: ex.sets.map((st, setIdx) => ({
          setNumber: setIdx + 1,
          reps: num(st.reps),
          weight: num(st.weight),
          restSeconds: num(st.restSeconds),
          durationSeconds: num(st.durationSeconds),
        })),
      })),
    })),
  };
}

export function toSchedulePayload(form: ScheduleForm, createdByAdminId: string): ScheduleInput {
  return { ...toBasePayload(form), createdByAdminId };
}

export function toScheduleUpdatePayload(form: ScheduleForm): ScheduleUpdateInput {
  return { ...toBasePayload(form), isActive: form.isActive };
}

export type ValidationCode =
  | "missingName"
  | "noDays"
  | "missingDayName"
  | "missingExercise"
  | "noSets";

/** Where the first problem lives, so the builder can highlight and scroll to it. */
export interface ValidationProblem {
  code: ValidationCode;
  /** Form key of the offending day / exercise, when the problem is nested. */
  dayKey?: string;
  exerciseKey?: string;
}

/** Returns the first problem found, or null when the form is submittable. */
export function validateScheduleForm(form: ScheduleForm): ValidationProblem | null {
  if (!form.nameEn.trim() || !form.nameAr.trim()) return { code: "missingName" };
  if (form.days.length === 0) return { code: "noDays" };
  for (const day of form.days) {
    if (!day.nameEn.trim() || !day.nameAr.trim())
      return { code: "missingDayName", dayKey: day.key };
    for (const ex of day.exercises) {
      if (!ex.exerciseId)
        return { code: "missingExercise", dayKey: day.key, exerciseKey: ex.key };
      if (ex.sets.length === 0)
        return { code: "noSets", dayKey: day.key, exerciseKey: ex.key };
    }
  }
  return null;
}

/** Maps a validation code to its key inside `t.exerciseSchedules`. */
export const VALIDATION_MESSAGE_KEYS = {
  missingName: "missingName",
  noDays: "noDaysError",
  missingDayName: "missingDayName",
  missingExercise: "missingExercise",
  noSets: "noSetsError",
} as const satisfies Record<ValidationCode, string>;

/** Moves an item inside an array, returning a new array. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
