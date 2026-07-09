/**
 * User Persona and Migration Pathway Types
 */

export type PersonaType = 'student' | 'skilled' | 'onshore-skilled' | 'partner' | 'employer';

export interface Persona {
  id: string;
  type: PersonaType;
  name: string;
  description: string;
  icon: string;
  pathwaySteps: PathwayStep[];
  successCriteria: string[];
}

export interface PathwayStep {
  id: string;
  order: number;
  title: string;
  description: string;
  duration: string;
  keyActions: string[];
  resources: string[];
}

export interface RelationshipChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  dueDate?: string;
}
