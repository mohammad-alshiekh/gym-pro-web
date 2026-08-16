"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Building2, MapPin, Phone, Trash2, Eye, EyeOff, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import LocationPicker from "@/components/ui/LocationPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { gymsApi } from "@/lib/api";
import { GYM_TYPES } from "@/lib/manager";
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
  gymType: "",
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
  const { t, locale } = useTranslation();
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
  const [showManagerPassword, setShowManagerPassword] = useState(false);

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
      toast.error(t.gyms.toastFailedLoadGyms);
    } finally {
      setLoading(false);
    }
  }, [search, page, t]);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const validateForm = (): boolean => {
    const errs: Partial<GymFormState> = {};
    if (!form.gymName.trim()) errs.gymName = t.gyms.validationGymNameRequired;
    if (!form.gymType) errs.gymType = t.gyms.validationGymTypeRequired;
    if (!form.managerName.trim()) errs.managerName = t.gyms.validationManagerNameRequired;
    if (!form.managerEmail.trim()) errs.managerEmail = t.gyms.validationManagerEmailRequired;
    if (!form.managerPassword || form.managerPassword.length < 8)
      errs.managerPassword = t.gyms.validationManagerPasswordMin;
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
      toast.error(t.gyms.toastFailedCreateGym);
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
      toast.error(t.gyms.toastCannotDeleteGym);
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key: keyof GymFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const inputStyle = {
    background: "#0e0e0e",
    borderColor: "#2a2a2a",
    color: "#ffffff",
    outline: "none",
    fontFamily: "Manrope, sans-serif",
  };

  const labelStyle = {
    fontFamily: "JetBrains Mono, monospace",
    color: "#adaaaa",
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
              style={{ color: "#8a8888" }}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
               placeholder={`${t.common.search}...`}
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
          <div className="text-center py-20" style={{ color: "#8a8888" }}>
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t.common.noData}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gyms.map((gym) => (
              <div
                key={gym.id}
                className="rounded-2xl border p-5 flex flex-col gap-4 card-interactive"
                style={{ background: "#131313", borderColor: "#2a2a2a" }}
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
                      style={{ background: "#20201f" }}
                    >
                      <Building2 className="w-6 h-6" style={{ color: "#cafd00" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                    >
                      {gym.name}
                    </p>
                    <Badge variant="default" className="mt-1">
                      {gymTypeLabel(gym.gymType, locale)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {gym.phone && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#adaaaa" }}
                    >
                      <Phone className="w-3.5 h-3.5" style={{ color: "#8a8888" }} />
                      {gym.phone}
                    </div>
                  )}
                  {(gym.latitude !== 0 || gym.longitude !== 0) && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#adaaaa" }}
                    >
                      <MapPin className="w-3.5 h-3.5" style={{ color: "#8a8888" }} />
                      {gym.latitude?.toFixed(4)}, {gym.longitude?.toFixed(4)}
                    </div>
                  )}
                  {gym.gymManager && (
                    <div className="text-xs" style={{ color: "#adaaaa" }}>
                      {t.gyms.gymManager}:{" "}
                      <span style={{ color: "#ffffff" }}>{gym.gymManager.name}</span>
                    </div>
                  )}
                </div>

                <div
                  className="flex items-center justify-between pt-2 border-t"
                  style={{ borderColor: "#20201f" }}
                >
                  <div
                    className="flex items-center gap-3 text-xs"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      color: "#8a8888",
                    }}
                  >
                    <span>{(gym.plans as unknown[])?.length ?? 0}{t.gyms.plansCount}</span>
                    <span>{(gym.images as unknown[])?.length ?? 0}{t.gyms.photosCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewTarget(gym)}
                      className="p-1.5 rounded-lg hover:bg-[#20201f] transition-colors"
                      style={{ color: "#adaaaa" }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(gym)}
                      className="p-1.5 rounded-lg hover:bg-[#5c1620]/20 transition-colors"
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
              color: "#cafd00",
              borderColor: "#2a2a2a",
            }}
          >
            {t.gyms.sectionGymDetails}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label style={labelStyle} className="block mb-1.5">{t.gyms.gymName}</label>
              <input
                value={form.gymName}
                onChange={(e) => setField("gymName", e.target.value)}
                placeholder={t.gyms.sectionGymDetails}
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={{ ...inputStyle, borderColor: formErrors.gymName ? "#ff6e81" : "#2a2a2a" }}
              />
              {formErrors.gymName && <p className="text-xs mt-1" style={{ color: "#ff6e81" }}>{formErrors.gymName}</p>}
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.gymType}</label>
              <select
                value={form.gymType}
                onChange={(e) => setField("gymType", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm appearance-none"
                style={{ ...inputStyle, borderColor: formErrors.gymType ? "#ff6e81" : "#2a2a2a" }}
              >
                <option value="" disabled>
                  {t.gyms.selectGymType}
                </option>
                {GYM_TYPES.map((value) => (
                  <option key={value} value={String(value)}>
                    {gymTypeLabel(value, locale)}
                  </option>
                ))}
              </select>
              {formErrors.gymType && (
                <p className="text-xs mt-1" style={{ color: "#ff6e81" }}>{formErrors.gymType}</p>
              )}
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.common.phone}</label>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder={t.common.phoneExample}
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
            <div className="sm:col-span-2">
              <label style={labelStyle} className="block mb-1.5">{t.gyms.location}</label>
              <LocationPicker
                lat={form.latitude}
                lng={form.longitude}
                label={t.gyms.location}
                onChange={(lat, lng) =>
                  setForm((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label style={labelStyle} className="block mb-1.5">{t.common.description}</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={2}
                placeholder={t.gyms.descriptionPlaceholder}
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
              borderColor: "#2a2a2a",
            }}
          >
            {t.gyms.sectionManagerDetails}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.managerName}</label>
              <input
                value={form.managerName}
                onChange={(e) => setField("managerName", e.target.value)}
                placeholder={t.gyms.managerNamePlaceholder}
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={{ ...inputStyle, borderColor: formErrors.managerName ? "#ff6e81" : "#2a2a2a" }}
              />
              {formErrors.managerName && <p className="text-xs mt-1" style={{ color: "#ff6e81" }}>{formErrors.managerName}</p>}
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.managerEmail}</label>
              <input
                value={form.managerEmail}
                onChange={(e) => setField("managerEmail", e.target.value)}
                placeholder={t.gyms.managerEmailPlaceholder}
                type="email"
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={{ ...inputStyle, borderColor: formErrors.managerEmail ? "#ff6e81" : "#2a2a2a" }}
              />
              {formErrors.managerEmail && <p className="text-xs mt-1" style={{ color: "#ff6e81" }}>{formErrors.managerEmail}</p>}
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.managerPhone}</label>
              <input
                value={form.managerPhone}
                onChange={(e) => setField("managerPhone", e.target.value)}
                placeholder={t.gyms.managerPhonePlaceholder}
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} className="block mb-1.5">{t.gyms.managerPassword}</label>
              <div className="relative">
                <input
                  value={form.managerPassword}
                  onChange={(e) => setField("managerPassword", e.target.value)}
                  placeholder={t.gyms.managerPasswordPlaceholder}
                  type={showManagerPassword ? "text" : "password"}
                  className="w-full px-4 py-3 pr-11 rounded-xl border text-sm input-accent"
                  style={{ ...inputStyle, borderColor: formErrors.managerPassword ? "#ff6e81" : "#2a2a2a" }}
                />
                <button
                  type="button"
                  onClick={() => setShowManagerPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-[#cafd00]"
                  style={{ color: "#8a8888" }}
                >
                  {showManagerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.managerPassword && <p className="text-xs mt-1" style={{ color: "#ff6e81" }}>{formErrors.managerPassword}</p>}
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
                  style={{ background: "#20201f" }}
                >
                  <Building2 className="w-8 h-8" style={{ color: "#cafd00" }} />
                </div>
              )}
              <div>
                <h3
                  className="font-semibold"
                  style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
                >
                  {viewTarget.name}
                </h3>
                  <Badge variant="default">{gymTypeLabel(viewTarget.gymType, locale)}</Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm" style={{ color: "#adaaaa" }}>
              <div className="flex justify-between">
                <span>{t.gyms.viewPhone}</span>
                <span style={{ color: "#ffffff" }}>{viewTarget.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.gyms.viewLocation}</span>
                <span style={{ color: "#ffffff" }}>
                  {viewTarget.latitude}, {viewTarget.longitude}
                </span>
              </div>
              {viewTarget.gymManager && (
                <>
                  <div className="flex justify-between">
                    <span>{t.gyms.viewManager}</span>
                    <span style={{ color: "#ffffff" }}>{viewTarget.gymManager.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.gyms.viewManagerEmail}</span>
                    <span style={{ color: "#ffffff" }}>{viewTarget.gymManager.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.gyms.viewManagerPhone}</span>
                    <span style={{ color: "#ffffff" }}>{viewTarget.gymManager.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.gyms.viewManagerId}</span>
                    <span style={{ color: "#ffffff", fontFamily: "JetBrains Mono, monospace" }}>{viewTarget.gymManager.gymId}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>{t.gyms.viewPlans}</span>
                <span style={{ color: "#ffffff" }}>
                  {(viewTarget.plans as unknown[])?.length ?? 0}
                </span>
              </div>
              {viewTarget.description && (
                <div>
                  <span className="block mb-1">Description</span>
                  <span style={{ color: "#ffffff" }}>{viewTarget.description}</span>
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
          <p style={{ color: "#ffffff" }}>{t.gyms.deleteConfirm}</p>
          <p className="text-sm" style={{ color: "#ff6e81" }}>
            {t.gyms.deleteWarning}
          </p>
          {deleteTarget && (
            <div
              className="px-4 py-3 rounded-xl border text-sm font-medium"
              style={{
                borderColor: "#5c1620",
                background: "#5c162020",
                color: "#ff6e81",
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
