'use client';

// 단기임대 상세 CTA 블록. 데스크톱 사이드바 / 모바일 하단 고정 두 형태로 쓴다.
//
// ⚠️ 사업모델 제약: 예약·결제·숙박 개념을 노출하지 않는다. 임대차 계약 문의만 다룬다.
// ⚠️ 문의 기능 미구현 — 브라우저 alert 금지. 컴포넌트 내 state 로 인라인 안내만 띄운다.

import { useState } from 'react';
import { MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { formatWon } from '@/lib/stay/format';
import type { StayOwnerType } from '@/lib/stay/constants';

const PENDING_MESSAGE = '문의 기능은 준비 중입니다';

export default function StayInquiryBar({
  ownerType,
  phone,
  kakaoUrl,
  contactName,
  contactHours,
  depositWon,
  monthlyFeeWon,
  variant,
}: {
  ownerType: StayOwnerType | null;
  phone: string | null;
  kakaoUrl: string | null;
  contactName: string | null;
  contactHours: string | null;
  depositWon: number | null;
  monthlyFeeWon: number | null;
  variant: 'sidebar' | 'mobile';
}) {
  const [notice, setNotice] = useState<string | null>(null);

  const isOwner = ownerType === 'owner';
  const primaryLabel = isOwner ? '소유주에게 문의' : '입주 문의';

  const showNotice = () => {
    setNotice(PENDING_MESSAGE);
    window.setTimeout(() => setNotice(null), 2400);
  };

  const noticeBox = notice ? (
    <p
      role="status"
      className="rounded-lg bg-slate-900/90 px-3 py-2 text-center text-xs font-medium text-white"
    >
      {notice}
    </p>
  ) : null;

  // ── 모바일 하단 고정 ──
  if (variant === 'mobile') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:hidden">
        <div className="mx-auto max-w-lg space-y-2">
          {noticeBox}
          <div className="flex gap-2">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="flex min-h-[48px] min-w-[48px] flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                aria-label="전화 걸기"
              >
                <Phone className="h-5 w-5" />
              </a>
            ) : null}
            {kakaoUrl ? (
              <a
                href={kakaoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] min-w-[48px] flex-shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100"
                aria-label="카카오 채널로 문의"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={showNotice}
              className="min-h-[48px] flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-base font-extrabold text-white transition-opacity hover:opacity-90"
            >
              {primaryLabel}
            </button>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={showNotice}
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
            >
              <ShieldCheck className="h-4 w-4" />
              중개사와 안전 계약으로 진행
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 데스크톱 사이드바 ──
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">보증금</p>
      <p className="text-xl font-extrabold text-slate-900">{formatWon(depositWon)}</p>
      <p className="mt-2 text-xs font-medium text-slate-500">월 임대료</p>
      <p className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-extrabold text-transparent">
        {formatWon(monthlyFeeWon)}
      </p>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={showNotice}
          className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
        >
          {primaryLabel}
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={showNotice}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
          >
            <ShieldCheck className="h-4 w-4" />
            중개사와 안전 계약으로 진행
          </button>
        )}

        {phone ? (
          <a
            href={`tel:${phone}`}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Phone className="h-4 w-4" />
            {phone}
          </a>
        ) : null}

        {kakaoUrl ? (
          <a
            href={kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100"
          >
            <MessageCircle className="h-4 w-4" />
            카카오 채널 문의
          </a>
        ) : null}

        {noticeBox}
      </div>

      {(contactName || contactHours) && (
        <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs">
          {contactName && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">담당자</dt>
              <dd className="font-semibold text-slate-800">{contactName}</dd>
            </div>
          )}
          {contactHours && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">연락 가능 시간</dt>
              <dd className="font-semibold text-slate-800">{contactHours}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
