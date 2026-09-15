'use client';

// 중개사 단기임대(/stay) 매물 관리 화면.
// 레이아웃·헤더·통계카드·목록 컨테이너 관례는 /agent/employer 를 그대로 이식했다.
//
// ⚠️ StayCard 를 재사용하지 않는 이유:
//    StayCard 는 카드 전체가 <Link> 래퍼다. 그 안에 삭제/수정 버튼을 넣으면
//    중첩 인터랙티브(a11y 위반 + <a> 안의 <button> 으로 hydration 경고)가 된다.
//    그래서 관리용 행은 StayPrimitives 프리미티브 + '@/lib/stay/format' 유틸로 새로 짠다.
//    (시각적 톤 — 썸네일 + 다단 텍스트 — 은 StayCard 와 맞춰 일관성 유지)

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  PenSquare,
  Home,
  CheckCircle2,
  Clock,
  Eye,
  ChevronRight,
  MapPin,
  Calendar,
  MoreVertical,
  Edit3,
  EyeOff,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StayStatusBadge, StayExclusiveBadge, StayImage } from '@/components/stay/StayPrimitives';
// 포맷 유틸은 반드시 '@/lib/stay/format' 에서. stays 는 원 단위라 formatKoreanPrice(만원 가정) 금지.
import { formatDepositMonthly } from '@/lib/stay/format';
import { STAY_TYPE_LABELS } from '@/lib/stay/constants';
import type { Stay, StayListResponse } from '@/types/stay';

// ---------- 승인/노출 배지 ----------
// ⚠️ DB 스키마(035_stays.sql:100-101)는 `is_active BOOLEAN DEFAULT true`,
//    `is_approved BOOLEAN DEFAULT false` 로 NOT NULL 이 아니다 → null 이 실제로 올 수 있다.
//    반면 TS 타입(src/types/stay.ts)은 `boolean` 으로 선언돼 있어 타입만 믿으면 안 된다.
//    그래서 truthy 판정이 아니라 `!== true` / `!== false` 로 null 을 명시적으로 흡수한다.
//    - is_approved 가 null 이면 "아직 승인 안 됨" → 심사중 (안전한 쪽)
//    - is_active 가 null 이면 DB DEFAULT 인 true 와 동일하게 취급 → 노출중
type ApprovalState = 'pending' | 'live' | 'paused';

function getApprovalState(stay: Stay): ApprovalState {
  if (stay.is_approved !== true) return 'pending';
  if (stay.is_active === false) return 'paused';
  return 'live';
}

