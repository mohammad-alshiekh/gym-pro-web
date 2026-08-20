"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Layers, Search, Edit2, Trash2 } from "lucide-react";
import Link from "next/link"; // ✅ استيراد Link للتنقل
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { muscleGroupsApi } from "@/lib/api";
import toast from "react-hot-toast";

interface MuscleGroup {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  isActive: boolean;
  exercises?: unknown[];
}

interface FormState {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  isActive: boolean;
}

const defaultForm: FormState = { nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "", isActive: true };

export default function MuscleGroupsPage() {
  const { t, isRtl } = useTranslation();
  const [items, setItems] = useState<MuscleGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MuscleGroup | null>(null);
  const [editTarget, setEditTarget] = useState<MuscleGroup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const perPage = 10;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await muscleGroupsApi.getAll({ pageNumber: page, resultsPerPage: perPage, searchQuery: search || undefined });
      setItems(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error(t.muscleGroups.toastFailedLoadMuscleGroups);
    } finally {
      setLoading(false);
    }
  }, [search, page, t]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setEditTarget(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (item: MuscleGroup) => {
    setEditTarget(item);
    setForm({ nameEn: item.nameEn, nameAr: item.nameAr, descriptionEn: item.descriptionEn ?? "", descriptionAr: item.descriptionAr ?? "", isActive: item.isActive });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameEn || !form.nameAr) { toast.error(t.muscleGroups.toastNameEnArRequired); return; }
    setSubmitting(true);
    try {
      if (editTarget) {
        await muscleGroupsApi.update(editTarget.id, { nameEn: form.nameEn, nameAr: form.nameAr, descriptionEn: form.descriptionEn, descriptionAr: form.descriptionAr, isActive: form.isActive });
        toast.success(t.muscleGroups.updateSuccess);
      } else {
        await muscleGroupsApi.create({ nameEn: form.nameEn, nameAr: form.nameAr, descriptionEn: form.descriptionEn, descriptionAr: form.descriptionAr, isActive: form.isActive });
        toast.success(t.muscleGroups.createSuccess);
      }
      setModalOpen(false);
      fetchItems();
    } catch { toast.error(t.muscleGroups.toastFailedSave); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await muscleGroupsApi.delete(deleteTarget.id);
      toast.success(t.muscleGroups.deleteSuccess);
      setDeleteTarget(null);
      fetchItems();
    } catch { toast.error(t.muscleGroups.toastFailedDelete); } finally { setSubmitting(false); }
  };

  const setField = (key: keyof FormState, value: string | boolean) => setForm(p => ({ ...p, [key]: value }));
  const inputStyle = { background: "#0e0e0e", borderColor: "#2a2a2a", color: "#ffffff", outline: "none" };
  const labelStyle = { fontFamily: "JetBrains Mono, monospace", color: "#adaaaa", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <DashboardLayout title={t.muscleGroups.title} requiredRole="super_admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8a8888" }} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t.muscleGroups.searchPlaceholder} className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent" style={{ ...inputStyle }} />
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>{t.muscleGroups.createGroup}</Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border py-20 text-center" style={{ borderColor: "#2a2a2a", background: "#131313" }}>
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "#cafd00" }} />
            <p style={{ color: "#8a8888" }}>{t.common.noData}</p>
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
              <table dir={isRtl ? "rtl" : "ltr"} className="w-full min-w-[620px]">
                <thead>
                  <tr style={{ background: "#1a1a1a" }}>
                    {[
                      t.common.name,
                      t.exercises.title,
                      t.common.status,
                      t.common.actions,
                    ].map((head, i) => (
                      <th
                        key={head}
                        className={`text-[10px] font-medium uppercase tracking-widest px-5 py-3.5 ${
                          // Actions reads as a toolbar, not a data column — center its header to match.
                          i === 3 ? "text-center" : isRtl ? "text-right" : "text-left"
                        }`}
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const cell = `px-5 py-4 ${isRtl ? "text-right" : "text-left"}`;
                    const exercisesCount = (item.exercises as unknown[])?.length ?? 0;
                    return (
                      <tr
                        key={item.id}
                        className="border-t transition-colors hover:bg-[#1a1a1a]"
                        style={{ borderColor: "#20201f" }}
                      >
                        <td className={cell}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: item.isActive ? "rgba(202,253,0,0.1)" : "rgba(173,170,170,0.1)",
                                color: item.isActive ? "#cafd00" : "#8a8888",
                              }}
                            >
                              <Layers className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[220px]" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                                {item.nameEn}
                              </p>
                              <p className="text-xs truncate max-w-[220px] mt-0.5" style={{ color: "#8a8888" }} dir="rtl" lang="ar">
                                {item.nameAr}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={cell}>
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs"
                            style={{ background: "#20201f", color: "#adaaaa", fontFamily: "JetBrains Mono, monospace" }}
                          >
                            {exercisesCount} {t.exercises.exercisesCount.trim()}
                          </span>
                        </td>
                        <td className={cell}>
                          <Badge variant={item.isActive ? "success" : "neutral"}>
                            {item.isActive ? t.common.active : t.common.inactive}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {/* A bordered toolbar instead of loose icons, matching
                              the treatment used on Membership Plans. */}
                          <div
                            className="inline-flex items-center gap-0.5 p-1 rounded-xl border"
                            style={{ background: "#0e0e0e", borderColor: "#2a2a2a" }}
                          >
                            <button
                              onClick={() => openEdit(item)}
                              title={t.common.edit}
                              aria-label={t.common.edit}
                              className="p-2 rounded-lg transition-colors hover:bg-[#20201f] hover:text-[#cafd00]"
                              style={{ color: "#adaaaa" }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <span className="w-px h-5 flex-shrink-0" style={{ background: "#2a2a2a" }} />
                            <button
                              onClick={() => setDeleteTarget(item)}
                              title={t.common.delete}
                              aria-label={t.common.delete}
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

        <Pagination currentPage={page} totalPages={Math.ceil(totalCount / perPage) || 1} onPageChange={setPage} totalCount={totalCount} resultsPerPage={perPage} />
      </div>

      {/* Modal للإضافة/التعديل */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? t.muscleGroups.editGroup : t.muscleGroups.createGroup}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>{t.common.cancel}</Button><Button loading={submitting} onClick={handleSave}>{editTarget ? t.common.update : t.common.create}</Button></>}>
        <div className="space-y-4">
          {[{ key: "nameEn", label: t.muscleGroups.nameEn, placeholder: "Back" }, { key: "nameAr", label: t.muscleGroups.nameAr, placeholder: "الظهر" }, { key: "descriptionEn", label: t.muscleGroups.descriptionEn, placeholder: "Description..." }, { key: "descriptionAr", label: t.muscleGroups.descriptionAr, placeholder: "الوصف..." }].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={labelStyle} className="block mb-1.5">{label}</label>
              <input value={String(form[key as keyof FormState])} onChange={(e) => setField(key as keyof FormState, e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border text-sm input-accent" style={inputStyle} />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setField("isActive", !form.isActive)} className="w-10 h-6 rounded-full transition-all flex-shrink-0" style={{ background: form.isActive ? "#cafd00" : "#2a2a28" }}>
              <span className="block w-4 h-4 rounded-full transition-all mx-1" style={{ background: form.isActive ? "#3a4a00" : "#8a8888", transform: form.isActive ? "translateX(16px)" : "translateX(0)" }} />
            </button>
            <span className="text-sm" style={{ color: "#ffffff" }}>
                  {t.common.active}
                </span>
          </div>
        </div>
      </Modal>

      {/* Modal للحذف */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t.muscleGroups.deleteConfirm} size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t.common.cancel}</Button><Button variant="danger" loading={submitting} onClick={handleDelete}>{t.common.delete}</Button></>}>
        <p style={{ color: "#ffffff" }}>Delete &quot;{deleteTarget?.nameEn}&quot;?</p>
      </Modal>
    </DashboardLayout>
  );
}