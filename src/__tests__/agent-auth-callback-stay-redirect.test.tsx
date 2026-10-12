import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import AuthCallbackPage from '@/app/agent/auth/callback/page';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  getParam: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
  useSearchParams: () => ({ get: mocks.getParam }),
}));

vi.mock('@/lib/auth', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getSession: mocks.getSession,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  localStorage.setItem('social_login_role', 'seeker');
  mocks.getParam.mockImplementation((key: string) => key === 'code' ? 'oauth-code' : null);
  mocks.exchangeCodeForSession.mockResolvedValue({
    data: {
      session: {
        access_token: 'test-token',
        user: { user_metadata: { role: 'seeker' } },
      },
    },
    error: null,
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ exists: true }),
  }));
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('OAuth callback STAY redirect', () => {
  it('returns an existing user to the stored STAY route and consumes it', async () => {
    sessionStorage.setItem('auth_stay_redirect', '/stay/owner#assisted-registration');
    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/stay/owner#assisted-registration');
    });
    expect(sessionStorage.getItem('auth_stay_redirect')).toBeNull();
  });

  it('rejects a stored external route and uses the account role fallback', async () => {
    sessionStorage.setItem('auth_stay_redirect', '//evil.example/stay');
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { user_metadata: { role: 'employer' } },
        },
      },
      error: null,
    });
    render(<AuthCallbackPage />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/agent/employer'));
    expect(mocks.replace).not.toHaveBeenCalledWith(expect.stringContaining('evil'));
  });

  it('passes a validated STAY route to a new social profile and consumes storage', async () => {
    sessionStorage.setItem('auth_stay_redirect', '/stay/requests');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ created: true }),
    } as Response);
    render(<AuthCallbackPage />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(
      '/agent/auth/signup?role=seeker&social=true&redirect=%2Fstay%2Frequests'
    ));
    expect(sessionStorage.getItem('auth_stay_redirect')).toBeNull();
  });
});
