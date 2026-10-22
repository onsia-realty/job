import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '@/app/agent/auth/login/page';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signInWithEmail: vi.fn(),
  signInWithProvider: vi.fn(),
  resendConfirmationEmail: vi.fn(),
  signInWithIdToken: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => ({ get: (key: string) => new URLSearchParams(window.location.search).get(key) }),
}));

vi.mock('@/lib/auth', () => ({
  signInWithEmail: mocks.signInWithEmail,
  signInWithProvider: mocks.signInWithProvider,
  resendConfirmationEmail: mocks.resendConfirmationEmail,
  supabase: { auth: { signInWithIdToken: mocks.signInWithIdToken } },
}));

function setLoginUrl(redirect?: string) {
  const query = redirect == null ? '' : `?redirect=${encodeURIComponent(redirect)}`;
  window.history.replaceState({}, '', `/agent/auth/login${query}`);
}

function renderLogin(role: 'seeker' | 'employer' = 'seeker') {
  mocks.signInWithEmail.mockResolvedValue({ user: { user_metadata: { role } }, session: { access_token: 'email-test' } });
  render(<LoginPage />);
  fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
    target: { value: 'member@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
    target: { value: 'safe-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ needsProfileCompletion: null, needsIdentityVerification: false }),
  }));
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-client';
  Object.defineProperty(window, 'google', {
    configurable: true,
    writable: true,
    value: {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn(),
          prompt: vi.fn(),
        },
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  delete window.google;
  window.history.replaceState({}, '', '/');
  sessionStorage.clear();
});

describe('Google profile completion redirect', () => {
  it('uses explicit server state and carries the internal STAY destination', async () => {
    setLoginUrl('/stay/requests');
    mocks.signInWithIdToken.mockResolvedValue({ data: { session: { access_token: 'test' } } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ needsProfileCompletion: true, needsIdentityVerification: false }),
    }));
    render(<LoginPage />);
    const initialize = vi.mocked(window.google!.accounts.id.initialize);
    const config = initialize.mock.calls[0][0];
    await config.callback({ credential: 'test-google' });
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(
      '/agent/auth/signup?role=seeker&social=true&redirect=%2Fstay%2Frequests'
    ));
  });
});

describe('existing email login STAY redirect', () => {
  it.each([
    { needsProfileCompletion: true, needsIdentityVerification: true },
    { needsProfileCompletion: null, needsIdentityVerification: true },
    { needsProfileCompletion: true, needsIdentityVerification: false },
  ])('honors server completion state %j and preserves STAY', async (state) => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => state } as Response);
    setLoginUrl('/stay/owner#assisted-registration');
    renderLogin('employer');
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(
      '/agent/auth/signup?role=employer&social=true&redirect=%2Fstay%2Fowner%23assisted-registration'
    ));
    expect(fetch).toHaveBeenCalledWith('/api/auth/ensure-user', {
      method: 'POST', headers: { Authorization: 'Bearer email-test' },
    });
  });
  it('does not forward unsafe redirects to completion', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ needsIdentityVerification: true }) } as Response);
    setLoginUrl('//evil.example/stay');
    renderLogin();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/agent/auth/signup?role=seeker&social=true'));
  });
  it('does not redirect when the profile check fails', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    renderLogin();
    await screen.findByText('사용자 정보 처리에 실패했습니다.');
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it('honors a same-origin STAY destination including its fragment', async () => {
    setLoginUrl('/stay/owner#assisted-registration');
    renderLogin();

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/stay/owner#assisted-registration');
    });
  });

  it.each([
    ['protocol-relative external destination', '//evil.example/stay', '/agent/jobs'],
    ['path traversal normalized outside STAY', '/stay/../../agent', '/agent/jobs'],
  ])('rejects %s', async (_label, redirect, fallback) => {
    setLoginUrl(redirect);
    renderLogin();

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(fallback);
    });
    expect(mocks.replace).not.toHaveBeenCalledWith(expect.stringContaining('evil'));
  });

  it('preserves the employer fallback when no STAY destination is requested', async () => {
    setLoginUrl();
    renderLogin('employer');

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/agent/employer');
    });
  });
});

describe('Kakao login STAY redirect handoff', () => {
  it('stores a validated STAY destination for the OAuth callback', async () => {
    setLoginUrl('/stay/owner#assisted-registration');
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: '카카오로 시작하기' }));

    await waitFor(() => expect(mocks.signInWithProvider).toHaveBeenCalledWith('kakao'));
    expect(sessionStorage.getItem('auth_stay_redirect')).toBe('/stay/owner#assisted-registration');
  });

  it('does not store an unsafe destination', async () => {
    setLoginUrl('//evil.example/stay');
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: '카카오로 시작하기' }));

    await waitFor(() => expect(mocks.signInWithProvider).toHaveBeenCalledWith('kakao'));
    expect(sessionStorage.getItem('auth_stay_redirect')).toBeNull();
  });
});
