// Authentication service

import { apiClient, setSuppressAuthRedirect } from '@/lib/apiClient';
import { AppError, ErrorCodes } from '@/lib/errorHandler';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  personaType: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  personaType?: string;
  isAdmin?: boolean;
  role?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserProfile;
}

export interface PasswordResetRequest {
  email: string;
}

class AuthService {
  private baseURL = '/auth';
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Suppress global 401 redirect during login sequence — we handle errors ourselves
    setSuppressAuthRedirect(true);
    try {
      const raw = await apiClient.post<any>(`${this.baseURL}/signin`, credentials);
      const res = this.normalizeResponse<AuthResponse>(raw) || {};

      // Support all common token field names
      const token = res.token || res.accessToken || (res as any).access_token || (res as any).data?.token || (res as any).data?.accessToken;

      console.debug('[AuthService] Login response normalized:', res);
      console.debug('[AuthService] Extracted token:', token ? 'Found' : 'Not Found');

      if (token) this.setToken(token);

      if (res.refreshToken) this.setRefreshToken(res.refreshToken);
      return res as AuthResponse;
    } catch (err) {
      throw new AppError('Login failed. Please check your credentials.', ErrorCodes.UNAUTHORIZED, 401, err);
    } finally {
      // Note: we keep it suppressed; the caller (Auth.tsx) resets it via finally block
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const raw = await apiClient.post<any>(`${this.baseURL}/signup`, data);
      const res = this.normalizeResponse<AuthResponse>(raw) || {};
      if (res.token) this.setToken(res.token);
      if (res.refreshToken) this.setRefreshToken(res.refreshToken);
      return res as AuthResponse;
    } catch (err) {
      throw new AppError('Registration failed. Please try again.', ErrorCodes.OPERATION_FAILED, 400, err);
    }
  }

  requestPasswordReset(data: PasswordResetRequest): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`${this.baseURL}/password-reset/request`, data);
  }

  resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`${this.baseURL}/password-reset/confirm`, { token, newPassword });
  }

  async refreshToken(): Promise<AuthResponse> {
    const rt = this.getRefreshToken();
    if (!rt) throw new AppError('No refresh token available', ErrorCodes.SESSION_EXPIRED, 401);
    try {
      const raw = await apiClient.post<any>(`${this.baseURL}/refresh`, { refreshToken: rt });
      const res = this.normalizeResponse<AuthResponse>(raw) || {};
      if (res.token) this.setToken(res.token);
      return res as AuthResponse;
    } catch (err) {
      this.logout();
      throw err;
    }
  }

  logout(): void {
    void apiClient.post(`${this.baseURL}/logout`).catch(() => { });
    this.clearToken();
    this.clearRefreshToken();
  }

  async me(token?: string): Promise<UserProfile | null> {
    try {
      // Token is automatically added by the apiClient interceptor from localStorage
      const raw = await apiClient.get<any>(`${this.baseURL}/me`);
      const payload = this.normalizeResponse<any>(raw);
      if (!payload) return null;

      // Handle various response structures: { user: {...} } vs { ...profile }
      const profile = (payload.user ?? payload) as any;

      // Normalize field names: is_admin -> isAdmin, full_name -> fullName
      if (profile) {
        if (typeof profile.isAdmin === 'undefined') {
          profile.isAdmin = !!(
            profile.is_admin ||
            profile.role === 'admin' ||
            (Array.isArray(profile.roles) && profile.roles.includes('admin'))
          );
        }

        // Handle full_name from backend
        if (!profile.fullName && profile.full_name) {
          profile.fullName = profile.full_name;
        }

        // If firstName/lastName are missing, derive them from fullName
        if (!profile.firstName && profile.fullName) {
          const parts = profile.fullName.split(' ');
          profile.firstName = parts[0];
          profile.lastName = parts.slice(1).join(' ');
        }
      }

      return profile as UserProfile;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    console.debug('[AuthService] isAuthenticated check:', !!token);
    return !!token;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.setAccessTokenCookie(token);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.clearAccessTokenCookie();
  }

  private setAccessTokenCookie(token: string, days = 7) {
    if (typeof document === 'undefined') return;
    const secure = window.location.protocol === 'https:';
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `access_token=${encodeURIComponent(token)}; Path=/; Expires=${expires}; SameSite=Lax${secure ? '; Secure' : ''}`;
  }

  private clearAccessTokenCookie() {
    if (typeof document === 'undefined') return;
    document.cookie = 'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }

  private clearRefreshToken(): void {
    localStorage.removeItem(this.refreshTokenKey);
  }

  private normalizeResponse<T>(raw: any): T {
    if (!raw) return raw as T;
    if (typeof raw === 'object' && 'success' in raw && raw.success && 'data' in raw) return raw.data as T;
    if (typeof raw === 'object' && 'data' in raw && !('success' in raw)) return raw.data as T;
    return raw as T;
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
}

export const authService = new AuthService();
