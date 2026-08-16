"use client";

import { useEffect, useState } from "react";
import { Plus, ScrollText, Edit2, EyeOff, Trash2, RotateCcw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { myGymApi, plansApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import type { GymPlan } from "@/lib/manager";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface FormState {
  name: string;
  description: string;
  durationDays: string;
  price: string;
}

const defaultForm: FormState = { name: "", description: "", durationDays: "", price: "" };

export default function ManagerPlansPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<GymPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GymPlan | null>(null);
  const [editTarget, setEditTarget] = useState<GymPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await myGymApi.get();
      setPlans(res.data?.plans ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err, t.plans.loadFailed));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreate = () => { setEditTarget(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (plan: GymPlan) => {
    setEditTarget(plan);
    setForm({ name: plan.name, description: plan.description ?? "", durationDays: String(plan.durationDays), price: String(plan.price) });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const duration = Number(form.durationDays);
    const price = Number(form.price);

    if (!form.name.trim()) { toast.error(t.plans.missingName); return; }
    // Documented bounds: durationDays 1–3650, price >= 0.
    if (!Number.isFinite(duration) || duration < 1 || duration > 3650) {
      toast.error(t.plans.invalidDuration);
      return;
    }
    if (!Number.isFinite(price) || price < 0) { toast.error(t.plans.invalidPrice); return; }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        durationDays: duration,
        price,
      };
      if (editTarget) {
        await plansApi.update(editTarget.id, payload);
        toast.success(t.plans.updateSuccess);
      } else {
        await plansApi.create(payload);
        toast.success(t.plans.createSuccess);
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(apiErrorMessage(err, t.plans.saveFailed));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await plansApi.delete(deleteTarget.id);
      toast.success(t.plans.deleteSuccess);
      setDeleteTarget(null);
      fetchPlans();
    } catch (err) {
      toast.error(apiErrorMessage(err, t.plans.deleteFailed));
    } finally { setSubmitting(false); }
  };

  const handleReactivate = async (plan: GymPlan) => {
    try {
      await plansApi.reactivate(plan.id);
      toast.success(t.plans.reactivateSuccess);
      fetchPlans();
    } catch (err) { toast.error(apiErrorMessage(err, t.plans.reactivateFailed)); }
  };

  // Deactivating keeps existing subscriptions running and only hides the plan
  // from trainee discovery — it is the documented fallback when delete is refused.
  const handleDeactivate = async (plan: GymPlan) => {
    try {
      await plansApi.deactivate(plan.id);
      toast.success(t.plans.deactivateSuccess);
      fetchPlans();
    } catch (err) { toast.error(apiErrorMessage(err, t.plans.deactivateFailed)); }
  };

  const setField = (key: keyof FormState, value: string) => setForm(p => ({ ...p, [key]: value }));
  const inputStyle = { background: "#0e0e0e", borderColor: "#2a2a2a", color: "#ffffff", outline: "none", fontFamily: "Manrope, sans-serif" };
  const labelStyle = { fontFamily: "JetBrains Mono, monospace", color: "#adaaaa", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <DashboardLayout title={t.plans.title} requiredRole="gym_manager">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "#8a8888" }}>{plans.length} {t.plans.plansCountPlural}</p>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>{t.plans.createPlan}</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-44 rounded-2xl shimmer" />)}</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8a8888" }}><ScrollText className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>{t.plans.noPlansYet}</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border p-6 flex flex-col gap-4 card-interactive" style={{ background: "#131313", borderColor: plan.isActive ? "#2a2a2a" : "#5c162030" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base leading-tight" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>{plan.name}</p>
                    {plan.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: "#8a8888" }}>{plan.description}</p>}
                  </div>
                  <Badge variant={plan.isActive ? "success" : "danger"}>{plan.isActive ? t.plans.activeLabel : t.plans.inactiveLabel}</Badge>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#cafd00" }}>
                      {formatCurrency(plan.price)}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm" style={{ background: "#cafd0015", color: "#cafd00", fontFamily: "JetBrains Mono, monospace" }}>
                    {plan.durationDays} {t.plans.daysLabel}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "#20201f" }}>
                  <button onClick={() => openEdit(plan)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs transition-colors hover:bg-[#20201f]" style={{ borderColor: "#2a2a2a", color: "#adaaaa" }}>
                    <Edit2 className="w-3.5 h-3.5" />{t.plans.edit}
                  </button>
                  {!plan.isActive ? (
                    <button onClick={() => handleReactivate(plan)} title={t.plans.reactivatePlan} className="p-2 rounded-xl hover:bg-[#cafd0015] transition-colors" style={{ color: "#cafd00" }}>
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => handleDeactivate(plan)} title={t.plans.deactivatePlan} className="p-2 rounded-xl hover:bg-[#20201f] transition-colors" style={{ color: "#8a8888" }}>
                      <EyeOff className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setDeleteTarget(plan)} title={t.plans.deletePlan} className="p-2 rounded-xl hover:bg-[#5c1620]/20" style={{ color: "#ff6e81" }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? t.plans.editPlan : t.plans.createPlan}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>{t.common.cancel}</Button><Button loading={submitting} onClick={handleSave}>{editTarget ? t.common.update : t.common.create}</Button></>}>
        <div className="space-y-4">
          {[{ key: "name", label: t.plans.planName, placeholder: "Gold Monthly Membership" }, { key: "durationDays", label: t.plans.durationDays, placeholder: "30", type: "number" }, { key: "price", label: `${t.plans.price} (USD)`, placeholder: "1200", type: "number" }].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label style={labelStyle} className="block mb-1.5">{label}</label>
              <input value={String(form[key as keyof FormState])} onChange={(e) => setField(key as keyof FormState, e.target.value)} placeholder={placeholder} type={type ?? "text"} className="w-full px-4 py-3 rounded-xl border text-sm input-accent" style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={labelStyle} className="block mb-1.5">{t.common.description}</label>
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Unlimited gym access..." className="w-full px-4 py-3 rounded-xl border text-sm input-accent resize-none" style={inputStyle} />
          </div>
          {/* The API rejects price/duration edits once the plan has active subscribers. */}
          {editTarget && (
            <p className="text-xs" style={{ color: "#8a8888" }}>{t.plans.editLockNote}</p>
          )}
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t.plans.deletePlan} size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t.common.cancel}</Button><Button variant="danger" loading={submitting} onClick={handleDelete}>{t.common.delete}</Button></>}>
        <p style={{ color: "#ffffff" }}>{t.plans.deleteConfirm}</p>
        {deleteTarget && <div className="mt-3 px-4 py-2 rounded-xl border text-sm" style={{ borderColor: "#5c1620", background: "#5c162015", color: "#ff6e81" }}>{deleteTarget.name}</div>}
        <p className="mt-3 text-xs" style={{ color: "#8a8888" }}>{t.plans.deleteNote}</p>
      </Modal>
    </DashboardLayout>
  );
}
