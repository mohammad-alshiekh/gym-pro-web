"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Dumbbell,
  Edit2,
  Flame,
  Layers,
  ListOrdered,
  Package,
  PlayCircle,
  Target,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ExerciseFormModal from "@/components/exercises/ExerciseFormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { exercisesApi } from "@/lib/api";
import { exerciseImageUrl, type CatalogueExercise } from "@/lib/exercises";
import { difficultyColor, difficultyKey, difficultyVariant } from "@/lib/schedules";

const CARD: React.CSSProperties = { background: "#131313", borderColor: "#2a2a2a" };
const MONO = "JetBrains Mono, monospace";

/**
 * Section wrapper — keeps the page's blocks visually identical without
 * repeating the card chrome at every call site.
 */
function Section({
  icon: Icon,
  title,
  accent = "#cafd00",
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: `${accent}15`, color: accent }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ fontFamily: MONO, color: "#adaaaa" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

/** Muscle-group chips, tinted by role (primary = lime, secondary = green). */
function MuscleChips({
  groups,
  color,
  isRtl,
}: {
  groups: { id: string; nameEn: string; nameAr: string }[];
  color: string;
  isRtl: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((m) => {
        const label = isRtl ? m.nameAr || m.nameEn : m.nameEn;
        return (
          <span
            key={m.id}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: `${color}15`, color }}
            dir={isRtl && m.nameAr ? "rtl" : "ltr"}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

export default function ExerciseDetailPage() {
  const { t, isRtl } = useTranslation();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [exercise, setExercise] = useState<CatalogueExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchExercise = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await exercisesApi.getById(id);
      setExercise(res.data);
      setError(null);
    } catch {
      setError(t.exercises.exerciseNotFound);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchExercise();
  }, [fetchExercise]);

  const backLink = (
    <Link
      href="/admin/exercises"
      title={t.exercises.backToExercises}
      className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#cafd00]"
      style={{ color: "#8a8888" }}
    >
      <ArrowLeft className="w-4 h-4" style={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
      {t.exercises.backToExercises}
    </Link>
  );

  // ── Loading ──
  if (loading) {
    return (
      <DashboardLayout title={t.exercises.title} requiredRole="super_admin">
        <div className="space-y-4">
          <div className="h-56 sm:h-72 rounded-2xl shimmer" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer" />
            ))}
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl shimmer" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ── Not found ──
  if (error || !exercise) {
    return (
      <DashboardLayout title={t.exercises.title} requiredRole="super_admin">
        <div className="space-y-4">
          {backLink}
          <div
            className="p-6 rounded-2xl border text-sm"
            style={{
              background: "rgba(92,22,32,0.12)",
              borderColor: "#5c1620",
              color: "#ff6e81",
            }}
          >
            {error ?? t.exercises.exerciseNotFound}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const levelKey = difficultyKey(exercise.level);
  const cover = exerciseImageUrl(exercise.imageUrl);
  const primary = exercise.primaryMuscleGroups ?? [];
  const secondary = exercise.secondaryMuscleGroups ?? [];
  const instructions = (isRtl ? exercise.instructionsAr : exercise.instructionsEn) ?? [];
  const description = isRtl
    ? exercise.descriptionAr || exercise.descriptionEn
    : exercise.descriptionEn;

  const metaCards = [
    {
      label: t.exercises.level,
      value: t.exercises[levelKey],
      icon: Flame,
      color: difficultyColor(exercise.level),
      dir: undefined as "ltr" | undefined,
    },
    {
      label: t.exercises.equipment,
      value: exercise.equipmentEn || "—",
      icon: Package,
      color: "#7df6ff",
      dir: "ltr" as const,
    },
    {
      label: t.exercises.primaryMuscles,
      value: String(primary.length),
      icon: Target,
      color: "#cafd00",
      dir: undefined,
    },
    {
      label: t.exercises.secondaryMuscles,
      value: String(secondary.length),
      icon: Layers,
      color: "#4ae176",
      dir: undefined,
    },
  ];

  return (
    <DashboardLayout
      title={isRtl ? exercise.nameAr || exercise.nameEn : exercise.nameEn}
      requiredRole="super_admin"
    >
      <div className="space-y-5 pb-6">
        <div className="flex items-center justify-between gap-4">
          {backLink}
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => setEditOpen(true)}
          >
            {t.common.edit}
          </Button>
        </div>

        {/* ── Hero ── */}
        <div className="rounded-2xl border overflow-hidden" style={CARD}>
          <div
            className="relative w-full h-52 sm:h-72 flex items-center justify-center"
            style={{ background: "#20201f" }}
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={exercise.nameEn}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Dumbbell className="w-14 h-14" style={{ color: "#cafd00", opacity: 0.25 }} />
            )}

            {/* Bottom scrim so the title stays readable over any photo. */}
            <div
              className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
              style={{
                background: "linear-gradient(to top, rgba(19,19,19,0.96), transparent)",
              }}
            />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <Badge variant={difficultyVariant(exercise.level)}>{t.exercises[levelKey]}</Badge>
                {exercise.equipmentEn && (
                  <Badge variant="neutral">{exercise.equipmentEn}</Badge>
                )}
                {exercise.isActive === false && (
                  <Badge variant="neutral">{t.common.inactive}</Badge>
                )}
              </div>

              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight"
                style={{ fontFamily: "Space Grotesk, sans-serif", color: "#ffffff" }}
                dir="ltr"
              >
                {exercise.nameEn}
              </h1>
              {exercise.nameAr && (
                <p
                  className="text-sm sm:text-base mt-1"
                  style={{ color: "#adaaaa" }}
                  dir="rtl"
                  lang="ar"
                >
                  {exercise.nameAr}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Meta ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metaCards.map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
              style={CARD}
            >
              <div
                className="p-2 rounded-xl flex-shrink-0"
                style={{ background: `${m.color}15`, color: m.color }}
              >
                <m.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-medium uppercase tracking-widest truncate"
                  style={{ fontFamily: MONO, color: "#8a8888" }}
                >
                  {m.label}
                </p>
                <p
                  className="text-sm font-bold truncate mt-0.5"
                  style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                  dir={m.dir}
                  title={m.value}
                >
                  {m.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Description ── */}
        {description && (
          <Section icon={Dumbbell} title={t.exercises.overview}>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#adaaaa" }}
              dir={isRtl && exercise.descriptionAr ? "rtl" : "ltr"}
            >
              {description}
            </p>
          </Section>
        )}

        {/* ── Muscles ── */}
        {(primary.length > 0 || secondary.length > 0) && (
          <Section icon={Target} title={t.exercises.targetedMuscles}>
            <div className="space-y-4">
              {primary.length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                    style={{ fontFamily: MONO, color: "#cafd00" }}
                  >
                    {t.exercises.primaryMuscles}
                  </p>
                  <MuscleChips groups={primary} color="#cafd00" isRtl={isRtl} />
                </div>
              )}
              {secondary.length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                    style={{ fontFamily: MONO, color: "#4ae176" }}
                  >
                    {t.exercises.secondaryMuscles}
                  </p>
                  <MuscleChips groups={secondary} color="#4ae176" isRtl={isRtl} />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Instructions ── */}
        <Section icon={ListOrdered} title={t.exercises.instructions} accent="#7df6ff">
          {instructions.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>
              {t.exercises.noInstructions}
            </p>
          ) : (
            <ol className="space-y-3">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "#cafd00", color: "#3a4a00", fontFamily: MONO }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-sm leading-relaxed pt-0.5"
                    style={{ color: "#adaaaa" }}
                    dir={isRtl && exercise.instructionsAr?.length ? "rtl" : "ltr"}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        {/* ── Video ── */}
        {exercise.videoUrl && (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-4 rounded-2xl border transition-colors hover:border-[#cafd00]"
            style={CARD}
          >
            <div
              className="p-2 rounded-xl flex-shrink-0"
              style={{ background: "rgba(202,253,0,0.1)", color: "#cafd00" }}
            >
              <PlayCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
              >
                {t.exercises.watchVideo}
              </p>
              <p className="text-xs truncate" style={{ color: "#8a8888" }} dir="ltr">
                {exercise.videoUrl}
              </p>
            </div>
          </a>
        )}
      </div>

      {/* Refetch rather than trust the PUT body — its shape is undocumented. */}
      <ExerciseFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        exercise={exercise}
        onSaved={fetchExercise}
      />
    </DashboardLayout>
  );
}
