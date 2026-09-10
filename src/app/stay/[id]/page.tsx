import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Building2,
  CalendarDays,
  Check,
  Eye,
  Home,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import StayGallery from '@/components/stay/StayGallery';
import StayAgentBlock from '@/components/stay/StayAgentBlock';
import StayInquiryBar from '@/components/stay/StayInquiryBar';
import StayLocationMap from '@/components/stay/StayLocationMap.client';
import StayNearbyPrice, { StayNearbyPriceSkeleton } from '@/components/stay/StayNearbyPrice';
import { StayExclusiveBadge, StayStatusBadge } from '@/components/stay/StayPrimitives';
import { formatArea, formatMinStay, formatWon } from '@/lib/stay/format';
import {
  STAY_AMENITY_LABELS,
  STAY_APPLIANCE_LABELS,
  STAY_DEAL_TYPE_LABELS,
  STAY_ROOM_STRUCTURE_LABELS,
  STAY_TYPE_LABELS,
  type StayAmenity,
  type StayAppliance,
} from '@/lib/stay/constants';
import type { Stay, StayListResponse } from '@/types/stay';

export const dynamic = 'force-dynamic';

// ---------- 데이터 로드 ----------
// GET /api/stays/[id] 는 공개(is_active && is_approved) 행만 익명에게 돌려주고,
// 없는 id 와 비공개 행을 똑같이 404 로 응답한다(존재 여부 누출 방지).
// 그래서 이 페이지는 404 → notFound(), 그 외 실패 → 안내 패널로만 나누면 된다.

/** 서버 컴포넌트에서 자기 자신의 API 를 부르려면 절대 URL 이 필요하다. */
async function apiOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.booin.co.kr').trim();
}

type StayDetailResult =
  | { status: 'ok'; stay: Stay }
  | { status: 'notfound' }
  | { status: 'error' };

async function fetchStay(id: string): Promise<StayDetailResult> {
  try {
    const res = await fetch(`${await apiOrigin()}/api/stays/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return { status: 'notfound' };
    if (!res.ok) return { status: 'error' };
    return { status: 'ok', stay: (await res.json()) as Stay };
  } catch {
    return { status: 'error' };
  }
}

/** 같은 시군구의 다른 공개 매물 (최대 3건). 실패하면 조용히 빈 배열. */
async function fetchNearby(sigungu: string, excludeId: string): Promise<Stay[]> {
  const sp = new URLSearchParams({ sigungu, sort: 'latest', limit: '4' });
  try {
    const res = await fetch(`${await apiOrigin()}/api/stays?${sp.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as StayListResponse;
    const items = Array.isArray(json.items) ? json.items : [];
    return items.filter((item) => item.id !== excludeId).slice(0, 3);
  } catch {
    return [];
  }
}

// ⚠️ 사업모델/법적 제약: 예약·결제·숙박·체크인 개념을 화면에 노출하지 않는다.
//    일단가(daily_fee_won)·주단가(weekly_fee_won) 는 전 건 null 이며 렌더 대상이 아니다.

// ---------- 포맷 헬퍼 (이 페이지 전용) ----------

/** '20190412' → '2019.04' */
function formatUseApprovalMonth(yyyymmdd: string | null): string {
  if (!yyyymmdd || yyyymmdd.length < 6) return '-';
  return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}`;
}

/** '2026-09-15' → '2026.09.15' */
function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return iso.slice(0, 10).replace(/-/g, '.');
}

/** ISO timestamp → '2026.08.04' */
function formatRegisteredAt(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.');
}

function formatMaxStay(days: number | null): string {
  if (days == null) return '협의';
  const months = Math.round(days / 30);
  return months >= 12 ? `${Math.round(months / 12)}년까지` : `${months}개월까지`;
}

// ---------- 표시용 소품 ----------

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Home;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-1.5 text-base font-extrabold text-slate-900">
        <Icon className="h-4 w-4 text-blue-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-0.5 text-[11px] text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function YesNo({ label, allowed }: { label: string; allowed: boolean | null }) {
  const ok = allowed === true;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        ok
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
          : 'bg-slate-100 text-slate-500 ring-slate-400/20'
      }`}
    >
      {ok ? <Check className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
      {label} {ok ? '가능' : '불가'}
    </span>
  );
}

// ---------- 이 지역 다른 매물 ----------

/** 로딩 자리 — 카드 높이를 미리 잡아 본문이 튀지 않게 한다. */
function NearbySkeleton() {
  return (
    <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
  );
}

