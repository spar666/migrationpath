import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';

/**
 * The axios layer every service sits on.
 *
 * Nothing here is business logic, which is exactly why it is worth testing:
 * when this misbehaves the symptom shows up somewhere else entirely. A dropped
 * Authorization header looks like a permissions bug. A 401 handler that fires
 * during login looks like wrong credentials. A missing retry on 429 looks like
 * the server being down.
 *
 * These tests drive the real interceptor chain by swapping axios's adapter for
 * a stub, so both interceptors run exactly as they do in the browser.
 *
 * Note on 429: the backoff is 2s, 4s, 8s of real `setTimeout`. Those tests use
 * fake timers and drain them by hand rather than waiting eleven seconds.
 */

let adapter: ReturnType<typeof vi.fn>;
let hrefSetter: ReturnType<typeof vi.fn>;

function ok(data: unknown = { ok: true }, config: AxiosRequestConfig = {}) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as never,
  };
}

function httpError(status: number, data: unknown = {}) {
  return (config: AxiosRequestConfig) => {
    const err = new Error(`Request failed with status code ${status}`) as Error & {
      config: AxiosRequestConfig;
      response: unknown;
      isAxiosError: boolean;
    };
    err.isAxiosError = true;
    err.config = config;
    err.response = { status, data, statusText: '', headers: {}, config };
    return Promise.reject(err);
  };
}

function networkError() {
  return (config: AxiosRequestConfig) => {
    const err = new Error('Network Error') as Error & {
      config: AxiosRequestConfig;
      isAxiosError: boolean;
    };
    err.isAxiosError = true;
    err.config = config;
    return Promise.reject(err);
  };
}

/** Fresh module instance with a stub adapter and a controllable location. */
async function loadClient() {
  vi.resetModules();
  // Both are read once at module load. Pinning them keeps the retry budget
  // deterministic and keeps the debug logger out of the test output.
  vi.stubEnv('VITE_API_DEBUG', 'false');
  vi.stubEnv('VITE_MAX_RETRIES', '3');
  const mod = await import('./apiClient');
  adapter = vi.fn();
  mod.default.defaults.adapter = adapter as unknown as AxiosAdapter;
  return mod;
}

beforeEach(() => {
  localStorage.clear();
  document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });

  hrefSetter = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      search: '',
      assign: vi.fn(),
      get href() {
        return 'http://localhost/';
      },
      set href(value: string) {
        hrefSetter(value);
      },
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('request interceptor', () => {
  it('sends no Authorization header when there is no token', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation((c) => Promise.resolve(ok({}, c)));

    await apiClient.get('/anything');

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it('attaches a bearer token from localStorage', async () => {
    localStorage.setItem('auth_token', 'tok_local');
    const { apiClient } = await loadClient();
    adapter.mockImplementation((c) => Promise.resolve(ok({}, c)));

    await apiClient.get('/anything');

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer tok_local');
  });

  it('prefers the cookie token over the localStorage one', async () => {
    // The cookie is the server-set, httpOnly-adjacent source of truth. A stale
    // localStorage token winning here would keep authenticating as whoever
    // logged in last.
    document.cookie = 'access_token=tok_cookie; path=/';
    localStorage.setItem('auth_token', 'tok_local');
    const { apiClient } = await loadClient();
    adapter.mockImplementation((c) => Promise.resolve(ok({}, c)));

    await apiClient.get('/anything');

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer tok_cookie');
  });

  it('stamps every request with a request id for log correlation', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation((c) => Promise.resolve(ok({}, c)));

    await apiClient.get('/anything');

    expect(adapter.mock.calls[0][0].headers['X-Request-ID']).toBeTruthy();
  });

  it('gives each request a distinct id', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation((c) => Promise.resolve(ok({}, c)));

    await apiClient.get('/a');
    await apiClient.get('/b');

    const first = adapter.mock.calls[0][0].headers['X-Request-ID'];
    const second = adapter.mock.calls[1][0].headers['X-Request-ID'];
    expect(first).not.toBe(second);
  });

  it('sends credentials so the auth cookie rides along', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation((c) => Promise.resolve(ok({}, c)));

    await apiClient.get('/anything');

    expect(adapter.mock.calls[0][0].withCredentials).toBe(true);
  });
});

