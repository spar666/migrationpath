/**
 * Central Type Definitions
 * Re-export all types from sub-modules for easy importing
 */

// API & Response Types
export type { ApiResponse, PaginatedResponse } from './api';

// Auth Types
//
// `./auth` is gone. Sign-in is staff-only now and its request/response shapes
// live next to their single consumer in `@/services/authService`; a second,
// drifting copy of them in the barrel was what made them worth deleting.

// User Types
export type {
  UserProfile,
  UserPreferences,
  UpdateProfileRequest,
} from './user';

// User Progress Types
//
// Removed with the user dashboard — nothing on the public site saves progress
// against an account any more.

// Document Types
//
// Removed with the document vault. There was never a working upload or review
// flow behind these — only types, endpoints and an admin button — so keeping
// them would advertise a feature the product does not have. The funnel's
// single lead attachment is a separate, much smaller thing and does not build
// on any of this.

// Occupation Types
export type {
  Occupation,
  OccupationData,
  OccupationSearchParams,
  OccupationSearchResponse,
  OccupationRow,
  OccupationSearchResult,
  VisaEligibility,
  OccupationThreshold,
} from './occupation';

// Points Types
//
// `./points` is empty and these six types were never written, so the re-export
// below resolved to nothing. Nothing imports them from this barrel — the live
// points types live in `@/hooks/usePointsConfig` and are imported directly.
// Re-add here only alongside real definitions in ./points.

// News Types
export type { NewsArticle, StrapiNewsArticle, StrapiPaginatedResponse } from './news';

// Visa Types
export type {
  VisaSubclass,
  MandatoryExtra,
  VisaCategory,
} from './visa';

// Persona & Pathway Types
export type {
  PersonaType,
  Persona,
  PathwayStep,
  RelationshipChecklistItem,
} from './persona';

// Admin Types
export type { AdminUserProfile } from './admin';

// Common & Utility Types
export type { ApiError, SecurityHeaders, ValidationError } from './common';
