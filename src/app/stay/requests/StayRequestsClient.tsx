'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock3, Loader2, LockKeyhole, RefreshCw } from 'lucide-react';
import { StayImage } from '@/components/stay/StayPrimitives';
import { useAuth } from '@/contexts/AuthContext';
import { STAY_DEAL_TYPE_LABELS, STAY_ROOM_STRUCTURE_LABELS, STAY_TYPE_LABELS } from '@/lib/stay/constants';
import { formatWon } from '@/lib/stay/format';
import type { OwnerLeadDetailV2, OwnerLeadStatus } from '@/lib/stay/owner-lead';
import type { Stay } from '@/types/stay';

type OwnerLeadDraftPreview = Partial<Stay> & {
  id: string;
  title: string;
  description: string | null;
  address: string | null;
  detail_address: string | null;
  building_name: string | null;
  deposit_won: number | null;
  weekly_fee_won: number | null;
  monthly_fee_won: number | null;
  maintenance_fee_won: number | null;
  daily_fee_won: number | null;
  thumbnail: string | null;
  images: string[];
  is_active: boolean;
  is_approved: boolean;
  updated_at: string;
}

interface OwnerLeadMine extends OwnerLeadDetailV2 {
  id: number;
  status: OwnerLeadStatus;
  name: string;
  phone: string;
  address: string;
  memo: string | null;
  created_at: string;
  draft: OwnerLeadDraftPreview | null;
  confirmation: { confirmed_at: string; stay_updated_at: string; is_current: boolean } | null;
  latest_review: { note: string | null; created_at: string } | null;
}

const STATUS_LABEL: Record<OwnerLeadStatus, string> = { new: '신청 접수', contacted: '사진·조건 확인 중', converted: '등록 초안 준비', dropped: '신청 종료' };

export default function StayRequestsClient() {
  const { user, session, isLoading: authLoading } = useAuth();
  const token = session?.access_token;
  const [leads, setLeads] = useState<OwnerLeadMine[]>([]);
  const [loadedToken, setLoadedToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const latestToken = useRef(token);
  latestToken.current = token;

  const load = useCallback(async () => {
    if (!token || latestToken.current !== token) return;
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/stay-owner-leads', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const result = await response.json().catch(() => null) as { leads?: OwnerLeadMine[]; error?: string } | null;
      if (!response.ok || !Array.isArray(result?.leads)) throw new Error(result?.error || '등록 신청을 불러오지 못했습니다.');
      if (latestToken.current === token) { setLeads(result.leads); setLoadedToken(token); }
    } catch (cause) { if (latestToken.current === token) setError(cause instanceof Error ? cause.message : '등록 신청을 불러오지 못했습니다.'); }
    finally { if (latestToken.current === token) setLoading(false); }
  }, [token]);

  useEffect(() => {
    setBusyId(null);
    if (!token) { setLeads([]); setLoadedToken(undefined); return; }
    void load();
  }, [token, load]);

  async function confirm(lead: OwnerLeadMine) {
    if (!token || !lead.draft || busyId !== null) return;
    const requestToken = token;
    setBusyId(lead.id); setError('');
    try {
      const response = await fetch('/api/stay-owner-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: lead.id, action: 'confirm', stay_updated_at: lead.draft.updated_at }),
      });
      const result = await response.json().catch(() => null) as { error?: string; code?: string } | null;
      if (latestToken.current !== requestToken) return;
      if (!response.ok) {
        if (response.status === 409 && result?.code === 'DRAFT_CHANGED') throw new Error('초안이 변경되었습니다. 최신 내용을 다시 확인한 뒤 승인해 주세요.');
        throw new Error(result?.error || '초안 확인을 저장하지 못했습니다.');
      }
      await load();
    } catch (cause) { if (latestToken.current === requestToken) setError(cause instanceof Error ? cause.message : '초안 확인을 저장하지 못했습니다.'); }
    finally { if (latestToken.current === requestToken) setBusyId(null); }
  }

  if (authLoading) return <main className="mx-auto max-w-5xl px-5 py-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" /><p className="mt-3 text-sm text-slate-600">로그인 정보를 확인하는 중입니다…</p></main>;
  if (!user || !session) return <main className="mx-auto max-w-3xl px-5 py-16 text-center"><LockKeyhole className="mx-auto h-10 w-10 text-blue-600" /><h1 className="mt-4 text-2xl font-bold">로그인이 필요합니다</h1><p className="mt-2 text-sm text-slate-600">본인이 신청한 등록 요청과 초안만 확인할 수 있습니다.</p><Link href={`/agent/auth/login?redirect=${encodeURIComponent('/stay/requests')}`} className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white">로그인하고 확인하기</Link></main>;

  const visibleLeads = loadedToken === token ? leads : [];

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/stay" className="text-sm font-semibold text-blue-700">← 부인 STAY</Link><h1 className="mt-3 text-3xl font-bold">내 등록 신청</h1><p className="mt-2 text-sm text-slate-600">운영자가 작성한 초안의 정보와 사진을 확인한 뒤 게시를 승인하세요.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />새로고침</button></div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading && visibleLeads.length === 0 && <p className="mt-8 text-sm text-slate-600">신청 내역을 불러오는 중입니다…</p>}
      {!loading && !error && visibleLeads.length === 0 && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="font-semibold">아직 등록 도움 신청이 없습니다.</p><Link href="/stay/owner#assisted-registration" className="mt-4 inline-flex text-sm font-semibold text-blue-700">등록 도움 신청하기</Link></div>}
      <div className="mt-8 space-y-6">{visibleLeads.map((lead) => <LeadCard key={lead.id} lead={lead} busy={busyId === lead.id} onConfirm={() => void confirm(lead)} />)}</div>
    </main>
  );
}