describe('response unwrapping', () => {
  it('returns the response body, not the axios envelope', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation((c) => Promise.resolve(ok({ id: 'x' }, c)));

    await expect(apiClient.get('/thing')).resolves.toEqual({ id: 'x' });
  });

  it('passes a POST body through to the adapter', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation((c) => Promise.resolve(ok({}, c)));

    await apiClient.post('/thing', { a: 1 });

    expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual({ a: 1 });
  });

  it('exposes the other verbs against the same instance', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation((c) => Promise.resolve(ok({ ok: true }, c)));

    await expect(apiClient.put('/thing', {})).resolves.toEqual({ ok: true });
    await expect(apiClient.patch('/thing', {})).resolves.toEqual({ ok: true });
    await expect(apiClient.delete('/thing')).resolves.toEqual({ ok: true });
  });
});

describe('error mapping', () => {
  it('maps a connection failure to a NETWORK_ERROR', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation(networkError());

    await expect(apiClient.get('/thing')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });

  it('maps 403 to FORBIDDEN without clearing the session', async () => {
    localStorage.setItem('auth_token', 'tok');
    const { apiClient } = await loadClient();
    adapter.mockImplementation(httpError(403));

    await expect(apiClient.get('/thing')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });
    expect(localStorage.getItem('auth_token')).toBe('tok');
  });

  it('maps 404 to NOT_FOUND', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation(httpError(404));

    await expect(apiClient.get('/thing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it.each([500, 502, 503, 504])(
    'maps %i to SERVICE_UNAVAILABLE and keeps the real status',
    async (status) => {
      const { apiClient } = await loadClient();
      adapter.mockImplementation(httpError(status));

      await expect(apiClient.get('/thing')).rejects.toMatchObject({
        code: 'SERVICE_UNAVAILABLE',
        status,
      });
    },
  );

  it('falls back to API_ERROR for an unmapped status', async () => {
    const { apiClient } = await loadClient();
    adapter.mockImplementation(httpError(418, { message: 'I am a teapot' }));

    await expect(apiClient.get('/thing')).rejects.toMatchObject({
      code: 'API_ERROR',
      status: 418,
    });
  });

  it('surfaces the server message on an unmapped status', async () => {
    // Validation errors arrive this way; swallowing the message leaves the
    // form saying "an error occurred" next to the field that is wrong.
    const { apiClient } = await loadClient();
    adapter.mockImplementation(
      httpError(422, { message: 'email must be an email' }),
    );

    await expect(apiClient.get('/thing')).rejects.toThrow(/email must be an email/);
  });

  it('attaches the response body as details for the caller to inspect', async () => {
    const { apiClient } = await loadClient();
    const body = { message: 'bad', errors: { email: 'invalid' } };
    adapter.mockImplementation(httpError(422, body));

    await expect(apiClient.get('/thing')).rejects.toMatchObject({ details: body });
  });
});

describe('401 handling', () => {
  it('clears the stored token and redirects to /auth', async () => {
    localStorage.setItem('auth_token', 'tok');
    const { apiClient } = await loadClient();
    adapter.mockImplementation(httpError(401));

    await expect(apiClient.get('/thing')).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
      status: 401,
    });
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(hrefSetter).toHaveBeenCalledWith('/auth');
  });

  it('does not redirect while the auth flow has suppression on', async () => {
    // A wrong password returns 401. Redirecting on it would bounce the user
    // off the login page mid-login and lose the error message.
    localStorage.setItem('auth_token', 'tok');
    const { apiClient, setSuppressAuthRedirect } = await loadClient();
    setSuppressAuthRedirect(true);
    adapter.mockImplementation(httpError(401));

    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });
    expect(hrefSetter).not.toHaveBeenCalled();
  });

  it('keeps the token in place while suppression is on', async () => {
    localStorage.setItem('auth_token', 'tok');
    const { apiClient, setSuppressAuthRedirect } = await loadClient();
    setSuppressAuthRedirect(true);
    adapter.mockImplementation(httpError(401));

    await expect(apiClient.post('/auth/login', {})).rejects.toThrow();
    expect(localStorage.getItem('auth_token')).toBe('tok');
  });

  it('still rejects with SESSION_EXPIRED when suppressed', async () => {
    const { apiClient, setSuppressAuthRedirect } = await loadClient();
    setSuppressAuthRedirect(true);
    adapter.mockImplementation(httpError(401));

    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({
      status: 401,
    });
  });

  it('resumes redirecting once suppression is turned back off', async () => {
    const { apiClient, setSuppressAuthRedirect } = await loadClient();
    setSuppressAuthRedirect(true);
    setSuppressAuthRedirect(false);
    adapter.mockImplementation(httpError(401));

    await expect(apiClient.get('/thing')).rejects.toThrow();
    expect(hrefSetter).toHaveBeenCalledWith('/auth');
  });
});

