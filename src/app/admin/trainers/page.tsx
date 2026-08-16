"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, UserCheck, Star, Users, Search, Eye, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { coachesApi } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

interface Coach {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  bio?: string;
  yearsOfExperience?: number;
  isAvailableForClients: boolean;
  isVerifiedByAdmin: boolean;
  numberOfClients: number;
  averageRatings: number;
  ratingsCount: number;
  facebookUrl?: string;
  instagramUrl?: string;
  tikTokUrl?: string;
  youTubeUrl?: string;
}

interface CoachFormState {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  bio: string;
  yearsOfExperience: string;
  facebookUrl: string;
  instagramUrl: string;
  isVerifiedByAdmin: boolean;
}

const defaultForm: CoachFormState = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  bio: "",
  yearsOfExperience: "",
  facebookUrl: "",
  instagramUrl: "",
  isVerifiedByAdmin: false,
};

export default function AdminTrainersPage() {
  const { t, locale } = useTranslation();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Coach | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CoachFormState>(defaultForm);

  const perPage = 12;

  const fetchCoaches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await coachesApi.getAll({
        PageNumber: page,
        ResultsPerPage: perPage,
        searchQuery: search || undefined,
      });
      setCoaches(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error(t.coaches.toastFailedLoadCoaches);
    } finally {
      setLoading(false);
    }
  }, [search, page, t]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  const handleCreate = async () => {
    if (!form.fullName || !form.email || !form.password) {
      toast.error(t.coaches.toastNameEmailPasswordRequired);
      return;
    }
    setSubmitting(true);
    try {
      await coachesApi.create({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber || undefined,
        bio: form.bio || undefined,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        facebookUrl: form.facebookUrl || undefined,
        instagramUrl: form.instagramUrl || undefined,
        isVerifiedByAdmin: form.isVerifiedByAdmin,
      });
      toast.success(t.coaches.createSuccess);
      setCreateOpen(false);
      setForm(defaultForm);
      fetchCoaches();
    } catch {
      toast.error(t.coaches.toastFailedCreateCoach);
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key: keyof CoachFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    <DashboardLayout title={t.coaches.title} requiredRole="super_admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8a8888" }} />
            <input
