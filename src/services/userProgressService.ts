import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/api';
import type { UserProgress, SaveProgressDto, UpdateProgressDto } from '@/types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
  requestId: string;
}

class UserProgressService {
  private baseURL = API_ENDPOINTS.USER_PROGRESS;

  async getMyProgress(): Promise<UserProgress[]> {
    const envelope = await apiClient.get<ApiEnvelope<UserProgress[]>>(this.baseURL);
    return envelope.data || [];
  }

  async getProgressById(id: string): Promise<UserProgress> {
    const envelope = await apiClient.get<ApiEnvelope<UserProgress>>(`${this.baseURL}/${id}`);
    return envelope.data;
  }

  async createProgress(dto: SaveProgressDto): Promise<UserProgress> {
    const envelope = await apiClient.post<ApiEnvelope<UserProgress>>(this.baseURL, dto);
    return envelope.data;
  }

  async updateProgress(id: string, dto: UpdateProgressDto): Promise<UserProgress> {
    const envelope = await apiClient.patch<ApiEnvelope<UserProgress>>(`${this.baseURL}/${id}`, dto);
    return envelope.data;
  }

  async deleteProgress(id: string): Promise<{ message: string }> {
    const envelope = await apiClient.delete<ApiEnvelope<{ message: string }>>(`${this.baseURL}/${id}`);
    return envelope.data;
  }
}

export const userProgressService = new UserProgressService();
