"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { exercisesApi, muscleGroupsApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import {
  CATEGORY_KEYS,
  FORCE_KEYS,
  MECHANIC_KEYS,
  invalidateExerciseCatalogue,
  type CatalogueExercise,
  type ExerciseInput,
  type MuscleGroupRef,
} from "@/lib/exercises";
import { DIFFICULTY_LEVELS, difficultyKey } from "@/lib/schedules";
import toast from "react-hot-toast";

const MONO = "JetBrains Mono, monospace";

const inputStyle: React.CSSProperties = {
  background: "#0e0e0e",
  borderColor: "#2a2a2a",
  color: "#ffffff",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: MONO,
  color: "#adaaaa",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

/**
 * Form state mirrors ExerciseInput, except the nullable enums are held as
 * strings so the native <select> can carry an "unset" option, and the two
 * instruction lists keep their blank rows until submit trims them.
 */
interface FormState {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  instructionsEn: string[];
  instructionsAr: string[];
  level: string;
  force: string;
  mechanic: string;
  category: string;
  equipmentEn: string;
  equipmentAr: string;
  videoUrl: string;
  imageUrl: string;
  isActive: boolean;
  primaryMuscleGroupIds: string[];
  secondaryMuscleGroupIds: string[];
}

const emptyForm: FormState = {
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  instructionsEn: [""],
  instructionsAr: [""],
  level: "0",
  force: "",
  mechanic: "",
  category: "",
  equipmentEn: "",
  equipmentAr: "",
  videoUrl: "",
  imageUrl: "",
  isActive: true,
  primaryMuscleGroupIds: [],
  secondaryMuscleGroupIds: [],
};

function toForm(ex: CatalogueExercise): FormState {
  // A list with no rows would render an empty editor, so seed one blank step.
  const steps = (v?: string[] | null) => (v && v.length > 0 ? [...v] : [""]);
  const num = (v?: number | null) => (v == null ? "" : String(v));

  return {
    nameEn: ex.nameEn ?? "",
    nameAr: ex.nameAr ?? "",
    descriptionEn: ex.descriptionEn ?? "",
    descriptionAr: ex.descriptionAr ?? "",
    instructionsEn: steps(ex.instructionsEn),
    instructionsAr: steps(ex.instructionsAr),
    level: num(ex.level) || "0",
    force: num(ex.force),
    mechanic: num(ex.mechanic),
    category: num(ex.category),
    equipmentEn: ex.equipmentEn ?? "",
    equipmentAr: ex.equipmentAr ?? "",
    videoUrl: ex.videoUrl ?? "",
    imageUrl: ex.imageUrl ?? "",
    isActive: ex.isActive !== false,
    primaryMuscleGroupIds: (ex.primaryMuscleGroups ?? []).map((m) => m.id),
    secondaryMuscleGroupIds: (ex.secondaryMuscleGroups ?? []).map((m) => m.id),
  };
}

/** Empty strings are sent as null so the API clears the column rather than storing "". */
function toPayload(form: FormState): ExerciseInput {
  const text = (v: string) => {
    const trimmed = v.trim();
    return trimmed === "" ? null : trimmed;
  };
  const steps = (v: string[]) => {
    const kept = v.map((s) => s.trim()).filter(Boolean);
    return kept.length > 0 ? kept : null;
  };
  const enumValue = (v: string) => (v === "" ? null : Number(v));

  return {
    nameEn: form.nameEn.trim(),
    nameAr: form.nameAr.trim(),
    descriptionEn: text(form.descriptionEn),
    descriptionAr: text(form.descriptionAr),
    instructionsEn: steps(form.instructionsEn),
    instructionsAr: steps(form.instructionsAr),
    level: enumValue(form.level),
    videoUrl: text(form.videoUrl),
    imageUrl: text(form.imageUrl),
    isActive: form.isActive,
    force: enumValue(form.force),
    mechanic: enumValue(form.mechanic),
    category: enumValue(form.category),
    equipmentEn: text(form.equipmentEn),
    equipmentAr: text(form.equipmentAr),
    primaryMuscleGroupIds: form.primaryMuscleGroupIds,
    secondaryMuscleGroupIds: form.secondaryMuscleGroupIds,
  };
}

// ─── Field primitives ────────────────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label style={labelStyle} className="block mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs mt-1.5" style={{ color: "#8a8888" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest flex-shrink-0"
          style={{ fontFamily: MONO, color: "#cafd00" }}
        >
          {title}
        </span>
        <span className="h-px flex-1" style={{ background: "#2a2a2a" }} />
      </div>
      {children}
    </div>
  );
}