describe('429 backoff', () => {
  /** Runs pending timers until the promise settles. */
  async function drain<T>(promise: Promise<T>): Promise<T> {
    // Both branches carry both fields. A discriminated union would read better,
    // but this project compiles with `strict: false`, and without
    // strictNullChecks TypeScript will not narrow on the `ok` literal — so the
    // error branch has to be reachable without narrowing.
    type Settled = { ok: boolean; v: T; e: unknown };
    const settled: Promise<Settled> = promise.then(
      (v): Settled => ({ ok: true, v, e: undefined }),
      (e): Settled => ({ ok: false, v: undefined as T, e }),
    );
    for (let i = 0; i < 12; i++) {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(10_000);
    }
    const outcome = await settled;
    if (outcome.ok) return outcome.v;
    throw outcome.e;
  }

  it('retries a rate-limited request and returns the eventual success', async () => {
    vi.useFakeTimers();
    const { apiClient } = await loadClient();
    adapter
      .mockImplementationOnce(httpError(429))
      .mockImplementation((c: AxiosRequestConfig) =>
        Promise.resolve(ok({ ok: true }, c)),
      );

    await expect(drain(apiClient.get('/thing'))).resolves.toEqual({ ok: true });
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('gives up after the retry budget and reports RATE_LIMIT', async () => {
    vi.useFakeTimers();
    const { apiClient } = await loadClient();
    adapter.mockImplementation(httpError(429));

    await expect(drain(apiClient.get('/thing'))).rejects.toMatchObject({
      code: 'RATE_LIMIT',
      status: 429,
    });
  });

  it('stops retrying rather than looping forever', async () => {
    vi.useFakeTimers();
    const { apiClient } = await loadClient();
    adapter.mockImplementation(httpError(429));

    await expect(drain(apiClient.get('/thing'))).rejects.toThrow();
    // One initial attempt plus VITE_MAX_RETRIES (pinned to 3 above).
    expect(adapter).toHaveBeenCalledTimes(4);
  });

  it('does not retry a 500 — a failed write must not be replayed blind', async () => {
    vi.useFakeTimers();
    const { apiClient } = await loadClient();
    adapter.mockImplementation(httpError(500));

    await expect(drain(apiClient.post('/payments/checkout', {}))).rejects.toThrow();
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('does not retry a 404', async () => {
    vi.useFakeTimers();
    const { apiClient } = await loadClient();
    adapter.mockImplementation(httpError(404));

    await expect(drain(apiClient.get('/thing'))).rejects.toThrow();
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
