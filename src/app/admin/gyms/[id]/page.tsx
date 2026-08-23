"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Images,
  Mail,
  MapPin,
  Phone,
  ScrollText,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { gymsApi } from "@/lib/api";
import { GENDER_TYPE } from "@/lib/manager";
import { DAY_KEYS, sortImages, sortWorkingPeriods, type MyGym } from "@/lib/gym";
import { formatCurrency, gymTypeLabel, serviceTypeLabel } from "@/lib/utils";

const CARD: React.CSSProperties = { background: "#131313", borderColor: "#2a2a2a" };
const MONO = "JetBrains Mono, monospace";

/** Section wrapper — keeps every block's card chrome identical. */
function Section({
  icon: Icon,
  title,
  accent = "#cafd00",
  meta,
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent?: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${accent}15`, color: accent }}>
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ fontFamily: MONO, color: "#adaaaa" }}>
            {title}
          </h2>
        </div>
        {meta && (
          <span className="text-xs" style={{ fontFamily: MONO, color: "#8a8888" }}>{meta}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AdminGymDetailPage() {
  const { t, locale, isRtl } = useTranslation();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [gym, setGym] = useState<MyGym | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGym = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await gymsApi.getById(id);
      setGym(res.data);
      setError(null);
    } catch {
      setError(t.gyms.gymNotFound);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchGym();
  }, [fetchGym]);

  const genderLabel = (type: number) =>
    type === GENDER_TYPE.men ? t.gyms.male : type === GENDER_TYPE.women ? t.gyms.female : t.gyms.mixed;

  const backLink = (
    <Link
      href="/admin/gyms"
      title={t.gyms.backToGyms}
      className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#cafd00]"
      style={{ color: "#8a8888" }}
    >
      <ArrowLeft className="w-4 h-4" style={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
      {t.gyms.backToGyms}
    </Link>
  );

  // ── Loading ──
  if (loading) {
    return (
      <DashboardLayout title={t.gyms.title} requiredRole="super_admin">
        <div className="space-y-4">
          <div className="h-44 rounded-2xl shimmer" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl shimmer" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ── Not found ──
  if (error || !gym) {
    return (
      <DashboardLayout title={t.gyms.title} requiredRole="super_admin">
        <div className="space-y-4">
          {backLink}
          <div
            className="p-6 rounded-2xl border text-sm"
            style={{ background: "rgba(92,22,32,0.12)", borderColor: "#5c1620", color: "#ff6e81" }}
          >
            {error ?? t.gyms.gymNotFound}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const images = sortImages(gym.images);
  const periods = sortWorkingPeriods(gym.workingPeriods ?? []);
  const enabledServices = (gym.services ?? []).filter((s) => s.isEnabled);

  const metaCards = [
    { label: t.gyms.plans, value: `${gym.plans?.length ?? 0}`, icon: ScrollText, color: "#cafd00" },
    { label: t.gyms.gallery, value: `${images.length}`, icon: Images, color: "#7df6ff" },
    { label: t.gyms.services, value: `${enabledServices.length}/${gym.services?.length ?? 0}`, icon: Sparkles, color: "#4ae176" },
  ];

  return (
    <DashboardLayout title={gym.name} requiredRole="super_admin">
      <div className="space-y-5 pb-6">
        {backLink}

        {/* ── Hero ── */}
        <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {gym.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gym.logoUrl}
                alt={gym.name}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#20201f" }}
              >
                <Building2 className="w-9 h-9" style={{ color: "#cafd00", opacity: 0.5 }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                {gym.name}
              </h1>
              {gym.phone && (
                <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: "#8a8888" }}>
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span dir="ltr">{gym.phone}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="default">{gymTypeLabel(gym.gymType, locale)}</Badge>
                {gym.gymManager && (
                  <Badge variant="info">
                    <UserCheck className="w-3 h-3 mr-1" />
                    {gym.gymManager.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Meta ── */}
        <div className="grid grid-cols-3 gap-3">
          {metaCards.map((m) => (
            <div key={m.label} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border" style={CARD}>
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${m.color}15`, color: m.color }}>
                <m.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-widest truncate" style={{ fontFamily: MONO, color: "#8a8888" }}>
                  {m.label}
                </p>
                <p className="text-sm font-bold truncate mt-0.5" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                  {m.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Overview ── */}
        <Section icon={Building2} title={t.gyms.viewDescription}>
          <p className="text-sm leading-relaxed" style={{ color: gym.description ? "#adaaaa" : "#8a8888" }}>
            {gym.description || t.gyms.noDescription}
          </p>
        </Section>

        {/* ── Location + Manager ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Section icon={MapPin} title={t.gyms.location} accent="#ff6e81">
            <p className="text-sm mb-3" style={{ fontFamily: MONO, color: "#ffffff" }} dir="ltr">
              {gym.latitude}, {gym.longitude}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${gym.latitude},${gym.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[#cafd00]"
              style={{ color: "#8a8888", fontFamily: MONO }}
            >
              <MapPin className="w-3.5 h-3.5" />
              {t.gyms.openMap}
            </a>
          </Section>

          <Section icon={UserCheck} title={t.gyms.gymManager} accent="#7df6ff">
            {gym.gymManager ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium" style={{ color: "#ffffff" }}>{gym.gymManager.name}</p>
                <div className="flex items-center gap-1.5" style={{ color: "#adaaaa" }}>
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate" dir="ltr">{gym.gymManager.email}</span>
                </div>
                {gym.gymManager.phoneNumber && (
                  <div className="flex items-center gap-1.5" style={{ color: "#adaaaa" }}>
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span dir="ltr">{gym.gymManager.phoneNumber}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: "#8a8888" }}>—</p>
            )}
          </Section>
        </div>

        {/* ── Services ── */}
        <Section
          icon={Sparkles}
          title={t.gyms.services}
          accent="#4ae176"
          meta={gym.services?.length ? `${enabledServices.length}${t.gyms.servicesCount}` : undefined}
        >
          {!gym.services || gym.services.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>—</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {gym.services.map((s) => (
                <div
                  key={s.serviceType}
                  className="flex items-center gap-2.5 p-3 rounded-xl border"
                  style={{
                    background: s.isEnabled ? "rgba(202,253,0,0.07)" : "#0e0e0e",
                    borderColor: s.isEnabled ? "rgba(202,253,0,0.35)" : "#2a2a2a",
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: s.isEnabled ? "#cafd00" : "#20201f" }}
                  >
                    {s.isEnabled ? (
                      <Check className="w-3 h-3" style={{ color: "#3a4a00" }} />
                    ) : (
                      <X className="w-3 h-3" style={{ color: "#8a8888" }} />
                    )}
                  </div>
                  <span className="text-xs font-medium truncate" style={{ color: s.isEnabled ? "#ffffff" : "#8a8888" }}>
                    {serviceTypeLabel(s.serviceType, locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Working hours ── */}
        <Section
          icon={Clock}
          title={t.gyms.workingHours}
          accent="#ffd04a"
          meta={periods.length ? `${periods.length}${t.gyms.workingHoursCount}` : undefined}
        >
          {periods.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-25" style={{ color: "#cafd00" }} />
              <p className="text-sm" style={{ color: "#8a8888" }}>{t.gyms.noPeriods}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {periods.map((wp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ background: "#0e0e0e" }}
                >
                  <span className="text-sm font-medium" style={{ color: "#ffffff" }}>
                    {t.gyms[DAY_KEYS[wp.dayOfWeek] ?? "sunday"]}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ fontFamily: MONO, color: "#cafd00" }}>
                      {wp.startTime} – {wp.endTime}
                    </span>
                    <Badge variant={wp.genderType === GENDER_TYPE.men ? "info" : "neutral"}>
                      {genderLabel(wp.genderType)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Membership plans ── */}
        <Section
          icon={ScrollText}
          title={t.gyms.plans}
          accent="#cafd00"
          meta={gym.plans?.length ? `${gym.plans.length}${t.gyms.plansCount}` : undefined}
        >
          {!gym.plans || gym.plans.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>{t.gyms.noPlans}</p>
          ) : (
            <div className="space-y-2">
              {gym.plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl"
                  style={{ background: "#0e0e0e" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#ffffff" }}>{plan.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8a8888" }}>
                      {plan.durationDays} {t.gyms.days}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-sm font-semibold" style={{ fontFamily: MONO, color: "#4ae176" }}>
                      {formatCurrency(plan.price)}
                    </span>
                    <Badge variant={plan.isActive ? "success" : "neutral"}>
                      {plan.isActive ? t.common.active : t.common.inactive}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Gallery ── */}
        <Section
          icon={Images}
          title={t.gyms.gallery}
          meta={images.length ? `${images.length}${t.gyms.galleryCount}` : undefined}
        >
          {images.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>{t.gyms.noImages}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img, i) => (
                <a
                  key={img.id}
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden aspect-square"
                  style={{ background: "#0e0e0e" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.description || `${gym.name} ${i + 1}`}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}
