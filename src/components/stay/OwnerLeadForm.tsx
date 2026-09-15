'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, LockKeyhole } from 'lucide-react';
import AddressSearch from '@/components/shared/AddressSearch';
import { useAuth } from '@/contexts/AuthContext';
import { STAY_TYPE_LABELS, type StayType } from '@/lib/stay/constants';
import { SELECTABLE_STAY_TYPES, PHONE_PATTERN, formatPhone, manwonToWon } from '@/lib/stay/form-utils';

interface OwnerLeadFormProps { sourceCode: string | null }
interface AuthenticatedOwnerLeadFormProps extends OwnerLeadFormProps { accessToken: string }

type FormErrors = Partial<Record<'name' | 'phone' | 'address' | 'stayType' | 'deposit' | 'weeklyFee' | 'privacy' | 'publication', string>>;

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';

function parseOptionalWon(value: string) {
  return value.trim() ? manwonToWon(value) : undefined;
}

export default function OwnerLeadForm({ sourceCode }: OwnerLeadFormProps) {
  const { user, session, isLoading: authLoading } = useAuth();
  const loginPath = `/agent/auth/login?redirect=${encodeURIComponent(`/stay/owner${sourceCode ? `?src=${sourceCode}` : ''}#assisted-registration`)}`;

  if (authLoading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center" aria-busy="true"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" /><p className="mt-3 text-sm text-slate-600">로그인 정보를 확인하는 중입니다…</p></div>;

  if (!user || !session) return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <LockKeyhole className="mx-auto h-9 w-9 text-blue-600" aria-hidden />
      <h3 className="mt-4 text-lg font-bold">로그인이 필요합니다</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">실제 호스트의 신청으로 연결하기 위해 로그인 후 접수할 수 있습니다.</p>
      <Link href={loginPath} className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">로그인하고 신청하기</Link>
    </div>
  );

  return <AuthenticatedOwnerLeadForm key={user.id} sourceCode={sourceCode} accessToken={session.access_token} />;
}

