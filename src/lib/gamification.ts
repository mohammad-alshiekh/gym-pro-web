/**
 * Admin gamification domain — types for
 * `GET /admin/gamification/leaderboard`. SuperAdmin-only.
 *
 * Unlike the trainee-facing leaderboard, this one includes trainees who
 * opted out of the public board (flagged `isVisibleOnLeaderboard: false`) so
 * an operator can see the true standings. Treat the whole screen as
 * internal-only — no share action, no public export — and render hidden
 * rows rather than dropping them, or ranks stop being continuous.
 */

export interface AdminLeaderboardEntry {
  rank: number;
  traineeId: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
  points: number;
  isVisibleOnLeaderboard: boolean;
}

export interface AdminLeaderboard {
  from: string;
  to: string;
  /** Distinct trainees who scored in the range. */
  totalParticipants: number;
  /** How many of those opted out of the public board. */
  hiddenParticipants: number;
  entries: AdminLeaderboardEntry[];
}
