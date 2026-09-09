'use client';

// 소유주(임대인) 매물 접수 폼.
//
// ⚠️ 이 폼은 우체국 무주소 광고우편 → QR → 랜딩 경로로 들어온 소유주가
//    "자발적으로" 개인정보를 제공하는 지점이다. 동의 기반 수집의 시작점이므로
//    필수동의(privacy_agreed)와 선택동의(marketing_agreed)를 절대 합치지 않는다.
//    (근거: 개인정보보호법 제22조, supabase/migrations/036_stay_owner_leads.sql)
//
// ⚠️ 요금 정책: 이 서비스는 월 임대료 + 보증금 상품만 취급한다.
//    일 단가·주 단가 입력란을 만들지 않고, '숙박/예약/체크인/1박' 어휘를 쓰지 않는다.
//
// v1 은 DB 저장을 하지 않는다. 제출 시 payload 를 console.log 하고 완료 화면으로 교체한다.

import { useMemo, useState } from 'react';
import {
  User,
  MapPin,
  Building2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import AddressSearch from '@/components/shared/AddressSearch';
import FormSection from '@/components/shared/FormSection';
import {
  STAY_TYPE_LABELS,
  STAY_ROOM_STRUCTURES,
  STAY_ROOM_STRUCTURE_LABELS,
  type StayType,
  type StayRoomStructure,
} from '@/lib/stay/constants';
import {
  SELECTABLE_STAY_TYPES,
  PHONE_PATTERN,
  formatPhone,
  manwonToWon,
  toNumberOrNull,
} from '@/lib/stay/form-utils';

/** 접수번호 (임시 난수 — DB 저장 전이므로 화면 안내용) */
function makeReceiptNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `OL-${ymd}-${rand}`;
}

interface OwnerLeadFormProps {
  /** 랜딩의 ?src= 캠페인 코드. 036.source_code 로 들어간다. */
  sourceCode: string | null;
}

const inputBase =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';
const labelBase = 'block text-sm font-medium text-slate-700 mb-1';

