import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OwnerLeadForm from './OwnerLeadForm';

const auth = vi.hoisted(() => ({ userId: 'host-1', token: 'access-token' }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: auth.userId }, session: { access_token: auth.token }, isLoading: false }),
}));

vi.mock('@/components/shared/AddressSearch', () => ({
  default: ({ address, onAddressChange }: { address: string; onAddressChange: (value: string) => void }) => (
    <input aria-label="공간 주소 입력" value={address} onChange={(event) => onAddressChange(event.target.value)} />
  ),
}));

function completeRequiredFields(includeConsents = true) {
  fireEvent.change(screen.getByLabelText(/이름/), { target: { value: '홍길동' } });
  fireEvent.change(screen.getByLabelText(/연락처/), { target: { value: '01012345678' } });
  fireEvent.change(screen.getByLabelText('공간 주소 입력'), { target: { value: '서울시 중구 세종대로 1' } });
  fireEvent.change(screen.getByLabelText(/공간 유형/), { target: { value: 'officetel' } });
  if (includeConsents) {
    fireEvent.click(screen.getByLabelText(/개인정보 수집·이용 동의/));
    fireEvent.click(screen.getByLabelText(/초안 작성·사진 게시 위임 동의/));
  }
}

describe('OwnerLeadForm', () => {
  beforeEach(() => { vi.restoreAllMocks(); auth.userId = 'host-1'; auth.token = 'access-token'; });

  it('필수 동의가 없으면 서버에 전송하지 않는다', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<OwnerLeadForm sourceCode={null} />);
    completeRequiredFields(false);
    fireEvent.click(screen.getByRole('button', { name: '등록 도움 신청하기' }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText('개인정보 수집·이용 동의가 필요합니다.')).toBeInTheDocument();
    expect(screen.getByText('초안 작성·게시 위임 동의가 필요합니다.')).toBeInTheDocument();
  });

  it('저장된 id가 없는 응답은 성공으로 표시하지 않고 입력을 보존한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ lead: {} }), { status: 201 }));
    render(<OwnerLeadForm sourceCode="letter_1" />);
    completeRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: '등록 도움 신청하기' }));
    await screen.findByRole('alert');
    expect(screen.queryByText('등록 도움 신청이 저장되었습니다')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/이름/)).toHaveValue('홍길동');
    expect(screen.getByLabelText('공간 주소 입력')).toHaveValue('서울시 중구 세종대로 1');
  });

  it('서버가 저장한 id를 반환한 뒤에만 완료 화면을 표시한다', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ lead: { id: 42 } }), { status: 201 }));
    render(<OwnerLeadForm sourceCode={null} />);
    completeRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: '등록 도움 신청하기' }));
    await waitFor(() => expect(screen.getByText('등록 도움 신청이 저장되었습니다')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith('/api/stay-owner-leads', expect.objectContaining({ method: 'POST' }));
    const request = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual(expect.objectContaining({
      address: '서울시 중구 세종대로 1',
      privacy_agreed: true,
      publication_agreed: true,
      marketing_agreed: false,
    }));
    expect(screen.getByText(/신청 번호 #42/)).toBeInTheDocument();
  });

  it('로그인 사용자가 바뀌면 이전 사용자의 입력과 완료 상태를 제거한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ lead: { id: 42 } }), { status: 201 }));
    const view = render(<OwnerLeadForm sourceCode={null} />);
    completeRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: '등록 도움 신청하기' }));
    await screen.findByText('등록 도움 신청이 저장되었습니다');

    auth.userId = 'host-2'; auth.token = 'second-token';
    view.rerender(<OwnerLeadForm sourceCode={null} />);

    expect(screen.queryByText('등록 도움 신청이 저장되었습니다')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/이름/)).toHaveValue('');
  });
});
