'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, User, Phone, Mail, MapPin,
  Briefcase, CheckCircle2, XCircle, MessageSquare, Eye,
  FileText, Users, ExternalLink, RotateCcw,
  Shield, ChevronDown, ChevronRight, Clock, StickyNote,
  AlertCircle, TrendingUp, Calendar, DollarSign, Dna, Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchJobById, mapDbResumeToResume } from '@/lib/supabase';
import type { AgentResume } from '@/types';
import { DNA_TYPE_INFO, AGENT_SALARY_TYPE_LABELS } from '@/types';

interface ResumeData {
  id: string; user_id: string; name: string; phone: string; email: string;
  photo: string | null; total_experience: string; preferred_regions: string[];
  preferred_types: string[]; license_number: string | null;
  birth_year: number | null; gender: string | null; created_at: string;
}
interface Application {
  id: string; job_id: string; user_id: string; resume_id: string | null;
  message: string | null; status: 'pending' | 'viewed' | 'contacted' | 'rejected' | 'hired';
  created_at: string; updated_at: string | null; resume: ResumeData | null;
}
type AppStatus = Application['status'];

const EXP: Record<string, string> = { none: '신입', '6month': '6개월', '1year': '1년', '2year': '2년', '3year': '3년', '5year': '5년 이상' };
const TYPE_KR: Record<string, string> = { apartment: '아파트', office: '오피스텔', commercial: '상가', villa: '빌라/주택', industrial: '지식산업센터', land: '토지', other: '기타' };

function getAge(y: number | null) { return y ? new Date().getFullYear() - y + 1 : null; }
function genderKr(g: string | null) { return g === 'male' ? '남' : g === 'female' ? '여' : null; }
function fmtFull(s: string) { const d = new Date(s); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }

function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}

function isOlderThan24h(s: string) {
  return Date.now() - new Date(s).getTime() > 24 * 60 * 60 * 1000;
}