const APPROVAL_CONFIG: Record<ApprovalState, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '심사중', color: 'bg-amber-100 text-amber-700', icon: Clock },
  live: { label: '노출중', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  paused: { label: '노출중지', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AgentStaysPage() {
  const { user, session } = useAuth();

  const [stays, setStays] = useState<Stay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

  // 노출 on/off 토글 — 삭제와 같은 관례(진행중 id + 행 단위 인라인 에러)
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<{ id: string; message: string } | null>(null);

  const userId = user?.id;
  const accessToken = session?.access_token;

  const loadStays = useCallback(async () => {
    if (!userId || !accessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await fetch('/api/stays?mine=1', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(res.status === 401 ? '로그인이 만료되었습니다' : `목록을 불러오지 못했습니다 (${res.status})`);
      }

      const data: StayListResponse = await res.json();
      setStays(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error('Load my stays error:', error);
      setLoadError(error instanceof Error ? error.message : '목록을 불러오지 못했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [userId, accessToken]);

  useEffect(() => {
    loadStays();
  }, [loadStays]);

  const handleDelete = async (stayId: string) => {
    if (!accessToken || deletingId) return; // 중복 클릭 방지

    setDeletingId(stayId);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/stays/${stayId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(
          res.status === 403 ? '이 매물을 삭제할 권한이 없습니다' : `삭제에 실패했습니다 (${res.status})`
        );
      }

      setStays((prev) => prev.filter((s) => s.id !== stayId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Delete stay error:', error);
      setDeleteError({
        id: stayId,
        message: error instanceof Error ? error.message : '삭제에 실패했습니다',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // 노출 on/off. 낙관적 업데이트 후 실패하면 "요청 직전 값"으로 되돌린다.
  //
  // ⚠️ is_active 는 null 일 수 있다(035 DEFAULT true, NOT NULL 아님). getApprovalState 와 같은 규약으로
  //    `=== false` 만 중지로 보므로, 다음 값은 "현재가 중지면 true, 아니면 false".
  // ⚠️ body 에 is_approved 를 절대 싣지 않는다. 승인은 운영팀 권한이며,
  //    서버도 Zod 화이트리스트(stayUpdateSchema) + 명시 destructure 로 두 겹 strip 한다.
  const handleToggleActive = async (stay: Stay) => {
    if (!accessToken || togglingId) return; // 중복 클릭 방지
    if (getApprovalState(stay) === 'pending') return; // 승인 전에는 의미 없음

    const prevIsActive = stay.is_active;
    const nextIsActive = stay.is_active === false;

    setTogglingId(stay.id);
    setToggleError(null);
    // 낙관적 반영 (liveCount 등 통계는 stays 파생값이라 함께 갱신된다)
    setStays((prev) => prev.map((s) => (s.id === stay.id ? { ...s, is_active: nextIsActive } : s)));

    try {
      const res = await fetch(`/api/stays/${stay.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: nextIsActive }),
      });

      if (!res.ok) {
        throw new Error(
          res.status === 403
            ? '이 매물을 수정할 권한이 없습니다'
            : res.status === 401
              ? '로그인이 만료되었습니다'
              : `노출 설정 변경에 실패했습니다 (${res.status})`
        );
      }

      // 서버 응답을 신뢰값으로 재반영 (다른 컬럼이 함께 바뀌었을 수 있다)
      const updated: Stay | null = await res.json().catch(() => null);
      if (updated && updated.id === stay.id) {
        setStays((prev) => prev.map((s) => (s.id === stay.id ? updated : s)));
      }
    } catch (error) {
      console.error('Toggle stay is_active error:', error);
      // 롤백: 요청 직전 값으로 복원 → 화면과 서버 상태가 어긋난 채 남지 않는다
      setStays((prev) =>
        prev.map((s) => (s.id === stay.id ? { ...s, is_active: prevIsActive } : s))
      );
      setToggleError({
        id: stay.id,
        message: error instanceof Error ? error.message : '노출 설정 변경에 실패했습니다',
      });
    } finally {
      setTogglingId(null);
      setOpenMenuId(null);
    }
  };

  // ---------- 통계 ----------
  const totalCount = stays.length;
  const liveCount = stays.filter((s) => getApprovalState(s) === 'live').length;
  const pendingCount = stays.filter((s) => getApprovalState(s) === 'pending').length;
  const totalViews = stays.reduce((sum, s) => sum + (s.views || 0), 0);

  // ---------- 미인증 ----------
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-6">내 단기임대 매물을 관리하려면 로그인해주세요</p>
          <Link
            href="/agent/auth/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/mypage"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-gray-900">내 단기임대 매물</h1>
            <Link
              href="/stay/new"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="매물 등록"
            >
              <PenSquare className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                <p className="text-xs text-gray-500">전체 매물</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{liveCount}</p>
                <p className="text-xs text-gray-500">노출중</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-xs text-gray-500">심사중</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                <p className="text-xs text-gray-500">총 조회수</p>
              </div>
            </div>
          </div>
        </div>

        {/* 등록 CTA */}
        <Link
          href="/stay/new"
          className="flex items-center gap-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl p-5 mb-6 hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <PenSquare className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">새 매물 등록</p>
            <p className="text-sm text-white/80">단기임대·공실 매물을 부인에 등록하세요</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* 내 매물 목록 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">내 매물 목록</h3>
            <span className="text-sm text-gray-500">{stays.length}개</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">매물을 불러오는 중...</p>
            </div>
          ) : loadError ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-1">{loadError}</p>
              <p className="text-sm text-gray-500 mb-4">잠시 후 다시 시도해주세요</p>
              <button
                type="button"
                onClick={loadStays}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </button>
            </div>
          ) : stays.length === 0 ? (
            <div className="p-8 text-center">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">등록된 매물이 없습니다</p>
              <Link
                href="/stay/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                첫 매물 등록하기
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stays.map((stay) => {
                const approvalState = getApprovalState(stay);
                const approval = APPROVAL_CONFIG[approvalState];
                const ApprovalIcon = approval.icon;
                const canToggleActive = approvalState !== 'pending';
                const isToggling = togglingId === stay.id;
                const toggleRowError = toggleError?.id === stay.id ? toggleError.message : null;
                const region = [stay.sigungu, stay.address].filter(Boolean).join(' ');
                const isConfirming = deleteConfirmId === stay.id;
                const isDeleting = deletingId === stay.id;
                const rowError = deleteError?.id === stay.id ? deleteError.message : null;

                return (
                  <div key={stay.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* 썸네일 */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <StayImage
                          src={stay.thumbnail}
                          alt={stay.title}
                          sizes="80px"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* 매물 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {/* 승인/노출 배지 (운영 축) */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${approval.color}`}
                          >
                            <ApprovalIcon className="w-3 h-3" />
                            {approval.label}
                          </span>
                          {/* 임대 진행 상태 (등록자 축) — 승인 배지와 다른 축이라 함께 노출 */}
                          <StayStatusBadge status={stay.status} />
                          {stay.is_exclusive && <StayExclusiveBadge />}
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {STAY_TYPE_LABELS[stay.stay_type]}
                          </span>
                        </div>

                        <h4 className="font-bold text-gray-900 truncate">{stay.title}</h4>

                        <p className="mt-0.5 truncate text-sm font-extrabold tracking-tight text-gray-900">
                          {formatDepositMonthly(stay.deposit_won, stay.monthly_fee_won)}
                        </p>

                        {region && (
                          <p className="flex items-center gap-1 mt-1 text-sm text-gray-500 truncate">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{region}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(stay.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {stay.views || 0}회
                          </span>
                        </div>

                        {/* 노출 토글 실패 인라인 에러 — 삭제 에러와 같은 톤 */}
                        {toggleRowError && (
                          <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            {toggleRowError}
                          </p>
                        )}

                        {/* 인라인 삭제 확인 — window.confirm 금지 */}
                        {isConfirming && (
                          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                            <p className="text-sm font-medium text-red-700">
                              이 매물을 삭제할까요? 되돌릴 수 없습니다.
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDelete(stay.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isDeleting ? '삭제 중...' : '삭제'}
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => {
                                  setDeleteConfirmId(null);
                                  setDeleteError(null);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                취소
                              </button>
                            </div>
                            {rowError && (
                              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                {rowError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 액션 */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/stay/${stay.id}`}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">보기</span>
                        </Link>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === stay.id ? null : stay.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="더보기"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === stay.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1">
                                <Link
                                  href={`/stay/${stay.id}`}
                                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <Eye className="w-4 h-4" />
                                  상세 보기
                                </Link>
                                <Link
                                  href={`/stay/new?edit=${stay.id}`}
                                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <Edit3 className="w-4 h-4" />
                                  수정하기
                                </Link>
                                {/* 승인 전(심사중) 매물은 노출 토글이 의미 없어 아예 노출하지 않는다 */}
                                {canToggleActive && (
                                  <button
                                    type="button"
                                    disabled={isToggling}
                                    onClick={() => handleToggleActive(stay)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {approvalState === 'paused' ? (
                                      <Eye className="w-4 h-4" />
                                    ) : (
                                      <EyeOff className="w-4 h-4" />
                                    )}
                                    {isToggling
                                      ? '변경 중...'
                                      : approvalState === 'paused'
                                        ? '노출 재개'
                                        : '노출 중지'}
                                  </button>
                                )}
                                <div className="border-t border-gray-100 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteConfirmId(stay.id);
                                    setDeleteError(null);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  삭제하기
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 도움말 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">매물이 노출되지 않나요?</h4>
              <p className="text-sm text-blue-700 mt-1">
                등록한 매물은 부인 운영팀 심사를 거친 뒤 노출됩니다. 심사중 상태가 오래 유지되면 매물 정보가 충분한지 확인해주세요.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
