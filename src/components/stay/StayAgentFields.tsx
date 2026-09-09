'use client';

// 등록폼 "등록 주체 · 중개사 표기" 섹션.
//
// ⚠️ 법정표기(공인중개사법 제18조의2) 5항목은 여기서 입력하지 않는다.
//    서버(lib/stay/agent-snapshot.ts)가 계정(users/broker_offices)에서 채우고,
//    이 컴포넌트는 GET /api/stays/agent-snapshot 결과를 "이렇게 표기됩니다" 미리보기로만 보여준다.
//    항목 순서·라벨은 상세 페이지 StayAgentBlock 과 동일하게 유지한다.
// ⚠️ 전속 여부(is_exclusive)만 매물 단위 속성이라 클라이언트가 보낸다.
// ⚠️ 스냅샷은 계정 정보라 ownerType 이 바뀌어도 재요청하지 않는다.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Building2, MapPin, Phone, User, Star, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { STAY_OWNER_TYPES, STAY_OWNER_TYPE_LABELS, type StayOwnerType } from '@/lib/stay/constants';
import type { StayAgentSnapshot } from '@/types/stay';

export interface StayAgentFieldsProps {
  ownerType: StayOwnerType;
  onOwnerTypeChange: (v: StayOwnerType) => void;
  isExclusive: boolean;
  onIsExclusiveChange: (v: boolean) => void;
  /** 스냅샷 로드 결과를 부모에 알림 — 부모가 missing 이 있으면 제출을 막는 데 쓴다 */
  onSnapshotLoaded?: (snap: StayAgentSnapshot | null) => void;
  error?: string;
}

const SNAPSHOT_ENDPOINT = '/api/stays/agent-snapshot';
const COMPANY_EDIT_PATH = '/agent/mypage/company';

const OWNER_TYPE_DESCRIPTIONS: Record<StayOwnerType, string> = {
  agent: '중개사무소 명의로 등록합니다',
  owner: '임대인이 직접 등록합니다',
};

type SnapshotKey = StayAgentSnapshot['missing'][number];

/** StayAgentBlock 과 같은 순서·라벨·아이콘 */
const SNAPSHOT_ROWS: Array<{ key: SnapshotKey; label: string; icon: typeof Building2 }> = [
  { key: 'agent_office_name', label: '중개사무소', icon: Building2 },
  { key: 'agent_office_address', label: '소재지', icon: MapPin },
  { key: 'agent_representative', label: '대표자', icon: User },
  { key: 'agent_reg_no', label: '등록번호', icon: BadgeCheck },
  { key: 'agent_phone', label: '연락처', icon: Phone },
];

type SnapshotState =
  | { kind: 'idle' }
  | { kind: 'loaded'; snap: StayAgentSnapshot }
  | { kind: 'error'; message: string };

