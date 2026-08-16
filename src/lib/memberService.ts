import { membersApi } from "@/lib/api";
import type { GymMemberDetail, GymSubscription } from "@/lib/manager";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

/**
 * Service for handling member-related API operations with data transformation
 */
export const memberService = {
  /**
   * Get all members with optional filtering and pagination
   */
  getMembers: async (params?: {
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: string;
    pageNumber?: number;
    resultsPerPage?: number;
  }) => {
    try {
      const res = await membersApi.getAll(params);
      return {
        items: res.data?.items ?? [],
        totalCount: res.data?.totalCount ?? 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch members: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Get member by ID with enhanced data transformation
   */
  getMemberById: async (traineeId: string): Promise<MemberViewModel> => {
    try {
      const res = await membersApi.getById(traineeId);
      const member = res.data;
      
      // Transform the raw API response into a view-model optimized for UI consumption
      return {
        basicInfo: {
          id: member.traineeId,
          name: member.name,
          email: member.email,
          phone: member.phone ?? null,
          photoUrl: member.photoUrl ?? null,
          initials: member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        },
        currentSubscription: member.currentSubscription 
          ? transformSubscription(member.currentSubscription) 
          : null,
        previousSubscriptions: (member.previousSubscriptions ?? []).map(transformSubscription),
        attendance: {
          totalCount: member.totalAttendanceCount,
          lastVisit: member.lastAttendanceTime 
            ? formatDateTime(member.lastAttendanceTime) 
            : null,
          recentVisits: (member.attendanceHistory ?? []).slice(0, 10).map(visit => ({
            id: visit.id,
            checkInTime: formatDateTime(visit.checkInTime),
            checkOutTime: visit.checkOutTime ? formatDateTime(visit.checkOutTime) : null,
            duration: visit.checkOutTime 
              ? `${Math.floor(((new Date(visit.checkOutTime).getTime() - new Date(visit.checkInTime).getTime()) / 60_000) / 60)}h ${((new Date(visit.checkOutTime).getTime() - new Date(visit.checkInTime).getTime()) / 60_000) % 60}m`
              : null,
            isStillInside: !visit.checkOutTime
          }))
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch member details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * Transform raw subscription data from API into UI-friendly format
 */
function transformSubscription(sub: GymSubscription): SubscriptionViewModel {
  return {
    id: sub.id,
    planName: sub.planName,
    price: {
      amount: sub.price,
      formatted: formatCurrency(sub.price),
      currency: "USD" as const
    },
    durationDays: sub.durationDays,
    status: {
      value: sub.status,
      label: getSubscriptionStatusLabel(sub.status),
      color: getSubscriptionStatusColor(sub.status)
    },
    paymentMethod: {
      value: sub.paymentMethod,
      label: getPaymentMethodLabel(sub.paymentMethod)
    },
    dates: {
      startDate: sub.startDate ? formatDate(sub.startDate) : null,
      endDate: sub.endDate ? formatDate(sub.endDate) : null,
      creationTime: sub.creationTime ? formatDateTime(sub.creationTime) : null
    },
    cancellationType: sub.cancellationType ?? null,
    isActive: sub.status === 1, // ACTIVE status
    daysRemaining: sub.endDate ? Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86_400_000) : null
  };
}

/**
 * Get human-readable label for subscription status
 */
function getSubscriptionStatusLabel(status: number): string {
  const statusMap: Record<number, string> = {
    0: "Pending",
    1: "Active",
    2: "Cancel Requested",
    3: "Cancelled",
    4: "Expired",
    5: "Rejected"
  };
  return statusMap[status] ?? "Unknown";
}

/**
 * Get color class for subscription status based on Tailwind CSS
 */
function getSubscriptionStatusColor(status: number): string {
  const colorMap: Record<number, string> = {
    0: "text-yellow-400 bg-yellow-400/10", // Pending
    1: "text-green-400 bg-green-400/10",   // Active
    2: "text-orange-400 bg-orange-400/10", // Cancel Requested
    3: "text-red-400 bg-red-400/10",       // Cancelled
    4: "text-gray-400 bg-gray-400/10",     // Expired
    5: "text-red-400 bg-red-400/10"        // Rejected
  };
  return colorMap[status] ?? "text-gray-400 bg-gray-400/10";
}

/**
 * Get label for payment method
 */
function getPaymentMethodLabel(method: number): string {
  const methodMap: Record<number, string> = {
    0: "Card (Stripe)",
    1: "Cash"
  };
  return methodMap[method] ?? "Unknown";
}

/**
 * View model for member data optimized for UI consumption
 */
export interface MemberViewModel {
  basicInfo: MemberBasicInfo;
  currentSubscription: SubscriptionViewModel | null;
  previousSubscriptions: SubscriptionViewModel[];
  attendance: AttendanceStats;
}

/**
 * Basic member information
 */
export interface MemberBasicInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  initials: string;
}

/**
 * Subscription view model
 */
export interface SubscriptionViewModel {
  id: string;
  planName: string;
  price: {
    amount: number;
    formatted: string;
    currency: "USD";
  };
  durationDays: number;
  status: {
    value: number;
    label: string;
    color: string;
  };
  paymentMethod: {
    value: number;
    label: string;
  };
  dates: {
    startDate: string | null;
    endDate: string | null;
    creationTime: string | null;
  };
  cancellationType: number | null;
  isActive: boolean;
  daysRemaining: number | null;
}

/**
 * Attendance statistics
 */
export interface AttendanceStats {
  totalCount: number;
  lastVisit: string | null;
  recentVisits: AttendanceVisit[];
}

/**
 * Individual attendance visit
 */
export interface AttendanceVisit {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  duration: string | null;
  isStillInside: boolean;
}