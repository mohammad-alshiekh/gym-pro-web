"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImagePlus,
  Images,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { myGymApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import { formatCurrency, gymTypeLabel, serviceTypeLabel } from "@/lib/utils";
import {
  DAY_KEYS,
  GENDER_FEMALE,
  GENDER_MALE,
  buildGymFormData,
  buildImageFormData,
  moveImage,
  sortImages,
  toGymForm,
  validateGymForm,
  type GymForm,
  type GymImage,
  type MyGym,
  type WorkingPeriod,
} from "@/lib/gym";
import toast from "react-hot-toast";

const CARD: React.CSSProperties = { background: "#171a1e", borderColor: "#2f3742" };
const INPUT: React.CSSProperties = {
  background: "#0f1013",
  borderColor: "#2f3742",
  color: "#e9ecf1",
  outline: "none",
};
const MONO: React.CSSProperties = { fontFamily: "JetBrains Mono, monospace", color: "#8b93a1" };

function SectionCard({
  icon: Icon,
  title,
  meta,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  meta?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border p-5 sm:p-6" style={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(200,243,35,0.1)", color: "#c8f323" }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3
              className="text-base font-semibold truncate"
              style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
            >
              {title}
            </h3>
            {meta && (
              <p className="text-xs truncate" style={MONO}>
                {meta}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-medium uppercase tracking-widest mb-1.5" style={MONO}>
      {children}
    </label>
  );
}

export default function MyGymPage() {
  const { t, isRtl } = useTranslation();

  const [gym, setGym] = useState<MyGym | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<GymForm | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Gallery
  const [images, setImages] = useState<GymImage[]>([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GymImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const applyGym = useCallback((data: MyGym) => {
    setGym(data);
    setForm(toGymForm(data));
    setImages(sortImages(data.images));
    setOrderDirty(false);
  }, []);

  const fetchGym = useCallback(async () => {
    try {
      const res = await myGymApi.get();
      applyGym(res.data);
      setLoadFailed(false);
    } catch (err) {
      setLoadFailed(true);
      toast.error(apiErrorMessage(err, t.gyms.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [applyGym, t]);

  useEffect(() => {
    fetchGym();
  }, [fetchGym]);

  // Counted from the form so the tile tracks unsaved toggles while editing.
  const enabledServices = useMemo(
    () => (form?.services ?? []).filter((s) => s.isEnabled).length,
    [form]
  );

  // ── Details editing ──
  const patchForm = (values: Partial<GymForm>) =>
    setForm((prev) => (prev ? { ...prev, ...values } : prev));

  const startEdit = () => {
    if (gym) setForm(toGymForm(gym));
    setEditMode(true);
  };

  const cancelEdit = () => {
    if (gym) setForm(toGymForm(gym));
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    setEditMode(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async () => {
    if (!form) return;

    const problem = validateGymForm(form);
    if (problem) {
      toast.error(t.gyms[problem]);
      return;
    }

    setSaving(true);
    try {
      await myGymApi.update(buildGymFormData(form, logoFile));
      toast.success(t.gyms.updateSuccess);
      setLogoFile(null);
      setLogoPreview(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      setEditMode(false);
      // Re-read so the logo URL and any server-side normalisation are reflected.
      await fetchGym();
    } catch (err) {
      toast.error(apiErrorMessage(err, t.gyms.updateFailed));
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (serviceType: number) =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            services: prev.services.map((s) =>
              s.serviceType === serviceType ? { ...s, isEnabled: !s.isEnabled } : s
            ),
          }
        : prev
    );

  const updatePeriod = (index: number, values: Partial<WorkingPeriod>) =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            workingPeriods: prev.workingPeriods.map((wp, i) =>
              i === index ? { ...wp, ...values } : wp
            ),
          }
        : prev
    );

  const addPeriod = () =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            workingPeriods: [
              ...prev.workingPeriods,
              { dayOfWeek: 0, startTime: "09:00", endTime: "22:00", genderType: GENDER_MALE },
            ],
          }
        : prev
    );

  const removePeriod = (index: number) =>
    setForm((prev) =>
      prev
        ? { ...prev, workingPeriods: prev.workingPeriods.filter((_, i) => i !== index) }
        : prev
    );

  // ── Gallery ──
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const resetUpload = () => {
    setUploadOpen(false);
    setImageFile(null);
    setImagePreview(null);
    setImageDescription("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!imageFile) {
      toast.error(t.gyms.selectImageFirst);
      return;
    }
    setUploading(true);
    try {
      // New images go to the end of the gallery.
      await myGymApi.addImage(buildImageFormData(imageFile, images.length, imageDescription));
      toast.success(t.gyms.imageAdded);
      resetUpload();
      await fetchGym();
    } catch (err) {
      toast.error(apiErrorMessage(err, t.gyms.imageAddFailed));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await myGymApi.deleteImage(deleteTarget.id);
      toast.success(t.gyms.imageDeleted);
      setDeleteTarget(null);
      await fetchGym();
    } catch (err) {
      // e.g. { status: 400, errorCode: 404, message: "Gym image not found." }
      toast.error(apiErrorMessage(err, t.gyms.imageDeleteFailed));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const shiftImage = (index: number, delta: number) => {
    setImages((prev) => {
      const next = moveImage(prev, index, index + delta);
      if (next !== prev) setOrderDirty(true);
      return next;
    });
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      await myGymApi.reorderImages(images.map((img) => img.id));
      toast.success(t.gyms.orderSaved);
      setOrderDirty(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, t.gyms.orderFailed));
    } finally {
      setSavingOrder(false);
    }
  };

  // ── States ──
  if (loading) {
    return (
      <DashboardLayout title={t.nav.myGym} requiredRole="gym_manager">
        <div className="space-y-5">
          <div className="h-40 rounded-2xl shimmer" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl shimmer" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!gym || !form) {
    return (
      <DashboardLayout title={t.nav.myGym} requiredRole="gym_manager">
        <div className="rounded-2xl border py-20 text-center" style={CARD}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#23272e" }}
          >
            <Building2 className="w-7 h-7" style={{ color: "#c8f323", opacity: 0.5 }} />
          </div>
          <p className="text-sm mb-5" style={{ color: "#8b93a1" }}>
            {t.gyms.noGym}
          </p>
          {loadFailed && (
            <Button variant="secondary" size="sm" onClick={fetchGym}>
              {t.common.refresh}
            </Button>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const logoSrc = logoPreview ?? gym.logoUrl;
  const activePlans = gym.plans?.filter((p) => p.isActive).length ?? 0;

  const statTiles = [
    { label: t.gyms.gallery, value: images.length, icon: Images, color: "#c8f323" },
    {
      label: t.gyms.services,
      value: `${enabledServices}/8`,
      icon: Sparkles,
      color: "#4ae176",
    },
    {
      label: t.gyms.workingHours,
      value: gym.workingPeriods?.length ?? 0,
      icon: Clock,
      color: "#adc6ff",
    },
    { label: t.gyms.plans, value: activePlans, icon: Check, color: "#ffd04a" },
  ];

  return (
    <DashboardLayout title={t.nav.myGym} requiredRole="gym_manager">
      <div className="space-y-5 pb-6">
        {/* ── Hero ── */}
        <section className="rounded-2xl border p-5 sm:p-6" style={CARD}>
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              {/* Logo */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center border"
                  style={{ background: "#23272e", borderColor: "#2f3742" }}
                >
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoSrc}
                      alt={gym.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <Building2 className="w-9 h-9" style={{ color: "#c8f323", opacity: 0.6 }} />
                  )}
                </div>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    title={t.gyms.replaceLogo}
                    className="absolute -bottom-2 -right-2 p-2 rounded-xl border transition-colors hover:border-[#c8f323]"
                    style={{ background: "#0f1013", borderColor: "#2f3742", color: "#c8f323" }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>

              <div className="min-w-0 space-y-2">
                {editMode ? (
                  <input
                    value={form.name}
                    onChange={(e) => patchForm({ name: e.target.value })}
                    className="text-xl font-bold px-3 py-2 rounded-xl border input-accent w-full max-w-sm"
                    style={{ ...INPUT, fontFamily: "Lexend, sans-serif" }}
                  />
                ) : (
                  <h2
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                  >
                    {gym.name}
                  </h2>
                )}

                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant="default">{gymTypeLabel(gym.gymType)}</Badge>
                  {!editMode && (
                    <>
                      {gym.phone && (
                        <span
                          className="flex items-center gap-1.5 text-sm"
                          style={{ color: "#c3cad6" }}
                        >
                          <Phone className="w-3.5 h-3.5" style={{ color: "#8b93a1" }} />
                          {gym.phone}
                        </span>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${gym.latitude},${gym.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t.gyms.openMap}
                        className="flex items-center gap-1.5 text-sm transition-colors hover:text-[#c8f323]"
                        style={{ color: "#c3cad6" }}
                      >
                        <MapPin className="w-3.5 h-3.5" style={{ color: "#8b93a1" }} />
                        <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {gym.latitude}, {gym.longitude}
                        </span>
                      </a>
                    </>
                  )}
                </div>

                {!editMode && (
                  <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "#c3cad6" }}>
                    {gym.description || t.gyms.myGymSubtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {editMode ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={cancelEdit}
                    disabled={saving}
                    icon={<XCircle className="w-4 h-4" />}
                  >
                    {t.gyms.discard}
                  </Button>
                  <Button
                    variant="primary"
                    loading={saving}
                    onClick={handleSave}
                    icon={<Save className="w-4 h-4" />}
                  >
                    {t.gyms.saveChanges}
                  </Button>
                </>
              ) : (
                <Button variant="secondary" onClick={startEdit}>
                  {t.gyms.editDetails}
                </Button>
              )}
            </div>
          </div>

          {/* Editable detail fields */}
          {editMode && (
            <div className="mt-6 pt-5 border-t space-y-4" style={{ borderColor: "#2f3742" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>{t.common.phone}</FieldLabel>
                  <input
                    value={form.phone}
                    onChange={(e) => patchForm({ phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm input-accent"
                    style={INPUT}
                  />
                </div>
                <div>
                  <FieldLabel>{t.gyms.latitude}</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => patchForm({ latitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm input-accent"
                    style={{ ...INPUT, fontFamily: "JetBrains Mono, monospace" }}
                  />
                </div>
                <div>
                  <FieldLabel>{t.gyms.longitude}</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => patchForm({ longitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm input-accent"
                    style={{ ...INPUT, fontFamily: "JetBrains Mono, monospace" }}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{t.common.description}</FieldLabel>
                <textarea
                  value={form.description}
                  onChange={(e) => patchForm({ description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm input-accent resize-y"
                  style={INPUT}
                />
              </div>

              <p className="text-xs" style={{ color: "#8b93a1" }}>
                {t.gyms.logoHint}
                {logoFile && (
                  <span style={{ color: "#c8f323" }}> · {logoFile.name}</span>
                )}
              </p>
            </div>
          )}
        </section>

        {/* ── Stat tiles ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statTiles.map((tile) => (
            <div
              key={tile.label}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
              style={CARD}
            >
              <div
                className="p-2 rounded-xl flex-shrink-0"
                style={{ background: `${tile.color}15`, color: tile.color }}
              >
                <tile.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-medium uppercase tracking-widest truncate"
                  style={MONO}
                >
                  {tile.label}
                </p>
                <p
                  className="text-sm font-bold truncate mt-0.5"
                  style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                >
                  {tile.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Services ── */}
          <SectionCard
            icon={Sparkles}
            title={t.gyms.services}
            meta={t.gyms.servicesEnabled
              .replace("{enabled}", String(form.services.filter((s) => s.isEnabled).length))
              .replace("{total}", String(form.services.length))}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* form.services always holds the full 1–8 list; it is reset from
                  the gym on load and on cancel, so it is correct in view mode too. */}
              {form.services.map((s) => {
                const on = s.isEnabled;
                return (
                  <button
                    key={s.serviceType}
                    type="button"
                    disabled={!editMode}
                    onClick={() => toggleService(s.serviceType)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors disabled:cursor-default"
                    style={{
                      background: on ? "rgba(200,243,35,0.07)" : "#0f1013",
                      borderColor: on ? "rgba(200,243,35,0.35)" : "#2f3742",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: on ? "#c8f323" : "#23272e" }}
                    >
                      {on ? (
                        <Check className="w-3 h-3" style={{ color: "#293500" }} />
                      ) : (
                        <X className="w-3 h-3" style={{ color: "#8b93a1" }} />
                      )}
                    </div>
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: on ? "#e9ecf1" : "#8b93a1" }}
                    >
                      {serviceTypeLabel(s.serviceType)}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* ── Working hours ── */}
          <SectionCard
            icon={Clock}
            title={t.gyms.workingHours}
            action={
              editMode ? (
                <button
                  type="button"
                  onClick={addPeriod}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: "rgba(200,243,35,0.12)", color: "#c8f323" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.gyms.addPeriod}
                </button>
              ) : undefined
            }
          >
            {editMode ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {form.workingPeriods.length === 0 && (
                  <p className="text-xs py-6 text-center" style={{ color: "#8b93a1" }}>
                    {t.gyms.noPeriodsHint}
                  </p>
                )}
                {form.workingPeriods.map((wp, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-2 items-center p-2.5 rounded-xl border"
                    style={{ background: "#0f1013", borderColor: "#2f3742" }}
                  >
                    <select
                      value={wp.dayOfWeek}
                      onChange={(e) => updatePeriod(i, { dayOfWeek: Number(e.target.value) })}
                      className="px-2 py-1.5 rounded-lg border text-xs cursor-pointer"
                      style={INPUT}
                    >
                      {DAY_KEYS.map((key, idx) => (
                        <option key={key} value={idx} style={{ background: "#0f1013" }}>
                          {t.gyms[key]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={wp.startTime}
                      onChange={(e) => updatePeriod(i, { startTime: e.target.value })}
                      className="px-2 py-1.5 rounded-lg border text-xs"
                      style={INPUT}
                    />
                    <input
                      type="time"
                      value={wp.endTime}
                      onChange={(e) => updatePeriod(i, { endTime: e.target.value })}
                      className="px-2 py-1.5 rounded-lg border text-xs"
                      style={INPUT}
                    />
                    <select
                      value={wp.genderType}
                      onChange={(e) => updatePeriod(i, { genderType: Number(e.target.value) })}
                      className="px-2 py-1.5 rounded-lg border text-xs cursor-pointer"
                      style={INPUT}
                    >
                      <option value={GENDER_FEMALE} style={{ background: "#0f1013" }}>
                        {t.gyms.female}
                      </option>
                      <option value={GENDER_MALE} style={{ background: "#0f1013" }}>
                        {t.gyms.male}
                      </option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removePeriod(i)}
                      title={t.common.delete}
                      className="p-1.5 rounded-lg justify-self-end transition-colors hover:bg-[#93000a]/20"
                      style={{ color: "#ffb4ab" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : gym.workingPeriods?.length ? (
              <div className="space-y-2">
                {form.workingPeriods.map((wp, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl"
                    style={{ background: "#0f1013" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "#e9ecf1" }}>
                      {t.gyms[DAY_KEYS[wp.dayOfWeek] ?? "sunday"]}
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs"
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#c8f323" }}
                      >
                        {wp.startTime} – {wp.endTime}
                      </span>
                      <Badge variant={wp.genderType === GENDER_MALE ? "info" : "neutral"}>
                        {wp.genderType === GENDER_MALE ? t.gyms.male : t.gyms.female}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-25" style={{ color: "#c8f323" }} />
                <p className="text-sm" style={{ color: "#8b93a1" }}>
                  {t.gyms.noPeriods}
                </p>
                <p className="text-xs mt-1" style={{ color: "#8b93a1" }}>
                  {t.gyms.noPeriodsHint}
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Gallery ── */}
        <SectionCard
          icon={Images}
          title={t.gyms.gallery}
          meta={t.gyms.galleryCount.replace("{count}", String(images.length))}
          action={
            <div className="flex items-center gap-2">
              {orderDirty && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={savingOrder}
                  onClick={handleSaveOrder}
                >
                  {t.gyms.saveOrder}
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setUploadOpen(true)}
                icon={<ImagePlus className="w-3.5 h-3.5" />}
              >
                {t.gyms.uploadImage}
              </Button>
            </div>
          }
        >
          {images.length === 0 ? (
            <div className="py-12 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#23272e" }}
              >
                <Images className="w-6 h-6" style={{ color: "#c8f323", opacity: 0.5 }} />
              </div>
              <p className="text-sm" style={{ color: "#8b93a1" }}>
                {t.gyms.noImages}
              </p>
              <p className="text-xs mt-1" style={{ color: "#8b93a1" }}>
                {t.gyms.noImagesHint}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  className="relative rounded-xl overflow-hidden border group"
                  style={{ aspectRatio: "1", background: "#0f1013", borderColor: "#2f3742" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.description ?? gym.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />

                  <span
                    className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                    style={{
                      background: "rgba(15,16,19,0.85)",
                      color: "#c8f323",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {index + 1}
                  </span>

                  <div
                    className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title={isRtl ? t.gyms.moveRight : t.gyms.moveLeft}
                        disabled={index === 0}
                        onClick={() => shiftImage(index, -1)}
                        className="p-1.5 rounded-lg disabled:opacity-30"
                        style={{ background: "rgba(15,16,19,0.8)", color: "#c3cad6" }}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={isRtl ? t.gyms.moveLeft : t.gyms.moveRight}
                        disabled={index === images.length - 1}
                        onClick={() => shiftImage(index, 1)}
                        className="p-1.5 rounded-lg disabled:opacity-30"
                        style={{ background: "rgba(15,16,19,0.8)", color: "#c3cad6" }}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      title={t.gyms.deleteImage}
                      onClick={() => setDeleteTarget(img)}
                      className="p-1.5 rounded-lg"
                      style={{ background: "#93000a", color: "#ffdad6" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {img.description && (
                    <p
                      className="absolute top-2 right-2 max-w-[60%] truncate px-1.5 py-0.5 rounded-md text-[10px]"
                      style={{ background: "rgba(15,16,19,0.85)", color: "#c3cad6" }}
                      title={img.description}
                    >
                      {img.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {orderDirty && (
            <p className="mt-3 text-xs" style={{ color: "#ffd04a" }}>
              {t.gyms.unsavedOrder}
            </p>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Plans ── */}
          <SectionCard
            icon={Check}
            title={t.gyms.plans}
            meta={t.gyms.plansCount.replace("{count}", String(gym.plans?.length ?? 0))}
            action={
              <Link
                href="/manager/plans"
                className="text-xs transition-colors hover:text-[#c8f323]"
                style={MONO}
              >
                {t.gyms.managePlans} →
              </Link>
            }
          >
            {!gym.plans?.length ? (
              <p className="text-sm py-8 text-center" style={{ color: "#8b93a1" }}>
                {t.gyms.noPlans}
              </p>
            ) : (
              <div className="space-y-2">
                {gym.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border"
                    style={{ background: "#0f1013", borderColor: "#2f3742" }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ fontFamily: "Lexend, sans-serif", color: "#e9ecf1" }}
                      >
                        {plan.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#8b93a1" }}>
                        {plan.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-sm font-bold"
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#c8f323" }}
                      >
                        {formatCurrency(plan.price)}
                      </p>
                      <p className="text-[11px]" style={MONO}>
                        {plan.durationDays} {t.gyms.days}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Manager ── */}
          <SectionCard icon={User} title={t.gyms.gymManager}>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#23272e" }}
              >
                <User className="w-6 h-6" style={{ color: "#c8f323" }} />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-semibold" style={{ color: "#e9ecf1" }}>
                  {gym.gymManager?.name}
                </p>
                <div className="space-y-1.5">
                  <p
                    className="flex items-center gap-2 text-xs truncate"
                    style={{ color: "#c3cad6" }}
                  >
                    <Mail className="w-3.5 h-3.5" style={{ color: "#8b93a1" }} />
                    {gym.gymManager?.email}
                  </p>
                  <p className="flex items-center gap-2 text-xs" style={{ color: "#c3cad6" }}>
                    <Phone className="w-3.5 h-3.5" style={{ color: "#8b93a1" }} />
                    {gym.gymManager?.phoneNumber || "—"}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Upload modal ── */}
      <Modal
        open={uploadOpen}
        onClose={() => !uploading && resetUpload()}
        title={t.gyms.uploadImage}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={resetUpload} disabled={uploading}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" loading={uploading} onClick={handleUpload}>
              {uploading ? t.gyms.uploading : t.gyms.uploadImage}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full rounded-xl border border-dashed overflow-hidden transition-colors hover:border-[#c8f323]"
            style={{ borderColor: "#2f3742", background: "#0f1013" }}
          >
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="" className="w-full h-48 object-cover" />
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <ImagePlus className="w-8 h-8" style={{ color: "#c8f323", opacity: 0.5 }} />
                <span className="text-sm" style={{ color: "#8b93a1" }}>
                  {t.gyms.chooseFile}
                </span>
              </div>
            )}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {imageFile && (
            <p className="text-xs truncate" style={MONO}>
              {imageFile.name} · {(imageFile.size / 1024).toFixed(0)} KB
            </p>
          )}

          <div>
            <FieldLabel>{t.gyms.imageDescription}</FieldLabel>
            <input
              value={imageDescription}
              onChange={(e) => setImageDescription(e.target.value)}
              placeholder={t.gyms.imageDescriptionPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm input-accent"
              style={INPUT}
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete image confirmation ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title={t.gyms.deleteImageConfirm}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteImage}>
              {t.common.delete}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: "#2f3742", background: "#0f1013" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={deleteTarget.url}
              alt={deleteTarget.description ?? ""}
              className="w-full h-40 object-cover"
            />
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
