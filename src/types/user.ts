/**
 * User Profile and Preferences Types
 */

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: 'en' | 'es' | 'fr';
  emailUpdates: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}
