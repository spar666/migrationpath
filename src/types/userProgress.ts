/**
 * User Progress Types for Tracking Migration Journey
 */

export type ProgressStep =
  | 'search'
  | 'view_details'
  | 'points_calculator'
  | 'visa_recommendation'
  | 'completed';

export interface UserProgress {
  id: string;
  user_id: string;
  title?: string;
  current_step: ProgressStep;
  anzsco_code?: string;
  target_visa?: string;
  calculated_points?: number;
  data?: Record<string, any>;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveProgressDto {
  title?: string;
  current_step?: ProgressStep;
  anzsco_code?: string;
  target_visa?: string;
  calculated_points?: number;
  data?: Record<string, any>;
  is_completed?: boolean;
}

export interface UpdateProgressDto extends Partial<SaveProgressDto> {}
