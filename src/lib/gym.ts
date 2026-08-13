/**
 * My Gym — types and helpers for GET/PUT /gyms/my-gym and the gallery endpoints.
 *
 * The OpenAPI document declares the PUT and the image upload as
 * `application/x-www-form-urlencoded`, but both carry an IFormFile, so they must
 * actually be sent as multipart/form-data — urlencoded is what produces
 * "Failed to read the request form. Form key length limit 2048 exceeded."
 */

// ─── API shapes ──────────────────────────────────────────────────────────────

export interface WorkingPeriod {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  genderType: number;
}

export interface GymImage {
  id: string;
  url: string;
  order: number;
  description?: string | null;
}

export interface GymService {
  serviceType: number;
  isEnabled: boolean;
}

export interface GymPlan {
  id: string;
  gymId: string;
  name: string;
  description: string;
  durationDays: number;
  price: number;
  isActive: boolean;
}

export interface GymManagerInfo {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  gymId: string;
}

export interface MyGym {
  id: string;
  name: string;
  description: string;
  phone: string;
  latitude: number;
  longitude: number;
  logoUrl: string | null;
  gymType: number;
  gymManagerId: string;
  gymManager: GymManagerInfo;
  workingPeriods: WorkingPeriod[];
  images: GymImage[];
  services: GymService[];
  plans: GymPlan[];
}

// ─── Enums (the API exposes these as bare integers) ──────────────────────────

/** Sunday-first, matching .NET's DayOfWeek. */
export const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

/**
 * GymServiceTypeEnum — the eight services occupy 0–7, not the 1–8 the API doc
 * lists. Verified against the live endpoint: 0–7 pass model validation while
 * 8 and 9 come back as "The value '8' is invalid."
 * Labels live in `serviceTypeLabel` (lib/utils.ts).
 */
export const SERVICE_TYPES = [0, 1, 2, 3, 4, 5, 6, 7] as const;

/** GenderTypeEnum — 1 = Male, 2 = Female (per the Gym Manager API doc). */
export const GENDER_MALE = 1;
export const GENDER_FEMALE = 2;

// ─── Normalisation ───────────────────────────────────────────────────────────

/**
 * The API returns times in several shapes ("23:23:56.287Z", "09:00:00",
 * "09:00"). Everything below works with plain "HH:mm".
 */
export function toTimeInput(value: string | null | undefined): string {
  if (!value) return "00:00";
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "00:00";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/** The update endpoint documents StartTime/EndTime as plain "HH:mm". */
export function toApiTime(value: string): string {
  return toTimeInput(value);
}

/**
 * The gym may come back with only some services (or none at all), so the editor
 * always works with the full list — otherwise a service can never be turned on.
 */
export function fullServiceList(services: GymService[] | null | undefined): GymService[] {
  const enabled = new Map<number, boolean>();
  for (const s of services ?? []) enabled.set(s.serviceType, s.isEnabled);
  return SERVICE_TYPES.map((serviceType) => ({
    serviceType,
    isEnabled: enabled.get(serviceType) ?? false,
  }));
}

export function sortImages(images: GymImage[] | null | undefined): GymImage[] {
  return [...(images ?? [])].sort((a, b) => a.order - b.order);
}

export function sortWorkingPeriods(periods: WorkingPeriod[]): WorkingPeriod[] {
  return [...periods].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || toTimeInput(a.startTime).localeCompare(toTimeInput(b.startTime))
  );
}

// ─── Edit form ───────────────────────────────────────────────────────────────

export interface GymForm {
  name: string;
  description: string;
  phone: string;
  latitude: string;
  longitude: string;
  workingPeriods: WorkingPeriod[];
  services: GymService[];
}

export function toGymForm(gym: MyGym): GymForm {
  return {
    name: gym.name ?? "",
    description: gym.description ?? "",
    phone: gym.phone ?? "",
    latitude: String(gym.latitude ?? 0),
    longitude: String(gym.longitude ?? 0),
    workingPeriods: sortWorkingPeriods(gym.workingPeriods ?? []).map((wp) => ({
      ...wp,
      startTime: toTimeInput(wp.startTime),
      endTime: toTimeInput(wp.endTime),
    })),
    services: fullServiceList(gym.services),
  };
}

export type GymValidationCode =
  | "missingName"
  | "missingPhone"
  | "invalidLatitude"
  | "invalidLongitude"
  | "invalidPeriod";

/** First problem found, or null when the form can be submitted. */
export function validateGymForm(form: GymForm): GymValidationCode | null {
  if (!form.name.trim()) return "missingName";
  if (!form.phone.trim()) return "missingPhone";

  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return "invalidLatitude";
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return "invalidLongitude";

  for (const wp of form.workingPeriods) {
    if (toTimeInput(wp.startTime) >= toTimeInput(wp.endTime)) return "invalidPeriod";
  }
  return null;
}

/**
 * Builds the multipart body for PUT /gyms/my-gym.
 *
 * The collections must use ASP.NET's indexed form keys —
 * `WorkingPeriods[0].DayOfWeek`, `Services[0].ServiceType`, … — as documented.
 * Posting them as a single JSON string (which is what Swagger's "try it out"
 * generates) binds to an empty list and silently wipes hours and services.
 */
export function buildGymFormData(form: GymForm, logo: File | null): FormData {
  const fd = new FormData();
  fd.append("Name", form.name.trim());
  fd.append("Description", form.description.trim());
  fd.append("Phone", form.phone.trim());
  fd.append("Latitude", String(Number(form.latitude)));
  fd.append("Longitude", String(Number(form.longitude)));

  form.workingPeriods.forEach((wp, i) => {
    fd.append(`WorkingPeriods[${i}].DayOfWeek`, String(wp.dayOfWeek));
    fd.append(`WorkingPeriods[${i}].StartTime`, toApiTime(wp.startTime));
    fd.append(`WorkingPeriods[${i}].EndTime`, toApiTime(wp.endTime));
    fd.append(`WorkingPeriods[${i}].GenderType`, String(wp.genderType));
  });

  form.services.forEach((service, i) => {
    fd.append(`Services[${i}].ServiceType`, String(service.serviceType));
    fd.append(`Services[${i}].IsEnabled`, String(service.isEnabled));
  });

  if (logo) fd.append("Logo", logo);
  return fd;
}

export function buildImageFormData(
  file: File,
  order: number,
  description: string
): FormData {
  const fd = new FormData();
  fd.append("Image", file);
  fd.append("Order", String(order));
  fd.append("Description", description.trim());
  return fd;
}

/** Moves an image within the gallery and renumbers `order` from its position. */
export function moveImage(images: GymImage[], from: number, to: number): GymImage[] {
  if (to < 0 || to >= images.length) return images;
  const next = [...images];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((img, index) => ({ ...img, order: index }));
}
