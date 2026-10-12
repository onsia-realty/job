import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import StayCreateForm from '@/components/stay/StayCreateForm';

const { auth } = vi.hoisted(() => ({
  auth: {
    user: { id: 'admin-1', app_metadata: {}, user_metadata: {} },
    session: { access_token: 'admin-token' },
    isLoading: false,
  },
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/components/shared/AddressSearch', () => ({ default: () => <div>주소 검색</div> }));
vi.mock('@/components/stay/StayImageUploader', () => ({ default: () => <div>공개 사진 등록</div> }));
vi.mock('@/components/stay/StayAgentFields', () => ({ default: () => <div>중개사 역할 선택</div> }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('delegated owner draft form', () => {
  it('locks the owner role and posts a lead-scoped draft to the admin endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        stay: { id: 'draft-1', owner_type: 'owner', is_approved: false },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <StayCreateForm
        delegatedLeadId={42}
        leadPrefill={{
          contactName: '신청자',
          phone: '010-1234-5678',
          address: '서울시 강남구 테헤란로 1',
          privacyAgreed: true,
          publicationAgreed: true,
        }}
      />
    );

    expect(screen.getByText('임대인 직접 등록 · 위임 초안')).toBeInTheDocument();
    expect(screen.queryByText('중개사 역할 선택')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('신청자')).toBeInTheDocument();
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/매물 유형/), { target: { value: 'officetel' } });
    fireEvent.change(screen.getByLabelText(/^제목/), { target: { value: '운영 확인 초안' } });
    fireEvent.change(screen.getByLabelText(/주 임대료 · 7일/), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/월 관리비/), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: '소유주 확인 대기 초안 저장하기' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [endpoint, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(request.body as string) as Record<string, unknown>;
    const stay = body.stay as Record<string, unknown>;

    expect(endpoint).toBe('/api/admin/stay-leads');
    expect(request.method).toBe('POST');
    expect(body.lead_id).toBe(42);
    expect(stay.owner_type).toBe('owner');
    expect(stay).not.toHaveProperty('user_id');
    expect(stay).not.toHaveProperty('is_approved');
  });

  it('does not mount the public image uploader without publication consent', () => {
    render(
      <StayCreateForm
        delegatedLeadId={43}
        leadPrefill={{ privacyAgreed: true, publicationAgreed: false }}
      />
    );
    expect(screen.queryByText('공개 사진 등록')).not.toBeInTheDocument();
    expect(screen.getByText(/매물 공개 동의가 확인되지 않아/)).toBeInTheDocument();
  });
});
