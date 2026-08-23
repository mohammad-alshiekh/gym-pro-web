/**
 * Admin finance domain — types for `GET /admin/finance/overview` and
 * `GET /admin/finance/transactions`. SuperAdmin-only.
 *
 * `totalRevenue` is Stripe-settled only and deliberately excludes
 * `manualPayments` — a gym manager can activate a member without Stripe, and
 * the platform has no record the money was actually collected. Never sum the
 * two into a single headline figure.
 *
 * Historical totals are not a locked ledger: gym/coach subscription amounts
 * are read from the plan's *current* price (those tables never snapshotted
 * what was actually charged), so a past month's reported revenue can shift
 * after the fact when a plan's price changes. Only AI-plan rows store the
 * real charged amount.
 */

/** FinanceStreamEnum. */
export const FinanceStream = {
  AiPlan: 0,
  GymSubscription: 1,
  CoachSubscription: 2,
} as const;

export interface FinanceStreamBreakdown {
  stream: number;
  streamName: string;
  transactionCount: number;
  revenue: number;
}

export interface FinanceOverview {
  from: string;
  to: string;
  /** Stripe-settled only. Do not add `manualPayments.amount` to this. */
  totalRevenue: number;
  transactionCount: number;
  /** Always all three streams, even at zero — render a fixed set of cards. */
  byStream: FinanceStreamBreakdown[];
  manualPayments: { count: number; amount: number };
  /**
   * `activeGymMembers`, `activeCoachTrainees` and `activeCoachTraineesPaid`
   * are live "as of now" and ignore `from`/`to`. Only `aiPlanBuyersInPeriod`
   * is scoped to the requested date range.
   */
  subscribers: {
    activeGymMembers: number;
    activeCoachTrainees: number;
    activeCoachTraineesPaid: number;
    aiPlanBuyersInPeriod: number;
  };
}

export interface FinanceTransaction {
  id: string;
  stream: number;
  streamName: string;
  /** Full UTC DateTime. */
  occurredAt: string;
  amount: number;
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  description: string;
  /** Always `null` when `isManualPayment` is true. */
  stripeReference: string | null;
  isManualPayment: boolean;
}