export default function StayAgentFields({
  ownerType,
  onOwnerTypeChange,
  isExclusive,
  onIsExclusiveChange,
  onSnapshotLoaded,
  error,
}: StayAgentFieldsProps) {
  const { session, isLoading: authLoading } = useAuth();
  const [snapshot, setSnapshot] = useState<SnapshotState>({ kind: 'idle' });

  // 콜백은 ref 로 들고 있어 effect 의존성에서 뺀다 (부모가 인라인 함수를 넘겨도 재요청되지 않게)
  const onSnapshotLoadedRef = useRef(onSnapshotLoaded);
  const onIsExclusiveChangeRef = useRef(onIsExclusiveChange);
  useEffect(() => {
    onSnapshotLoadedRef.current = onSnapshotLoaded;
    onIsExclusiveChangeRef.current = onIsExclusiveChange;
  });

  // 스냅샷은 세션당 한 번만 요청한다
  const fetchedRef = useRef(false);
  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    if (!accessToken || fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(SNAPSHOT_ENDPOINT, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        if (!res.ok) {
          const message =
            res.status === 401
              ? '로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.'
              : '중개사무소 정보를 불러오지 못했습니다.';
          setSnapshot({ kind: 'error', message });
          onSnapshotLoadedRef.current?.(null);
          return;
        }
        const snap = (await res.json()) as StayAgentSnapshot;
        setSnapshot({ kind: 'loaded', snap });
        onSnapshotLoadedRef.current?.(snap);
      } catch (e) {
        if (controller.signal.aborted) return;
        console.error('[stay/agent-fields] snapshot fetch failed', e);
        setSnapshot({ kind: 'error', message: '네트워크 오류로 중개사무소 정보를 불러오지 못했습니다.' });
        onSnapshotLoadedRef.current?.(null);
      }
    })();

    return () => {
      controller.abort();
      // 언마운트 후 재마운트(StrictMode 포함) 시 다시 요청할 수 있게 되돌린다
      fetchedRef.current = false;
    };
  }, [accessToken]);

  // 임대인 직접등록으로 바꾸면 전속 값이 남지 않게 한 번 내린다
  useEffect(() => {
    if (ownerType === 'owner') onIsExclusiveChangeRef.current(false);
  }, [ownerType]);

  const showSkeleton = snapshot.kind === 'idle' && (authLoading || !!accessToken);
  const noSession = snapshot.kind === 'idle' && !authLoading && !accessToken;

  return (
    <div className="space-y-4">
      {/* 등록 주체 선택 */}
      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-slate-700">
          등록 주체 <span className="text-red-500">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {STAY_OWNER_TYPES.map((t) => {
            const checked = ownerType === t;
            return (
              <label
                key={t}
                htmlFor={`stay-owner-type-${t}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  id={`stay-owner-type-${t}`}
                  type="radio"
                  name="stay-owner-type"
                  value={t}
                  checked={checked}
                  onChange={() => onOwnerTypeChange(t)}
                  className="mt-0.5 h-5 w-5 shrink-0 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{STAY_OWNER_TYPE_LABELS[t]}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{OWNER_TYPE_DESCRIPTIONS[t]}</span>
                </span>
              </label>
            );
          })}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </fieldset>

      {ownerType === 'owner' && (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          임대인 직접등록 매물은 중개사 표기 없이 게시되며, 문의는 등록자 연락처로 연결됩니다.
        </p>
      )}

      {ownerType === 'agent' && (
        <>
          {/* 전속 토글 */}
          <div className="rounded-xl border border-slate-200 p-4">
            <label htmlFor="stay-is-exclusive" className="flex cursor-pointer items-start gap-3">
              <input
                id="stay-is-exclusive"
                type="checkbox"
                checked={isExclusive}
                onChange={(e) => onIsExclusiveChange(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <Star className="h-4 w-4 text-blue-600" aria-hidden />
                  전속중개 매물
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                  소유주와 전속중개계약을 맺은 매물입니다. 상세 페이지에 ★ 전속 배지가 표시됩니다.
                </span>
              </span>
            </label>
          </div>

          {/* 법정표기 미리보기 (읽기 전용) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900">
              <Building2 className="h-4 w-4 text-blue-600" aria-hidden />
              담당 중개사 표기
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              공인중개사법 제18조의2에 따라 아래 정보가 매물에 표기됩니다. 내 정보에서 수정할 수 있습니다.
            </p>

            <div className="mt-4">
              {showSkeleton && <SnapshotSkeleton />}

              {noSession && (
                <p className="text-xs text-red-600">로그인 후 중개사무소 정보를 확인할 수 있습니다.</p>
              )}

              {snapshot.kind === 'error' && (
                <p className="flex items-start gap-1.5 text-xs text-red-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {snapshot.message}
                </p>
              )}

              {snapshot.kind === 'loaded' && <SnapshotPreview snap={snapshot.snap} />}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SnapshotSkeleton() {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="중개사무소 정보 불러오는 중">
      {SNAPSHOT_ROWS.map((row) => (
        <div key={row.key} className="flex items-center gap-2.5">
          <div className="h-4 w-4 shrink-0 rounded bg-slate-100" />
          <div className="h-3 w-[92px] shrink-0 rounded bg-slate-100" />
          <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function SnapshotPreview({ snap }: { snap: StayAgentSnapshot }) {
  const missingSet = new Set<SnapshotKey>(snap.missing);
  const hasMissing = snap.missing.length > 0;

  return (
    <div>
      {snap.source === 'none' && (
        <p className="mb-3 flex items-start gap-1.5 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          중개사무소 정보가 없습니다.
        </p>
      )}

      <dl className="space-y-2.5">
        {SNAPSHOT_ROWS.map(({ key, label, icon: Icon }) => {
          const value = snap[key];
          const isMissing = missingSet.has(key) || !value;
          return (
            <div key={key} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden />
              <dt className="w-[92px] flex-shrink-0 text-xs text-slate-500">{label}</dt>
              <dd className="min-w-0 flex-1 break-words text-sm">
                {isMissing ? (
                  <span className="text-xs font-medium text-red-600">등록 전에 채워야 합니다</span>
                ) : (
                  <span className="font-semibold text-slate-800">{value}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {(hasMissing || snap.source === 'none') && (
        <Link
          href={COMPANY_EDIT_PATH}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
        >
          내 정보 수정
        </Link>
      )}

      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
        공인중개사법 제18조의2에 따른 중개대상물 표시·광고 명시 사항입니다.
      </p>
    </div>
  );
}
