import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '@/app/agent/auth/login/page';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signInWithEmail: vi.fn(),
  signInWithProvider: vi.fn(),
  resendConfirmationEmail: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => ({ get: (key: string) => new URLSearchParams(window.location.search).get(key) }),
}));

vi.mock('@/lib/auth', () => ({
  signInWithEmail: mocks.signInWithEmail,
  signInWithProvider: mocks.signInWithProvider,
  resendConfirmationEmail: mocks.resendConfirmationEmail,
  supabase: { auth: { signInWithIdToken: vi.fn() } },
}));

function setLoginUrl(redirect?: string) {
  const query = redirect == null ? '' : `?redirect=${encodeURIComponent(redirect)}`;
  window.history.replaceState({}, '', `/agent/auth/login${query}`);
}

function renderLogin(role: 'seeker' | 'employer' = 'seeker') {
  mocks.signInWithEmail.mockResolvedValue({ user: { user_metadata: { role } } });
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
  cleanup();
  delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  delete window.google;
  window.history.replaceState({}, '', '/');
  sessionStorage.clear();
});

describe('existing email login STAY redirect', () => {
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
