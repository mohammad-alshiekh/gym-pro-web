import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** GymTypeEnum. */
export function gymTypeLabel(type: number, locale = "en"): string {
  const en: Record<number, string> = { 0: "Men Only", 1: "Women Only", 2: "Separate Sessions", 3: "Mixed" };
  const ar: Record<number, string> = { 0: "رجال فقط", 1: "نساء فقط", 2: "أوقات منفصلة", 3: "مختلط" };
  const map = locale === "ar" ? ar : en;
  return map[type] ?? "Unknown";
}

/** GymSubscriptionStatusEnum. */
export function subscriptionStatusLabel(status: number, locale = "en"): string {
  const en: Record<number, string> = { 0: "Pending", 1: "Active", 2: "Cancel Requested", 3: "Cancelled", 4: "Expired", 5: "Rejected" };
  const ar: Record<number, string> = { 0: "معلق", 1: "نشط", 2: "طلب إلغاء", 3: "ملغى", 4: "منتهي", 5: "مرفوض" };
  const map = locale === "ar" ? ar : en;
  return map[status] ?? "Unknown";
}

export function subscriptionStatusColor(status: number): string {
  const map: Record<number, string> = {
    0: "text-yellow-400 bg-yellow-400/10",
    1: "text-green-400 bg-green-400/10",
    2: "text-orange-400 bg-orange-400/10",
    3: "text-red-400 bg-red-400/10",
    4: "text-gray-400 bg-gray-400/10",
    5: "text-red-400 bg-red-400/10",
  };
  return map[status] ?? "text-gray-400 bg-gray-400/10";
}

/** GymServiceTypeEnum — eight services occupying 0–7. */
export function serviceTypeLabel(type: number, locale = "en"): string {
  const en: Record<number, string> = { 0: "Sauna", 1: "Pool", 2: "Personal Training", 3: "CrossFit", 4: "Locker Room", 5: "WiFi", 6: "Parking", 7: "Spa" };
  const ar: Record<number, string> = { 0: "ساونا", 1: "مسبح", 2: "تدريب شخصي", 3: "كروس فيت", 4: "غرفة خزائن", 5: "واي فاي", 6: "موقف سيارات", 7: "منتج صحي" };
  const map = locale === "ar" ? ar : en;
  return map[type] ?? "Unknown";
}

/** GymPaymentMethodEnum — 0 is an online Stripe checkout, 1 is cash at reception. */
export function paymentMethodLabel(method: number): string {
  const map: Record<number, string> = {
    0: "Card (Stripe)",
    1: "Cash",
  };
  return map[method] ?? "Unknown";
}
