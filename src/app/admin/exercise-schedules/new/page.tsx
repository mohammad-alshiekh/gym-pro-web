"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ScheduleBuilder from "@/components/schedules/ScheduleBuilder";
import { useTranslation } from "@/hooks/useTranslation";
import { schedulesApi } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { emptyScheduleForm, toSchedulePayload, type ScheduleForm } from "@/lib/schedules";
import toast from "react-hot-toast";

export default function NewExerciseSchedulePage() {
  const { t, isRtl } = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const initialForm = useMemo(() => emptyScheduleForm(), []);

  // The builder validates and highlights before calling this.
  const handleSubmit = async (form: ScheduleForm) => {
    const adminId = getUserId();
    if (!adminId) {
      toast.error(t.exerciseSchedules.missingAdminId);
      return;
    }

    setSubmitting(true);
    try {
      const res = await schedulesApi.create(toSchedulePayload(form, adminId));
      toast.success(t.exerciseSchedules.createSuccess);
      router.push(
        res.data?.id ? `/admin/exercise-schedules/${res.data.id}` : "/admin/exercise-schedules"
      );
    } catch {
      toast.error(t.exerciseSchedules.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title={t.exerciseSchedules.createPlan} requiredRole="super_admin">
      <div className="space-y-5">
        <Link
          href="/admin/exercise-schedules"
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#c8f323]"
          style={{ color: "#8b93a1" }}
        >
          <ArrowLeft className="w-4 h-4" style={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
          {t.exerciseSchedules.backToPlans}
        </Link>

        <ScheduleBuilder
          initialForm={initialForm}
          submitting={submitting}
          submitLabel={t.common.create}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/admin/exercise-schedules")}
        />
      </div>
    </DashboardLayout>
  );
}
