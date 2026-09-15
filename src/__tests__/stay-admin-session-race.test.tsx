import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StayAdminPage from '@/app/stay/admin/page';

const mocks = vi.hoisted(() => ({
  auth: {
    current: {
      user: { id: 'admin-a' },
      session: { access_token: 'token-a' },
      isLoading: false,
    } as {
      user: { id: string } | null;
      session: { access_token: string } | null;
      isLoading: boolean;
    },
  },
  delegatedCreated: null as null | (() => void),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mocks.auth.current }));
vi.mock('@/components/shared/Header', () => ({ default: () => <div>헤더</div> }));
vi.mock('@/components/stay/StayCreateForm', () => ({
  default: (props: { onDelegatedCreated?: () => void }) => {
    mocks.delegatedCreated = props.onDelegatedCreated ?? null;
    return <div>위임 초안 폼</div>;
  },
}));

interface MockResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

function response(body: unknown, status = 200): MockResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function stay(id: string, title: string) {
  return {
    id,
    title,
    stay_type: 'officetel',
    address: '서울시 강남구',
    region: '서울시',
    sigungu: '강남구',
    owner_type: 'agent',
    status: 'available',
    is_active: true,
    is_approved: false,
    source: 'direct',
    lead_id: null,
    created_at: '2026-09-15T00:00:00Z',
  };
}

function lead() {
  return {
    id: 10,
    name: '신청자 A',
    phone: '010-1111-2222',
    address: '서울시 강남구 테헤란로 1',
    detail_address: '101호',
    building_name: null,
    memo: null,
    privacy_agreed: true,
    publication_agreed: true,
    marketing_agreed: false,
    source_code: null,
    status: 'new',
    converted_stay_id: null,
    applicant_user_id: 'owner-a',
    detail: null,
    detail_version: 2,
    created_at: '2026-09-15T00:00:00Z',
    draft: null,
    confirmation_current: false,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  mocks.auth.current = {
    user: { id: 'admin-a' },
    session: { access_token: 'token-a' },
    isLoading: false,
  };
  mocks.delegatedCreated = null;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('STAY admin session isolation', () => {
  it('ignores a review completion and old-token reload after the account changes', async () => {
    const review = deferred<MockResponse>();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const authorization = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (init?.method === 'PATCH') return review.promise;
      if (url === '/api/admin/stay-leads') return Promise.resolve(response([]));
      if (url === '/api/admin/stays') {
        return Promise.resolve(response([
          authorization === 'Bearer token-a' ? stay('stay-a', 'A 계정 매물') : stay('stay-b', 'B 계정 매물'),
        ]));
      }
      throw new Error(`unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const view = render(<StayAdminPage />);
    expect(await screen.findByText('A 계정 매물')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '승인·공개' }));

    mocks.auth.current = {
      user: { id: 'admin-b' },
      session: { access_token: 'token-b' },
      isLoading: false,
    };
    view.rerender(<StayAdminPage />);
    expect(await screen.findByText('B 계정 매물')).toBeInTheDocument();

    await act(async () => {
      review.resolve(response({ success: true, stay: { id: 'stay-a' } }));
      await review.promise;
    });

    await waitFor(() => expect(screen.queryByText('A 계정 매물')).not.toBeInTheDocument());
    expect(screen.queryByText('매물을 승인했습니다.')).not.toBeInTheDocument();
    const oldTokenGets = fetchMock.mock.calls.filter(([, init]) =>
      (init?.headers as Record<string, string> | undefined)?.Authorization === 'Bearer token-a'
      && init?.method !== 'PATCH'
    );
    expect(oldTokenGets).toHaveLength(2);
  });

  it('ignores an old delegated-create callback after the account changes', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const authorization = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (url === '/api/admin/stay-leads') {
        return Promise.resolve(response(authorization === 'Bearer token-a' ? [lead()] : []));
      }
      if (url === '/api/admin/stays') return Promise.resolve(response([]));
      throw new Error(`unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const view = render(<StayAdminPage />);
    fireEvent.click(await screen.findByRole('button', { name: '이 접수로 초안 작성' }));
    expect(await screen.findByText('위임 초안 폼')).toBeInTheDocument();
    const oldCallback = mocks.delegatedCreated;
    expect(oldCallback).toBeTypeOf('function');

    mocks.auth.current = {
      user: { id: 'admin-b' },
      session: { access_token: 'token-b' },
      isLoading: false,
    };
    view.rerender(<StayAdminPage />);
    await waitFor(() => expect(screen.queryByText('위임 초안 폼')).not.toBeInTheDocument());

    act(() => oldCallback?.());

    expect(screen.queryByText(/소유주 확인 대기 초안을 저장했습니다/)).not.toBeInTheDocument();
    const oldTokenGets = fetchMock.mock.calls.filter(([, init]) =>
      (init?.headers as Record<string, string> | undefined)?.Authorization === 'Bearer token-a'
    );
    expect(oldTokenGets).toHaveLength(2);
  });
});
