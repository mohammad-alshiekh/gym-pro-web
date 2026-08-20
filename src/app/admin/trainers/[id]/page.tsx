"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle,
  ExternalLink,
  Images,
  Mail,
  MessageSquare,
  Phone,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { coachesApi } from "@/lib/api";
import type { CoachDetail } from "@/lib/coaches";
import { getInitials } from "@/lib/utils";

const CARD: React.CSSProperties = { background: "#131313", borderColor: "#2a2a2a" };
const MONO = "JetBrains Mono, monospace";

/** Section wrapper — keeps every block's card chrome identical. */
function Section({
  icon: Icon,
  title,
  accent = "#cafd00",
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${accent}15`, color: accent }}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ fontFamily: MONO, color: "#adaaaa" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

/** A single labelled link out to a coach's social profile. */
function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors hover:border-[#cafd00]"
      style={{ background: "#0e0e0e", borderColor: "#2a2a2a" }}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-widest" style={{ fontFamily: MONO, color: "#8a8888" }}>
          {label}
        </p>
        <p className="text-sm truncate mt-0.5" style={{ color: "#ffffff" }} dir="ltr">
          {href}
        </p>
      </div>
      <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: "#8a8888" }} />
    </a>
  );
}

/** Uniform image grid used for both the gallery and the achievements sections. */
function ImageGrid({ urls, alt }: { urls: string[]; alt: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {urls.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden aspect-square"
          style={{ background: "#0e0e0e" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`${alt} ${i + 1}`}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </a>
      ))}
    </div>
  );
}

export default function CoachDetailPage() {
  const { t, isRtl } = useTranslation();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [coach, setCoach] = useState<CoachDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoach = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await coachesApi.getById(id);
      setCoach(res.data);
      setError(null);
    } catch {
      setError(t.coaches.coachNotFound);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchCoach();
  }, [fetchCoach]);

  const backLink = (
    <Link
      href="/admin/trainers"
      title={t.coaches.backToCoaches}
      className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#cafd00]"
      style={{ color: "#8a8888" }}
    >
      <ArrowLeft className="w-4 h-4" style={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
      {t.coaches.backToCoaches}
    </Link>
  );

  // ── Loading ──
  if (loading) {
    return (
      <DashboardLayout title={t.coaches.title} requiredRole="super_admin">
        <div className="space-y-4">
          <div className="h-44 rounded-2xl shimmer" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer" />
            ))}
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl shimmer" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ── Not found ──
  if (error || !coach) {
    return (
      <DashboardLayout title={t.coaches.title} requiredRole="super_admin">
        <div className="space-y-4">
          {backLink}
          <div
            className="p-6 rounded-2xl border text-sm"
            style={{ background: "rgba(92,22,32,0.12)", borderColor: "#5c1620", color: "#ff6e81" }}
          >
            {error ?? t.coaches.coachNotFound}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const socials = [
    { href: coach.facebookUrl, label: t.coaches.facebook },
    { href: coach.instagramUrl, label: t.coaches.instagram },
    { href: coach.tikTokUrl, label: t.coaches.tiktok },
    { href: coach.youTubeUrl, label: t.coaches.youtube },
  ].filter((s): s is { href: string; label: string } => !!s.href);

  const metaCards = [
    { label: t.coaches.experienceLabel, value: `${coach.yearsOfExperience ?? 0}`, sub: t.coaches.yrsExp, icon: Award, color: "#cafd00" },
    { label: t.coaches.clientsLabel, value: `${coach.numberOfClients}`, sub: t.coaches.clientsCount, icon: Users, color: "#4ae176" },
    { label: t.coaches.ratingLabel, value: coach.averageRatings?.toFixed(1) ?? "0", sub: `${coach.ratingsCount} ${t.coaches.ratingCount}`, icon: Star, color: "#ffd04a" },
  ];

  return (
    <DashboardLayout title={coach.name} requiredRole="super_admin">
      <div className="space-y-5 pb-6">
        {backLink}

        {/* ── Hero ── */}
        <div className="rounded-2xl border p-5 sm:p-6" style={CARD}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {coach.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coach.profilePictureUrl}
                alt={coach.name}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{ background: "#20201f", color: "#cafd00", fontFamily: "Lexend, sans-serif" }}
              >
                {getInitials(coach.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                {coach.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: "#8a8888" }}>
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate" dir="ltr">{coach.email}</span>
              </div>
              {coach.phoneNumber && (
                <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: "#8a8888" }}>
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span dir="ltr">{coach.phoneNumber}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {coach.isVerifiedByAdmin ? (
                  <Badge variant="success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t.coaches.verified}
                  </Badge>
                ) : (
                  <Badge variant="neutral">{t.coaches.unverified}</Badge>
                )}
                {coach.isAvailableForClients && (
                  <Badge variant="info">
                    <UserCheck className="w-3 h-3 mr-1" />
                    {t.coaches.available}
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
                  {m.value} <span className="font-normal text-xs" style={{ color: "#8a8888" }}>{m.sub}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bio ── */}
        {coach.bio && (
          <Section icon={UserCheck} title={t.coaches.overview}>
            <p className="text-sm leading-relaxed" style={{ color: "#adaaaa" }}>
              {coach.bio}
            </p>
          </Section>
        )}

        {/* ── Contact & Social ── */}
        {socials.length > 0 && (
          <Section icon={ExternalLink} title={t.coaches.contactSocial} accent="#7df6ff">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socials.map((s) => (
                <SocialLink key={s.label} href={s.href} label={s.label} />
              ))}
            </div>
          </Section>
        )}

        {/* ── Gallery ── */}
        <Section icon={Images} title={t.coaches.gallery}>
          {coach.galleryImageUrls.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>{t.coaches.noGalleryImages}</p>
          ) : (
            <ImageGrid urls={coach.galleryImageUrls} alt={t.coaches.gallery} />
          )}
        </Section>

        {/* ── Achievements ── */}
        <Section icon={Award} title={t.coaches.achievements} accent="#ffd04a">
          {coach.achievementUrls.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>{t.coaches.noAchievements}</p>
          ) : (
            <ImageGrid urls={coach.achievementUrls} alt={t.coaches.achievements} />
          )}
        </Section>

        {/* ── Reviews ── */}
        <Section icon={MessageSquare} title={t.coaches.reviewsTitle} accent="#4ae176">
          {coach.reviews.length === 0 ? (
            <p className="text-sm italic" style={{ color: "#8a8888" }}>{t.coaches.noReviews}</p>
          ) : (
            <div className="space-y-3">
              {coach.reviews.map((review, i) => (
                <div key={review.id ?? i} className="rounded-xl p-4" style={{ background: "#0e0e0e" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {review.traineeProfilePictureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.traineeProfilePictureUrl}
                          alt={review.traineeName ?? t.coaches.anonymousTrainee}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "#20201f", color: "#cafd00", fontFamily: "Lexend, sans-serif" }}
                        >
                          {getInitials(review.traineeName ?? t.coaches.anonymousTrainee)}
                        </div>
                      )}
                      <p className="text-sm font-medium truncate" style={{ color: "#ffffff" }}>
                        {review.traineeName ?? t.coaches.anonymousTrainee}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" style={{ color: "#ffd04a" }}>
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-sm font-bold" style={{ fontFamily: MONO }}>{review.rating}</span>
                    </div>
                  </div>
                  {(review.comment || review.feedback) && (
                    <p className="text-sm leading-relaxed mt-2.5" style={{ color: "#adaaaa" }}>
                      {review.comment || review.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}
