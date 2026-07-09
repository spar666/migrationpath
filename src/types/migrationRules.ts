export type VisaGroup = "GSM" | "Business" | "Checklist";

export interface MigrationRule {
  id: string;
  visa_group: VisaGroup;
  category: string;
  sub_category: string;
  label: string;
  min_value?: number;
  max_value?: number;
  points_value: number;
  is_active: boolean;
  guardrails?: string; // Optional field for specific logic like "Max 20"
}

export type VisaType = 
  | "189" | "190" | "491" // GSM
  | "188"                // Business
  | "858"                // National Innovation
  | "820" | "309"        // Partner
  | "482" | "186";       // Employer

export interface VisaMetadata {
  id: VisaType;
  label: string;
  group: VisaGroup;
  action: "Points" | "Checklist";
}

export interface DocumentRequirement {
  id: string;
  document_name: string;
  description: string | null;
  persona_type: string;
  is_mandatory: boolean;
  created_at?: string;
  updated_at?: string;
}

export const VISA_TYPES: VisaMetadata[] = [
  { id: "189", label: "Skilled Independent (189)", group: "GSM", action: "Points" },
  { id: "190", label: "Skilled Nominated (190)", group: "GSM", action: "Points" },
  { id: "491", label: "Skilled Regional (491)", group: "GSM", action: "Points" },
  { id: "188", label: "Business Innovation (188)", group: "Business", action: "Points" },
  { id: "858", label: "National Innovation (858)", group: "Checklist", action: "Checklist" },
  { id: "820", label: "Partner Onshore (820)", group: "Checklist", action: "Checklist" },
  { id: "309", label: "Partner Offshore (309)", group: "Checklist", action: "Checklist" },
  { id: "482", label: "Temporary Skill Shortage (482)", group: "Checklist", action: "Checklist" },
  { id: "186", label: "Employer Nomination (186)", group: "Checklist", action: "Checklist" },
];
