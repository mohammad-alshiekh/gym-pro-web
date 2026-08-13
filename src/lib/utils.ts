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

export function formatCurrency(amount: number, currency = "EGP"): string {
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

export function gymTypeLabel(type: number): string {
  const map: Record<number, string> = {
    0: "Unspecified",
    1: "Male Only",
    2: "Female Only",
    3: "Mixed",
  };
  return map[type] ?? "Unknown";
}

export function subscriptionStatusLabel(status: number): string {
  const map: Record<number, string> = {
    1: "Pending",
    2: "Active",
    3: "Rejected",
    4: "Expired",
    5: "Cancelled",
  };
  return map[status] ?? "Unknown";
}

export function subscriptionStatusColor(status: number): string {
  const map: Record<number, string> = {
    1: "text-yellow-400 bg-yellow-400/10",
    2: "text-green-400 bg-green-400/10",
    3: "text-red-400 bg-red-400/10",
    4: "text-gray-400 bg-gray-400/10",
    5: "text-orange-400 bg-orange-400/10",
  };
  return map[status] ?? "text-gray-400 bg-gray-400/10";
}

/**
 * GymServiceTypeEnum is 0-based on the server (verified: values 0–7 validate,
 * 8 and 9 are rejected). The API doc numbers the same eight services 1–8.
 */
export function serviceTypeLabel(type: number): string {
  const map: Record<number, string> = {
    0: "Personal Trainer",
    1: "Locker Room",
    2: "Sauna",
    3: "Pool",
    4: "Parking",
    5: "WiFi",
    6: "Protein Bar",
    7: "Nutritionist",
  };
  return map[type] ?? "Unknown";
}

export function paymentMethodLabel(method: number): string {
  const map: Record<number, string> = {
    1: "Cash",
    2: "Card",
  };
  return map[method] ?? "Unknown";
}
