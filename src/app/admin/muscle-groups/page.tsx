"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Layers, Search, Edit2, Trash2 } from "lucide-react";
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
  const { t } = useTranslation();
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
      toast.error("Failed to load muscle groups");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setEditTarget(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (item: MuscleGroup) => {
    setEditTarget(item);
    setForm({ nameEn: item.nameEn, nameAr: item.nameAr, descriptionEn: item.descriptionEn ?? "", descriptionAr: item.descriptionAr ?? "", isActive: item.isActive });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameEn || !form.nameAr) { toast.error("Name (EN and AR) required"); return; }
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
    } catch { toast.error("Failed to save"); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await muscleGroupsApi.delete(deleteTarget.id);
      toast.success(t.muscleGroups.deleteSuccess);
      setDeleteTarget(null);
      fetchItems();
    } catch { toast.error("Failed to delete"); } finally { setSubmitting(false); }
  };

  const setField = (key: keyof FormState, value: string | boolean) => setForm(p => ({ ...p, [key]: value }));
  const inputStyle = { background: "#0f1013", borderColor: "#2f3742", color: "#e9ecf1", outline: "none" };
  const labelStyle = { fontFamily: "JetBrains Mono, monospace", color: "#c3cad6", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <DashboardLayout title={t.muscleGroups.title} requiredRole="super_admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8b93a1" }} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent" style={{ ...inputStyle }} />
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>{t.muscleGroups.createGroup}</Button>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8b93a1" }}><Layers className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>{t.common.noData}</p></div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2f3742", background: "#171a1e" }}>
            {items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#23272e] transition-colors" style={{ borderBottom: i < items.length - 1 ? "1px solid #23272e" : "none" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#c8f32315" }}>
                  <Layers className="w-5 h-5" style={{ color: "#c8f323" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}>{item.nameEn}</p>
                  <p className="text-xs" style={{ color: "#8b93a1", direction: "rtl", textAlign: "left" }}>{item.nameAr}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                  <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" }}>
                    {(item.exercises as unknown[])?.length ?? 0} exercises
                  </span>
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[#2d323a]" style={{ color: "#c3cad6" }}><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg hover:bg-[#93000a]/20" style={{ color: "#ffb4ab" }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination currentPage={page} totalPages={Math.ceil(totalCount / perPage) || 1} onPageChange={setPage} totalCount={totalCount} resultsPerPage={perPage} />
      </div>

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
            <button type="button" onClick={() => setField("isActive", !form.isActive)} className="w-10 h-6 rounded-full transition-all flex-shrink-0" style={{ background: form.isActive ? "#c8f323" : "#2d323a" }}>
              <span className="block w-4 h-4 rounded-full transition-all mx-1" style={{ background: form.isActive ? "#293500" : "#8b93a1", transform: form.isActive ? "translateX(16px)" : "translateX(0)" }} />
            </button>
            <span className="text-sm" style={{ color: "#e9ecf1" }}>Active</span>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t.muscleGroups.deleteConfirm} size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t.common.cancel}</Button><Button variant="danger" loading={submitting} onClick={handleDelete}>{t.common.delete}</Button></>}>
        <p style={{ color: "#e9ecf1" }}>Delete &quot;{deleteTarget?.nameEn}&quot;?</p>
      </Modal>
    </DashboardLayout>
  );
}
