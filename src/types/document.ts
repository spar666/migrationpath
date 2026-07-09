/**
 * Document and File Types
 */

export type DocumentStatus = 'pending' | 'approved' | 'rejected';
export type DocumentType = 'passport' | 'english' | 'degree' | 'skills' | 'experience' | 'other';

export interface DocumentData {
  id: string;
  userId: string;
  filename: string;
  type: DocumentType;
  url: string;
  uploadedAt: string;
  size: number;
}

export interface DocumentUploadRequest {
  file: File;
  type: DocumentType;
  description?: string;
}

export interface DocumentResponse {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
}

export interface UserDocument {
  id: string;
  userId: string;
  type: DocumentType;
  filename: string;
  url: string;
  status: DocumentStatus;
  uploadedAt: string;
  reviewedAt?: string;
  notes?: string;
}

export interface AdminDocument {
  id: string;
  userId: string;
  type: DocumentType;
  filename: string;
  url: string;
  status: DocumentStatus;
  uploadedAt: string;
  userName?: string;
  userEmail?: string;
}
