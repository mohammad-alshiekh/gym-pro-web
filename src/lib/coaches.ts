/**
 * Coaches domain — types shared between the list page and the coach detail
 * page. Every coach page imports from here instead of redeclaring its own
 * shape, so a change in the contract is a one-file change.
 */

/** Row shape returned by `GET /Coach/GetAllCoachs`. */
export interface CoachSummary {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  profilePictureUrl?: string | null;
  bio?: string | null;
  yearsOfExperience?: number | null;
  isAvailableForClients: boolean;
  isVerifiedByAdmin: boolean;
  numberOfClients: number;
  averageRatings: number;
  ratingsCount: number;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tikTokUrl?: string | null;
  youTubeUrl?: string | null;
}

/** A single trainee review left on a coach's profile. */
export interface CoachReview {
  id?: string;
  traineeName?: string | null;
  traineeProfilePictureUrl?: string | null;
  rating: number;
  comment?: string | null;
  feedback?: string | null;
  createdAt?: string | null;
}

/** Full shape returned by `GET /Coach/{id}`. */
export interface CoachDetail extends CoachSummary {
  galleryImageUrls: string[];
  achievementUrls: string[];
  myRating?: number | null;
  myFeedback?: string | null;
  reviews: CoachReview[];
}
