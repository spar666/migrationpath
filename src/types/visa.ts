/**
 * Visa Subclass and Immigration Types
 */

export type VisaCategory =
  | 'skilled-migration'
  | 'employer-sponsored'
  | 'family'
  | 'student'
  | 'temporary'
  | 'humanitarian';

export interface VisaSubclass {
  id: string;
  code: string;
  name: string;
  description: string;
  category: VisaCategory;
  processingTime: string;
  fee?: number;
  mandatoryExtras?: MandatoryExtra[];
}

export interface MandatoryExtra {
  id: string;
  visaId: string;
  name: string;
  description: string;
  cost: number;
  required: boolean;
}
