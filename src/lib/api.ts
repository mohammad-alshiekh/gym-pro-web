/**
 * GymBro API Client
 * Base URL: https://gymbro.runasp.net/api
 *
 * All API calls go through this client.
 * Auth token is automatically attached from localStorage/cookie.
 */

import axios from "axios";
import { attachApiLogger } from "@/lib/apiLogger";
import type { CatalogueExercise } from "@/lib/exercises";
import type { MyGym } from "@/lib/gym";
import type {
  AttendanceLog,
  GymMember,
  GymMemberDetail,
  GymPlan,
  GymPlanInput,
  GymQrCode,
  GymStatistics,
  GymSubscription,
  ManagerProfile,
} from "@/lib/manager";
import type {
  ExerciseSchedule,
  ScheduleInput,
  ScheduleUpdateInput,
} from "@/lib/schedules";

const BASE_URL = "https://gymbro.runasp.net/api";

/** Standard paged envelope returned by the GymBro API. */
export interface Paginated<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  resultsPerPage: number;
  totalPages: number;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attached first on purpose: axios runs request interceptors in reverse
// registration order, so the logger runs last and sees the Authorization header.
attachApiLogger(apiClient);

// Request interceptor - attach Bearer token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  superAdminLogin: (email: string, password: string) =>
    apiClient.post("/SuperAdmin/LogIn", { email, password }),

  gymManagerLogin: (email: string, password: string) =>
    apiClient.post("/gym-manager/auth/login", { email, password }),

  gymManagerForgotPassword: (email: string) =>
    apiClient.post("/gym-manager/auth/forgot-password", { email }),

  gymManagerResetPassword: (
    email: string,
    otpCode: string,
    newPassword: string
  ) =>
    apiClient.post("/gym-manager/auth/reset-password", {
      email,
      otpCode,
      newPassword,
    }),

  refreshToken: (providedToken: string) =>
    apiClient.get(`/RefreshToken?providedToken=${providedToken}`),

  getManagerProfile: () => apiClient.get<ManagerProfile>("/gym-manager/auth/profile"),

  updateManagerProfile: (data: {
    name: string;
    email: string;
    phone?: string;
  }) => apiClient.put<ManagerProfile>("/gym-manager/auth/profile", data),
};

// ─── Super Admin: Gyms ───────────────────────────────────────────────────────

export const gymsApi = {
  getAll: (params?: {
    searchQuery?: string;
    "pageInfo.pageNumber"?: number;
    "pageInfo.resultsPerPage"?: number;
  }) => apiClient.get("/gyms", { params }),

  getById: (id: string) => apiClient.get(`/gyms/${id}`),

  create: (data: {
    gymName: string;
    gymType: number;
    latitude: number;
    longitude: number;
    phone: string;
    description: string;
    managerName: string;
    managerEmail: string;
    managerPhone: string;
    managerPassword: string;
  }) => apiClient.post("/admin/gyms", data),

  delete: (gymId: string) => apiClient.delete(`/admin/gyms/${gymId}`),
};

// ─── Gym Manager: My Gym ─────────────────────────────────────────────────────

