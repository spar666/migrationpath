/**
 * Central Type Definitions
 * Re-export all types from sub-modules for easy importing
 */

// API & Response Types
export type { ApiResponse, PaginatedResponse } from './api';

// Auth Types
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  PasswordResetRequest,
} from './auth';

// User Types
export type {
  UserProfile,
  UserPreferences,
  UpdateProfileRequest,
} from './user';

// User Progress Types
export type {
  ProgressStep,
  UserProgress,
  SaveProgressDto,
  UpdateProgressDto,
} from './userProgress';

// Document Types
export type {
  DocumentData,
  DocumentUploadRequest,
  DocumentResponse,
  DocumentStatus,
  DocumentType,
  UserDocument,
  AdminDocument,
} from './document';

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
export type {
  PointsConfig,
  PointsCalculation,
  PointsBreakdown,
  UserPoints,
  PointsConfigItem,
  PointsConfigByCategory,
} from './points';

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
export type {
  AdminUserProfile,
  AdminUserWithDocuments,
} from './admin';

// Common & Utility Types
export type { ApiError, SecurityHeaders, CompressionResult, ValidationError } from './common';
