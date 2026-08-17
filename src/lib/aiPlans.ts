/**
 * AI Plan Packages — the tiers a trainee can buy, one purchase per generated
 * plan. Defined here in the web panel; bought in the mobile app.
 *
 * If no package exists the mobile app hides the AI-plan feature entirely, so
 * this catalogue is the switch that turns the whole feature on.
 */

export interface AiPlanPackage {
  id: string;
  name: string;
  description?: string | null;
  /** USD, two decimal places. Charged once, per plan. */
  price: number;
  /** Longest span a plan bought under this tier may cover. 1–365. */
  maxPlanDurationDays: number;
  isActive: boolean;
  creationTime: string;
}

/** POST and PUT take the same body. */
export interface AiPlanPackageInput {
  name: string;
  description?: string;
  price: number;
  maxPlanDurationDays: number;
  isActive: boolean;
}

/** Server-enforced bounds on `maxPlanDurationDays`. */
export const MAX_PLAN_DURATION_MIN = 1;
export const MAX_PLAN_DURATION_MAX = 365;

export const NAME_MAX_LENGTH = 100;

export type PackageValidationCode =
  | "missingName"
  | "nameTooLong"
  | "invalidPrice"
  | "invalidDuration";

/**
 * Mirrors the documented server rules so the obvious mistakes are caught
 * before a round-trip: name present and within length, price >= 0, and
 * duration inside 1–365.
 */
export function validatePackage(form: {
  name: string;
  price: string;
  maxPlanDurationDays: string;
}): PackageValidationCode | null {
  if (!form.name.trim()) return "missingName";
  if (form.name.trim().length > NAME_MAX_LENGTH) return "nameTooLong";

  const price = Number(form.price);
  if (!Number.isFinite(price) || price < 0) return "invalidPrice";

  const days = Number(form.maxPlanDurationDays);
  if (
    !Number.isInteger(days) ||
    days < MAX_PLAN_DURATION_MIN ||
    days > MAX_PLAN_DURATION_MAX
  ) {
    return "invalidDuration";
  }
  return null;
}
