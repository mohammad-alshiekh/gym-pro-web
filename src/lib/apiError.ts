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
  errorCode?: number;
  errors?: Record<string, string[] | string>;
}

/**
 * Some endpoints (AI plan packages) answer every business failure with HTTP
 * 400 and put the real code in the body's `errorCode` — so `404 not found`
 * arrives as a 400. Callers that need to branch must read this, not the status.
 * Returns null when the response carries no `errorCode`.
 */
export function apiErrorCode(error: unknown): number | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as ProblemDetails | undefined;
  return typeof data?.errorCode === "number" ? data.errorCode : null;
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

/**
 * Some endpoints only ever answer with a fixed, un-localized English
 * sentence — apiErrorMessage would pass that straight through to an Arabic
 * user. This checks the raw message against known phrases first and shows
 * the matching localized string instead; anything unrecognized still falls
 * through to apiErrorMessage's usual behavior.
 */
export function apiErrorMessageKnown(
  error: unknown,
  knownPhrases: Record<string, string>,
  fallback: string
): string {
  const raw = apiErrorMessage(error, "");
  for (const [phrase, localized] of Object.entries(knownPhrases)) {
    if (raw.includes(phrase)) return localized;
  }
  return raw || fallback;
}