export default function OwnerLeadForm({ sourceCode }: OwnerLeadFormProps) {
  // 연락처
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // 위치
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  // 개요
  const [stayType, setStayType] = useState<Exclude<StayType, 'living_facility'> | ''>('');
  const [roomStructure, setRoomStructure] = useState<StayRoomStructure | ''>('');
  const [areaM2, setAreaM2] = useState('');
  const [floor, setFloor] = useState('');

  // 희망 조건 (만원 단위 입력)
  const [depositManwon, setDepositManwon] = useState('');
  const [monthlyManwon, setMonthlyManwon] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');

  const [memo, setMemo] = useState('');

  // 동의 — 필수/선택 완전 분리
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [receiptNo, setReceiptNo] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      privacyAgreed &&
      name.trim().length > 0 &&
      PHONE_PATTERN.test(phone) &&
      address.trim().length > 0 &&
      !submitting,
    [privacyAgreed, name, phone, address, submitting]
  );

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = '이름을 입력해 주세요.';
    else if (name.trim().length > 50) next.name = '이름은 50자 이내로 입력해 주세요.';

    if (!phone.trim()) next.phone = '휴대폰 번호를 입력해 주세요.';
    else if (!PHONE_PATTERN.test(phone)) next.phone = '010-0000-0000 형식으로 입력해 주세요.';

    if (!address.trim()) next.address = '주소를 검색해 주세요.';
    if (!privacyAgreed) next.privacyAgreed = '개인정보 수집·이용 동의가 필요합니다.';
    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const now = new Date().toISOString();

    const payload = {
      // ---- 036 stay_owner_leads 컬럼 ----
      name: name.trim(),
      phone: phone.trim(),
      address: [address.trim(), detailAddress.trim()].filter(Boolean).join(' '),
      building_name: null as string | null, // v1 미수집 (소유주 입력 부담 최소화)
      unit_count: null as number | null, // v1 미수집 (1호실 접수 기준)
      memo: memo.trim() || null,
      privacy_agreed: privacyAgreed,
      privacy_agreed_at: privacyAgreed ? now : null,
      marketing_agreed: marketingAgreed,
      marketing_agreed_at: marketingAgreed ? now : null,
      source_code: sourceCode,
      // status / converted_stay_id / ip_hash / created_at 은 서버·DB가 정한다.

      // ---- 036 에는 없는 매물 개요 (035 stays 로 전환할 때 쓰는 참고 정보) ----
      detail: {
        road_address: address.trim() || null,
        unit_detail: detailAddress.trim() || null,
        stay_type: stayType || null,
        room_structure: roomStructure || null,
        area_m2: toNumberOrNull(areaM2),
        floor: toNumberOrNull(floor),
        // 만원 단위 입력 → 원 단위 정수 (stays 도메인은 전부 원 단위)
        deposit: manwonToWon(depositManwon),
        monthly_fee: manwonToWon(monthlyManwon),
        available_from: availableFrom || null,
      },
    };

    // v1: API 호출 없음. 저장 연동 시 이 payload 를 그대로 서버로 보낸다.
    console.log('[stay/owner] lead payload', payload);

    setReceiptNo(makeReceiptNo());
    setSubmitting(false);
  }

  // ---------- 완료 화면 ----------
  if (receiptNo) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">접수되었습니다</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          담당 중개사가 1영업일 이내 연락드립니다.
          <br />
          접수 내용은 담당 중개사 배정 목적으로만 사용됩니다.
        </p>
        <div className="mt-5 inline-flex flex-col items-center rounded-xl bg-slate-50 px-6 py-3">
          <span className="text-xs text-slate-500">접수번호</span>
          <span className="mt-0.5 font-mono text-base font-semibold text-slate-900">{receiptNo}</span>
        </div>
      </div>
    );
  }

  // ---------- 입력 폼 ----------
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* 연락처 */}
      <FormSection icon={User} title="연락처">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="owner-name" className={labelBase}>
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="owner-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
              maxLength={50}
              className={inputBase}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="owner-phone" className={labelBase}>
              휴대폰 번호 <span className="text-red-500">*</span>
            </label>
            <input
              id="owner-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-0000-0000"
              autoComplete="tel"
              maxLength={13}
              className={inputBase}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
        </div>
      </FormSection>

      {/* 매물 위치 */}
      <FormSection icon={MapPin} title="매물 위치">
        <AddressSearch
          address={address}
          detailAddress={detailAddress}
          onAddressChange={setAddress}
          onDetailAddressChange={setDetailAddress}
        />
        {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
      </FormSection>

      {/* 매물 개요 */}
      <FormSection icon={Building2} title="매물 개요">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="owner-stay-type" className={labelBase}>
              유형
            </label>
            <select
              id="owner-stay-type"
              value={stayType}
              onChange={(e) =>
                setStayType(e.target.value as Exclude<StayType, 'living_facility'> | '')
              }
              className={inputBase}
            >
              <option value="">선택해 주세요</option>
              {SELECTABLE_STAY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {STAY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="owner-room-structure" className={labelBase}>
              방 구조
            </label>
            <select
              id="owner-room-structure"
              value={roomStructure}
              onChange={(e) => setRoomStructure(e.target.value as StayRoomStructure | '')}
              className={inputBase}
            >
              <option value="">선택해 주세요</option>
              {STAY_ROOM_STRUCTURES.map((s) => (
                <option key={s} value={s}>
                  {STAY_ROOM_STRUCTURE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="owner-area" className={labelBase}>
              전용면적 (㎡)
            </label>
            <input
              id="owner-area"
              type="text"
              inputMode="decimal"
              value={areaM2}
              onChange={(e) => setAreaM2(e.target.value)}
              placeholder="예: 33.5"
              className={inputBase}
            />
          </div>
          <div>
            <label htmlFor="owner-floor" className={labelBase}>
              층
            </label>
            <input
              id="owner-floor"
              type="text"
              inputMode="numeric"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="예: 5"
              className={inputBase}
            />
          </div>
        </div>
      </FormSection>

      {/* 희망 조건 */}
      <FormSection icon={Wallet} title="희망 조건">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="owner-deposit" className={labelBase}>
              희망 보증금 (만원)
            </label>
            <input
              id="owner-deposit"
              type="text"
              inputMode="numeric"
              value={depositManwon}
              onChange={(e) => setDepositManwon(e.target.value)}
              placeholder="예: 300"
              className={inputBase}
            />
          </div>
          <div>
            <label htmlFor="owner-monthly" className={labelBase}>
              희망 월 임대료 (만원)
            </label>
            <input
              id="owner-monthly"
              type="text"
              inputMode="numeric"
              value={monthlyManwon}
              onChange={(e) => setMonthlyManwon(e.target.value)}
              placeholder="예: 90"
              className={inputBase}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="owner-available-from" className={labelBase}>
              입주 가능일
            </label>
            <input
              id="owner-available-from"
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className={inputBase}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="owner-memo" className={labelBase}>
              메모 (선택)
            </label>
            <textarea
              id="owner-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="담당 중개사에게 전달할 내용이 있으면 적어주세요."
              className={`${inputBase} resize-y`}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          희망 조건은 참고용이며, 실제 계약 조건은 담당 중개사와 협의해 정합니다.
        </p>
      </FormSection>

      {/* 동의 — 필수/선택 분리 */}
      <FormSection icon={ShieldCheck} title="동의">
        {/* 필수 */}
        <div className="rounded-xl border border-slate-200 p-4">
          <label htmlFor="agree-privacy" className="flex items-start gap-3 cursor-pointer">
            <input
              id="agree-privacy"
              type="checkbox"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-800">
              <span className="font-semibold text-blue-700">[필수]</span> 개인정보 수집·이용에 동의합니다.
            </span>
          </label>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
              동의 내용 전문 보기
            </summary>
            <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              <p>
                <strong className="text-slate-800">① 수집·이용 목적</strong>
                <br />
                단기임대 매물 등록 접수 처리, 담당 공인중개사 배정 및 연결, 매물 정보 확인을 위한 연락,
                접수 이력 관리.
              </p>
              <p>
                <strong className="text-slate-800">② 수집 항목</strong>
                <br />
                (필수) 이름, 휴대폰 번호, 매물 주소 · (선택) 상세주소, 매물 유형·방 구조·전용면적·층,
                희망 보증금·월 임대료·입주 가능일, 메모, 유입 캠페인 코드.
              </p>
              <p>
                <strong className="text-slate-800">③ 보유·이용 기간</strong>
                <br />
                동의일로부터 매물 등록이 종료된 날로부터 1년까지 보유 후 파기합니다. 매물 등록으로
                이어지지 않은 접수는 접수일로부터 6개월 후 파기합니다. 관계 법령이 별도 보존 기간을
                정한 경우 그 기간을 따릅니다.
              </p>
              <p>
                <strong className="text-slate-800">④ 동의 거부 권리 및 거부 시 불이익</strong>
                <br />
                귀하는 이 동의를 거부할 권리가 있습니다. 다만 위 필수 항목에 동의하지 않으시면 매물
                접수와 담당 공인중개사 배정이 불가능합니다. 동의 후에도 언제든지 동의를 철회하고
                개인정보의 열람·정정·삭제를 요청하실 수 있습니다.
              </p>
            </div>
          </details>
          {errors.privacyAgreed && (
            <p className="mt-2 text-xs text-red-600">{errors.privacyAgreed}</p>
          )}
        </div>

        {/* 선택 — 필수와 절대 합치지 않는다 */}
        <div className="mt-3 rounded-xl border border-slate-200 p-4">
          <label htmlFor="agree-marketing" className="flex items-start gap-3 cursor-pointer">
            <input
              id="agree-marketing"
              type="checkbox"
              checked={marketingAgreed}
              onChange={(e) => setMarketingAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-800">
              <span className="font-semibold text-slate-500">[선택]</span> 마케팅 정보 수신에 동의합니다.
            </span>
          </label>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
              동의 내용 전문 보기
            </summary>
            <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              <p>
                <strong className="text-slate-800">① 수집·이용 목적</strong>
                <br />
                신규 서비스 및 임대 관련 정보, 이벤트·혜택 안내를 문자메시지·알림톡·이메일로 발송.
              </p>
              <p>
                <strong className="text-slate-800">② 수집 항목</strong>
                <br />
                이름, 휴대폰 번호.
              </p>
              <p>
                <strong className="text-slate-800">③ 보유·이용 기간</strong>
                <br />
                동의 철회 시까지 보유하며, 철회 즉시 발송을 중단하고 해당 목적의 정보를 파기합니다.
              </p>
              <p>
                <strong className="text-slate-800">④ 동의 거부 권리 및 거부 시 불이익</strong>
                <br />
                선택 항목이므로 동의하지 않으셔도 매물 접수와 담당 중개사 배정에 아무런 불이익이
                없습니다. 동의하지 않으실 경우 광고성 정보만 받지 못합니다.
              </p>
            </div>
          </details>
        </div>
      </FormSection>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            접수 중...
          </span>
        ) : (
          '무료로 매물 접수하기'
        )}
      </button>
      {!privacyAgreed && (
        <p className="text-center text-xs text-slate-500">
          개인정보 수집·이용(필수)에 동의하셔야 접수할 수 있습니다.
        </p>
      )}
    </form>
  );
}
