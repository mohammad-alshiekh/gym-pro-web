"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Package, Search, Edit2, Trash2 } from "lucide-react";
import Link from "next/link"; // ✅ استيراد Link للتنقل
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { equipmentApi } from "@/lib/api";
import toast from "react-hot-toast";

interface Equipment {
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

export default function EquipmentPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Equipment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);
  const [editTarget, setEditTarget] = useState<Equipment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const perPage = 10;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await equipmentApi.getAll({ pageNumber: page, resultsPerPage: perPage, searchQuery: search || undefined });
      setItems(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error("Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setEditTarget(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (item: Equipment) => {
    setEditTarget(item);
    setForm({ nameEn: item.nameEn, nameAr: item.nameAr, descriptionEn: item.descriptionEn ?? "", descriptionAr: item.descriptionAr ?? "", isActive: item.isActive });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameEn || !form.nameAr) { toast.error("Name required"); return; }
    setSubmitting(true);
    try {
      if (editTarget) {
        await equipmentApi.update(editTarget.id, form);
        toast.success(t.equipment.updateSuccess);
      } else {
        await equipmentApi.create(form);
        toast.success(t.equipment.createSuccess);
      }
      setModalOpen(false);
      fetchItems();
    } catch { toast.error("Failed to save"); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await equipmentApi.delete(deleteTarget.id);
      toast.success(t.equipment.deleteSuccess);
      setDeleteTarget(null);
      fetchItems();
    } catch { toast.error("Failed to delete"); } finally { setSubmitting(false); }
  };

  const setField = (key: keyof FormState, value: string | boolean) => setForm(p => ({ ...p, [key]: value }));
  const inputStyle = { background: "#0e0e0e", borderColor: "#2a2a2a", color: "#ffffff", outline: "none" };
  const labelStyle = { fontFamily: "JetBrains Mono, monospace", color: "#adaaaa", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <DashboardLayout title={t.equipment.title} requiredRole="super_admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8a8888" }} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t.equipment.searchPlaceholder} className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent" style={{ ...inputStyle }} />
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>{t.equipment.createEquipment}</Button>
        </div>

        {/* حالة التحميل (Shimmer Cards) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl shimmer" style={{ background: "#1a1a1a" }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8a8888" }}><Package className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>{t.common.noData}</p></div>
        ) : (
          /* شبكة البطاقات */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
               // href={`/admin/equipment/${item.id}`}
                className="block transition-all duration-200 hover:scale-[1.01] hover:border-[#4ae176]"
              >
                <div
                  className="p-5 rounded-xl border flex flex-col h-full gap-3"
                  style={{ background: "#131313", borderColor: "#2a2a2a" }}
                >
                  {/* رأس البطاقة: الأيقونة والاسم */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#4ae17615" }}>
                      <Package className="w-5 h-5" style={{ color: "#4ae176" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>{item.nameEn}</p>
                      <p className="text-xs" style={{ color: "#8a8888" }}>{item.nameAr}</p>
                    </div>
                  </div>

                  {/* منتصف البطاقة: الحالة */}
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex items-center justify-end gap-1 pt-2 mt-auto border-t" style={{ borderColor: "#20201f" }}>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(item); }}
                      className="p-1.5 rounded-lg hover:bg-[#2a2a28]"
                      style={{ color: "#adaaaa" }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(item); }}
                      className="p-1.5 rounded-lg hover:bg-[#5c1620]/20"
                      style={{ color: "#ff6e81" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination currentPage={page} totalPages={Math.ceil(totalCount / perPage) || 1} onPageChange={setPage} totalCount={totalCount} resultsPerPage={perPage} />
      </div>

      {/* Modal للإضافة/التعديل */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? t.equipment.editEquipment : t.equipment.createEquipment}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>{t.common.cancel}</Button><Button loading={submitting} onClick={handleSave}>{editTarget ? t.common.update : t.common.create}</Button></>}>
        <div className="space-y-4">
          {[{ key: "nameEn", label: t.equipment.nameEn, placeholder: "Dumbbell" }, { key: "nameAr", label: t.equipment.nameAr, placeholder: "دمبل" }, { key: "descriptionEn", label: t.equipment.descriptionEn, placeholder: "Description..." }, { key: "descriptionAr", label: t.equipment.descriptionAr, placeholder: "الوصف..." }].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={labelStyle} className="block mb-1.5">{label}</label>
              <input value={String(form[key as keyof FormState])} onChange={(e) => setField(key as keyof FormState, e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border text-sm input-accent" style={inputStyle} />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setField("isActive", !form.isActive)} className="w-10 h-6 rounded-full transition-all" style={{ background: form.isActive ? "#cafd00" : "#2a2a28" }}>
              <span className="block w-4 h-4 rounded-full transition-all mx-1" style={{ background: form.isActive ? "#3a4a00" : "#8a8888", transform: form.isActive ? "translateX(16px)" : "translateX(0)" }} />
            </button>
            <span className="text-sm" style={{ color: "#ffffff" }}>Active</span>
          </div>
        </div>
      </Modal>

      {/* Modal للحذف */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t.equipment.deleteConfirm} size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t.common.cancel}</Button><Button variant="danger" loading={submitting} onClick={handleDelete}>{t.common.delete}</Button></>}>
        <p style={{ color: "#ffffff" }}>Delete &quot;{deleteTarget?.nameEn}&quot;?</p>
      </Modal>
    </DashboardLayout>
  );
}