async function NearbyStays({ sigungu, excludeId }: { sigungu: string; excludeId: string }) {
  const nearby = await fetchNearby(sigungu, excludeId);
  if (nearby.length === 0) return null;

  return (
    <Section icon={Building2} title={`${sigungu} 다른 매물`}>
      <ul className="divide-y divide-slate-100">
        {nearby.map((item) => (
          <li key={item.id}>
            <Link
              href={`/stay/${item.id}`}
              className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <StayStatusBadge status={item.status} />
                  <span className="text-[11px] text-slate-400">
                    {STAY_TYPE_LABELS[item.stay_type]}
                  </span>
                </div>
                <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {formatArea(item.exclusive_area)}
                  {item.floor != null ? ` · ${item.floor}층` : ''}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-slate-400">보증금 {formatWon(item.deposit_won)}</p>
                <p className="text-sm font-extrabold text-blue-700">
                  월 {formatWon(item.monthly_fee_won)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------- 페이지 ----------

export default async function StayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // /stay 목록과 동일한 플래그 가드
  const enabled = process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';
  if (!enabled) {
    redirect('/');
  }

  const { id } = await params;
  const result = await fetchStay(id);

  // 없는 매물 · 비공개 매물 → 동일하게 404
  if (result.status === 'notfound') {
    notFound();
  }

  // API 500/네트워크 실패 — 빈 화면 대신 재시도 안내를 준다.
  if (result.status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header variant="landing" />
        <main className="mx-auto max-w-[1200px] px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="mb-2 text-base font-bold text-slate-700">
            매물을 불러오지 못했습니다
          </h1>
          <p className="mb-4 text-sm text-slate-400">
            일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
          </p>
          <Link href="/stay" className="text-sm font-semibold text-blue-600 hover:underline">
            매물 목록으로
          </Link>
        </main>
      </div>
    );
  }

  const stay = result.stay;

  // 'selfcheckin' 의 라벨은 '셀프 체크인' 이다. 숙박업 어휘라 임대차 화면에 노출하지 않는다.
  // (현재 목데이터엔 없지만 라벨 상수는 다른 도메인과 공유되므로 방어적으로 제외한다)
  const amenityCodes = stay.amenities.filter((code) => code !== 'selfcheckin');

  // 주변 시세 블록에 넘길 절대 origin.
  // StayNearbyPrice 안에서 headers() 를 부르면 그 컴포넌트가 동적 API 에 묶여
  // Suspense 경계 밖의 셸까지 지연될 수 있다. 페이지 본문은 이미 fetchStay 로
  // headers() 를 읽은 뒤라 여기서 한 번 더 뽑아도 추가 비용이 없다.
  const origin = await apiOrigin();

  const roomStructureLabel = stay.room_structure
    ? STAY_ROOM_STRUCTURE_LABELS[stay.room_structure]
    : '-';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-40 lg:pb-12">
      <Header variant="landing" />

      <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6 lg:px-8">
        <Link
          href="/stay"
          className="inline-flex min-h-[44px] items-center gap-1.5 -ml-2 px-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          매물 목록으로
        </Link>
      </div>

      <main className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ── 본문 ── */}
          <div className="min-w-0 flex-1 space-y-4">
            <StayGallery images={stay.images} title={stay.title} />

            {/* 헤더 블록 */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                <StayStatusBadge status={stay.status} />
                {stay.is_exclusive && <StayExclusiveBadge />}
                <Chip>{STAY_DEAL_TYPE_LABELS[stay.deal_type]}</Chip>
                <Chip>{STAY_TYPE_LABELS[stay.stay_type]}</Chip>
              </div>

              <h1 className="text-xl font-extrabold leading-tight text-slate-900 sm:text-2xl">
                {stay.title}
              </h1>

              <div className="mt-2.5 space-y-1 text-sm text-slate-600">
                <p className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span>
                    {stay.address ?? '-'}
                    {stay.detail_address ? ` ${stay.detail_address}` : ''}
                  </span>
                </p>
                {stay.jibun_address && (
                  <p className="pl-[22px] text-xs text-slate-400">지번 {stay.jibun_address}</p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  조회 {stay.views.toLocaleString('ko-KR')}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  등록 {formatRegisteredAt(stay.created_at)}
                </span>
              </div>
            </section>

            {/* 가격 카드 — 화면의 주인공 */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">보증금</p>
                  <p className="mt-0.5 text-2xl font-extrabold text-slate-900">
                    {formatWon(stay.deposit_won)}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
                  <p className="text-xs font-medium text-blue-700">월 임대료</p>
                  <p className="mt-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                    {formatWon(stay.monthly_fee_won)}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                <Field
                  label="관리비"
                  value={
                    stay.maintenance_included
                      ? '월 임대료에 포함'
                      : `${formatWon(stay.maintenance_fee_won)} (별도)`
                  }
                />
                <Field label="공과금" value={stay.utilities_included ? '포함' : '별도 부담'} />
                <Field label="임대 구분" value={STAY_DEAL_TYPE_LABELS[stay.deal_type]} />
              </dl>
            </section>

            {/* 계약 조건 */}
            <Section icon={CalendarDays} title="계약 조건">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                <Field label="최소 계약기간" value={formatMinStay(stay.min_stay_days)} />
                <Field label="최장 계약기간" value={formatMaxStay(stay.max_stay_days)} />
                <Field label="입주 가능일" value={formatDate(stay.available_from)} />
                <Field
                  label="임대 종료 예정일"
                  value={stay.available_to ? formatDate(stay.available_to) : '협의'}
                />
              </dl>
            </Section>

            {/* 호실 정보 */}
            <Section icon={Ruler} title="호실 정보">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Field label="전용면적" value={formatArea(stay.exclusive_area)} />
                <Field label="공급면적" value={formatArea(stay.supply_area)} />
                <Field
                  label="층"
                  value={
                    stay.floor != null
                      ? `${stay.floor}층 / 총 ${stay.total_floors ?? '-'}층`
                      : '-'
                  }
                />
                <Field label="방 구조" value={roomStructureLabel} />
                <Field label="방 수" value={stay.rooms != null ? `${stay.rooms}개` : '-'} />
                <Field label="욕실 수" value={stay.baths != null ? `${stay.baths}개` : '-'} />
              </dl>
            </Section>

            {/* 건물 정보 */}
            <Section icon={Building2} title="건물 정보">
              {stay.building_verified === true && (
                <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  건축물대장 확인
                </p>
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Field label="건물명" value={stay.building_name ?? '-'} />
                <Field label="주용도" value={stay.main_purps_cd_nm ?? '-'} />
                <Field label="사용승인" value={formatUseApprovalMonth(stay.use_apr_day)} />
                <Field
                  label="엘리베이터"
                  value={stay.elevator_cnt != null ? `${stay.elevator_cnt}대` : '-'}
                />
                <Field
                  label="총 주차대수"
                  value={
                    stay.parking_total != null
                      ? `${stay.parking_total.toLocaleString('ko-KR')}대`
                      : '-'
                  }
                />
                <Field label="총 층수" value={stay.total_floors != null ? `${stay.total_floors}층` : '-'} />
              </dl>
            </Section>

            {/* 옵션 */}
            <Section icon={Sparkles} title="옵션 · 이용 조건">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  <YesNo label="주차" allowed={stay.parking_available} />
                  <YesNo label="반려동물" allowed={stay.pets_allowed} />
                  <YesNo label="흡연" allowed={stay.smoking_allowed} />
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    시설
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {amenityCodes.length > 0 ? (
                      amenityCodes.map((code) => (
                        <Chip key={code}>
                          {STAY_AMENITY_LABELS[code as StayAmenity] ?? code}
                        </Chip>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">등록된 시설 정보가 없습니다.</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    가전 · 비품
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {stay.appliances.length > 0 ? (
                      stay.appliances.map((code) => (
                        <Chip key={code}>
                          {STAY_APPLIANCE_LABELS[code as StayAppliance] ?? code}
                        </Chip>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">등록된 가전 정보가 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>
            </Section>

            {/* 설명 */}
            {stay.description && (
              <Section icon={Home} title="매물 설명">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {stay.description}
                </p>
              </Section>
            )}

            {/* 위치 */}
            <Section icon={MapPin} title="위치">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-800">{stay.address ?? '-'}</p>
                {stay.jibun_address && (
                  <p className="text-xs text-slate-400">지번 {stay.jibun_address}</p>
                )}
                {(() => {
                  // Supabase NUMERIC 은 클라이언트/직렬화 경로에 따라 문자열로 올 수 있어 정규화한다.
                  const lat = Number(stay.lat);
                  const lng = Number(stay.lng);
                  return stay.lat != null && stay.lng != null
                    && Number.isFinite(lat) && Number.isFinite(lng) ? (
                    <StayLocationMap lat={lat} lng={lng} title={stay.title} />
                  ) : (
                    <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                      위치 정보가 등록되지 않은 매물입니다
                    </div>
                  );
                })()}
              </div>
            </Section>

            {/* 담당 중개사 (제18조의2) 또는 임대인 직접등록 안내 */}
            <StayAgentBlock stay={stay} />

            {/* 주변 시세 — 국토부 전월세 실거래 평균 비교. 표본 부족/미지원 유형이면 렌더 안 됨 */}
            <Suspense fallback={<StayNearbyPriceSkeleton />}>
              <StayNearbyPrice stayId={stay.id} origin={origin} />
            </Suspense>

            {/* 이 지역 다른 매물 — 별도 API 호출이라 본문을 막지 않게 Suspense 로 분리 */}
            {stay.sigungu && (
              <Suspense fallback={<NearbySkeleton />}>
                <NearbyStays sigungu={stay.sigungu} excludeId={stay.id} />
              </Suspense>
            )}
          </div>

          {/* ── 우측 sticky 사이드바 (lg+) ── */}
          <aside className="hidden w-[312px] flex-shrink-0 lg:block">
            <div className="sticky top-24 space-y-3">
              <StayInquiryBar
                variant="sidebar"
                ownerType={stay.owner_type}
                phone={stay.phone}
                kakaoUrl={stay.kakao_url}
                contactName={stay.contact_name}
                contactHours={stay.contact_hours}
                depositWon={stay.deposit_won}
                monthlyFeeWon={stay.monthly_fee_won}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* ── 모바일 하단 고정 CTA ── */}
      <StayInquiryBar
        variant="mobile"
        ownerType={stay.owner_type}
        phone={stay.phone}
        kakaoUrl={stay.kakao_url}
        contactName={stay.contact_name}
        contactHours={stay.contact_hours}
        depositWon={stay.deposit_won}
        monthlyFeeWon={stay.monthly_fee_won}
      />
    </div>
  );
}
