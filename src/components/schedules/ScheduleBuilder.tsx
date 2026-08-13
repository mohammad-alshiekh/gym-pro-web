"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Copy,
  Dumbbell,
  ImageIcon,
  Layers,
  Plus,
  Repeat,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ExercisePicker, { type PickedExercise } from "@/components/schedules/ExercisePicker";
import { useTranslation } from "@/hooks/useTranslation";
import { useExerciseCatalogue } from "@/hooks/useExerciseCatalogue";
import { exerciseImageUrl } from "@/lib/exercises";
import {
  DIFFICULTY_LEVELS,
  VALIDATION_MESSAGE_KEYS,
  difficultyColor,
  difficultyKey,
  difficultyVariant,
  emptyDay,
  emptyExercise,
  emptySet,
  moveItem,
  uid,
  validateScheduleForm,
  type DayForm,
  type ExerciseForm,
  type ScheduleForm,
  type ValidationProblem,
} from "@/lib/schedules";
import toast from "react-hot-toast";

interface ScheduleBuilderProps {
  initialForm: ScheduleForm;
  submitting: boolean;
  submitLabel: string;
  /** The create DTO has no isActive field, so the toggle is edit-only. */
  showPublishToggle?: boolean;
  onSubmit: (form: ScheduleForm) => void;
  onCancel: () => void;
}

// ─── Local styled primitives ─────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "#0f1013",
  borderColor: "#2f3742",
  color: "#e9ecf1",
  outline: "none",
  fontFamily: "Inter, sans-serif",
};

const monoLabel: React.CSSProperties = {
  fontFamily: "JetBrains Mono, monospace",
  color: "#8b93a1",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-medium uppercase tracking-widest" style={monoLabel}>
      {children}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  rtl,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rtl?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={rtl ? "rtl" : undefined}
        lang={rtl ? "ar" : undefined}
        className="w-full py-2.5 px-3.5 rounded-xl border text-sm transition-all input-accent"
        style={{
          ...inputStyle,
          borderColor: invalid ? "#ffb4ab" : "#2f3742",
          background: invalid ? "rgba(147,0,10,0.08)" : "#0f1013",
        }}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rtl,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rtl?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        dir={rtl ? "rtl" : undefined}
        lang={rtl ? "ar" : undefined}
        className="w-full py-2.5 px-3.5 rounded-xl border text-sm transition-all resize-y input-accent"
        style={inputStyle}
      />
    </div>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-lg transition-colors disabled:opacity-25 disabled:cursor-not-allowed hover:bg-[#23272e]"
      style={{ color: danger ? "#ffb4ab" : "#8b93a1" }}
    >
      {children}
    </button>
  );
}

function NumberCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-2 px-2.5 rounded-lg border text-sm text-center input-accent"
      style={{ ...inputStyle, fontFamily: "JetBrains Mono, monospace" }}
    />
  );
}

function Chip({ label, color, background }: { label: string; color: string; background: string }) {
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-md whitespace-nowrap"
      style={{ background, color, fontFamily: "JetBrains Mono, monospace" }}
    >
      {label}
    </span>
  );
}

// ─── Builder ─────────────────────────────────────────────────────────────────