function AuthenticatedOwnerLeadForm({ sourceCode, accessToken }: AuthenticatedOwnerLeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [stayType, setStayType] = useState<Exclude<StayType, 'living_facility'> | ''>('');
  const [depositManwon, setDepositManwon] = useState('');
  const [weeklyManwon, setWeeklyManwon] = useState('');
  const [memo, setMemo] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [publicationAgreed, setPublicationAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

  const canSubmit = useMemo(() => !submitting, [submitting]);

  function validate() {
    const next: FormErrors = {};
    if (!name.trim()) next.name = '이름을 입력해 주세요.';
    else if (name.trim().length > 50) next.name = '이름은 50자 이내로 입력해 주세요.';
    if (!PHONE_PATTERN.test(phone)) next.phone = '010-0000-0000 형식으로 입력해 주세요.';
    if (!address.trim()) next.address = '주소를 검색해 주세요.';
    if (!stayType) next.stayType = '공간 유형을 선택해 주세요.';
    if (depositManwon.trim() && parseOptionalWon(depositManwon) === null) next.deposit = '0 이상의 숫자로 입력해 주세요.';
    if (weeklyManwon.trim() && parseOptionalWon(weeklyManwon) === null) next.weeklyFee = '0 이상의 숫자로 입력해 주세요.';
    if (!privacyAgreed) next.privacy = '개인정보 수집·이용 동의가 필요합니다.';
    if (!publicationAgreed) next.publication = '초안 작성·게시 위임 동의가 필요합니다.';
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setRequestError('');
    if (Object.keys(nextErrors).length) return;

    const desiredDepositWon = parseOptionalWon(depositManwon);
    const desiredWeeklyFeeWon = parseOptionalWon(weeklyManwon);
    setSubmitting(true);
    try {
      const response = await fetch('/api/stay-owner-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          address: address.trim(),
          ...(detailAddress.trim() && { detail_address: detailAddress.trim() }),
          stay_type: stayType,
          ...(desiredDepositWon !== undefined && { desired_deposit_won: desiredDepositWon }),
          ...(desiredWeeklyFeeWon !== undefined && { desired_weekly_fee_won: desiredWeeklyFeeWon }),
          ...(memo.trim() && { memo: memo.trim() }),
          ...(sourceCode && { source_code: sourceCode }),
          privacy_agreed: true,
          publication_agreed: true,
          marketing_agreed: marketingAgreed,
        }),
      });
      const result = await response.json().catch(() => null) as { lead?: { id?: number }; error?: string } | null;
      if (!response.ok || typeof result?.lead?.id !== 'number') throw new Error(result?.error || '신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setSavedId(result.lead.id);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : '신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (savedId !== null) return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
      <h3 className="mt-4 text-xl font-bold">등록 도움 신청이 저장되었습니다</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">신청 번호 #{savedId}로 저장했습니다. 운영자가 사진과 상세 조건을 확인하기 위해 연락드립니다.</p>
      <Link href="/stay/requests" className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">내 등록 신청 확인</Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="owner-name" className={labelClass}>이름 <span className="text-red-600">*</span></label><input id="owner-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={50} className={inputClass} />{errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}</div>
        <div><label htmlFor="owner-phone" className={labelClass}>연락처 <span className="text-red-600">*</span></label><input id="owner-phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} autoComplete="tel" placeholder="010-0000-0000" maxLength={13} className={inputClass} />{errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}</div>
      </div>

      <div><span className={labelClass}>공간 주소 <span className="text-red-600">*</span></span><AddressSearch address={address} detailAddress={detailAddress} onAddressChange={setAddress} onDetailAddressChange={setDetailAddress} />{errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}</div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div><label htmlFor="owner-stay-type" className={labelClass}>공간 유형 <span className="text-red-600">*</span></label><select id="owner-stay-type" value={stayType} onChange={(e) => setStayType(e.target.value as Exclude<StayType, 'living_facility'> | '')} className={inputClass}><option value="">선택해 주세요</option>{SELECTABLE_STAY_TYPES.map((type) => <option key={type} value={type}>{STAY_TYPE_LABELS[type]}</option>)}</select>{errors.stayType && <p className="mt-1 text-xs text-red-600">{errors.stayType}</p>}</div>
        <div><label htmlFor="owner-deposit" className={labelClass}>희망 보증금 (만원)</label><input id="owner-deposit" inputMode="numeric" value={depositManwon} onChange={(e) => setDepositManwon(e.target.value)} placeholder="상담 후 결정 가능" className={inputClass} />{errors.deposit && <p className="mt-1 text-xs text-red-600">{errors.deposit}</p>}</div>
        <div><label htmlFor="owner-weekly" className={labelClass}>희망 주 임대료 (만원)</label><input id="owner-weekly" inputMode="numeric" value={weeklyManwon} onChange={(e) => setWeeklyManwon(e.target.value)} placeholder="상담 후 결정 가능" className={inputClass} />{errors.weeklyFee && <p className="mt-1 text-xs text-red-600">{errors.weeklyFee}</p>}</div>
      </div>

      <div><label htmlFor="owner-memo" className={labelClass}>메모 (선택)</label><textarea id="owner-memo" value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={2000} rows={4} placeholder="운영자에게 미리 알릴 내용을 적어주세요." className={`${inputClass} resize-y`} /></div>

      <fieldset className="space-y-3"><legend className="mb-2 text-base font-bold">동의</legend>
        <div className="rounded-xl border border-slate-200 p-4"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} className="mt-0.5 h-5 w-5" /><span className="text-sm font-semibold"><span className="text-blue-700">[필수]</span> 개인정보 수집·이용 동의</span></label><div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600"><p>수집·이용 주체: 온시아 공인중개사(부인 STAY 운영자)</p><p>목적: 등록 상담, 운영자의 매물 초안 대리 작성 및 호스트 검토 진행</p><p>항목: 이름, 연락처, 공간 주소, 공간 유형과 희망 임대 조건, 선택 메모</p><p>열람: 등록 업무를 담당하는 운영자가 신청 내용을 열람합니다.</p><p>보유 기간: 신청 처리 종료일로부터 1년 후 파기합니다.</p><p>동의를 거부할 수 있으나, 거부하면 등록 도움을 신청할 수 없습니다.</p></div>{errors.privacy && <p className="mt-2 text-xs text-red-600">{errors.privacy}</p>}</div>
        <div className="rounded-xl border border-slate-200 p-4"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={publicationAgreed} onChange={(e) => setPublicationAgreed(e.target.checked)} className="mt-0.5 h-5 w-5" /><span className="text-sm font-semibold"><span className="text-blue-700">[필수]</span> 초안 작성·사진 게시 위임 동의</span></label><p className="mt-2 pl-8 text-xs leading-6 text-slate-600">운영자에게 매물 초안 작성과 제공한 사진의 게시를 요청·허락합니다. 공개 전 초안의 정보와 사진을 직접 확인한 뒤 게시를 승인합니다. 이 동의는 임대차 계약 체결 동의가 아닙니다.</p>{errors.publication && <p className="mt-2 text-xs text-red-600">{errors.publication}</p>}</div>
        <div className="rounded-xl border border-slate-200 p-4"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={marketingAgreed} onChange={(e) => setMarketingAgreed(e.target.checked)} className="mt-0.5 h-5 w-5" /><span className="text-sm font-semibold"><span className="text-slate-500">[선택]</span> 마케팅 정보 수신 동의</span></label><div className="mt-2 pl-8 text-xs leading-6 text-slate-600"><p>신규 서비스, 임대 관련 정보와 이벤트·혜택을 문자메시지, 알림톡 또는 이메일로 받을 수 있습니다. 동의 철회 시까지 이용하며 언제든 철회할 수 있습니다.</p><p className="mt-1">등록 상담 연락과 별개의 선택 항목이며, 동의하지 않아도 신청 처리에는 영향이 없습니다.</p></div></div>
      </fieldset>

      {requestError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{requestError}</p>}
      <button type="submit" disabled={!canSubmit} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />저장 중…</span> : '등록 도움 신청하기'}</button>
    </form>
  );
}
