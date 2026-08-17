"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { authApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import type { ManagerProfile } from "@/lib/manager";
import { getAuth, saveAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ManagerProfilePage() {
  const { t, isRtl } = useTranslation();
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await authApi.getManagerProfile();
        setProfile(res.data);
        setForm({ name: res.data.name, email: res.data.email, phone: res.data.phoneNumber ?? "" });
      } catch (err) {
        toast.error(apiErrorMessage(err, t.profile.loadFailed));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const res = await authApi.updateManagerProfile({ name: form.name, email: form.email, phone: form.phone });
      setProfile(res.data);
      // Update stored name
      const auth = getAuth();
      if (auth) {
        saveAuth({ ...auth, name: form.name, email: form.email });
        localStorage.setItem("userName", form.name);
      }
      toast.success(t.profile.updateSuccess);
    } catch (err) {
      toast.error(apiErrorMessage(err, t.profile.updateFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: "#0e0e0e",
    borderColor: "#2a2a2a",
    color: "#ffffff",
    outline: "none",
    fontFamily: "Manrope, sans-serif",
    fontSize: "14px",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #2a2a2a",
    width: "100%",
  };

  const labelStyle = {
    fontFamily: "JetBrains Mono, monospace",
    color: "#adaaaa",
    fontSize: "11px",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    display: "block",
    marginBottom: "6px",
  };

  return (
    <DashboardLayout title={t.profile.title} requiredRole="gym_manager">
      <div className="max-w-lg mx-auto space-y-6">
        {/* This page is no longer in the sidebar — My Gym is the way back. */}
        <Link
          href="/manager/my-gym"
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#cafd00]"
          style={{ color: "#8a8888" }}
        >
          <ArrowLeft
            className="w-4 h-4"
            style={{ transform: isRtl ? "scaleX(-1)" : undefined }}
          />
          {t.nav.myGym}
        </Link>

        {/* Avatar */}
        <div className="rounded-2xl border p-8 flex flex-col items-center gap-4" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
          {loading ? (
            <div className="w-24 h-24 rounded-full shimmer" />
          ) : (
            <>
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
                style={{ background: "#20201f", color: "#cafd00", fontFamily: "Lexend, sans-serif", border: "3px solid #2a2a2a" }}
              >
                {profile ? getInitials(profile.name) : "?"}
              </div>
               <div className="text-center">
                 <p className="text-lg font-bold" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>{profile?.name}</p>
                 <p className="text-sm" style={{ color: "#8a8888" }}>{profile?.email}</p>
                 <div className="mt-2 px-3 py-1 rounded-full inline-block" style={{ background: "#cafd0015" }}>
                   <span className="text-xs font-medium" style={{ fontFamily: "JetBrains Mono, monospace", color: "#cafd00" }}>{t.profile.gymManagerBadge}</span>
                 </div>
               </div>
            </>
          )}
        </div>

        {/* Edit Form */}
        <div className="rounded-2xl border p-6" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
          <h3 className="text-base font-semibold mb-5" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
            {t.profile.updateProfile}
          </h3>
          <div className="space-y-4">
            <div>
              <label style={labelStyle}>{t.profile.fullName}</label>
              <input
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={t.profile.placeholderFullName}
                style={inputStyle}
                className="input-accent"
              />
            </div>
            <div>
              <label style={labelStyle}>{t.common.email}</label>
              <input
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder={t.profile.placeholderEmail}
                type="email"
                dir="ltr"
                style={inputStyle}
                className="input-accent"
              />
            </div>
            <div>
              <label style={labelStyle}>{t.common.phone}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder={t.profile.placeholderPhone}
                dir="ltr"
                style={inputStyle}
                className="input-accent"
              />
            </div>
            <Button
              loading={submitting}
              icon={<Save className="w-4 h-4" />}
              className="w-full mt-2"
              size="lg"
              onClick={handleSave}
            >
              {t.common.save}
            </Button>
          </div>
        </div>

        {/* Info Card */}
        {profile?.gymId && (
          <div className="rounded-2xl border p-5" style={{ background: "#131313", borderColor: "#2a2a2a" }}>
            <p className="text-xs mb-2" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}>{t.profile.gymIdLabel}</p>
            <p className="text-sm font-mono" style={{ color: "#adaaaa" }}>{profile.gymId}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
