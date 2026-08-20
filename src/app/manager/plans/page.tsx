"use client";

import { useEffect, useState } from "react";
import { Plus, ScrollText, Edit2, EyeOff, Trash2, RotateCcw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { myGymApi, plansApi } from "@/lib/api";
import { apiErrorMessage, apiErrorMessageKnown } from "@/lib/apiError";
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
  const { t, isRtl } = useTranslation();
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
      // The API answers this specific case with a fixed English sentence —
      // show the already-translated hint instead of that raw text.
      toast.error(
        apiErrorMessageKnown(
          err,
          { "Price and duration cannot be changed": t.plans.editLockNote },
          t.plans.saveFailed
        )
      );
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
      // Same deal — the "deactivate instead" refusal comes back as fixed
      // English, so map it to the localized note we already show up front.
      toast.error(
        apiErrorMessageKnown(
          err,
          { "Cannot delete plan because subscriptions exist": t.plans.deleteNote },
          t.plans.deleteFailed
        )
      );
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
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}</div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border py-20 text-center" style={{ borderColor: "#2a2a2a", background: "#131313" }}>
            <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "#cafd00" }} />
            <p style={{ color: "#8a8888" }}>{t.plans.noPlansYet}</p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2a2a2a", background: "#131313" }}>
            <div className="overflow-x-auto">
              {/* `dir` is pinned explicitly (not just inherited from the RTL
                  page shell) so the table's own column order and each
                  cell's text-align always agree — otherwise the browser
                  flips column order for a `dir=rtl` ancestor while a
                  physical `text-left` utility class stays put, and headers
                  drift away from the data underneath them. */}
              <table dir={isRtl ? "rtl" : "ltr"} className="w-full min-w-[720px]">
                <thead>
                  <tr style={{ background: "#1a1a1a" }}>
                    {[
                      t.plans.planName,
                      t.plans.price,
                      t.plans.durationDays,
                      t.common.status,
                      t.common.actions,
                    ].map((head, i) => (
                      <th
                        key={head}
                        className={`text-[10px] font-medium uppercase tracking-widest px-5 py-3.5 ${
                          // Actions reads as a toolbar, not a data column — center its header to match.
                          i === 4 ? "text-center" : isRtl ? "text-right" : "text-left"
                        }`}
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => {
                    const cell = `px-5 py-4 ${isRtl ? "text-right" : "text-left"}`;
                    return (
                      <tr
                        key={plan.id}
                        className="border-t transition-colors hover:bg-[#1a1a1a]"
                        style={{ borderColor: "#20201f" }}
                      >
                        <td className={cell}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: plan.isActive ? "rgba(202,253,0,0.1)" : "rgba(173,170,170,0.1)",
                                color: plan.isActive ? "#cafd00" : "#8a8888",
                              }}
                            >
                              <ScrollText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[220px]" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                                {plan.name}
                              </p>
                              {plan.description && (
                                <p className="text-xs truncate max-w-[220px] mt-0.5" style={{ color: "#8a8888" }}>
                                  {plan.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={cell}>
                          <span className="text-sm font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#cafd00" }}>
                            {formatCurrency(plan.price)}
                          </span>
                        </td>
                        <td className={cell}>
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs"
                            style={{ background: "#20201f", color: "#adaaaa", fontFamily: "JetBrains Mono, monospace" }}
                          >
                            {plan.durationDays} {t.plans.daysLabel}
                          </span>
                        </td>
                        <td className={cell}>
                          <Badge variant={plan.isActive ? "success" : "danger"}>
                            {plan.isActive ? t.plans.activeLabel : t.plans.inactiveLabel}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {/* A bordered toolbar instead of loose icons — edit is
                              the primary action, a divider sets the destructive
                              pair (deactivate/reactivate, delete) apart from it. */}
                          <div
                            className="inline-flex items-center gap-0.5 p-1 rounded-xl border"
                            style={{ background: "#0e0e0e", borderColor: "#2a2a2a" }}
                          >
                            <button
                              onClick={() => openEdit(plan)}
                              title={t.plans.edit}
                              aria-label={t.plans.edit}
                              className="p-2 rounded-lg transition-colors hover:bg-[#20201f] hover:text-[#cafd00]"
                              style={{ color: "#adaaaa" }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <span className="w-px h-5 flex-shrink-0" style={{ background: "#2a2a2a" }} />
                            {!plan.isActive ? (
                              <button
                                onClick={() => handleReactivate(plan)}
                                title={t.plans.reactivatePlan}
                                aria-label={t.plans.reactivatePlan}
                                className="p-2 rounded-lg transition-colors hover:bg-[#cafd0015]"
                                style={{ color: "#cafd00" }}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeactivate(plan)}
                                title={t.plans.deactivatePlan}
                                aria-label={t.plans.deactivatePlan}
                                className="p-2 rounded-lg transition-colors hover:bg-[#20201f]"
                                style={{ color: "#8a8888" }}
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget(plan)}
                              title={t.plans.deletePlan}
                              aria-label={t.plans.deletePlan}
                              className="p-2 rounded-lg transition-colors hover:bg-[#5c1620]/30"
                              style={{ color: "#ff6e81" }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
