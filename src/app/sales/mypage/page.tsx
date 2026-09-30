'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Eye, MapPin, PenSquare, UserCog, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PRICING_TIERS, isProductPurchasable } from '@/lib/toss';
import { planAdPurchase, tierLabel, tierRank, type AdWindowInput } from '@/lib/ad-entitlement';

// 내 분양 공고 — 광고 연장/업그레이드. 가격·기간은 toss.ts(PRICING_TIERS) 단일 출처, 공급가(부가세 별도).

interface MyJob {
  id: string;
  title: string;
  company: string | null;
  region: string | null;
  tier: string;              // 현재 유효 등급
  ad_expires_at: string | null;
  deadline: string | null;
  is_active: boolean;
  is_approved: boolean;
  views: number | null;
  created_at: string;
  windows: AdWindowInput[];  // 아직 끝나지 않은 광고 창
}

const SALES_TIERS = ['premium', 'superior', 'dia', 'unique'] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

const BADGE: Record<string, string> = {
  unique: 'bg-amber-100 text-amber-800',
  dia: 'bg-violet-100 text-violet-700',
  superior: 'bg-cyan-100 text-cyan-800',
  premium: 'bg-blue-100 text-blue-700',
  normal: 'bg-gray-100 text-gray-600',
};

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
}
function dday(end: Date | string): string {
  const diff = Math.ceil((new Date(end).getTime() - Date.now()) / DAY_MS);
  return diff <= 0 ? '오늘 종료' : `D-${diff}`;
}
// 받침 여부로 이/가 선택 (유니크가, 베이직이)
function iGa(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '이' : '가';
}
function latestEnd(windows: AdWindowInput[]): Date | null {
  let max = 0;
  for (const w of windows) {
    const t = w.expires_at ? new Date(w.expires_at).getTime() : 0;
    if (t > max) max = t;
  }
  return max > 0 ? new Date(max) : null;
}

type Picker = { job: MyJob; mode: 'extend' | 'upgrade' };

export default function SalesMyJobsPage() {
  const router = useRouter();
  const { user, session, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<Picker | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/sales/auth/login');
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs/mine?category=sales', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '공고를 불러오지 못했어요');
      setJobs(json.jobs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '공고를 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading || !user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">불러오는 중이에요…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/sales" className="p-2 -ml-2 text-gray-600 hover:text-gray-900" aria-label="분양 홈으로">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-900">내 분양 공고</h1>
          <Link href="/sales/jobs/new" className="p-2 -mr-2 text-blue-600" aria-label="새 공고 작성">
            <PenSquare className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <Link
          href="/agent/mypage"
          className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
        >
          <span className="flex items-center gap-2"><UserCog className="w-4 h-4 text-gray-500" />내 정보 · 기업 인증 관리</span>
          <span className="text-gray-400">›</span>
        </Link>

        <p className="text-xs text-gray-500 leading-relaxed">
          연장은 지금 광고가 끝나는 날부터 이어 붙고, 업그레이드는 결제 즉시 적용돼요. 표시 가격은 공급가이고 부가세는 별도예요.
        </p>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">공고를 불러오는 중이에요…</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-600">
            {error}
            <button type="button" onClick={load} className="block mx-auto mt-3 text-blue-600 underline">다시 시도</button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-600 mb-4">아직 등록한 분양 공고가 없어요.</p>
            <Link href="/sales/jobs/new" className="inline-block px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold">공고 등록하기</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onExtend={() => setPicker({ job, mode: 'extend' })}
                onUpgrade={() => setPicker({ job, mode: 'upgrade' })}
              />
            ))}
          </ul>
        )}
      </main>

      {picker && (
        <PeriodPicker
          picker={picker}
          onClose={() => setPicker(null)}
          onProceed={(productKey, days) =>
            router.push(`/checkout?productKey=${productKey}&days=${days}&jobId=${picker.job.id}`)
          }
        />
      )}
    </div>
  );
}

