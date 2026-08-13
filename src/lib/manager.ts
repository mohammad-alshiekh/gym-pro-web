/**
 * Gym Manager domain — types and enums transcribed from
 * `.claude/GYM_MANAGER_API_DOCUMENTATION.md`.
 *
 * Every manager page imports from here instead of redeclaring its own shapes,
 * so a change in the contract is a one-file change.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export const SUBSCRIPTION_STATUS = {
  pending: 1,
  active: 2,
  rejected: 3,
  expired: 4,
  cancelled: 5,
} as const;

export const SUBSCRIPTION_STATUSES = [1, 2, 3, 4, 5] as const;

export const PAYMENT_METHOD = { cash: 1, card: 2 } as const;

/** CancellationTypeEnum — a manager cancelling always sends ByManager. */
export const CANCELLATION_TYPE = { byManager: 1, byTrainee: 2, expired: 3 } as const;

export function cancellationTypeLabel(type: number | null | undefined): string {
  const map: Record<number, string> = {
    1: "By Manager",
    2: "By Trainee",
    3: "Expired",
  };
  return type ? map[type] ?? "—" : "—";
}

/**
 * GenderTypeEnum — 1 = Male, 2 = Female. The server also accepts 0, which
 * follows this API's usual "Unspecified" convention (3 is rejected).
 */
export function genderLabel(type: number | null | undefined): string {
  if (type === 0) return "Unspecified";
  if (type === 1) return "Male";
  if (type === 2) return "Female";
  return "—";
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
