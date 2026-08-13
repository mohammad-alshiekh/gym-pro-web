"use client";

import { useAppStore } from "@/store/useAppStore";
import { getTranslation } from "@/lib/i18n";

export function useTranslation() {
  const locale = useAppStore((s) => s.locale);
  const t = getTranslation(locale);
  const isRtl = locale === "ar";
  return { t, locale, isRtl };
}
