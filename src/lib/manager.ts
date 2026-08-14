/**
 * Gym Manager domain — types and enums transcribed from
 * `.claude/GYM_MANAGER_API_DOCUMENTATION.md`.
 *
 * Every manager page imports from here instead of redeclaring its own shapes,
 * so a change in the contract is a one-file change.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────
// Integer values mirror section 2 (Enum Reference Data) of the API doc. Every
// one of them is 0-based, so guard optional fields with `== null` rather than
// truthiness — 0 is a real value in all six enums.

/** GymTypeEnum */
export const GYM_TYPE = {
  menOnly: 0,
  womenOnly: 1,
  separateSessions: 2,
  mixed: 3,
} as const;

export const GYM_TYPES = Object.values(GYM_TYPE);

/** GymServiceTypeEnum */
export const SERVICE_TYPE = {
  sauna: 0,
  pool: 1,
  personalTraining: 2,
  crossFit: 3,
  lockerRoom: 4,
  wifi: 5,
  parking: 6,
  spa: 7,
} as const;

/** GymSubscriptionStatusEnum */
export const SUBSCRIPTION_STATUS = {
  pending: 0,
  active: 1,
  cancelRequested: 2,
  cancelled: 3,
  expired: 4,
  rejected: 5,
} as const;

export const SUBSCRIPTION_STATUSES = Object.values(SUBSCRIPTION_STATUS);

/**
 * GymPaymentMethodEnum — `stripe` settles online through a Checkout session,
 * `manual` is cash at the reception desk. Only manual requests are the
 * manager's to approve or reject.
 */
export const PAYMENT_METHOD = { stripe: 0, manual: 1 } as const;

/** CancellationTypeEnum — the manager picks one when cancelling a membership. */
export const CANCELLATION_TYPE = { immediate: 0, cancelAtEnd: 1 } as const;

export const CANCELLATION_TYPES = Object.values(CANCELLATION_TYPE);

export function cancellationTypeLabel(type: number | null | undefined): string {
  if (type == null) return "—";
  const map: Record<number, string> = {
    0: "Immediate",
    1: "At Period End",
  };
  return map[type] ?? "—";
}

/** GenderTypeEnum — the audience a working period serves. */
export const GENDER_TYPE = { men: 0, women: 1, mixed: 2 } as const;

export const GENDER_TYPES = Object.values(GENDER_TYPE);

export function genderLabel(type: number | null | undefined): string {
  if (type == null) return "—";
  const map: Record<number, string> = {
    0: "Men",
    1: "Women",
    2: "Mixed",
  };
  return map[type] ?? "—";
}

// ─── Membership plans ────────────────────────────────────────────────────────

export interface GymPlan {
  id: string;
  gymId: string;
  name: string;
  description: string;
  durationDays: number;
  price: number;
  isActive: boolean;
}

export interface GymPlanInput {
  name: string;
  description?: string;
  durationDays: number;
  price: number;
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export interface GymSubscription {
  id: string;
  gymId: string;
  gymName: string;
  traineeId: string;
  traineeName: string;
  gymPlanId: string;
  planName: string;
  price: number;
  durationDays: number;
  status: number;
  paymentMethod: number;
  startDate: string | null;
  endDate: string | null;
  cancellationType?: number | null;
  creationTime: string;
}

// ─── Members ─────────────────────────────────────────────────────────────────

export interface GymMember {
  traineeId: string;
  name: string;
  phone?: string | null;
  email: string;
  photoUrl?: string | null;
  currentPlanName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: number;
  paymentMethod: number;
}

export interface AttendanceLog {
  id: string;
  gymId: string;
  gymName: string;
  traineeId: string;
  traineeName: string;
  checkInTime: string;
  checkOutTime?: string | null;
}

export interface GymMemberDetail {
  traineeId: string;
  name: string;
  phone?: string | null;
  email: string;
  photoUrl?: string | null;
  currentSubscription?: GymSubscription | null;
  previousSubscriptions?: GymSubscription[];
  attendanceHistory?: AttendanceLog[];
  totalAttendanceCount: number;
  lastAttendanceTime?: string | null;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface GymStatistics {
  attendance?: {
    todayCount: number;
    weekCount: number;
    monthCount: number;
    peakHour: string;
    peakDay: string;
    averageDailyAttendance: number;
  };
  subscriptions?: {
    newCount: number;
    cancelledCount: number;
    expiredCount: number;
  };
  plans?: {
    activePlansCount: number;
    inactivePlansCount: number;
    planMemberCounts?: {
      planId: string;
      planName: string;
      activeMembersCount: number;
    }[];
  };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface ManagerProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  gymId: string;
}

// ─── QR ──────────────────────────────────────────────────────────────────────

export interface GymQrCode {
  qrToken: string;
  qrCodeBase64: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Days left on a subscription, or null when there is no end date. */
export function daysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / 86_400_000);
}

/** Check-in → check-out duration as "1h 30m", or null while still inside. */
export function sessionDuration(log: AttendanceLog): string | null {
  if (!log.checkOutTime) return null;
  const ms = new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const minutes = Math.round(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}
