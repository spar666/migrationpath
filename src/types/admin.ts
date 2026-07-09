/**
 * Admin and Management Types
 */

export interface AdminUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'moderator' | 'analyst';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface AdminUserWithDocuments extends AdminUserProfile {
  documentsCount: number;
  pendingDocuments: number;
  approvedDocuments: number;
}