export default function ScheduleBuilder({
  initialForm,
  submitting,
  submitLabel,
  showPublishToggle = false,
  onSubmit,
  onCancel,
}: ScheduleBuilderProps) {
  const { t } = useTranslation();
  const { byId: catalogue } = useExerciseCatalogue();

  const [form, setForm] = useState<ScheduleForm>(initialForm);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [problem, setProblem] = useState<ValidationProblem | null>(null);
  const [picker, setPicker] = useState<
    { mode: "single"; dayKey: string; exKey: string } | { mode: "multi"; dayKey: string } | null
  >(null);

  // Anchors used to scroll the first invalid day/exercise into view.
  const anchors = useRef(new Map<string, HTMLElement>());
  const registerAnchor = useCallback((key: string, el: HTMLElement | null) => {
    if (el) anchors.current.set(key, el);
    else anchors.current.delete(key);
  }, []);

  const totals = useMemo(() => {
    const exercises = form.days.reduce((n, d) => n + d.exercises.length, 0);
    const sets = form.days.reduce(
      (n, d) => n + d.exercises.reduce((m, e) => m + e.sets.length, 0),
      0
    );
    return { days: form.days.length, exercises, sets };
  }, [form.days]);

  // ── State updaters (any edit clears the current validation highlight) ──
  const patch = (values: Partial<ScheduleForm>) => {
    setProblem(null);
    setForm((prev) => ({ ...prev, ...values }));
  };

  const setDays = (updater: (days: DayForm[]) => DayForm[]) => {
    setProblem(null);
    setForm((prev) => ({ ...prev, days: updater(prev.days) }));
  };

  const updateDay = (dayKey: string, updater: (day: DayForm) => DayForm) =>
    setDays((days) => days.map((d) => (d.key === dayKey ? updater(d) : d)));

  const updateExercise = (
    dayKey: string,
    exKey: string,
    updater: (ex: ExerciseForm) => ExerciseForm
  ) =>
    updateDay(dayKey, (day) => ({
      ...day,
      exercises: day.exercises.map((e) => (e.key === exKey ? updater(e) : e)),
    }));

  const addDay = () => setDays((days) => [...days, emptyDay()]);

  const duplicateDay = (dayKey: string) =>
    setDays((days) => {
      const index = days.findIndex((d) => d.key === dayKey);
      if (index === -1) return days;
      const source = days[index];
      const copy: DayForm = {
        ...source,
        key: uid("day"),
        exercises: source.exercises.map((ex) => ({
          ...ex,
          key: uid("ex"),
          sets: ex.sets.map((st) => ({ ...st, key: uid("set") })),
        })),
      };
      const next = [...days];
      next.splice(index + 1, 0, copy);
      return next;
    });

  const removeDay = (dayKey: string) => setDays((days) => days.filter((d) => d.key !== dayKey));

  const moveDay = (dayKey: string, delta: number) =>
    setDays((days) => {
      const index = days.findIndex((d) => d.key === dayKey);
      return index === -1 ? days : moveItem(days, index, index + delta);
    });

  const toggleDay = (dayKey: string) =>
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayKey)) next.delete(dayKey);
      else next.add(dayKey);
      return next;
    });

  const removeExercise = (dayKey: string, exKey: string) =>
    updateDay(dayKey, (day) => ({
      ...day,
      exercises: day.exercises.filter((e) => e.key !== exKey),
    }));

  const moveExercise = (dayKey: string, exKey: string, delta: number) =>
    updateDay(dayKey, (day) => {
      const index = day.exercises.findIndex((e) => e.key === exKey);
      if (index === -1) return day;
      return { ...day, exercises: moveItem(day.exercises, index, index + delta) };
    });

  const addSet = (dayKey: string, exKey: string) =>
    updateExercise(dayKey, exKey, (ex) => {
      // New sets inherit the previous set's numbers — faster than retyping.
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, last ? { ...last, key: uid("set") } : emptySet()] };
    });

  const removeSet = (dayKey: string, exKey: string, setKey: string) =>
    updateExercise(dayKey, exKey, (ex) => ({
      ...ex,
      sets: ex.sets.filter((s) => s.key !== setKey),
    }));

  const updateSet = (
    dayKey: string,
    exKey: string,
    setKey: string,
    field: "reps" | "weight" | "restSeconds" | "durationSeconds",
    value: string
  ) =>
    updateExercise(dayKey, exKey, (ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.key === setKey ? { ...s, [field]: value } : s)),
    }));

  // ── Exercise picking ──
  const handlePicked = (picked: PickedExercise[]) => {
    if (!picker || picked.length === 0) return;

    if (picker.mode === "single") {
      const [first] = picked;
      updateExercise(picker.dayKey, picker.exKey, (ex) => ({
        ...ex,
        exerciseId: first.id,
        exerciseNameEn: first.nameEn,
        exerciseNameAr: first.nameAr,
      }));
      return;
    }

    updateDay(picker.dayKey, (day) => ({
      ...day,
      exercises: [
        ...day.exercises,
        ...picked.map((p) => ({
          ...emptyExercise(),
          exerciseId: p.id,
          exerciseNameEn: p.nameEn,
          exerciseNameAr: p.nameAr,
        })),
      ],
    }));
  };

  const pickerDay = picker ? form.days.find((d) => d.key === picker.dayKey) : undefined;
  const pickerSelectedId =
    picker?.mode === "single"
      ? pickerDay?.exercises.find((e) => e.key === picker.exKey)?.exerciseId
      : undefined;

  // ── Submit ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const found = validateScheduleForm(form);
    if (found) {
      setProblem(found);
      toast.error(t.exerciseSchedules[VALIDATION_MESSAGE_KEYS[found.code]]);

      if (found.dayKey) {
        setCollapsedDays((prev) => {
          const next = new Set(prev);
          next.delete(found.dayKey as string);
          return next;
        });
      }

      const anchorKey = found.exerciseKey ?? found.dayKey ?? "plan";
      window.requestAnimationFrame(() => {
        anchors.current.get(anchorKey)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    setProblem(null);
    onSubmit(form);
  };

  const nameInvalid = problem?.code === "missingName";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28">
      {/* ── Schedule details ── */}
      <section
        ref={(el) => registerAnchor("plan", el)}
        className="rounded-2xl border p-5 sm:p-6 space-y-5"
        style={{ background: "#171a1e", borderColor: "#2f3742" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(200,243,35,0.1)", color: "#c8f323" }}
            >
              <Layers className="w-4 h-4" />
            </div>
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
            >
              {t.exerciseSchedules.planDetails}
            </h2>
          </div>

          {showPublishToggle && (
            <button
              type="button"
              onClick={() => patch({ isActive: !form.isActive })}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors"
              style={{
                borderColor: form.isActive ? "#4ae176" : "#2f3742",
                background: form.isActive ? "rgba(74,225,118,0.08)" : "transparent",
              }}
              title={t.exerciseSchedules.publishedHint}
            >
              <span
                className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                style={{ background: form.isActive ? "#4ae176" : "#2f3742" }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    background: "#0f1013",
                    left: form.isActive ? "1.125rem" : "0.125rem",
                  }}
                />
              </span>
              <span
                className="text-xs font-medium"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color: form.isActive ? "#4ae176" : "#8b93a1",
                }}
              >
                {form.isActive ? t.exerciseSchedules.published : t.common.inactive}
              </span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label={t.exerciseSchedules.nameEn}
            value={form.nameEn}
            onChange={(v) => patch({ nameEn: v })}
            placeholder="3-Day Beginner Full Body Split"
            invalid={nameInvalid && !form.nameEn.trim()}
          />
          <TextField
            label={t.exerciseSchedules.nameAr}
            value={form.nameAr}
            onChange={(v) => patch({ nameAr: v })}
            placeholder="برنامج تقسيم الجسم للمبتدئين"
            rtl
            invalid={nameInvalid && !form.nameAr.trim()}
          />
          <TextArea
            label={t.exerciseSchedules.descriptionEn}
            value={form.descriptionEn}
            onChange={(v) => patch({ descriptionEn: v })}
          />
          <TextArea
            label={t.exerciseSchedules.descriptionAr}
            value={form.descriptionAr}
            onChange={(v) => patch({ descriptionAr: v })}
            rtl
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <FieldLabel>{t.exerciseSchedules.imageUrl}</FieldLabel>
            <div className="relative">
              <ImageIcon
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "#8b93a1" }}
              />
              <input
                value={form.imageUrl}
                onChange={(e) => patch({ imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full py-2.5 pl-10 pr-3.5 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
            <p className="text-xs" style={{ color: "#8b93a1" }}>
              {t.exerciseSchedules.imageUrlHint}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t.exerciseSchedules.difficultyLevel}</FieldLabel>
            <div className="flex gap-2">
              {DIFFICULTY_LEVELS.map((level) => {
                const isActive = form.difficultyLevel === level;
                const accent = difficultyColor(level);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => patch({ difficultyLevel: level })}
                    className="flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      background: isActive ? `${accent}18` : "#0f1013",
                      borderColor: isActive ? accent : "#2f3742",
                      color: isActive ? accent : "#c3cad6",
                    }}
                  >
                    {t.exerciseSchedules[difficultyKey(level)]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {form.imageUrl.trim() !== "" && (
          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t.exerciseSchedules.coverPreview}</FieldLabel>
            <div
              className="w-full max-w-md h-36 rounded-xl overflow-hidden border"
              style={{ background: "#23272e", borderColor: "#2f3742" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl}
                alt={t.exerciseSchedules.coverPreview}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.visibility = "hidden";
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Days ── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(200,243,35,0.1)", color: "#c8f323" }}
            >
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
              >
                {t.exerciseSchedules.days}
              </h2>
              <p className="text-xs" style={{ color: "#8b93a1" }}>
                {t.exerciseSchedules.unsavedHint}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 text-xs"
            style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
          >
            <span>
              {totals.days} {t.exerciseSchedules.days}
            </span>
            <span style={{ color: "#2f3742" }}>·</span>
            <span>
              {totals.exercises} {t.exerciseSchedules.exercises}
            </span>
            <span style={{ color: "#2f3742" }}>·</span>
            <span>
              {totals.sets} {t.exerciseSchedules.sets}
            </span>
          </div>
        </div>

        {form.days.map((day, dayIdx) => {
          const isCollapsed = collapsedDays.has(day.key);
          const daySets = day.exercises.reduce((n, e) => n + e.sets.length, 0);
          const dayInvalid = problem?.code === "missingDayName" && problem.dayKey === day.key;

          return (
            <div
              key={day.key}
              ref={(el) => registerAnchor(day.key, el)}
              className="rounded-2xl border overflow-hidden transition-colors"
              style={{
                background: "#171a1e",
                borderColor: dayInvalid ? "#ffb4ab" : "#2f3742",
              }}
            >
              {/* Day header */}
              <div
                className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b"
                style={{ background: "#1c2025", borderColor: "#2f3742" }}
              >
                <div
                  className="flex flex-col items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                  style={{ background: "#c8f323", color: "#293500" }}
                >
                  <span className="text-[8px] font-bold uppercase tracking-widest leading-none opacity-80">
                    {t.exerciseSchedules.day}
                  </span>
                  <span
                    className="text-sm font-extrabold leading-none mt-0.5"
                    style={{ fontFamily: "Lexend, sans-serif" }}
                  >
                    {dayIdx + 1}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                    >
                      {day.nameEn || `${t.exerciseSchedules.day} ${dayIdx + 1}`}
                    </p>
                    {day.exercises.length === 0 && (
                      <Chip
                        label={t.exerciseSchedules.emptyDayBadge}
                        color="#8b93a1"
                        background="rgba(195,202,214,0.1)"
                      />
                    )}
                  </div>
                  <p className="text-xs truncate" style={monoLabel}>
                    {day.exercises.length} {t.exerciseSchedules.exercises} · {daySets}{" "}
                    {t.exerciseSchedules.sets}
                  </p>
                </button>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <IconButton
                    title={t.exerciseSchedules.moveUp}
                    onClick={() => moveDay(day.key, -1)}
                    disabled={dayIdx === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    title={t.exerciseSchedules.moveDown}
                    onClick={() => moveDay(day.key, 1)}
                    disabled={dayIdx === form.days.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    title={t.exerciseSchedules.duplicateDay}
                    onClick={() => duplicateDay(day.key)}
                  >
                    <Copy className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    title={t.exerciseSchedules.removeDay}
                    onClick={() => removeDay(day.key)}
                    danger
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                  <button
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[#23272e] ml-1"
                    style={{ color: "#c3cad6" }}
                    aria-label={
                      isCollapsed ? t.exerciseSchedules.expandAll : t.exerciseSchedules.collapseAll
                    }
                  >
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-4 sm:p-5 space-y-5">
                  {/* Day fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label={t.exerciseSchedules.nameEn}
                      value={day.nameEn}
                      onChange={(v) => updateDay(day.key, (d) => ({ ...d, nameEn: v }))}
                      placeholder="Pull Day (Back & Biceps)"
                      invalid={dayInvalid && !day.nameEn.trim()}
                    />
                    <TextField
                      label={t.exerciseSchedules.nameAr}
                      value={day.nameAr}
                      onChange={(v) => updateDay(day.key, (d) => ({ ...d, nameAr: v }))}
                      placeholder="يوم السحب (الظهر والبايسبس)"
                      rtl
                      invalid={dayInvalid && !day.nameAr.trim()}
                    />
                    <TextField
                      label={t.exerciseSchedules.descriptionEn}
                      value={day.descriptionEn}
                      onChange={(v) => updateDay(day.key, (d) => ({ ...d, descriptionEn: v }))}
                    />
                    <TextField
                      label={t.exerciseSchedules.descriptionAr}
                      value={day.descriptionAr}
                      onChange={(v) => updateDay(day.key, (d) => ({ ...d, descriptionAr: v }))}
                      rtl
                    />
                  </div>

                  {/* Exercises */}
                  <div className="space-y-3">
                    {day.exercises.length === 0 && (
                      <div
                        className="rounded-xl border border-dashed py-8 text-center text-sm"
                        style={{ borderColor: "#2f3742", color: "#8b93a1" }}
                      >
                        <Dumbbell className="w-7 h-7 mx-auto mb-2 opacity-30" />
                        {t.exerciseSchedules.noExercises}
                        <p className="text-xs mt-1 opacity-70">
                          {t.exerciseSchedules.restDayHint}
                        </p>
                      </div>
                    )}

                    {day.exercises.map((ex, exIdx) => {
                      const meta = catalogue.get(ex.exerciseId);
                      const thumb = exerciseImageUrl(meta?.imageUrl);
                      const exInvalid = problem?.exerciseKey === ex.key;

                      return (
                        <div
                          key={ex.key}
                          ref={(el) => registerAnchor(ex.key, el)}
                          className="rounded-xl border transition-colors"
                          style={{
                            background: "#0f1013",
                            borderColor: exInvalid ? "#ffb4ab" : "#2f3742",
                          }}
                        >
                          {/* Exercise header */}
                          <div
                            className="flex items-center gap-3 p-3 border-b"
                            style={{ borderColor: "#23272e" }}
                          >
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: "#23272e",
                                color: "#c8f323",
                                fontFamily: "JetBrains Mono, monospace",
                              }}
                            >
                              {exIdx + 1}
                            </span>

                            {/* Thumbnail */}
                            <div
                              className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                              style={{ background: "#23272e" }}
                            >
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumb}
                                  alt={ex.exerciseNameEn}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.visibility = "hidden";
                                  }}
                                />
                              ) : (
                                <Dumbbell
                                  className="w-4 h-4"
                                  style={{ color: "#c8f323", opacity: 0.4 }}
                                />
                              )}
                            </div>

                            {ex.exerciseId ? (
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-sm font-semibold truncate"
                                  style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                                >
                                  {ex.exerciseNameEn}
                                </p>
                                {ex.exerciseNameAr && (
                                  <p
                                    className="text-xs truncate"
                                    style={{ color: "#8b93a1" }}
                                    dir="rtl"
                                    lang="ar"
                                  >
                                    {ex.exerciseNameAr}
                                  </p>
                                )}
                                {meta && (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <Chip
                                      label={t.exerciseSchedules[difficultyKey(meta.level)]}
                                      color={difficultyColor(meta.level)}
                                      background={`${difficultyColor(meta.level)}18`}
                                    />
                                    <Chip
                                      label={meta.equipmentEn || t.exerciseSchedules.noEquipment}
                                      color="#8b93a1"
                                      background="rgba(195,202,214,0.08)"
                                    />
                                    {(meta.primaryMuscleGroups ?? []).slice(0, 3).map((m) => (
                                      <Chip
                                        key={m.id}
                                        label={m.nameEn}
                                        color="#adc6ff"
                                        background="rgba(173,198,255,0.1)"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setPicker({ mode: "single", dayKey: day.key, exKey: ex.key })
                                }
                                className="flex-1 text-left text-sm px-3 py-2 rounded-lg border border-dashed transition-colors hover:border-[#c8f323] hover:text-[#c8f323]"
                                style={{
                                  borderColor: exInvalid ? "#ffb4ab" : "#2f3742",
                                  color: exInvalid ? "#ffb4ab" : "#8b93a1",
                                }}
                              >
                                {t.exerciseSchedules.chooseExercise}
                              </button>
                            )}

                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {ex.exerciseId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPicker({ mode: "single", dayKey: day.key, exKey: ex.key })
                                  }
                                  className="text-xs px-2.5 py-1 rounded-lg border transition-colors hover:border-[#c8f323] hover:text-[#c8f323]"
                                  style={{ borderColor: "#2f3742", color: "#c3cad6" }}
                                >
                                  {t.exerciseSchedules.changeExercise}
                                </button>
                              )}
                              <IconButton
                                title={t.exerciseSchedules.moveUp}
                                onClick={() => moveExercise(day.key, ex.key, -1)}
                                disabled={exIdx === 0}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </IconButton>
                              <IconButton
                                title={t.exerciseSchedules.moveDown}
                                onClick={() => moveExercise(day.key, ex.key, 1)}
                                disabled={exIdx === day.exercises.length - 1}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </IconButton>
                              <IconButton
                                title={t.exerciseSchedules.removeExercise}
                                onClick={() => removeExercise(day.key, ex.key)}
                                danger
                              >
                                <X className="w-4 h-4" />
                              </IconButton>
                            </div>
                          </div>

                          {/* Sets + notes */}
                          <div className="p-3.5 space-y-3">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[520px]">
                                <thead>
                                  <tr>
                                    {[
                                      t.exerciseSchedules.set,
                                      t.exerciseSchedules.reps,
                                      t.exerciseSchedules.weight,
                                      t.exerciseSchedules.rest,
                                      t.exerciseSchedules.durationSeconds,
                                      "",
                                    ].map((head, i) => (
                                      <th
                                        key={i}
                                        className="text-left text-[10px] font-medium uppercase tracking-widest pb-2 px-1"
                                        style={monoLabel}
                                      >
                                        {head}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {ex.sets.map((st, setIdx) => (
                                    <tr key={st.key}>
                                      <td className="py-1 px-1 w-12">
                                        <span
                                          className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
                                          style={{
                                            background: "#23272e",
                                            color: "#c3cad6",
                                            fontFamily: "JetBrains Mono, monospace",
                                          }}
                                        >
                                          {setIdx + 1}
                                        </span>
                                      </td>
                                      <td className="py-1 px-1">
                                        <NumberCell
                                          value={st.reps}
                                          onChange={(v) =>
                                            updateSet(day.key, ex.key, st.key, "reps", v)
                                          }
                                        />
                                      </td>
                                      <td className="py-1 px-1">
                                        <NumberCell
                                          value={st.weight}
                                          onChange={(v) =>
                                            updateSet(day.key, ex.key, st.key, "weight", v)
                                          }
                                        />
                                      </td>
                                      <td className="py-1 px-1">
                                        <NumberCell
                                          value={st.restSeconds}
                                          onChange={(v) =>
                                            updateSet(day.key, ex.key, st.key, "restSeconds", v)
                                          }
                                        />
                                      </td>
                                      <td className="py-1 px-1">
                                        <NumberCell
                                          value={st.durationSeconds}
                                          onChange={(v) =>
                                            updateSet(day.key, ex.key, st.key, "durationSeconds", v)
                                          }
                                        />
                                      </td>
                                      <td className="py-1 px-1 w-10">
                                        <IconButton
                                          title={t.exerciseSchedules.removeSet}
                                          onClick={() => removeSet(day.key, ex.key, st.key)}
                                          disabled={ex.sets.length === 1}
                                          danger
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </IconButton>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                              <div className="flex-1">
                                <TextField
                                  label={t.exerciseSchedules.notes}
                                  value={ex.notes}
                                  onChange={(v) =>
                                    updateExercise(day.key, ex.key, (e) => ({ ...e, notes: v }))
                                  }
                                  placeholder={t.exerciseSchedules.notesPlaceholder}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => addSet(day.key, ex.key)}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors hover:border-[#c8f323] hover:text-[#c8f323]"
                                style={{
                                  borderColor: "#2f3742",
                                  color: "#c3cad6",
                                  fontFamily: "JetBrains Mono, monospace",
                                }}
                              >
                                <Repeat className="w-3.5 h-3.5" />
                                {t.exerciseSchedules.addSet}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setPicker({ mode: "multi", dayKey: day.key })}
                      className="w-full py-3 rounded-xl border border-dashed text-sm font-medium transition-colors hover:border-[#c8f323] hover:text-[#c8f323] flex items-center justify-center gap-2"
                      style={{ borderColor: "#2f3742", color: "#c3cad6" }}
                    >
                      <Plus className="w-4 h-4" />
                      {t.exerciseSchedules.addExercise}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addDay}
          className="w-full py-4 rounded-2xl border border-dashed text-sm font-semibold transition-colors hover:border-[#c8f323] hover:text-[#c8f323] flex items-center justify-center gap-2"
          style={{ borderColor: "#2f3742", color: "#c3cad6", fontFamily: "Lexend, sans-serif" }}
        >
          <Plus className="w-4 h-4" />
          {t.exerciseSchedules.addDay}
        </button>
      </section>

      {/* ── Sticky action bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t px-4 sm:px-6 py-3"
        style={{
          background: "rgba(15,16,19,0.92)",
          borderColor: "#2f3742",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-center justify-between gap-4 max-w-[1400px] mx-auto">
          <div className="hidden sm:flex items-center gap-3">
            <Badge variant={difficultyVariant(form.difficultyLevel)}>
              {t.exerciseSchedules[difficultyKey(form.difficultyLevel)]}
            </Badge>
            {[
              { icon: CalendarDays, value: totals.days },
              { icon: Dumbbell, value: totals.exercises },
              { icon: BarChart3, value: totals.sets },
            ].map((s, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}
              >
                <s.icon className="w-3.5 h-3.5" style={{ color: "#c8f323" }} />
                {s.value}
              </span>
            ))}
            {problem && (
              <span className="text-xs" style={{ color: "#ffb4ab" }}>
                {t.exerciseSchedules.fixHighlighted}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              icon={<Save className="w-4 h-4" />}
            >
              {submitting ? t.exerciseSchedules.saving : submitLabel}
            </Button>
          </div>
        </div>
      </div>

      {picker && (
        <ExercisePicker
          key={picker.mode === "single" ? `${picker.dayKey}:${picker.exKey}` : picker.dayKey}
          mode={picker.mode}
          onClose={() => setPicker(null)}
          onSelect={handlePicked}
          selectedId={pickerSelectedId}
          existingIds={(pickerDay?.exercises ?? []).map((e) => e.exerciseId).filter(Boolean)}
        />
      )}
    </form>
  );
}
