/**
 * Turns an API failure into a message worth showing a user.
 *
 * The GymBro API answers with two different error shapes:
 *   { status, errorCode, message, traceId }                    ← domain errors
 *   { title, status, errors: { field: [msg, ...] }, traceId }  ← model validation
 * Axios itself only gives "Request failed with status code 400", so without this
 * the real reason ("Gym image not found.") never reaches the toast.
 */

import axios from "axios";

interface ProblemDetails {
  message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[] | string>;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ProblemDetails | string | undefined;

    if (typeof data === "string" && data.trim()) return data;

    if (data && typeof data === "object") {
      if (data.message) return data.message;

      // Validation problem details: surface the first field message.
      if (data.errors) {
        for (const value of Object.values(data.errors)) {
          const first = Array.isArray(value) ? value[0] : value;
          if (first) return first;
        }
      }

      if (data.detail) return data.detail;
      if (data.title) return data.title;
    }

    if (error.code === "ERR_NETWORK") return fallback;
  }

  if (error instanceof Error && error.message && !error.message.startsWith("Request failed")) {
    return error.message;
  }

  return fallback;
}
