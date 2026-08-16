"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ScheduleBuilder from "@/components/schedules/ScheduleBuilder";
import { useTranslation } from "@/hooks/useTranslation";
import { schedulesApi } from "@/lib/api";
import {
  toScheduleForm,
  toScheduleUpdatePayload,
  type ScheduleForm,
} from "@/lib/schedules";
import toast from "react-hot-toast";

export default function EditExerciseSchedulePage() {
  const { t, isRtl } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [initialForm, setInitialForm] = useState<ScheduleForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSchedule = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await schedulesApi.getById(id);
      setInitialForm(toScheduleForm(res.data));
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // The builder validates and highlights before calling this.
  const handleSubmit = async (form: ScheduleForm) => {
    if (!id) return;

    setSubmitting(true);
    try {
      // PUT takes the update DTO: isActive is carried, createdByAdminId is not.
      await schedulesApi.update(id, toScheduleUpdatePayload(form));
      toast.success(t.exerciseSchedules.updateSuccess);
      router.push(`/admin/exercise-schedules/${id}`);
    } catch {
      toast.error(t.exerciseSchedules.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title={t.exerciseSchedules.editPlan} requiredRole="super_admin">
      <div className="space-y-5">
        <Link
          href={id ? `/admin/exercise-schedules/${id}` : "/admin/exercise-schedules"}
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#cafd00]"
          style={{ color: "#8a8888" }}
        >
          <ArrowLeft className="w-4 h-4" style={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
          {t.exerciseSchedules.backToPlans}
        </Link>

        {loading ? (
          <div className="space-y-4">
            <div className="h-72 rounded-2xl shimmer" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl shimmer" />
            ))}
          </div>
        ) : notFound || !initialForm ? (
          <div
            className="p-6 rounded-2xl border text-sm"
            style={{ background: "rgba(92,22,32,0.12)", borderColor: "#5c1620", color: "#ff6e81" }}
          >
            {t.exerciseSchedules.planNotFound}
          </div>
        ) : (
          <ScheduleBuilder
            initialForm={initialForm}
            submitting={submitting}
            submitLabel={t.common.save}
            showPublishToggle
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/admin/exercise-schedules/${id}`)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
