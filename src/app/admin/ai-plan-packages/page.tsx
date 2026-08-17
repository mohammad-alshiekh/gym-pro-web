"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarRange, Edit2, Eye, EyeOff, Plus, Sparkles, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { aiPlanPackagesApi } from "@/lib/api";
import { apiErrorCode, apiErrorMessage } from "@/lib/apiError";
import {
  MAX_PLAN_DURATION_MAX,
  MAX_PLAN_DURATION_MIN,
  NAME_MAX_LENGTH,
  validatePackage,
  type AiPlanPackage,
} from "@/lib/aiPlans";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

const CARD: React.CSSProperties = { background: "#131313", borderColor: "#2a2a2a" };
const INPUT: React.CSSProperties = {
  background: "#0e0e0e",
  borderColor: "#2a2a2a",
  color: "#ffffff",
  outline: "none",
  fontFamily: "Manrope, sans-serif",
};
const LABEL: React.CSSProperties = {
  fontFamily: "JetBrains Mono, monospace",
  color: "#adaaaa",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

interface FormState {
  name: string;
  description: string;
  price: string;
  maxPlanDurationDays: string;
  isActive: boolean;
}

const defaultForm: FormState = {
  name: "",
  description: "",
  price: "",
  maxPlanDurationDays: "30",
  isActive: true,
};

export default function AiPlanPackagesPage() {
  const { t } = useTranslation();

  const [packages, setPackages] = useState<AiPlanPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AiPlanPackage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AiPlanPackage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      // activeOnly=false — deactivated tiers must stay visible to the admin.
      const res = await aiPlanPackagesApi.getAll(false);
      setPackages(res.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err, t.aiPlans.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const setField = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (pkg: AiPlanPackage) => {
    setEditTarget(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      price: String(pkg.price),
      maxPlanDurationDays: String(pkg.maxPlanDurationDays),
      isActive: pkg.isActive,
    });
    setModalOpen(true);
  };

  /** Every business failure arrives as HTTP 400 — `errorCode` carries the real one. */
  const reportFailure = (err: unknown, fallback: string) => {
    if (apiErrorCode(err) === 404) {
      toast.error(t.aiPlans.notFound);
      fetchPackages();
      return;
    }
    toast.error(apiErrorMessage(err, fallback));
  };

  const handleSave = async () => {
    const problem = validatePackage(form);
    if (problem) {
      toast.error(t.aiPlans[problem]);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        maxPlanDurationDays: Number(form.maxPlanDurationDays),
        isActive: form.isActive,
      };

      if (editTarget) {
        await aiPlanPackagesApi.update(editTarget.id, payload);
        toast.success(t.aiPlans.updateSuccess);
      } else {
        await aiPlanPackagesApi.create(payload);
        toast.success(t.aiPlans.createSuccess);
      }
      setModalOpen(false);
      fetchPackages();
    } catch (err) {
      reportFailure(err, t.aiPlans.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  /** There is no dedicated activate endpoint — flipping the flag is a PUT. */
  const handleToggleActive = async (pkg: AiPlanPackage) => {
    setTogglingId(pkg.id);
    try {
      await aiPlanPackagesApi.update(pkg.id, {
        name: pkg.name,
        description: pkg.description ?? "",
        price: pkg.price,
        maxPlanDurationDays: pkg.maxPlanDurationDays,
        isActive: !pkg.isActive,
      });
      toast.success(pkg.isActive ? t.aiPlans.deactivateSuccess : t.aiPlans.activateSuccess);
      fetchPackages();
    } catch (err) {
      reportFailure(err, t.aiPlans.saveFailed);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setSubmitting(true);
    try {
      await aiPlanPackagesApi.delete(target.id);
      setDeleteTarget(null);

      // 204 means "handled", not "removed" — a package with purchases comes
      // back deactivated. Re-read and report whichever actually happened.
      const res = await aiPlanPackagesApi.getAll(false);
      const next = res.data ?? [];
      setPackages(next);
      toast.success(
        next.some((p) => p.id === target.id)
          ? t.aiPlans.deactivatedInstead
          : t.aiPlans.deleteSuccess
      );
    } catch (err) {
      reportFailure(err, t.aiPlans.deleteFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title={t.aiPlans.title} requiredRole="super_admin">
      <div className="space-y-6">
        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm" style={{ color: "#8a8888" }}>
            {packages.length} {t.aiPlans.title}
          </p>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            {t.aiPlans.createPackage}
          </Button>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl shimmer" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border py-16 px-6 text-center" style={CARD}>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#20201f" }}
            >
              <Sparkles className="w-7 h-7" style={{ color: "#cafd00", opacity: 0.5 }} />
            </div>
            <p
              className="text-base font-semibold mb-2"
              style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
            >
              {t.aiPlans.emptyTitle}
            </p>
            <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "#8a8888" }}>
              {t.aiPlans.emptyBody}
            </p>
            <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>
              {t.aiPlans.createPackage}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-2xl border p-5 flex flex-col gap-4 card-interactive"
                style={{
                  ...CARD,
                  borderColor: pkg.isActive ? "#2a2a2a" : "#5c162030",
                  opacity: pkg.isActive ? 1 : 0.75,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-semibold text-base leading-tight truncate"
                      style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                      title={pkg.name}
                    >
                      {pkg.name}
                    </p>
                    {pkg.description && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "#8a8888" }}>
                        {pkg.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={pkg.isActive ? "success" : "neutral"}>
                    {pkg.isActive ? t.common.active : t.common.inactive}
                  </Badge>
                </div>

                <div className="flex items-end gap-3 flex-wrap">
                  <div>
                    <p
                      className="text-2xl font-bold leading-none"
                      style={{ fontFamily: "Space Grotesk, sans-serif", color: "#cafd00" }}
                    >
                      {formatCurrency(pkg.price)}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "#8a8888" }}>
                      {t.aiPlans.perPlan}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-0.5"
                    style={{
                      background: "rgba(125,246,255,0.1)",
                      color: "#7df6ff",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    <CalendarRange className="w-3.5 h-3.5" />
                    {t.aiPlans.upToDays.replace("{days}", String(pkg.maxPlanDurationDays))}
                  </span>
                </div>

                <div
                  className="flex items-center gap-2 pt-3 mt-auto border-t"
                  style={{ borderColor: "#20201f" }}
                >
                  <button
                    type="button"
                    onClick={() => openEdit(pkg)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs transition-colors hover:bg-[#20201f]"
                    style={{ borderColor: "#2a2a2a", color: "#adaaaa" }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t.common.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(pkg)}
                    disabled={togglingId === pkg.id}
                    title={pkg.isActive ? t.aiPlans.deactivate : t.aiPlans.activate}
                    className="p-2 rounded-xl transition-colors hover:bg-[#20201f] disabled:opacity-50"
                    style={{ color: pkg.isActive ? "#8a8888" : "#cafd00" }}
                  >
                    {pkg.isActive ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(pkg)}
                    title={t.aiPlans.deletePackage}
                    className="p-2 rounded-xl transition-colors hover:bg-[#5c1620]/20"
                    style={{ color: "#ff6e81" }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / edit ── */}
      <Modal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editTarget ? t.aiPlans.editPackage : t.aiPlans.createPackage}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button loading={submitting} onClick={handleSave}>
              {editTarget ? t.common.update : t.common.create}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label style={LABEL} className="block mb-1.5">
              {t.aiPlans.packageName}
            </label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder={t.aiPlans.placeholderName}
              maxLength={NAME_MAX_LENGTH}
              className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL} className="block mb-1.5">
              {t.common.description}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder={t.aiPlans.placeholderDescription}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border text-sm input-accent resize-none"
              style={INPUT}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={LABEL} className="block mb-1.5">
                {t.aiPlans.price}
              </label>
              <input
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="9.99"
                type="number"
                min={0}
                step="0.01"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={INPUT}
                dir="ltr"
              />
            </div>
            <div>
              <label style={LABEL} className="block mb-1.5">
                {t.aiPlans.maxDuration}
              </label>
              <input
                value={form.maxPlanDurationDays}
                onChange={(e) => setField("maxPlanDurationDays", e.target.value)}
                placeholder="30"
                type="number"
                min={MAX_PLAN_DURATION_MIN}
                max={MAX_PLAN_DURATION_MAX}
                step={1}
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={INPUT}
                dir="ltr"
              />
            </div>
          </div>
          <p className="text-xs" style={{ color: "#8a8888" }}>
            {t.aiPlans.maxDurationHint}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setField("isActive", !form.isActive)}
              className="w-10 h-6 rounded-full transition-all flex-shrink-0"
              style={{ background: form.isActive ? "#cafd00" : "#2a2a28" }}
            >
              <span
                className="block w-4 h-4 rounded-full transition-all mx-1"
                style={{
                  background: form.isActive ? "#3a4a00" : "#8a8888",
                  transform: form.isActive ? "translateX(16px)" : "translateX(0)",
                }}
              />
            </button>
            <span className="text-sm" style={{ color: "#ffffff" }}>
              {t.aiPlans.activeLabel}
            </span>
          </div>
        </div>
      </Modal>

      {/* ── Delete ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !submitting && setDeleteTarget(null)}
        title={t.aiPlans.deleteConfirm}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" loading={submitting} onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div
            className="px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "#5c1620", background: "rgba(92,22,32,0.12)", color: "#ff6e81" }}
          >
            {deleteTarget.name}
          </div>
        )}
        <p className="mt-3 text-xs" style={{ color: "#8a8888" }}>
          {t.aiPlans.deleteNote}
        </p>
      </Modal>
    </DashboardLayout>
  );
}