export const myGymApi = {
  get: () => apiClient.get<MyGym>("/gyms/my-gym"),

  // The OpenAPI doc types the two uploads below as x-www-form-urlencoded, but
  // both carry an IFormFile, so they must go out as multipart — urlencoded is
  // what produces "Form key length limit 2048 exceeded".
  update: (formData: FormData) =>
    apiClient.put("/gyms/my-gym", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  addImage: (formData: FormData) =>
    apiClient.post("/gyms/my-gym/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteImage: (imageId: string) =>
    apiClient.delete(`/gyms/my-gym/images/${imageId}`),

  /** Body is the image ids in their new display order. */
  reorderImages: (ids: string[]) =>
    apiClient.post("/gyms/my-gym/images/reorder", ids),

  getQr: () => apiClient.get<GymQrCode>("/gyms/my-gym/qr"),

  regenerateQr: () => apiClient.post<GymQrCode>("/gyms/my-gym/qr/regenerate"),
};

// ─── Membership Plans ────────────────────────────────────────────────────────

export const plansApi = {
  create: (data: GymPlanInput) => apiClient.post<GymPlan>("/gym-plans", data),

  update: (id: string, data: GymPlanInput) =>
    apiClient.put<GymPlan>(`/gym-plans/${id}`, data),

  /**
   * Hard-deletes the plan. Returns 400 when trainees have already subscribed —
   * `deactivate` is the call to make in that case.
   */
  delete: (id: string) => apiClient.delete<{ message: string }>(`/gym-plans/${id}`),

  /** Hides the plan from trainee discovery, leaving existing subscriptions intact. */
  deactivate: (id: string) => apiClient.post<GymPlan>(`/gym-plans/${id}/deactivate`),

  reactivate: (id: string) => apiClient.post<GymPlan>(`/gym-plans/${id}/reactivate`),
};

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptionsApi = {
  /** `status` is GymSubscriptionStatusEnum; 0 (Pending) is a filter, not "unset". */
  getRequests: (status?: number) =>
    apiClient.get<GymSubscription[]>("/gym-subscriptions/gym-requests", {
      params: status == null ? {} : { status },
    }),

  approve: (id: string) => apiClient.post(`/gym-subscriptions/${id}/approve`),

  reject: (id: string) => apiClient.post(`/gym-subscriptions/${id}/reject`),

  /** `cancellationType` is CancellationTypeEnum — 0 Immediate, 1 CancelAtEnd. */
  cancel: (id: string, cancellationType: number) =>
    apiClient.post(`/gym-subscriptions/${id}/cancel`, { cancellationType }),

  getStats: () => apiClient.get("/Subscription/stats"),
};

// ─── Members ─────────────────────────────────────────────────────────────────

export const membersApi = {
  getAll: (params?: {
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: string;
    "pageInfo.pageNumber"?: number;
    "pageInfo.resultsPerPage"?: number;
  }) => apiClient.get<Paginated<GymMember>>("/gym-dashboard/members", { params }),

  getById: (traineeId: string) =>
    apiClient.get<GymMemberDetail>(`/gym-dashboard/members/${traineeId}`),
};

// ─── Attendance ──────────────────────────────────────────────────────────────

export const attendanceApi = {
  getHistory: (date?: string) =>
    apiClient.get<AttendanceLog[]>("/gym-attendance/gym-history", {
      params: date ? { date } : {},
    }),
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  getStats: () => apiClient.get<GymStatistics>("/gym-statistics"),
};

// ─── Coaches ─────────────────────────────────────────────────────────────────

export const coachesApi = {
  getAll: (params?: {
    PageNumber?: number;
    ResultsPerPage?: number;
    searchQuery?: string;
  }) => apiClient.get("/Coach/GetAllCoachs", { params }),

  getById: (coachId: string) => apiClient.get(`/Coach/${coachId}`),

  create: (data: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    bio?: string;
    yearsOfExperience?: number;
    facebookUrl?: string;
    instagramUrl?: string;
    tikTokUrl?: string;
    youTubeUrl?: string;
    isVerifiedByAdmin?: boolean;
  }) => apiClient.post("/Coach/AddCoach", data),
};

// ─── Trainees ────────────────────────────────────────────────────────────────

export const traineesApi = {
  getAll: (params?: {
    "pageInfo.PageNumber"?: number;
    "pageInfo.ResultsPerPage"?: number;
    searchQuery?: string;
  }) => apiClient.get("/Trainee/GetAllTrainees", { params }),
};

// ─── Muscle Groups ───────────────────────────────────────────────────────────

export const muscleGroupsApi = {
  getAll: (params?: {
    pageNumber?: number;
    resultsPerPage?: number;
    searchQuery?: string;
  }) => apiClient.get("/MuscleGroup", { params }),

  getById: (id: string) => apiClient.get(`/MuscleGroup/${id}`),

  create: (data: {
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    isActive: boolean;
  }) => apiClient.post("/MuscleGroup", data),

  update: (
    id: string,
    data: {
      nameEn: string;
      nameAr: string;
      descriptionEn?: string;
      descriptionAr?: string;
      isActive: boolean;
    }
  ) => apiClient.put(`/MuscleGroup/${id}`, data),

  delete: (id: string) => apiClient.delete(`/MuscleGroup/${id}`),
};

// ─── Equipment ───────────────────────────────────────────────────────────────

export const equipmentApi = {
  getAll: (params?: {
    pageNumber?: number;
    resultsPerPage?: number;
    searchQuery?: string;
  }) => apiClient.get("/Equipment", { params }),

  getById: (id: string) => apiClient.get(`/Equipment/${id}`),

  create: (data: {
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    isActive: boolean;
  }) => apiClient.post("/Equipment", data),

  update: (
    id: string,
    data: {
      nameEn: string;
      nameAr: string;
      descriptionEn?: string;
      descriptionAr?: string;
      isActive: boolean;
    }
  ) => apiClient.put(`/Equipment/${id}`, data),

  delete: (id: string) => apiClient.delete(`/Equipment/${id}`),
};

// ─── Exercises ───────────────────────────────────────────────────────────────

export const exercisesApi = {
  getAll: (params?: {
    pageNumber?: number;
    resultsPerPage?: number;
    searchQuery?: string;
  }) => apiClient.get<Paginated<CatalogueExercise>>("/Exercise", { params }),

  getById: (id: string) => apiClient.get<CatalogueExercise>(`/Exercise/${id}`),
};

// ─── Exercise Schedules ──────────────────────────────────────────────────────

export const schedulesApi = {
  getAll: (params?: {
    pageNumber?: number;
    resultsPerPage?: number;
    searchQuery?: string;
  }) =>
    apiClient.get<Paginated<ExerciseSchedule>>("/ExerciseSchedule", { params }),

  getById: (id: string) =>
    apiClient.get<ExerciseSchedule>(`/ExerciseSchedule/${id}`),

  create: (data: ScheduleInput) =>
    apiClient.post<ExerciseSchedule>("/ExerciseSchedule", data),

  update: (id: string, data: ScheduleUpdateInput) =>
    apiClient.put<ExerciseSchedule>(`/ExerciseSchedule/${id}`, data),

  delete: (id: string) => apiClient.delete(`/ExerciseSchedule/${id}`),
};
