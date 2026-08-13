"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Building2, MapPin, Phone, Trash2, Eye, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { gymsApi } from "@/lib/api";
import { gymTypeLabel } from "@/lib/utils";
import toast from "react-hot-toast";

interface Gym {
  id: string;
  name: string;
  phone: string;
  gymType: number;
  latitude: number;
  longitude: number;
  logoUrl?: string;
  gymManager?: { id: string; name: string; email: string; phoneNumber: string; gymId: string };
  plans?: unknown[];
  images?: unknown[];
  description?: string;
}

interface GymFormState {
  gymName: string;
  gymType: string;
  latitude: string;
  longitude: string;
  phone: string;
  description: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  managerPassword: string;
}

const defaultForm: GymFormState = {
  gymName: "",
  gymType: "3",
  latitude: "",
  longitude: "",
  phone: "",
  description: "",
  managerName: "",
  managerEmail: "",
  managerPhone: "",
  managerPassword: "",
};

export default function AdminGymsPage() {
  const { t } = useTranslation();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Gym | null>(null);
  const [viewTarget, setViewTarget] = useState<Gym | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<GymFormState>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<GymFormState>>({});

  const perPage = 10;

  const fetchGyms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gymsApi.getAll({
        searchQuery: search || undefined,
        "pageInfo.pageNumber": page,
        "pageInfo.resultsPerPage": perPage,
      });
      setGyms(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error("Failed to load gyms");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const validateForm = (): boolean => {
    const errs: Partial<GymFormState> = {};
    if (!form.gymName.trim()) errs.gymName = "Gym name is required";
    if (!form.managerName.trim()) errs.managerName = "Manager name is required";
    if (!form.managerEmail.trim()) errs.managerEmail = "Manager email is required";
    if (!form.managerPassword || form.managerPassword.length < 8)
      errs.managerPassword = "Min 8 characters";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await gymsApi.create({
        gymName: form.gymName,
        gymType: Number(form.gymType),
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        phone: form.phone,
        description: form.description,
        managerName: form.managerName,
        managerEmail: form.managerEmail,
        managerPhone: form.managerPhone,
        managerPassword: form.managerPassword,
      });
      toast.success(t.gyms.createSuccess);
      setCreateOpen(false);
      setForm(defaultForm);
      fetchGyms();
    } catch {
      toast.error("Failed to create gym");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await gymsApi.delete(deleteTarget.id);
      toast.success(t.gyms.deleteSuccess);
      setDeleteTarget(null);
      fetchGyms();
    } catch {
      toast.error("Cannot delete gym (may have active subscriptions)");
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key: keyof GymFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const inputStyle = {
    background: "#0f1013",
    borderColor: "#2f3742",
    color: "#e9ecf1",
    outline: "none",
    fontFamily: "Inter, sans-serif",
  };

  const labelStyle = {
    fontFamily: "JetBrains Mono, monospace",
    color: "#c3cad6",
    fontSize: "11px",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  };

  return (
    <DashboardLayout title={t.gyms.title} requiredRole="super_admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#8b93a1" }}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={`${t.common.search} gyms...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
              style={{ ...inputStyle }}
            />
          </div>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateOpen(true)}
          >
            {t.gyms.createGym}
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-48 shimmer" />
            ))}
          </div>
        ) : gyms.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8b93a1" }}>
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t.common.noData}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gyms.map((gym) => (
              <div
                key={gym.id}
                className="rounded-2xl border p-5 flex flex-col gap-4 card-interactive"
                style={{ background: "#171a1e", borderColor: "#2f3742" }}
              >
                <div className="flex items-start gap-3">
                  {gym.logoUrl ? (
                    <img
                      src={gym.logoUrl}
                      alt={gym.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#23272e" }}
                    >
                      <Building2 className="w-6 h-6" style={{ color: "#c8f323" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                    >
                      {gym.name}
                    </p>
                    <Badge variant="default" className="mt-1">
                      {gymTypeLabel(gym.gymType)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {gym.phone && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#c3cad6" }}
                    >
                      <Phone className="w-3.5 h-3.5" style={{ color: "#8b93a1" }} />
                      {gym.phone}
                    </div>
                  )}
                  {(gym.latitude !== 0 || gym.longitude !== 0) && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#c3cad6" }}
                    >
                      <MapPin className="w-3.5 h-3.5" style={{ color: "#8b93a1" }} />
                      {gym.latitude?.toFixed(4)}, {gym.longitude?.toFixed(4)}
                    </div>
                  )}
                  {gym.gymManager && (
                    <div className="text-xs" style={{ color: "#c3cad6" }}>
                      Manager:{" "}
                      <span style={{ color: "#e9ecf1" }}>{gym.gymManager.name}</span>
                    </div>
                  )}
                </div>

                <div
                  className="flex items-center justify-between pt-2 border-t"
                  style={{ borderColor: "#23272e" }}
                >
                  <div
                    className="flex items-center gap-3 text-xs"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      color: "#8b93a1",
                    }}
                  >
                    <span>{(gym.plans as unknown[])?.length ?? 0} plans</span>
                    <span>{(gym.images as unknown[])?.length ?? 0} photos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewTarget(gym)}
                      className="p-1.5 rounded-lg hover:bg-[#23272e] transition-colors"
                      style={{ color: "#c3cad6" }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(gym)}
                      className="p-1.5 rounded-lg hover:bg-[#93000a]/20 transition-colors"
                      style={{ color: "#ffb4ab" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalCount / perPage) || 1}
          onPageChange={setPage}
          totalCount={totalCount}
          resultsPerPage={perPage}
        />
      </div>

      {/* Create Gym Modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setForm(defaultForm);
          setFormErrors({});
        }}
        title={t.gyms.createGym}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                setForm(defaultForm);
                setFormErrors({});
              }}
            >
              {t.common.cancel}
            </Button>
            <Button loading={submitting} onClick={handleCreate}>
              {t.common.create}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div
            className="text-xs font-semibold uppercase tracking-widest pb-2 border-b"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              color: "#c8f323",
              borderColor: "#2f3742",
            }}
          >
            Gym Details
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label style={labelStyle} className="block mb-1.5">{t.gyms.gymName}</label>
              <input
                value={form.gymName}
                onChange={(e) => setField("gymName", e.target.value)}
                placeholder="Gold's Gym New Cairo"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={{ ...inputStyle, borderColor: formErrors.gymName ? "#ffb4ab" : "#2f3742" }}
              />
              {formErrors.gymName && <p className="text-xs mt-1" style={{ color: "#ffb4ab" }}>{formErrors.gymName}</p>}
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.gymType}</label>
              <select
                value={form.gymType}
                onChange={(e) => setField("gymType", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm appearance-none"
                style={inputStyle}
              >
                <option value="0">Unspecified</option>
                <option value="1">Male Only</option>
                <option value="2">Female Only</option>
                <option value="3">Mixed</option>
              </select>
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.common.phone}</label>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+201000000000"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.latitude}</label>
              <input
                value={form.latitude}
                onChange={(e) => setField("latitude", e.target.value)}
                placeholder="30.0444"
                type="number"
                step="any"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.longitude}</label>
              <input
                value={form.longitude}
                onChange={(e) => setField("longitude", e.target.value)}
                placeholder="31.2357"
                type="number"
                step="any"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
            <div className="sm:col-span-2">
              <label style={labelStyle} className="block mb-1.5">{t.common.description}</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={2}
                placeholder="State of the art fitness facility"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent resize-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            className="text-xs font-semibold uppercase tracking-widest pb-2 border-b"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              color: "#4ae176",
              borderColor: "#2f3742",
            }}
          >
            Manager Details
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.managerName}</label>
              <input
                value={form.managerName}
                onChange={(e) => setField("managerName", e.target.value)}
                placeholder="Mark Johnson"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={{ ...inputStyle, borderColor: formErrors.managerName ? "#ffb4ab" : "#2f3742" }}
              />
              {formErrors.managerName && <p className="text-xs mt-1" style={{ color: "#ffb4ab" }}>{formErrors.managerName}</p>}
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.managerEmail}</label>
              <input
                value={form.managerEmail}
                onChange={(e) => setField("managerEmail", e.target.value)}
                placeholder="mark@gym.com"
                type="email"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={{ ...inputStyle, borderColor: formErrors.managerEmail ? "#ffb4ab" : "#2f3742" }}
              />
              {formErrors.managerEmail && <p className="text-xs mt-1" style={{ color: "#ffb4ab" }}>{formErrors.managerEmail}</p>}
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.managerPhone}</label>
              <input
                value={form.managerPhone}
                onChange={(e) => setField("managerPhone", e.target.value)}
                placeholder="+201111111111"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.managerPassword}</label>
              <input
                value={form.managerPassword}
                onChange={(e) => setField("managerPassword", e.target.value)}
                placeholder="Min 8 characters"
                type="password"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={{ ...inputStyle, borderColor: formErrors.managerPassword ? "#ffb4ab" : "#2f3742" }}
              />
              {formErrors.managerPassword && <p className="text-xs mt-1" style={{ color: "#ffb4ab" }}>{formErrors.managerPassword}</p>}
            </div>
          </div>
        </div>
      </Modal>

      {/* View Gym Modal */}
      {viewTarget && (
        <Modal
          open={!!viewTarget}
          onClose={() => setViewTarget(null)}
          title={viewTarget.name}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {viewTarget.logoUrl ? (
                <img
                  src={viewTarget.logoUrl}
                  alt={viewTarget.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ background: "#23272e" }}
                >
                  <Building2 className="w-8 h-8" style={{ color: "#c8f323" }} />
                </div>
              )}
              <div>
                <h3
                  className="font-semibold"
                  style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                >
                  {viewTarget.name}
                </h3>
                <Badge variant="default">{gymTypeLabel(viewTarget.gymType)}</Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm" style={{ color: "#c3cad6" }}>
              <div className="flex justify-between">
                <span>Phone</span>
                <span style={{ color: "#e9ecf1" }}>{viewTarget.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Location</span>
                <span style={{ color: "#e9ecf1" }}>
                  {viewTarget.latitude}, {viewTarget.longitude}
                </span>
              </div>
              {viewTarget.gymManager && (
                <>
                  <div className="flex justify-between">
                    <span>Manager</span>
                    <span style={{ color: "#e9ecf1" }}>{viewTarget.gymManager.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manager Email</span>
                    <span style={{ color: "#e9ecf1" }}>{viewTarget.gymManager.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manager Phone</span>
                    <span style={{ color: "#e9ecf1" }}>{viewTarget.gymManager.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manager ID</span>
                    <span style={{ color: "#e9ecf1", fontFamily: "JetBrains Mono, monospace" }}>{viewTarget.gymManager.gymId}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>Plans</span>
                <span style={{ color: "#e9ecf1" }}>
                  {(viewTarget.plans as unknown[])?.length ?? 0}
                </span>
              </div>
              {viewTarget.description && (
                <div>
                  <span className="block mb-1">Description</span>
                  <span style={{ color: "#e9ecf1" }}>{viewTarget.description}</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t.gyms.deleteGym}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" loading={submitting} onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p style={{ color: "#e9ecf1" }}>{t.gyms.deleteConfirm}</p>
          <p className="text-sm" style={{ color: "#ffb4ab" }}>
            {t.gyms.deleteWarning}
          </p>
          {deleteTarget && (
            <div
              className="px-4 py-3 rounded-xl border text-sm font-medium"
              style={{
                borderColor: "#93000a",
                background: "#93000a20",
                color: "#ffb4ab",
              }}
            >
              {deleteTarget.name}
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
