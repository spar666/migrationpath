/**
 * User-Facing Messages and Strings
 */

export const MESSAGES = {
  // Success Messages
  SUCCESS: 'Operation completed successfully',
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'You have been logged out',
  PROFILE_UPDATED: 'Profile updated successfully',
  DOCUMENT_UPLOADED: 'Document uploaded successfully',
  PREFERENCES_SAVED: 'Preferences saved',

  // Error Messages
  ERROR_GENERIC: 'An error occurred. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
  ERROR_UNAUTHORIZED: 'Unauthorized. Please login again.',
  ERROR_FORBIDDEN: 'You do not have permission to access this resource.',
  ERROR_NOT_FOUND: 'Resource not found.',
  ERROR_SERVER: 'Server error. Please try again later.',
  ERROR_TIMEOUT: 'Request timed out. Please try again.',
  ERROR_VALIDATION: 'Please check your input and try again.',

  // Info Messages
  INFO_LOADING: 'Loading...',
  INFO_PROCESSING: 'Processing...',
  INFO_NO_DATA: 'No data available',
  INFO_EMPTY_RESULTS: 'No results found',

  // Warning Messages
  WARNING_SESSION_EXPIRING: 'Your session is about to expire. Please save your work.',
  WARNING_UNSAVED_CHANGES: 'You have unsaved changes. Do you want to leave?',
  WARNING_DELETE_CONFIRMATION: 'Are you sure you want to delete this? This action cannot be undone.',

  // Confirmation Messages
  CONFIRM_DELETE: 'Delete this item?',
  CONFIRM_LOGOUT: 'Are you sure you want to logout?',
  CONFIRM_SUBMIT: 'Submit this form?',

  // Auth Messages
  EMAIL_ALREADY_EXISTS: 'This email is already registered',
  INVALID_CREDENTIALS: 'Invalid email or password',
  PASSWORD_RESET_SENT: 'Password reset link has been sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',

  // Document Messages
  DOCUMENT_DELETED: 'Document deleted successfully',
  DOCUMENT_APPROVED: 'Document approved',
  DOCUMENT_REJECTED: 'Document rejected',
  DOCUMENT_PENDING_REVIEW: 'Your document is pending review',

  // Occupation Messages
  OCCUPATION_SEARCH_HELP: 'Enter occupation name or ANZSCO code',
  NO_OCCUPATIONS_FOUND: 'No occupations found matching your search',
  OCCUPATION_NOT_AVAILABLE: 'This occupation is not available for your visa subclass',

  // Points Messages
  POINTS_CALCULATED: 'Points calculated successfully',
  POINTS_INSUFFICIENT: 'Your points are below the eligible threshold',
  POINTS_ELIGIBLE: 'You meet the minimum points requirement',

  // Pathway Messages
  PATHWAY_COMPLETED: 'Pathway step completed',
  ALL_STEPS_COMPLETED: 'All pathway steps completed',
} as const;

export const BUTTON_LABELS = {
  SUBMIT: 'Submit',
  CANCEL: 'Cancel',
  SAVE: 'Save',
  DELETE: 'Delete',
  EDIT: 'Edit',
  ADD: 'Add',
  NEXT: 'Next',
  PREVIOUS: 'Previous',
  LOGIN: 'Login',
  REGISTER: 'Register',
  LOGOUT: 'Logout',
  SEARCH: 'Search',
  UPLOAD: 'Upload',
  DOWNLOAD: 'Download',
  CLOSE: 'Close',
  AGREE: 'Agree',
  DECLINE: 'Decline',
  LEARN_MORE: 'Learn More',
  APPLY_NOW: 'Apply Now',
} as const;

export const FIELD_LABELS = {
  EMAIL: 'Email Address',
  PASSWORD: 'Password',
  CONFIRM_PASSWORD: 'Confirm Password',
  FIRST_NAME: 'First Name',
  LAST_NAME: 'Last Name',
  PHONE: 'Phone Number',
  DATE_OF_BIRTH: 'Date of Birth',
  OCCUPATION: 'Occupation',
  YEARS_OF_EXPERIENCE: 'Years of Experience',
  EDUCATION_LEVEL: 'Education Level',
  ENGLISH_PROFICIENCY: 'English Proficiency',
  DOCUMENT_TYPE: 'Document Type',
  UPLOAD_FILE: 'Upload File',
} as const;
