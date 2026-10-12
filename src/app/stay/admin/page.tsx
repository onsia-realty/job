'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  XCircle,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import StayCreateForm from '@/components/stay/StayCreateForm';
import { useAuth } from '@/contexts/AuthContext';

interface LeadDraft {
  id: string;
  title: string;
  stay_type: string;
  address: string | null;
  detail_address: string | null;
  is_approved: boolean;
  is_active: boolean;
  updated_at: string;
}

interface StayLead {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  detail_address: string | null;
  building_name: string | null;
  memo: string | null;
  privacy_agreed: boolean;
  publication_agreed: boolean;
  marketing_agreed: boolean;
  source_code: string | null;
  status: string;
  converted_stay_id: string | null;
  applicant_user_id: string | null;
  detail: Record<string, unknown> | null;
  detail_version: number | null;
  created_at: string;
  draft: LeadDraft | null;
  confirmation_current: boolean;
}

interface AdminStay {
  id: string;
  title: string;
  stay_type: string;
  address: string | null;
  region: string | null;
  sigungu: string | null;
  owner_type: 'agent' | 'owner';
  status: string;
  is_active: boolean;
  is_approved: boolean;
  source: string | null;
  lead_id: number | null;
  host_confirmed_at?: string | null;
  host_confirmation_current?: boolean;
  created_at: string;
}

type PageState = 'loading' | 'ready' | 'denied' | 'error';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('ko-KR');
}

