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
 * Sign-in is the only entry point left — signup, password reset and refresh
 * went with the user accounts, and the service is now staff-only. Whether the
 * client stores the token decides whether the admin is signed in, and when it
 * silently fails nothing throws: the next request goes out unauthenticated and
 * the admin is bounced to /admin/login with no explanation.
 *
 * Hence the assertion below, repeated across every spelling the backend has
 * ever used for the field: the token the server issued is the token we keep.
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

describe('logout', () => {
  it('clears the stored token', async () => {
    localStorage.setItem('auth_token', 'jwt');
    post.mockResolvedValue({});

    authService.logout();

    expect(authService.getToken()).toBeNull();
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