/** Ordered, editable instruction steps — the API stores them as a string array. */
function StepsEditor({
  label,
  steps,
  dir,
  placeholder,
  addLabel,
  removeLabel,
  onChange,
}: {
  label: string;
  steps: string[];
  /** Content language of this list, independent of the UI locale. */
  dir: "ltr" | "rtl";
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  onChange: (steps: string[]) => void;
}) {
  const update = (index: number, value: string) =>
    onChange(steps.map((s, i) => (i === index ? value : s)));

  // Never drop the last row — the editor needs something to type into.
  const remove = (index: number) =>
    onChange(steps.length === 1 ? [""] : steps.filter((_, i) => i !== index));

  return (
    <Field label={label}>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className="flex-shrink-0 w-6 h-6 mt-2 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: "#20201f", color: "#cafd00", fontFamily: MONO }}
            >
              {i + 1}
            </span>
            <textarea
              value={step}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              rows={2}
              dir={dir}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border text-sm input-accent resize-y"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 mt-1.5 rounded-lg flex-shrink-0 transition-colors hover:bg-[#5c1620]/20"
              style={{ color: "#ff6e81" }}
              title={removeLabel}
              aria-label={`${removeLabel} ${i + 1} — ${label}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...steps, ""])}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[#cafd00]"
        style={{ color: "#8a8888", fontFamily: MONO }}
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </Field>
  );
}

/** Muscle-group multi-select rendered as toggle chips (there are only ~19). */
function MuscleChipPicker({
  label,
  hint,
  groups,
  selected,
  color,
  isRtl,
  onToggle,
}: {
  label: string;
  hint: string;
  groups: MuscleGroupRef[];
  selected: string[];
  color: string;
  isRtl: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {groups.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              aria-pressed={on}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{
                background: on ? `${color}15` : "#0e0e0e",
                borderColor: on ? color : "#2a2a2a",
                color: on ? color : "#8a8888",
              }}
              dir={isRtl && m.nameAr ? "rtl" : "ltr"}
              lang={isRtl && m.nameAr ? "ar" : "en"}
            >
              {isRtl ? m.nameAr || m.nameEn : m.nameEn}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ExerciseFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Null creates a new exercise; otherwise the form opens pre-filled for a PUT. */
  exercise?: CatalogueExercise | null;
  /** Receives the saved exercise so the caller can refresh without a round trip. */
  onSaved: (exercise: CatalogueExercise | null) => void;
}

export default function ExerciseFormModal({
  open,
  onClose,
  exercise = null,
  onSaved,
}: ExerciseFormModalProps) {
  const { t, isRtl } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [muscles, setMuscles] = useState<MuscleGroupRef[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(exercise);
  const ph = t.exercises.placeholders;

  // Reset whenever the modal opens so a cancelled edit never leaks into the next one.
  useEffect(() => {
    if (open) setForm(exercise ? toForm(exercise) : emptyForm);
  }, [open, exercise]);

  useEffect(() => {
    if (!open || muscles.length > 0) return;
    let cancelled = false;

    muscleGroupsApi
      .getAll({ pageNumber: 1, resultsPerPage: 200 })
      .then((res) => {
        if (cancelled) return;
        const items = (res.data as { items?: MuscleGroupRef[] })?.items ?? [];
        setMuscles(items);
      })
      .catch(() => {
        if (!cancelled) toast.error(t.exercises.muscleGroupsFailed);
      });

    return () => {
      cancelled = true;
    };
  }, [open, muscles.length, t]);

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const toggleMuscle = (key: "primaryMuscleGroupIds" | "secondaryMuscleGroupIds", id: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((m) => m !== id) : [...prev[key], id],
    }));

  const levelOptions = useMemo(
    () => DIFFICULTY_LEVELS.map((v) => ({ value: String(v), label: t.exercises[difficultyKey(v)] })),
    [t]
  );
  const forceOptions = useMemo(
    () => FORCE_KEYS.map((k, i) => ({ value: String(i), label: t.exercises.forceOptions[k] })),
    [t]
  );
  const mechanicOptions = useMemo(
    () => MECHANIC_KEYS.map((k, i) => ({ value: String(i), label: t.exercises.mechanicOptions[k] })),
    [t]
  );
  const categoryOptions = useMemo(
    () => CATEGORY_KEYS.map((k, i) => ({ value: String(i), label: t.exercises.categoryOptions[k] })),
    [t]
  );

  const handleSave = async () => {
    if (!form.nameEn.trim() || !form.nameAr.trim()) {
      toast.error(t.exercises.nameRequired);
      return;
    }

    setSubmitting(true);
    try {
      const payload = toPayload(form);
      const res = exercise
        ? await exercisesApi.update(exercise.id, payload)
        : await exercisesApi.create(payload);

      // The picker and schedule builder read a session cache of the catalogue.
      invalidateExerciseCatalogue();
      toast.success(isEdit ? t.exercises.updateSuccess : t.exercises.createSuccess);
      onSaved(res.data ?? null);
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, t.exercises.saveFailed));
    } finally {
      setSubmitting(false);
    }
  };

  // Every free-text box is locked to the language it stores, so `dir` comes
  // from the field itself and never from the UI locale.
  const textInput = (
    key: keyof FormState,
    { dir = "ltr", placeholder }: { dir?: "ltr" | "rtl"; placeholder?: string } = {}
  ) => (
    <input
      value={String(form[key])}
      onChange={(e) => setField(key, e.target.value as FormState[typeof key])}
      placeholder={placeholder}
      dir={dir}
      lang={dir === "rtl" ? "ar" : "en"}
      className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
      style={inputStyle}
    />
  );

  const textArea = (
    key: "descriptionEn" | "descriptionAr",
    { dir, placeholder }: { dir: "ltr" | "rtl"; placeholder: string }
  ) => (
    <textarea
      value={form[key]}
      onChange={(e) => setField(key, e.target.value)}
      placeholder={placeholder}
      rows={3}
      dir={dir}
      lang={dir === "rtl" ? "ar" : "en"}
      className="w-full px-4 py-3 rounded-xl border text-sm input-accent resize-y"
      style={inputStyle}
    />
  );

  const select = (
    key: "level" | "force" | "mechanic" | "category",
    options: { value: string; label: string }[],
    { allowEmpty = true }: { allowEmpty?: boolean } = {}
  ) => (
    <select
      value={form[key]}
      onChange={(e) => setField(key, e.target.value)}
      className="w-full px-4 py-3 rounded-xl border text-sm cursor-pointer input-accent"
      style={{ ...inputStyle, fontFamily: "Manrope, sans-serif" }}
    >
      {allowEmpty && <option value="">{t.exercises.noneOption}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#0e0e0e" }}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? t.exercises.editExercise : t.exercises.createExercise}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button loading={submitting} onClick={handleSave}>
            {isEdit ? t.common.update : t.common.create}
          </Button>
        </>
      }
    >
      <div className="space-y-7">
        <Section title={t.exercises.basics}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.exercises.nameEn}>
              {textInput("nameEn", { placeholder: ph.nameEn })}
            </Field>
            <Field label={t.exercises.nameAr}>
              {textInput("nameAr", { dir: "rtl", placeholder: ph.nameAr })}
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.exercises.descriptionEn}>
              {textArea("descriptionEn", { dir: "ltr", placeholder: ph.descriptionEn })}
            </Field>
            <Field label={t.exercises.descriptionAr}>
              {textArea("descriptionAr", { dir: "rtl", placeholder: ph.descriptionAr })}
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.exercises.equipmentEn}>
              {textInput("equipmentEn", { placeholder: ph.equipmentEn })}
            </Field>
            <Field label={t.exercises.equipmentAr}>
              {textInput("equipmentAr", { dir: "rtl", placeholder: ph.equipmentAr })}
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setField("isActive", !form.isActive)}
              aria-pressed={form.isActive}
              className="w-10 h-6 rounded-full transition-all flex-shrink-0"
              style={{ background: form.isActive ? "#cafd00" : "#2a2a28" }}
            >
              <span
                className="block w-4 h-4 rounded-full transition-all mx-1"
                style={{
                  background: form.isActive ? "#3a4a00" : "#8a8888",
                  // translateX is physical, not writing-order aware — mirror it
                  // in RTL so "on" slides toward the track's end either way.
                  transform: form.isActive
                    ? `translateX(${isRtl ? "-16px" : "16px"})`
                    : "translateX(0)",
                }}
              />
            </button>
            <span className="text-sm" style={{ color: "#ffffff" }}>
              {t.common.active}
            </span>
          </div>
        </Section>

        <Section title={t.exercises.classification}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.exercises.level}>
              {select("level", levelOptions, { allowEmpty: false })}
            </Field>
            <Field label={t.exercises.category}>{select("category", categoryOptions)}</Field>
            <Field label={t.exercises.force}>{select("force", forceOptions)}</Field>
            <Field label={t.exercises.mechanic}>{select("mechanic", mechanicOptions)}</Field>
          </div>

          <MuscleChipPicker
            label={t.exercises.primaryMuscles}
            hint={t.exercises.selectPrimaryMuscles}
            groups={muscles}
            selected={form.primaryMuscleGroupIds}
            color="#cafd00"
            isRtl={isRtl}
            onToggle={(id) => toggleMuscle("primaryMuscleGroupIds", id)}
          />
          <MuscleChipPicker
            label={t.exercises.secondaryMuscles}
            hint={t.exercises.selectSecondaryMuscles}
            groups={muscles}
            selected={form.secondaryMuscleGroupIds}
            color="#4ae176"
            isRtl={isRtl}
            onToggle={(id) => toggleMuscle("secondaryMuscleGroupIds", id)}
          />
        </Section>

        <Section title={t.exercises.instructions}>
          <StepsEditor
            label={t.exercises.instructionsEn}
            steps={form.instructionsEn}
            dir="ltr"
            placeholder={ph.stepEn}
            addLabel={t.exercises.addStep}
            removeLabel={t.exercises.removeStep}
            onChange={(steps) => setField("instructionsEn", steps)}
          />
          <StepsEditor
            label={t.exercises.instructionsAr}
            steps={form.instructionsAr}
            dir="rtl"
            placeholder={ph.stepAr}
            addLabel={t.exercises.addStep}
            removeLabel={t.exercises.removeStep}
            onChange={(steps) => setField("instructionsAr", steps)}
          />
        </Section>

        <Section title={t.exercises.media}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.exercises.imageUrl} hint={t.exercises.imageUrlHint}>
              {textInput("imageUrl", { placeholder: ph.imageUrl })}
            </Field>
            <Field label={t.exercises.videoUrl}>
              {textInput("videoUrl", { placeholder: ph.videoUrl })}
            </Field>
          </div>
        </Section>
      </div>
    </Modal>
  );
}