export default function StayAdminPage() {
  const { user, session, isLoading: authLoading } = useAuth();
  const token = session?.access_token ?? null;
  const [pageState, setPageState] = useState<PageState>('loading');
  const [loadError, setLoadError] = useState('');
  const [leads, setLeads] = useState<StayLead[]>([]);
  const [stays, setStays] = useState<AdminStay[]>([]);
  const [selectedLead, setSelectedLead] = useState<StayLead | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [notice, setNotice] = useState('');
  const loadRequestRef = useRef(0);
  const currentTokenRef = useRef<string | null>(token);
  currentTokenRef.current = token;

  const loadData = useCallback(async () => {
    if (!token || currentTokenRef.current !== token) return;
    const requestToken = token;
    const requestId = ++loadRequestRef.current;
    setPageState('loading');
    setLoadError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [leadResponse, stayResponse] = await Promise.all([
        fetch('/api/admin/stay-leads', { headers, cache: 'no-store' }),
        fetch('/api/admin/stays', { headers, cache: 'no-store' }),
      ]);

      if (leadResponse.status === 403 || stayResponse.status === 403) {
        if (requestId !== loadRequestRef.current || currentTokenRef.current !== requestToken) return;
        setLeads([]);
        setStays([]);
        setSelectedLead(null);
        setPageState('denied');
        return;
      }

      if (!leadResponse.ok || !stayResponse.ok) {
        const failed = !leadResponse.ok ? leadResponse : stayResponse;
        const body = (await failed.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || '관리자 접수 데이터를 불러오지 못했습니다.');
      }

      const [leadData, stayData] = (await Promise.all([
        leadResponse.json(),
        stayResponse.json(),
      ])) as [StayLead[], AdminStay[]];

      if (!Array.isArray(leadData) || !Array.isArray(stayData)) {
        throw new Error('관리자 API 응답 형식을 확인할 수 없습니다.');
      }
      if (requestId !== loadRequestRef.current || currentTokenRef.current !== requestToken) return;

      setLeads(leadData);
      setStays(stayData);
      setPageState('ready');
    } catch (error) {
      if (requestId !== loadRequestRef.current || currentTokenRef.current !== requestToken) return;
      setLeads([]);
      setStays([]);
      setSelectedLead(null);
      setLoadError(error instanceof Error ? error.message : '관리자 접수 데이터를 불러오지 못했습니다.');
      setPageState('error');
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      loadRequestRef.current += 1;
      setLeads([]);
      setStays([]);
      setSelectedLead(null);
      setNotice('');
      setReviewingId(null);
      setRowError(null);
      setPageState('ready');
      return;
    }
    setLeads([]);
    setStays([]);
    setSelectedLead(null);
    setNotice('');
    setReviewingId(null);
    setRowError(null);
    void loadData();
    return () => {
      loadRequestRef.current += 1;
    };
  }, [authLoading, user, token, loadData]);

  const pendingCount = useMemo(() => stays.filter((stay) => !stay.is_approved).length, [stays]);

  async function reviewStay(stay: AdminStay, approve: boolean) {
    if (!token) return;
    const actionToken = token;
    if (approve && stay.lead_id != null && stay.host_confirmation_current !== true) {
      setRowError({ id: stay.id, message: '소유주가 현재 초안을 확인하기 전에는 승인할 수 없습니다.' });
      return;
    }

    setReviewingId(stay.id);
    setRowError(null);
    try {
      const response = await fetch(`/api/admin/stays/${encodeURIComponent(stay.id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approve ? { is_approved: true, is_active: true } : { is_approved: false, is_active: false }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (currentTokenRef.current !== actionToken) return;
      if (!response.ok) {
        throw new Error(body?.error || (approve ? '매물 승인에 실패했습니다.' : '승인 거절에 실패했습니다.'));
      }
      setNotice(approve ? '매물을 승인했습니다.' : '매물 승인을 거절하고 노출을 중지했습니다.');
      await loadData();
    } catch (error) {
      if (currentTokenRef.current !== actionToken) return;
      setRowError({
        id: stay.id,
        message: error instanceof Error ? error.message : '승인 상태를 변경하지 못했습니다.',
      });
    } finally {
      if (currentTokenRef.current === actionToken) setReviewingId(null);
    }
  }

  if (authLoading) {
    return <CenteredState icon={<Loader2 className="h-7 w-7 animate-spin text-blue-600" />} title="로그인 정보를 확인하는 중입니다" />;
  }

  if (!user || !token) {
    return (
      <CenteredState
        icon={<LockKeyhole className="h-7 w-7 text-blue-600" />}
        title="관리자 로그인이 필요합니다"
        description="로그인 후 서버에서 관리자 권한을 확인합니다."
        action={<Link href="/agent/auth/login?redirect=%2Fstay%2Fadmin" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">로그인</Link>}
      />
    );
  }

  if (pageState === 'denied') {
    return <CenteredState icon={<ShieldAlert className="h-7 w-7 text-red-600" />} title="접근할 수 없습니다" description="관리자 권한이 있는 계정으로 로그인해 주세요." />;
  }

  if (pageState === 'error') {
    return (
      <CenteredState
        icon={<AlertCircle className="h-7 w-7 text-red-600" />}
        title="관리자 데이터를 불러오지 못했습니다"
        description={loadError}
        action={<button type="button" onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" />다시 시도</button>}
      />
    );
  }

  if (pageState === 'loading') {
    return <CenteredState icon={<Loader2 className="h-7 w-7 animate-spin text-blue-600" />} title="접수와 초안을 불러오는 중입니다" />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="landing" />
      <main className="mx-auto max-w-7xl px-4 py-8 pb-20">
        <Link href="/stay" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" /> 매물 목록으로
        </Link>
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">부인 STAY 운영</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">호스트 접수 · 매물 승인</h1>
            <p className="mt-2 text-sm text-slate-600">접수 내용을 확인해 초안을 작성하고, 소유주 확인이 끝난 초안만 명시적으로 승인합니다.</p>
          </div>
          <button type="button" onClick={() => { setNotice(''); void loadData(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-400">
            <RefreshCw className="h-4 w-4" /> 새로고침
          </button>
        </div>

        {notice && <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Summary label="전체 접수" value={leads.length} />
          <Summary label="승인 대기 매물" value={pendingCount} />
          <Summary label="전체 매물" value={stays.length} />
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ClipboardList className="h-5 w-5 text-blue-600" />호스트 접수</h2>
            <p className="mt-1 text-xs text-slate-500">이름·연락처·주소는 접수 처리 목적으로만 확인하세요.</p>
          </div>
          {leads.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">접수된 요청이 없습니다.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.map((lead) => {
                const consentReady = lead.privacy_agreed === true && lead.publication_agreed === true;
                const canDraft = consentReady && !!lead.applicant_user_id && !lead.converted_stay_id;
                return (
                  <article key={lead.id} className="grid gap-4 p-5 lg:grid-cols-[1.15fr_1.4fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-slate-900">{lead.name}</strong>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{lead.status}</span>
                        {lead.draft && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">초안 연결됨</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{lead.phone}</p>
                      <p className="mt-1 text-xs text-slate-500">접수 {formatDate(lead.created_at)}</p>
                    </div>
                    <div className="min-w-0 text-sm text-slate-700">
                      <p className="break-words">{lead.address || '주소 없음'}</p>
                      {lead.building_name && <p className="mt-1 text-xs text-slate-500">건물명 {lead.building_name}</p>}
                      {lead.memo && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-600">{lead.memo}</p>}
                      <p className={`mt-2 text-xs font-medium ${consentReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {consentReady ? '개인정보·매물 공개 동의 확인됨' : '필수 동의 미확인 · 초안 생성 불가'}
                      </p>
                      {!lead.applicant_user_id && <p className="mt-1 text-xs font-medium text-amber-700">신청자 계정 연결이 필요합니다.</p>}
                      {lead.draft && (
                        <p className={`mt-1 text-xs font-medium ${lead.confirmation_current ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {lead.confirmation_current ? '소유주가 현재 초안을 확인했습니다.' : '현재 초안에 대한 소유주 확인이 필요합니다.'}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!canDraft}
                      onClick={() => {
                        setSelectedLead(lead);
                        setNotice('');
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {lead.converted_stay_id ? '초안 생성 완료' : '이 접수로 초안 작성'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {selectedLead && (
          <section className="mt-8 rounded-2xl border border-blue-200 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">접수 #{selectedLead.id}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{selectedLead.name} 님의 위임 초안 작성</h2>
                <p className="mt-2 text-sm text-slate-600">연락처와 기본 주소만 채웠습니다. 매물 세부 정보와 공개할 사진은 운영자가 확인해 입력하세요.</p>
                {(selectedLead.detail_version ?? 0) < 2 && (
                  <p className="mt-2 text-sm font-medium text-amber-700">이전 형식 접수는 도로명주소와 상세주소를 안전하게 분리할 수 없습니다. 주소를 다시 검색해 확정하세요.</p>
                )}
              </div>
              <button type="button" onClick={() => setSelectedLead(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600">닫기</button>
            </div>
            <StayCreateForm
              key={selectedLead.id}
              delegatedLeadId={selectedLead.id}
              initialOwnerType="owner"
              leadPrefill={{
                contactName: selectedLead.name,
                phone: selectedLead.phone,
                address: (selectedLead.detail_version ?? 0) >= 2 ? selectedLead.address : '',
                detailAddress: (selectedLead.detail_version ?? 0) >= 2 ? selectedLead.detail_address : '',
                buildingName: selectedLead.building_name,
                privacyAgreed: selectedLead.privacy_agreed,
                publicationAgreed: selectedLead.publication_agreed,
              }}
              onDelegatedCreated={() => {
                if (!token || currentTokenRef.current !== token) return;
                setSelectedLead(null);
                setNotice('소유주 확인 대기 초안을 저장했습니다. 공개하려면 소유주 확인 후 아래에서 승인하세요.');
                void loadData();
              }}
            />
          </section>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><UserCheck className="h-5 w-5 text-blue-600" />매물 승인</h2>
          </div>
          {stays.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">등록된 매물이 없습니다.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stays.map((stay) => {
                const delegated = stay.lead_id != null;
                const confirmationReady = !delegated || stay.host_confirmation_current === true;
                const busy = reviewingId === stay.id;
                return (
                  <article key={stay.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="truncate text-slate-900">{stay.title}</strong>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stay.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{stay.is_approved ? '승인됨' : '승인 대기'}</span>
                        {delegated && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">위임 초안</span>}
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600">{[stay.sigungu, stay.address].filter(Boolean).join(' ') || '주소 없음'}</p>
                      <Link href={`/stay/${stay.id}`} className="mt-2 inline-block text-xs font-medium text-blue-700 hover:underline">매물 상세 확인</Link>
                    </div>
                    <div>
                      {delegated ? (
                        <div>
                          <p className={`text-sm font-medium ${confirmationReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {confirmationReady ? '소유주가 현재 초안을 확인함' : '소유주 확인 필요 · 승인할 수 없음'}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">수정이 필요하면 소유주가 내 매물 관리에서 수정한 뒤 최신 초안을 다시 확인해야 합니다.</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">등록자 직접 제출</p>
                      )}
                      {rowError?.id === stay.id && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{rowError.message}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!stay.is_approved && (
                        <button
                          type="button"
                          disabled={busy || !confirmationReady}
                          onClick={() => void reviewStay(stay, true)}
                          title={!confirmationReady ? '소유주가 현재 초안을 확인해야 승인할 수 있습니다.' : undefined}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} 승인·공개
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void reviewStay(stay, false)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> 승인 거절
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-slate-950">{value}</p></div>;
}

function CenteredState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="landing" />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">{icon}</div>
        <h1 className="mt-5 text-xl font-bold text-slate-950">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </main>
    </div>
  );
}
