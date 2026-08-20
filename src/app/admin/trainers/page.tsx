"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserCheck, Search, ChevronRight, Star } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { coachesApi } from "@/lib/api";
import type { CoachSummary } from "@/lib/coaches";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

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
  const { t, locale, isRtl } = useTranslation();
  const router = useRouter();
  const [coaches, setCoaches] = useState<CoachSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
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
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
            ))}
          </div>
        ) : coaches.length === 0 ? (
          <div className="rounded-2xl border py-20 text-center" style={{ borderColor: "#2a2a2a", background: "#131313" }}>
            <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "#cafd00" }} />
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
              <table dir={isRtl ? "rtl" : "ltr"} className="w-full min-w-[760px]">
                <thead>
                  <tr style={{ background: "#1a1a1a" }}>
                    {[
                      t.coaches.coachName,
                      t.coaches.experienceLabel,
                      t.coaches.clientsLabel,
                      t.coaches.ratingLabel,
                      t.common.status,
                      "",
                    ].map((head, i) => (
                      <th
                        key={i}
                        className={`text-[10px] font-medium uppercase tracking-widest px-5 py-3.5 ${isRtl ? "text-right" : "text-left"}`}
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coaches.map((coach) => {
                    const cell = `px-5 py-4 ${isRtl ? "text-right" : "text-left"}`;
                    return (
                      <tr
                        key={coach.id}
                        onClick={() => router.push(`/admin/trainers/${coach.id}`)}
                        className="border-t transition-colors hover:bg-[#1a1a1a] cursor-pointer"
                        style={{ borderColor: "#20201f" }}
                      >
                        <td className={cell}>
                          <div className="flex items-center gap-3 min-w-0">
                            {coach.profilePictureUrl ? (
                              <img src={coach.profilePictureUrl} alt={coach.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                style={{ background: "rgba(202,253,0,0.1)", color: "#cafd00", fontFamily: "Lexend, sans-serif" }}
                              >
                                {getInitials(coach.name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[180px]" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                                {coach.name}
                              </p>
                              <p className="text-xs truncate max-w-[180px]" style={{ color: "#8a8888" }}>{coach.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={cell}>
                          <span className="text-sm" style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}>
                            {coach.yearsOfExperience ?? 0} {t.coaches.yrsExp}
                          </span>
                        </td>
                        <td className={cell}>
                          <span className="text-sm" style={{ fontFamily: "JetBrains Mono, monospace", color: "#4ae176" }}>
                            {coach.numberOfClients}
                          </span>
                        </td>
                        <td className={cell}>
                          <span className="flex items-center gap-1 text-sm" style={{ fontFamily: "JetBrains Mono, monospace", color: "#ffd04a" }}>
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {coach.averageRatings?.toFixed(1) ?? "0"}
                          </span>
                        </td>
                        <td className={cell}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {coach.isVerifiedByAdmin ? (
                              <Badge variant="success">{t.coaches.verified}</Badge>
                            ) : (
                              <Badge variant="neutral">{t.coaches.unverified}</Badge>
                            )}
                            
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <ChevronRight
                            className="w-4 h-4"
                            style={{ color: "#8a8888", transform: isRtl ? "scaleX(-1)" : undefined }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
            <span className="text-sm" style={{ color: "#ffffff" }}>{t.coaches.verifyCoachImmediately}</span>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