function JobRow({ job, onExtend, onUpgrade }: { job: MyJob; onExtend: () => void; onUpgrade: () => void }) {
  const label = tierLabel('sales', job.tier);
  const paid = job.tier !== 'normal';
  const totalEnd = latestEnd(job.windows);
  const currentEnd = job.ad_expires_at && paid ? new Date(job.ad_expires_at) : null;
  const canUpgrade = SALES_TIERS.some((t) => tierRank('sales', t) > tierRank('sales', job.tier));
  const status = !job.is_approved ? '승인 대기' : job.is_active ? '게시 중' : '비활성';
  const statusCls = !job.is_approved ? 'text-amber-600' : job.is_active ? 'text-green-600' : 'text-gray-400';

  return (
    <li className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${BADGE[job.tier] ?? BADGE.normal}`}>{label}</span>
        <span className={`text-xs font-medium ${statusCls}`}>{status}</span>
      </div>
      <h2 className="font-bold text-gray-900 line-clamp-1">{job.title}</h2>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        {job.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.region}</span>}
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{job.views ?? 0}회</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />모집 마감 {job.deadline ? fmtDate(`${job.deadline}T12:00:00+09:00`) : '상시채용'}
        </span>
      </div>
      <div className="mt-2 text-xs">
        {currentEnd ? (
          <p className="text-gray-700">
            광고 만료 <strong>{fmtDate(currentEnd)}</strong> <span className="text-blue-600 font-semibold">({dday(currentEnd)})</span>
            {totalEnd && totalEnd.getTime() > currentEnd.getTime() && (
              <span className="text-gray-500"> · 이어지는 광고 {fmtDate(totalEnd)}까지</span>
            )}
          </p>
        ) : totalEnd ? (
          <p className="text-gray-700">예약된 광고가 {fmtDate(totalEnd)}까지 있어요</p>
        ) : (
          <p className="text-gray-500">유료 광고 없음 (일반 공고는 24시간 노출)</p>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {paid && (
          <button type="button" onClick={onExtend} className="h-9 rounded-lg bg-gray-900 text-white text-sm font-bold">연장하기</button>
        )}
        {canUpgrade && (
          <button type="button" onClick={onUpgrade} className="h-9 rounded-lg bg-blue-600 text-white text-sm font-bold">업그레이드</button>
        )}
        <Link href={`/sales/jobs/new?edit=${job.id}`} className="h-9 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium flex items-center justify-center">수정</Link>
        <Link href={`/sales/jobs/${job.id}`} className="h-9 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium flex items-center justify-center">상세 보기</Link>
      </div>
    </li>
  );
}

function PeriodPicker({
  picker,
  onClose,
  onProceed,
}: {
  picker: Picker;
  onClose: () => void;
  onProceed: (productKey: string, days: number) => void;
}) {
  const { job, mode } = picker;
  const tierChoices = useMemo(
    () =>
      mode === 'extend'
        ? [job.tier]
        : SALES_TIERS.filter((t) => tierRank('sales', t) > tierRank('sales', job.tier)),
    [job.tier, mode],
  );
  const [tier, setTier] = useState<string>(
    () => tierChoices.find((t) => isProductPurchasable(`sales-${t}`)) ?? tierChoices[0],
  );
  const productKey = `sales-${tier}`;
  const product = PRICING_TIERS[productKey];
  const purchasable = isProductPurchasable(productKey);
  const [days, setDays] = useState<number | null>(null);
  const option = product?.options.find((o) => o.days === days) ?? null;

  const selectTier = (t: string) => {
    setTier(t);
    setDays(null);
  };

  const explanation = useMemo(() => {
    if (!option) return null;
    const newLabel = tierLabel('sales', tier);
    const plan = planAdPurchase({
      newTier: tier,
      category: 'sales',
      exposureDays: option.days + option.bonusDays,
      approvedAt: new Date(),
      existing: job.windows,
    });
    const lines: string[] = [];
    if (!plan.startsNow) {
      lines.push(`지금 만료일 ${fmtDate(plan.startsAt)} → 연장 후 ${fmtDate(plan.expiresAt)}까지 이어져요.`);
    } else if (mode === 'upgrade' && job.tier !== 'normal') {
      lines.push(`업그레이드는 결제 즉시 적용되고 ${fmtDate(plan.expiresAt)}까지 ${newLabel}로 노출돼요.`);
    } else {
      lines.push(`결제하면 바로 시작해 ${fmtDate(plan.expiresAt)}까지 ${newLabel}로 노출돼요.`);
    }
    for (const r of plan.resumes) {
      lines.push(`남은 ${tierLabel('sales', r.tier)} 기간은 ${newLabel}${iGa(newLabel)} 끝난 뒤 ${fmtDate(r.until)}까지 이어져요.`);
    }
    for (const t of plan.overlapped) {
      lines.push(`지금 ${tierLabel('sales', t)} 기간은 ${newLabel} 기간과 겹쳐서 함께 지나가요.`);
    }
    return lines;
  }, [option, tier, job.windows, job.tier, mode]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-gray-900">{mode === 'extend' ? '광고 연장' : '등급 업그레이드'}</h3>
            <p className="text-sm text-gray-500 truncate">{job.title}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600" aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'upgrade' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tierChoices.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => selectTier(t)}
                className={`h-9 px-4 rounded-full text-sm font-bold border ${
                  tier === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {tierLabel('sales', t)}
                {!isProductPurchasable(`sales-${t}`) && <span className="ml-1 text-[11px] font-medium opacity-70">준비 중</span>}
              </button>
            ))}
          </div>
        )}

        {!product ? (
          <p className="text-sm text-gray-500">선택할 수 있는 상품이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {product.options.map((o) => (
              <button
                key={o.days}
                type="button"
                disabled={!purchasable}
                onClick={() => setDays(o.days)}
                className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors ${
                  !purchasable
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : days === o.days
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">
                      {o.days}일{o.bonusDays > 0 && <span className="text-blue-600"> + {o.bonusDays}일 증정</span>}
                    </p>
                    <p className="text-xs text-gray-500">총 {o.days + o.bonusDays}일 노출</p>
                  </div>
                  <div className="text-right">
                    {purchasable ? (
                      <>
                        <p className="font-bold text-gray-900">{o.price.toLocaleString()}원</p>
                        <p className="text-[11px] text-gray-500">(부가세 별도)</p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-gray-500">판매 준비 중</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {explanation && (
          <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900 space-y-1">
            {explanation.map((l) => <p key={l}>{l}</p>)}
          </div>
        )}

        <button
          type="button"
          disabled={!option || !purchasable}
          onClick={() => option && onProceed(productKey, option.days)}
          className="mt-4 w-full h-12 rounded-xl bg-blue-600 text-white font-bold disabled:bg-gray-300"
        >
          {!purchasable ? '판매 준비 중' : option ? '결제하러 가기' : '기간을 골라 주세요'}
        </button>
      </div>
    </div>
  );
}
