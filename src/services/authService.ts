// Authentication service
//
// Staff-only. The public site has no accounts: every visitor journey ends at
// the consultation funnel, so the only thing that signs in here is an admin on
// their way to /admin. That is why there is no register, no password reset and
// no refresh — an admin account is provisioned on the backend, and a session
// that expires sends the user back to /admin/login rather than being renewed
// silently.

import { apiClient, setSuppressAuthRedirect } from '@/lib/apiClient';
import { AppError, ErrorCodes } from '@/lib/errorHandler';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  isAdmin?: boolean;
  role?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  user?: UserProfile;
}

class AuthService {
  private baseURL = '/auth';
  private tokenKey = 'auth_token';

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Suppress global 401 redirect during login sequence — we handle errors ourselves
    setSuppressAuthRedirect(true);
    try {
      const raw = await apiClient.post<any>(`${this.baseURL}/signin`, credentials);
      const res = this.normalizeResponse<AuthResponse>(raw) || {};

      const token = this.extractToken(res);

      // Deliberately not logged. The normalized response carries the user
      // object and the token itself, and console output reliably ends up in
      // support screenshots, session recordings and browser extensions.
      if (token) this.setToken(token);

      return res as AuthResponse;
    } catch (err) {
      throw new AppError('Login failed. Please check your credentials.', ErrorCodes.UNAUTHORIZED, 401, err);
    } finally {
      // Note: we keep it suppressed; the caller (AdminLogin.tsx) resets it via finally block
    }
  }

  logout(): void {
    void apiClient.post(`${this.baseURL}/logout`).catch(() => { });
    this.clearToken();
  }

  async me(): Promise<UserProfile | null> {
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

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.setAccessTokenCookie(token);
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

  /**
   * Pulls the access token out of a sign-in response, whatever it's called.
   *
   * The backend signs `access_token`; older code and some proxies use `token`
   * or `accessToken`, and the envelope is sometimes still wrapped in `data`.
   * Reading only one of those spellings is how a sign-in that "worked" leaves
   * the browser with no token and the admin apparently signed out.
   */
  private extractToken(res: any): string | undefined {
    return (
      res?.token ||
      res?.accessToken ||
      res?.access_token ||
      res?.data?.token ||
      res?.data?.accessToken ||
      res?.data?.access_token
    );
  }

  private normalizeResponse<T>(raw: any): T {
    if (!raw) return raw as T;
    if (typeof raw === 'object' && 'success' in raw && raw.success && 'data' in raw) return raw.data as T;
    if (typeof raw === 'object' && 'data' in raw && !('success' in raw)) return raw.data as T;
    return raw as T;
  }
}

export const authService = new AuthService();
