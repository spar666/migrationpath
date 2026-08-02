import { describe, it, expect, beforeEach, vi } from 'vitest';

const post = vi.fn();
const get = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    get: (...a: unknown[]) => get(...a),
  },
  setSuppressAuthRedirect: vi.fn(),
}));

const { authService } = await import('./authService');

/**
 * Token persistence.
 *
 * The backend signs `access_token` on signin, signup AND refresh. Whether the
 * client stores it decides whether the user is logged in — and when it silently
 * fails, nothing throws. The request just goes out unauthenticated later, and
 * the user is bounced to the login screen with no explanation.
 *
 * So each entry point gets the same assertion: the token the server issued is
 * the token we keep.
 */

beforeEach(() => {
  localStorage.clear();
  post.mockReset();
  get.mockReset();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

describe('login', () => {
  it('stores an access_token', async () => {
    post.mockResolvedValue({ access_token: 'jwt-123', user: { id: 'u1' } });
    await authService.login({ email: 'a@b.com', password: 'x' } as never);
    expect(authService.getToken()).toBe('jwt-123');
  });

  it.each([
    ['token', { token: 'jwt-123' }],
    ['accessToken', { accessToken: 'jwt-123' }],
    ['access_token', { access_token: 'jwt-123' }],
    ['data.token', { data: { token: 'jwt-123' } }],
  ])('accepts the %s field name', async (_label, body) => {
    post.mockResolvedValue(body);
    await authService.login({ email: 'a@b.com', password: 'x' } as never);
    expect(authService.getToken()).toBe('jwt-123');
  });

  it('throws a typed error on bad credentials', async () => {
    post.mockRejectedValue(new Error('401'));
    await expect(
      authService.login({ email: 'a@b.com', password: 'wrong' } as never),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('stores no token when the response carries none', async () => {
    post.mockResolvedValue({ user: { id: 'u1' } });
    await authService.login({ email: 'a@b.com', password: 'x' } as never);
    expect(authService.getToken()).toBeNull();
  });
});

describe('register', () => {
  it('stores the access_token the backend issues', async () => {
    // The backend's signUp returns { user, access_token } — the same shape as
    // signin. A client that only reads `res.token` throws away a perfectly
    // good session and the user appears logged out the moment they sign up.
    post.mockResolvedValue({ access_token: 'jwt-signup', user: { id: 'u1' } });

    await authService.register({
      email: 'a@b.com',
      password: 'x',
      fullName: 'A B',
    } as never);

    expect(authService.getToken()).toBe('jwt-signup');
  });

  it('accepts the same token field names as login', async () => {
    post.mockResolvedValue({ accessToken: 'jwt-signup' });
    await authService.register({
      email: 'a@b.com',
      password: 'x',
      fullName: 'A B',
    } as never);
    expect(authService.getToken()).toBe('jwt-signup');
  });
});

describe('refreshToken', () => {
  it('stores the refreshed access_token', async () => {
    // The failure here is the nastiest of the three: refresh "succeeds", the
    // new token is dropped, the next call goes out with the expired one, and
    // the user is signed out mid-session for no visible reason.
    localStorage.setItem('refresh_token', 'refresh-abc');
    post.mockResolvedValue({ access_token: 'jwt-refreshed', user: { id: 'u1' } });

    await authService.refreshToken();

    expect(authService.getToken()).toBe('jwt-refreshed');
  });

  it('refuses without a stored refresh token', async () => {
    await expect(authService.refreshToken()).rejects.toMatchObject({
      status: 401,
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('logs out when the refresh is rejected', async () => {
    localStorage.setItem('auth_token', 'stale');
    localStorage.setItem('refresh_token', 'refresh-abc');
    post.mockRejectedValue(new Error('invalid refresh'));

    await expect(authService.refreshToken()).rejects.toThrow();
    expect(authService.getToken()).toBeNull();
  });
});

describe('logout', () => {
  it('clears both tokens', async () => {
    localStorage.setItem('auth_token', 'jwt');
    localStorage.setItem('refresh_token', 'refresh');
    post.mockResolvedValue({});

    authService.logout();

    expect(authService.getToken()).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('clears local state even when the server call fails', async () => {
    // Otherwise a network blip leaves the user apparently signed in on a
    // shared machine.
    localStorage.setItem('auth_token', 'jwt');
    post.mockRejectedValue(new Error('offline'));

    authService.logout();

    expect(authService.getToken()).toBeNull();
  });
});

describe('logging', () => {
  it('does not log the raw auth response', async () => {
    // The normalized response carries the user object and, depending on the
    // backend, the token itself. Console output ends up in support
    // screenshots and browser extensions.
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    post.mockResolvedValue({
      access_token: 'jwt-secret-value',
      user: { id: 'u1', email: 'ada@example.com' },
    });

    await authService.login({ email: 'a@b.com', password: 'x' } as never);

    // Serialised, not String()'d: String({...}) is "[object Object]", which
    // would make this assertion pass no matter what was logged.
    const logged = JSON.stringify(debug.mock.calls);
    expect(logged).not.toContain('jwt-secret-value');
    expect(logged).not.toContain('ada@example.com');
  });
});
