/**
 * Auth utilities for GymBro Admin Portal
 */

export type UserRole = "super_admin" | "gym_manager";

export interface AuthUser {
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  name?: string;
  email?: string;
  gymId?: string;
}

export function saveAuth(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", user.accessToken);
  localStorage.setItem("refreshToken", user.refreshToken);
  localStorage.setItem("userRole", user.role);
  if (user.name) localStorage.setItem("userName", user.name);
  if (user.email) localStorage.setItem("userEmail", user.email);
  if (user.gymId) localStorage.setItem("gymId", user.gymId);
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem("accessToken");
  const role = localStorage.getItem("userRole") as UserRole | null;
  if (!accessToken || !role) return null;
  return {
    accessToken,
    refreshToken: localStorage.getItem("refreshToken") ?? "",
    role,
    name: localStorage.getItem("userName") ?? undefined,
    email: localStorage.getItem("userEmail") ?? undefined,
    gymId: localStorage.getItem("gymId") ?? undefined,
  };
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("gymId");
}

export function isAuthenticated(): boolean {
  return !!getAuth();
}

export function getUserRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userRole") as UserRole | null;
}

/**
 * Reads the signed-in user's id from the access token.
 * The login endpoints only return tokens, so the id comes from the JWT claims
 * (needed by endpoints such as POST /ExerciseSchedule → createdByAdminId).
 */
export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as Record<string, unknown>;
    const candidates = [
      claims["sub"],
      claims["nameid"],
      claims["uid"],
      claims["userId"],
      claims["id"],
      claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
    ];
    const id = candidates.find((v) => typeof v === "string" && v.length > 0);
    return (id as string) ?? null;
  } catch {
    return null;
  }
}