function LeadCard({ lead, busy, onConfirm }: { lead: OwnerLeadMine; busy: boolean; onConfirm: () => void }) {
  const draft = lead.draft;
  const confirmed = Boolean(lead.confirmation?.is_current);
  const published = Boolean(draft?.is_active && draft.is_approved);
  const photos = draft ? Array.from(new Set([draft.thumbnail, ...draft.images].filter((photo): photo is string => Boolean(photo)))) : [];
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-semibold text-blue-700">신청 #{lead.id} · {new Date(lead.created_at).toLocaleDateString('ko-KR')}</p><h2 className="mt-2 text-lg font-bold">{lead.address}</h2><p className="mt-1 text-sm text-slate-600">{lead.stay_type ? STAY_TYPE_LABELS[lead.stay_type] : '유형 상담 예정'} · 희망 주 임대료 {formatWon(lead.desired_weekly_fee_won)} · 희망 보증금 {formatWon(lead.desired_deposit_won)}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{STATUS_LABEL[lead.status]}</span></div>
    {lead.latest_review?.note && <div className="border-b border-slate-100 bg-blue-50 px-5 py-4 text-sm leading-6 text-slate-700 sm:px-6"><strong>운영자 검토 메모</strong><p className="mt-1 whitespace-pre-wrap">{lead.latest_review.note}</p></div>}
    {!draft ? <div className="flex items-start gap-3 p-5 text-sm leading-6 text-slate-600 sm:p-6"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><p>운영자가 사진과 상세 조건을 확인하고 있습니다. 초안이 준비되면 이 화면에서 전체 내용을 확인할 수 있습니다.</p></div> : <div className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-blue-700">게시 전 매물 초안</p><h3 className="mt-1 text-xl font-bold">{draft.title}</h3><p className="mt-2 text-sm text-slate-600">{[draft.address, draft.detail_address, draft.building_name].filter(Boolean).join(' · ')}</p></div><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${published ? 'bg-emerald-50 text-emerald-700' : confirmed ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{(published || confirmed) && <CheckCircle2 className="h-4 w-4" />}{published ? '게시 중' : confirmed ? '확인 완료 · 게시 준비 중' : '호스트 확인 대기'}</span></div>
      {draft.description && <div className="mt-5"><h4 className="text-sm font-bold">공개 설명</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{draft.description}</p></div>}
      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-5"><div><dt className="text-slate-500">보증금</dt><dd className="mt-1 font-semibold">{formatWon(draft.deposit_won)}</dd></div><div><dt className="text-slate-500">일 임대료</dt><dd className="mt-1 font-semibold">{formatWon(draft.daily_fee_won)}</dd></div><div><dt className="text-slate-500">주 임대료</dt><dd className="mt-1 font-semibold">{formatWon(draft.weekly_fee_won)}</dd></div><div><dt className="text-slate-500">월 임대료</dt><dd className="mt-1 font-semibold">{formatWon(draft.monthly_fee_won)}</dd></div><div><dt className="text-slate-500">관리비</dt><dd className="mt-1 font-semibold">{formatWon(draft.maintenance_fee_won)}</dd></div></dl>
      <DraftDetails draft={draft} />
      <div className="mt-5"><h4 className="text-sm font-bold">게시 예정 사진 {photos.length}장</h4>{photos.length ? <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{photos.map((image, index) => <div key={`${image}-${index}`} className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"><StayImage src={image} alt={`${draft.title} 사진 ${index + 1}`} sizes="(min-width: 640px) 33vw, 50vw" className="h-full w-full object-cover" /></div>)}</div> : <p className="mt-2 text-sm text-slate-500">등록된 사진이 없습니다.</p>}</div>
      <div className="mt-6 flex flex-wrap items-center gap-3"><Link href={`/stay/new?edit=${encodeURIComponent(draft.id)}`} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:border-blue-400">내용 수정하기</Link><p className="text-xs leading-5 text-slate-500">내용을 수정하면 변경된 초안을 다시 확인하고 게시 승인해야 합니다.</p></div>
      {!confirmed && <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-sm leading-6 text-slate-700">위 제목, 주소, 임대료와 사진을 확인했습니다. 승인하면 운영자가 이 버전의 초안을 게시 검토합니다.</p><button onClick={onConfirm} disabled={busy} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? '저장 중…' : '이 초안 확인 및 게시 승인'}</button></div>}
      {lead.confirmation && !lead.confirmation.is_current && <p className="mt-4 text-sm font-medium text-amber-700">확인 후 초안이 변경되었습니다. 최신 내용을 다시 확인해 주세요.</p>}
    </div>}
  </article>;
}

function DraftDetails({ draft }: { draft: OwnerLeadDraftPreview }) {
  const yesNo = (value: boolean | null | undefined) => value == null ? '-' : value ? '가능/포함' : '불가/별도';
  return <details className="mt-4 rounded-xl border border-slate-200 p-4" open>
    <summary className="cursor-pointer text-sm font-bold">초안 전체 조건 확인</summary>
    <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <div><dt className="text-slate-500">공간·거래 유형</dt><dd className="mt-1 font-medium">{draft.stay_type ? STAY_TYPE_LABELS[draft.stay_type] : '-'} · {draft.deal_type ? STAY_DEAL_TYPE_LABELS[draft.deal_type] : '-'}</dd></div>
      <div><dt className="text-slate-500">호실 정보</dt><dd className="mt-1 font-medium">{draft.floor ?? '-'}층 · 방 {draft.rooms ?? '-'} · 욕실 {draft.baths ?? '-'}</dd></div>
      <div><dt className="text-slate-500">면적</dt><dd className="mt-1 font-medium">전용 {draft.exclusive_area ?? '-'}㎡ · 공급 {draft.supply_area ?? '-'}㎡</dd></div>
      <div><dt className="text-slate-500">방 구조·최대 인원</dt><dd className="mt-1 font-medium">{draft.room_structure ? STAY_ROOM_STRUCTURE_LABELS[draft.room_structure] : '-'} · {draft.max_guests ?? '-'}명</dd></div>
      <div><dt className="text-slate-500">임대 기간</dt><dd className="mt-1 font-medium">최소 {draft.min_stay_days ?? '-'}일 · 최대 {draft.max_stay_days ?? '-'}일</dd></div>
      <div><dt className="text-slate-500">입주 가능 기간</dt><dd className="mt-1 font-medium">{draft.available_from ?? '-'} ~ {draft.available_to ?? '협의'}</dd></div>
      <div><dt className="text-slate-500">관리비·공과금</dt><dd className="mt-1 font-medium">관리비 {yesNo(draft.maintenance_included)} · 공과금 {yesNo(draft.utilities_included)}</dd></div>
      <div><dt className="text-slate-500">주차·반려동물·흡연</dt><dd className="mt-1 font-medium">주차 {yesNo(draft.parking_available)} · 반려동물 {yesNo(draft.pets_allowed)} · 흡연 {yesNo(draft.smoking_allowed)}</dd></div>
      <div><dt className="text-slate-500">건물 정보</dt><dd className="mt-1 font-medium">{draft.main_purps_cd_nm ?? '-'} · 총 {draft.total_floors ?? '-'}층 · 승강기 {draft.elevator_cnt ?? '-'}대 · 주차 {draft.parking_total ?? '-'}대</dd></div>
      <div className="sm:col-span-2 lg:col-span-3"><dt className="text-slate-500">편의시설</dt><dd className="mt-1 font-medium">{draft.amenities?.join(', ') || '-'}</dd></div>
      <div className="sm:col-span-2 lg:col-span-3"><dt className="text-slate-500">가전·비품</dt><dd className="mt-1 font-medium">{draft.appliances?.join(', ') || '-'}</dd></div>
      <div className="sm:col-span-2 lg:col-span-3"><dt className="text-slate-500">공개 연락처</dt><dd className="mt-1 font-medium">{[draft.contact_name, draft.phone, draft.kakao_url, draft.contact_hours].filter(Boolean).join(' · ') || '-'}</dd></div>
    </dl>
  </details>;
}