const STEPS = [
  { key: 'pending' as const, label: '접수', icon: FileText, color: '#3B82F6', light: '#EFF6FF', border: '#BFDBFE' },
  { key: 'viewed' as const, label: '검토중', icon: Eye, color: '#8B5CF6', light: '#F5F3FF', border: '#DDD6FE' },
  { key: 'contacted' as const, label: '연락', icon: Phone, color: '#F59E0B', light: '#FFFBEB', border: '#FDE68A' },
  { key: 'hired' as const, label: '합격', icon: CheckCircle2, color: '#22C55E', light: '#F0FDF4', border: '#BBF7D0' },
  { key: 'rejected' as const, label: '불합격', icon: XCircle, color: '#9CA3AF', light: '#F9FAFB', border: '#E5E7EB' },
];

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const { user, session } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<AgentResume | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [memos, setMemos] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ appId: string; status: AppStatus; name: string } | null>(null);

  const headers = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
    : undefined;

  useEffect(() => {
    if (!user?.id || !jobId || !headers) { setIsLoading(false); return; }
    (async () => {
      try {
        const [jobData, res] = await Promise.all([
          fetchJobById(jobId),
          fetch(`/api/jobs/${jobId}/applicants`, { headers }),
        ]);
        setJob(jobData);
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
          if (data.length > 0) setActiveId(data[0].id);
        }
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [user?.id, jobId, session?.access_token]);

  const changeStatus = async (appId: string, status: AppStatus) => {
    if (!headers) return;
    setUpdatingId(appId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/applicants`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ applicationId: appId, status }),
      });
      if (res.ok) setApplications(prev => prev.map(a => a.id === appId ? { ...a, status, updated_at: new Date().toISOString() } : a));
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  const safeStatusChange = (appId: string, status: AppStatus, name: string) => {
    if (status === 'hired' || status === 'rejected') {
      setConfirmModal({ appId, status, name });
    } else {
      changeStatus(appId, status);
    }
  };

  const viewResume = async (resumeId: string) => {
    if (!headers) return;
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, { headers });
      if (res.ok) { setSelectedResume(mapDbResumeToResume(await res.json())); setShowResumeModal(true); }
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);
  const counts = Object.fromEntries(['all', ...STEPS.map(s => s.key)].map(k => [k, k === 'all' ? applications.length : applications.filter(a => a.status === k).length]));
  const current = filtered.find(a => a.id === activeId) || filtered[0] || null;

  // 오늘 지원자 수
  const todayCount = applications.filter(a => {
    const d = new Date(a.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;

  if (!user) return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      <div className="text-center">
        <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
        <Link href="/agent/auth/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">로그인</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F3F6] pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200/60 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-8 flex items-center justify-between h-14">
          <Link href="/agent/employer" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> 공고 관리
          </Link>
          {job && (
            <div className="flex items-center gap-3">
              <h1 className="text-[15px] font-bold text-gray-900 truncate max-w-[300px]">{job.title}</h1>
              <Link href={`/agent/jobs/${jobId}`} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium">
                보기 <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
          <div className="flex items-center gap-4">
            {todayCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <TrendingUp className="w-3 h-3" /> 오늘 +{todayCount}명
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">전체</span>
              <span className="text-lg font-extrabold text-gray-900">{counts.all}</span>
              <span className="text-xs text-gray-400">명</span>
            </div>
          </div>
        </div>
      </header>

      {/* KPI 파이프라인 - 진행 흐름 */}
      <div className="bg-white border-b border-gray-200/60">
        <div className="max-w-[1440px] mx-auto px-8 py-5">
          <div className="flex items-center gap-3">
            {STEPS.map((step, i) => {
              const count = counts[step.key];
              const total = applications.length || 1;
              const pct = Math.round((count / total) * 100);
              const active = filter === step.key;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1 min-w-0">
                  <button
                    onClick={() => setFilter(active ? 'all' : step.key)}
                    className={`w-full rounded-2xl p-4 transition-all relative overflow-hidden ${
                      active
                        ? 'bg-white shadow-lg ring-2'
                        : 'bg-white/60 hover:bg-white hover:shadow-md'
                    }`}
                    style={{
                      ...(active ? { ringColor: step.color, boxShadow: `0 8px 24px -4px ${step.color}25` } : {}),
                      borderColor: active ? step.color : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ backgroundColor: active ? step.color : step.light }}
                      >
                        <Icon className="w-5 h-5" style={{ color: active ? '#fff' : step.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: step.color }}>{step.label}</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[28px] font-extrabold leading-none" style={{ color: active ? step.color : '#1F2937' }}>{count}</span>
                          <span className="text-[11px] font-medium text-gray-400">{pct}%</span>
                        </div>
                      </div>
                    </div>
                    {/* 퍼센트 바 */}
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: step.color, opacity: active ? 1 : 0.6 }}
                      />
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="flex-shrink-0 mx-1">
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-8 py-6">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-20 text-center shadow-sm"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" /><p className="text-sm text-gray-400">불러오는 중...</p></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-20 text-center shadow-sm">
            <Users className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-700 text-lg">{filter === 'all' ? '아직 지원자가 없습니다' : '해당 상태의 지원자가 없습니다'}</p>
            <p className="text-sm text-gray-400 mt-1">공고를 공유해서 지원자를 모아보세요</p>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* 좌측 리스트 */}
            <div className="w-full md:w-[340px] flex-shrink-0 space-y-2">
              <p className="text-xs font-medium text-gray-400 mb-3 pl-1">{filtered.length}명 {filter !== 'all' ? `· ${STEPS.find(s => s.key === filter)?.label}` : '· 최신순'}</p>
              {filtered.map((app) => {
                const r = app.resume;
                const age = r ? getAge(r.birth_year) : null;
                const gender = r ? genderKr(r.gender) : null;
                const sel = activeId === app.id;
                const step = STEPS.find(s => s.key === app.status)!;
                const hasMemo = !!(memos[app.id]?.trim());
                const needsAttention = app.status === 'pending' && isOlderThan24h(app.created_at);

                return (
                  <button
                    key={app.id}
                    onClick={() => setActiveId(app.id)}
                    className={`w-full text-left rounded-2xl transition-all relative overflow-hidden ${
                      sel
                        ? 'bg-white shadow-lg shadow-blue-500/8 ring-1 ring-blue-200'
                        : 'bg-white hover:bg-white hover:shadow-md'
                    } ${app.status === 'rejected' ? 'opacity-50' : ''}`}
                  >
                    {/* 좌측 컬러 바 */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all"
                      style={{ backgroundColor: sel ? '#2563EB' : step.color, opacity: sel ? 1 : 0.5 }}
                    />

                    <div className="p-4 pl-5">
                      <div className="flex items-center gap-3.5">
                        {/* 프로필 사진 (15% 업) */}
                        <div className="relative flex-shrink-0">
                          <div className="w-[84px] h-[84px] rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-200/60">
                            {r?.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-gray-300" />}
                          </div>
                          {/* 24시간 경고 */}
                          {needsAttention && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                              <AlertCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {/* 메모 있음 표시 */}
                          {hasMemo && !needsAttention && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                              <StickyNote className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-[16px] text-gray-900">{r?.name || '(미등록)'}</span>
                            {(gender || age) && <span className="text-xs text-gray-400">{[gender, age ? `${age}세` : null].filter(Boolean).join(', ')}</span>}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {r?.total_experience ? EXP[r.total_experience] || r.total_experience : '신입'}
                            {r?.preferred_regions && r.preferred_regions.length > 0 && ` · ${r.preferred_regions[0]}`}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                              style={{ backgroundColor: step.light, color: step.color, borderColor: step.border }}
                            >
                              <step.icon className="w-2.5 h-2.5" /> {step.label}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400">{timeAgo(app.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 우측 상세 패널 */}
            {current && (
              <div className="hidden md:block flex-1">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200/40 sticky top-[72px] max-h-[calc(100vh-96px)] overflow-y-auto">
                  {(() => {
                    const r = current.resume;
                    const age = r ? getAge(r.birth_year) : null;
                    const gender = r ? genderKr(r.gender) : null;
                    const busy = updatingId === current.id;
                    const step = STEPS.find(s => s.key === current.status)!;
                    const name = r?.name || '(미등록)';

                    return (
                      <>
                        {/* 프로필 헤더 - 연한 그라데이션 배경 */}
                        <div className="p-8 pb-6 bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-100">
                          <div className="flex items-start gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-gray-200 shadow-sm">
                              {r?.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-gray-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-[22px] font-extrabold text-gray-900">{name}</h2>
                                {(gender || age) && <span className="text-sm text-gray-400 font-medium">{[gender, age ? `${age}세` : null].filter(Boolean).join(', ')}</span>}
                              </div>
                              <p className="text-sm text-gray-500 mb-4">
                                {r?.total_experience ? EXP[r.total_experience] : '신입'} · 지원 {timeAgo(current.created_at)}
                              </p>
                              {/* 아이콘 버튼 3개 */}
                              <div className="flex items-center gap-2">
                                {r?.phone && (
                                  <a href={`tel:${r.phone}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-sm font-medium transition-all">
                                    <Phone className="w-4 h-4" /> 통화
                                  </a>
                                )}
                                {r?.phone && (
                                  <a href={`sms:${r.phone}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-sm font-medium transition-all">
                                    <MessageSquare className="w-4 h-4" /> 문자
                                  </a>
                                )}
                                {r?.email && (
                                  <a href={`mailto:${r.email}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-sm font-medium transition-all">
                                    <Mail className="w-4 h-4" /> 이메일
                                  </a>
                                )}
                                <span
                                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                                  style={{ backgroundColor: step.light, color: step.color, borderColor: step.border }}
                                >
                                  <step.icon className="w-3.5 h-3.5" /> {step.label}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* 뱃지 */}
                          <div className="flex flex-wrap gap-2 mt-5">
                            {r?.license_number && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
                                <Shield className="w-3 h-3" /> 공인중개사
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                              <Briefcase className="w-3 h-3" /> {r?.total_experience ? EXP[r.total_experience] : '신입'}
                            </span>
                            {r?.preferred_regions && r.preferred_regions.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                                <MapPin className="w-3 h-3" /> {r.preferred_regions.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 액션 버튼 - 크기 줄이고, 합격만 primary */}
                        <div className="px-8 py-4 border-b border-gray-100">
                          {(current.status === 'hired' || current.status === 'rejected') ? (
                            <div className="flex items-center gap-3">
                              <div
                                className="flex-1 text-center py-2.5 rounded-xl text-[13px] font-bold border"
                                style={{ backgroundColor: step.light, color: step.color, borderColor: step.border }}
                              >
                                {current.status === 'hired' ? '합격 처리됨' : '불합격 처리됨'}
                              </div>
                              <button
                                onClick={() => changeStatus(current.id, 'pending')}
                                disabled={busy}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> 되돌리기
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2.5">
                              <button
                                onClick={() => safeStatusChange(current.id, 'contacted', name)}
                                disabled={busy || current.status === 'contacted'}
                                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                                  current.status === 'contacted'
                                    ? 'bg-amber-500 text-white' : 'border-2 border-amber-400 text-amber-600 hover:bg-amber-50 disabled:opacity-50'
                                }`}
                              >
                                {busy ? '...' : current.status === 'contacted' ? '연락완료' : '연락하기'}
                              </button>
                              <button onClick={() => safeStatusChange(current.id, 'hired', name)} disabled={busy}
                                className="px-6 py-2.5 rounded-xl text-[13px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm shadow-emerald-500/20">
                                합격
                              </button>
                              <button onClick={() => safeStatusChange(current.id, 'rejected', name)} disabled={busy}
                                className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-gray-600 transition-all disabled:opacity-50">
                                불합격
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 섹션 카드 영역 */}
                        <div className="px-8 py-6 space-y-5">
                          {/* 지원 메시지 카드 */}
                          {current.message && (
                            <div className="bg-blue-50/70 rounded-2xl p-5 border border-blue-100">
                              <p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                <MessageSquare className="w-3.5 h-3.5" /> 지원 메시지
                              </p>
                              <p className="text-sm text-gray-700 leading-relaxed">{current.message}</p>
                            </div>
                          )}

                          {/* 관리 상태 & 지원일 */}
                          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
                              <FileText className="w-3.5 h-3.5" /> 지원 정보
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[11px] font-medium text-gray-400 mb-1.5">관리 상태</p>
                                <div className="relative">
                                  <select value={current.status}
                                    onChange={(e) => {
                                      const v = e.target.value as AppStatus;
                                      if (v === 'hired' || v === 'rejected') safeStatusChange(current.id, v, name);
                                      else changeStatus(current.id, v);
                                    }}
                                    disabled={busy}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:opacity-50 font-semibold text-gray-700">
                                    <option value="pending">접수</option>
                                    <option value="viewed">검토중</option>
                                    <option value="contacted">연락완료</option>
                                    <option value="hired">합격</option>
                                    <option value="rejected">불합격</option>
                                  </select>
                                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-gray-400 mb-1.5">지원일</p>
                                <div className="px-3 py-2.5 text-sm text-gray-600 bg-white rounded-xl border border-gray-200 font-medium flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" /> {fmtFull(current.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 활동 로그 타임라인 */}
                          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
                              <Clock className="w-3.5 h-3.5" /> 활동 로그
                            </p>
                            <div className="space-y-3">
                              {/* 현재 상태 */}
                              {current.updated_at && current.status !== 'pending' && (
                                <div className="flex gap-3 items-start">
                                  <div className="flex flex-col items-center">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: step.color }} />
                                    <div className="w-px h-full bg-gray-200 mt-1" />
                                  </div>
                                  <div className="pb-3">
                                    <p className="text-sm font-semibold text-gray-700">{step.label} 처리</p>
                                    <p className="text-xs text-gray-400">{fmtFull(current.updated_at)}</p>
                                  </div>
                                </div>
                              )}
                              {/* 지원 접수 */}
                              <div className="flex gap-3 items-start">
                                <div className="flex flex-col items-center">
                                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-700">지원 접수</p>
                                  <p className="text-xs text-gray-400">{fmtFull(current.created_at)}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 관리 메모 카드 */}
                          <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100/80">
                            <p className="text-xs font-bold text-amber-600 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                              <StickyNote className="w-3.5 h-3.5" /> 관리 메모
                              <span className="text-[10px] font-normal text-amber-400 ml-1">(내부 전용)</span>
                            </p>
                            <textarea
                              value={memos[current.id] || ''}
                              onChange={(e) => setMemos(prev => ({ ...prev, [current.id]: e.target.value }))}
                              placeholder="이 지원자에 대한 메모를 남겨보세요..."
                              className="w-full px-4 py-3 text-sm border border-amber-200/60 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 placeholder:text-amber-300/60 bg-white"
                            />
                          </div>

                          {/* 이력서 보기 */}
                          {r?.id && (
                            <button onClick={() => viewResume(r.id)}
                              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-sm">
                              <FileText className="w-5 h-5" /> 상세 이력서 보기
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 모바일 하단 바 */}
        {current && activeId && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl rounded-t-3xl">
            {(() => {
              const r = current.resume;
              const busy = updatingId === current.id;
              const name = r?.name || '(미등록)';
              return (
                <div className="px-5 py-4 pb-7">
                  <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-200">
                      {r?.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">{r?.phone} · {timeAgo(current.created_at)}</p>
                    </div>
                    {(current.status === 'hired' || current.status === 'rejected') && (
                      <button onClick={() => changeStatus(current.id, 'pending')} className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> 되돌리기
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {current.status === 'hired' || current.status === 'rejected' ? (
                      <div className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold bg-gray-50 text-gray-400 border border-gray-200">
                        {current.status === 'hired' ? '합격' : '불합격'} 처리됨
                      </div>
                    ) : (
                      <>
                        <button onClick={() => safeStatusChange(current.id, 'contacted', name)} disabled={busy}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-amber-50 border border-amber-300 text-amber-600">연락</button>
                        <button onClick={() => safeStatusChange(current.id, 'hired', name)} disabled={busy}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white">합격</button>
                        <button onClick={() => safeStatusChange(current.id, 'rejected', name)} disabled={busy}
                          className="py-2.5 px-4 rounded-xl text-sm border border-gray-200 text-gray-400">불합격</button>
                      </>
                    )}
                    {r?.id && (
                      <button onClick={() => viewResume(r.id)} className="py-2.5 px-3 rounded-xl text-sm border border-gray-200 text-gray-700">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* 확인 모달 (합격/불합격) */}
      {confirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="p-7 text-center">
              {confirmModal.status === 'hired' ? (
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                {confirmModal.status === 'hired' ? '합격 처리' : '불합격 처리'}
              </h3>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{confirmModal.name}</span>님을{' '}
                {confirmModal.status === 'hired' ? '합격' : '불합격'} 처리하시겠습니까?
              </p>
              <p className="text-xs text-gray-400 mt-2">나중에 되돌리기로 변경할 수 있습니다</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                취소
              </button>
              <div className="w-px bg-gray-100" />
              <button
                onClick={() => { changeStatus(confirmModal.appId, confirmModal.status); setConfirmModal(null); }}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${
                  confirmModal.status === 'hired' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'
                }`}
              >
                {confirmModal.status === 'hired' ? '합격' : '불합격'} 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이력서 모달 */}
      {showResumeModal && selectedResume && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowResumeModal(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-7 py-5 flex items-center justify-between z-10">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg"><FileText className="w-5 h-5 text-blue-600" /> 이력서</h2>
              <button onClick={() => setShowResumeModal(false)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">✕</button>
            </div>
            <div className="p-7">
              <div className="flex items-start gap-5 pb-6 border-b border-gray-100">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
                  {selectedResume.photo ? <img src={selectedResume.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-gray-300" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">{selectedResume.name}</h3>
                  <div className="flex gap-3 text-sm">
                    <a href={`tel:${selectedResume.phone}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"><Phone className="w-3.5 h-3.5" />{selectedResume.phone}</a>
                    <a href={`mailto:${selectedResume.email}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"><Mail className="w-3.5 h-3.5" />{selectedResume.email}</a>
                  </div>
                </div>
              </div>

              {selectedResume.licenseNumber && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800">자격증</h4>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-700 flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-600" /> 공인중개사 ({selectedResume.licenseNumber})</p>
                    {selectedResume.licenseDate && <span className="text-xs text-gray-400">취득일: {selectedResume.licenseDate}</span>}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800 flex items-center gap-2">
                  경력 <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md">{EXP[selectedResume.totalExperience || 'none']}</span>
                </h4>
                {selectedResume.careers && selectedResume.careers.length > 0 ? (
                  <div className="space-y-3">
                    {selectedResume.careers.map((c, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="text-gray-400 w-28 flex-shrink-0">{c.startDate}~{c.isCurrent ? '현재' : c.endDate}</span>
                        <div><p className="font-semibold text-gray-900">{c.company}</p>{c.position && <p className="text-gray-500 text-xs">{c.position}</p>}</div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">경력 없음</p>}
              </div>

              {selectedResume.introduction && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800">자기소개</h4>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-5 border border-gray-100">{selectedResume.introduction}</p>
                </div>
              )}

              {selectedResume.strengths && selectedResume.strengths.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800">강점</h4>
                  <div className="flex flex-wrap gap-2">{selectedResume.strengths.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-100">{s}</span>
                  ))}</div>
                </div>
              )}

              {((selectedResume.preferredRegions?.length ?? 0) > 0 || (selectedResume.preferredTypes?.length ?? 0) > 0 || selectedResume.preferredSalary || selectedResume.availableDate) && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800">희망조건</h4>
                  <div className="space-y-2.5 text-sm">
                    {(selectedResume.preferredRegions?.length ?? 0) > 0 && (
                      <div className="flex gap-3"><span className="text-gray-400 w-16 font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> 지역</span><span className="text-gray-700">{selectedResume.preferredRegions?.join(', ')}</span></div>
                    )}
                    {(selectedResume.preferredTypes?.length ?? 0) > 0 && (
                      <div className="flex gap-3"><span className="text-gray-400 w-16 font-medium flex items-center gap-1"><Briefcase className="w-3 h-3" /> 업종</span><span className="text-gray-700">{selectedResume.preferredTypes?.map(t => TYPE_KR[t] || t).join(', ')}</span></div>
                    )}
                    {selectedResume.preferredSalary && (
                      <div className="flex gap-3">
                        <span className="text-gray-400 w-16 font-medium flex items-center gap-1"><DollarSign className="w-3 h-3" /> 급여</span>
                        <span className="text-gray-700">
                          {AGENT_SALARY_TYPE_LABELS[selectedResume.preferredSalary.type] || selectedResume.preferredSalary.type}
                          {selectedResume.preferredSalary.min && selectedResume.preferredSalary.max
                            ? ` (${selectedResume.preferredSalary.min}만~${selectedResume.preferredSalary.max}만원)`
                            : selectedResume.preferredSalary.min ? ` (${selectedResume.preferredSalary.min}만원~)` : ''}
                        </span>
                      </div>
                    )}
                    {selectedResume.availableDate && (
                      <div className="flex gap-3"><span className="text-gray-400 w-16 font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> 입사</span><span className="text-gray-700">{selectedResume.availableDate}</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* DNA 분석 결과 */}
              {selectedResume.dnaType && DNA_TYPE_INFO[selectedResume.dnaType] && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800 flex items-center gap-2">
                    <Dna className="w-4 h-4" /> DNA 분석
                  </h4>
                  <div className={`bg-gradient-to-r ${DNA_TYPE_INFO[selectedResume.dnaType].color} rounded-xl p-4 text-white`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{DNA_TYPE_INFO[selectedResume.dnaType].emoji}</span>
                      <span className="font-bold text-lg">{DNA_TYPE_INFO[selectedResume.dnaType].name}</span>
                    </div>
                    <p className="text-sm opacity-90">{DNA_TYPE_INFO[selectedResume.dnaType].description}</p>
                  </div>
                  {selectedResume.dnaScores && (
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      {[
                        { key: 'risk', label: '도전력', color: '#EF4444' },
                        { key: 'social', label: '소통력', color: '#3B82F6' },
                        { key: 'logic', label: '분석력', color: '#8B5CF6' },
                        { key: 'resilience', label: '회복력', color: '#22C55E' },
                      ].map(({ key, label, color }) => (
                        <div key={key} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <p className="text-[10px] font-medium text-gray-400 mb-1">{label}</p>
                          <p className="text-lg font-extrabold" style={{ color }}>{selectedResume.dnaScores![key as keyof typeof selectedResume.dnaScores]}</p>
                          <div className="h-1 rounded-full bg-gray-200 mt-1.5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${selectedResume.dnaScores![key as keyof typeof selectedResume.dnaScores]}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 px-7 py-5 flex gap-3">
              <a href={`tel:${selectedResume.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 shadow-sm"><Phone className="w-5 h-5" /> 전화</a>
              <a href={`mailto:${selectedResume.email}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-sm"><Mail className="w-5 h-5" /> 이메일</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