value={search}
               onChange={(e) => { setSearch(e.target.value); setPage(1); }}
               placeholder={t.coaches.searchPlaceholder}
               className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
               style={{ ...inputStyle }}
            />
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            {t.coaches.createCoach}
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-52 shimmer" />
            ))}
          </div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8a8888" }}>
            <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t.common.noData}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="rounded-2xl border p-5 flex flex-col gap-3 card-interactive"
                style={{ background: "#131313", borderColor: "#2a2a2a" }}
              >
                <div className="flex items-center gap-3">
                  {coach.profilePictureUrl ? (
                    <img src={coach.profilePictureUrl} alt={coach.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ background: "#20201f", color: "#cafd00", fontFamily: "Lexend, sans-serif" }}>
                      {getInitials(coach.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                      {coach.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#8a8888" }}>{coach.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {coach.isVerifiedByAdmin ? (
                    <Badge variant="success">{t.coaches.verified}</Badge>
                  ) : (
                    <Badge variant="neutral">{t.coaches.unverified}</Badge>
                  )}
                  {coach.isAvailableForClients && (
                    <Badge variant="info">{t.coaches.available}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#cafd00" }}>
                      {coach.yearsOfExperience ?? 0}
                    </p>
                    <p className="text-xs" style={{ color: "#8a8888" }}>{t.coaches.yrsExp}</p>
                  </div>
                  <div>
                    <p className="text-base font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#4ae176" }}>
                      {coach.numberOfClients}
                    </p>
                    <p className="text-xs" style={{ color: "#8a8888" }}>{t.coaches.clientsCount}</p>
                  </div>
                  <div>
                    <p className="text-base font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#ffd04a" }}>
                      {coach.averageRatings?.toFixed(1) ?? "0"}
                    </p>
                    <p className="text-xs" style={{ color: "#8a8888" }}>{t.coaches.ratingCount}</p>
                  </div>
                </div>

                <button
                  onClick={() => setViewTarget(coach)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-[#20201f]"
                  style={{ color: "#adaaaa", border: "1px solid #2a2a2a" }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t.coaches.viewDetails}
                </button>
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

      {/* Create Coach Modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setForm(defaultForm); }}
        title={t.coaches.createCoach}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setCreateOpen(false); setForm(defaultForm); }}>{t.common.cancel}</Button>
            <Button loading={submitting} onClick={handleCreate}>{t.common.create}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "fullName", label: t.coaches.fullName, placeholder: t.coaches.fullNamePlaceholder },
            { key: "email", label: t.coaches.email, placeholder: "coach@example.com", type: "email" },
            { key: "password", label: t.coaches.password, placeholder: t.coaches.managerPasswordPlaceholder, type: "password" },
            { key: "phoneNumber", label: t.coaches.phone, placeholder: t.gyms.phoneExample },
            { key: "yearsOfExperience", label: t.coaches.yearsOfExperience, placeholder: "10", type: "number" },
            { key: "facebookUrl", label: t.coaches.facebookUrl, placeholder: "https://facebook.com/..." },
            { key: "instagramUrl", label: t.coaches.instagramUrl, placeholder: "https://instagram.com/..." },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label style={labelStyle} className="block mb-1.5">{label}</label>
              <input
                value={String(form[key as keyof CoachFormState])}
                onChange={(e) => setField(key as keyof CoachFormState, e.target.value)}
                placeholder={placeholder}
                type={type ?? "text"}
                className="w-full px-4 py-3 rounded-xl border text-sm input-accent"
                style={inputStyle}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label style={labelStyle} className="block mb-1.5">{t.coaches.bio}</label>
            <textarea
              value={form.bio}
              onChange={(e) => setField("bio", e.target.value)}
              rows={3}
              placeholder={t.coaches.bioPlaceholder}
              className="w-full px-4 py-3 rounded-xl border text-sm input-accent resize-none"
              style={inputStyle}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setField("isVerifiedByAdmin", !form.isVerifiedByAdmin)}
              className="w-10 h-6 rounded-full transition-all flex-shrink-0"
              style={{ background: form.isVerifiedByAdmin ? "#cafd00" : "#2a2a28" }}
            >
              <span
                className="block w-4 h-4 rounded-full transition-all mx-1"
                style={{
                  background: form.isVerifiedByAdmin ? "#3a4a00" : "#8a8888",
                  transform: form.isVerifiedByAdmin ? "translateX(16px)" : "translateX(0)",
                }}
              />
            </button>
            <span className="text-sm" style={{ color: "#ffffff" }}>Verify coach immediately</span>
          </div>
        </div>
      </Modal>

      {/* View Coach Modal */}
      {viewTarget && (
        <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={t.coaches.coachDetails} size="md">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {viewTarget.profilePictureUrl ? (
                <img src={viewTarget.profilePictureUrl} alt={viewTarget.name} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                  style={{ background: "#20201f", color: "#cafd00", fontFamily: "Lexend, sans-serif" }}>
                  {getInitials(viewTarget.name)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>{viewTarget.name}</h3>
                <p className="text-sm" style={{ color: "#8a8888" }}>{viewTarget.email}</p>
                <div className="flex gap-2 mt-2">
                  {viewTarget.isVerifiedByAdmin ? (
                    <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />{t.coaches.verified}</Badge>
                  ) : (
                    <Badge variant="neutral">{t.coaches.unverified}</Badge>
                  )}
                </div>
              </div>
            </div>
            {viewTarget.bio && (
              <p className="text-sm" style={{ color: "#adaaaa" }}>{viewTarget.bio}</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t.coaches.experienceLabel, value: `${viewTarget.yearsOfExperience ?? 0} ${t.coaches.yrsExp}`, color: "#cafd00" },
                { label: t.coaches.clientsLabel, value: viewTarget.numberOfClients, color: "#4ae176" },
                { label: t.coaches.ratingLabel, value: `${viewTarget.averageRatings?.toFixed(1)} ★`, color: "#ffd04a" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#20201f" }}>
                  <p className="text-lg font-bold" style={{ fontFamily: "Lexend, sans-serif", color }}>{value}</p>
                  <p className="text-xs" style={{ color: "#8a8888" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
