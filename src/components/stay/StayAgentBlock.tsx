'use client';

// 담당 중개사 블록 — 공인중개사법 제18조의2 법정 필수 표기.
//
// ⚠️ 아래 6개 항목은 하나라도 빠지면 안 된다:
//    ① 중개사무소 명칭 ② 소재지 ③ 연락처 ④ 등록번호 ⑤ 대표자 성명 (+ 전속 여부)
// ⚠️ 중개보조원 성명은 어떤 경우에도 표기하지 않는다. (관련 필드 자체가 없다)
//
// owner_type === 'owner' (임대인 직접등록, agent_* 전부 null) 이면 중개사 블록 대신
// 안내 문구 + "중개사와 안전하게 계약 진행하기" 보조 CTA 를 노출한다.
//
// 데이터는 038 stays 의 평면 컬럼(agent_office_name … is_exclusive)을 그대로 읽는다.

import Link from 'next/link';
import { BadgeCheck, Building2, MapPin, Phone, ShieldCheck, User } from 'lucide-react';
import { StayExclusiveBadge } from '@/components/stay/StayPrimitives';
import type { Stay } from '@/types/stay';



function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden />
      <dt className="w-[92px] flex-shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

export default function StayAgentBlock({ stay }: { stay: Stay }) {
  // ── 임대인 직접등록 ──
  if (stay.owner_type !== 'agent') {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-1.5 text-base font-extrabold text-slate-900">
          <User className="h-4 w-4 text-blue-600" />
          등록 주체
        </h2>
        <p className="text-sm font-semibold text-slate-800">임대인이 직접 등록한 매물입니다.</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          중개사무소를 통하지 않은 매물이라 계약서 작성과 권리관계 확인을 직접 하셔야 합니다.
          안전하게 진행하고 싶으시면 아래에서 중개사 연결을 요청하실 수 있습니다.
        </p>
        <Link
          href="/stay/agents"
          className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
        >
          <ShieldCheck className="h-4 w-4" />
          중개사와 안전하게 계약 진행하기
        </Link>
      </section>
    );
  }

  // ── 중개사 매물 (제18조의2 법정 표기) ──
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900">
          <Building2 className="h-4 w-4 text-blue-600" />
          담당 중개사
        </h2>
        {stay.is_exclusive && <StayExclusiveBadge />}
      </div>

      <dl className="space-y-2.5">
        <Row icon={Building2} label="중개사무소" value={stay.agent_office_name ?? ''} />
        <Row icon={MapPin} label="소재지" value={stay.agent_office_address ?? ''} />
        <Row icon={User} label="대표자" value={stay.agent_representative ?? ''} />
        <Row icon={BadgeCheck} label="등록번호" value={stay.agent_reg_no ?? ''} />
        <div className="flex items-start gap-2.5">
          <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden />
          <dt className="w-[92px] flex-shrink-0 text-xs text-slate-500">연락처</dt>
          <dd className="min-w-0 flex-1">
            <a href={`tel:${stay.agent_phone ?? ''}`} className="text-sm font-semibold text-blue-700 hover:underline">
              {stay.agent_phone}
            </a>
          </dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
        공인중개사법 제18조의2에 따른 중개대상물 표시·광고 명시 사항입니다.
      </p>
    </section>
  );
}
