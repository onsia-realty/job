'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Building2,
  Briefcase,
  Users,
  Eye,
  Share2,
  Bookmark,
  BookmarkCheck,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Flame,
  Send,
  Heart,
  FileText,
  Award,
  Banknote,
  Coffee,
  Car,
  GraduationCap,
  Timer,
  Laptop,
  Gift,
  Bus,
} from 'lucide-react';
import type { AgentJobListing, AgentBenefit } from '@/types';
import { AGENT_BENEFIT_LABELS, AGENT_JOB_TYPE_LABELS } from '@/types';
import AgentJobCard from '@/components/agent/JobCard';

// 복리후생 아이콘 매핑
const BENEFIT_ICONS: Record<AgentBenefit, React.ElementType> = {
  insurance: Award,
  incentive: Banknote,
  parking: Car,
  meal: Coffee,
  education: GraduationCap,
  flexible: Timer,
  vacation: Calendar,
  transport: Bus,
  bonus: Gift,
  laptop: Laptop,
};

// D-Day 계산
function getDDay(deadline?: string, isAlwaysRecruiting?: boolean): { text: string; color: string; urgent: boolean } {
  if (isAlwaysRecruiting) {
    return { text: '상시채용', color: 'text-blue-600 bg-blue-50', urgent: false };
  }

  if (!deadline) {
    return { text: '채용중', color: 'text-gray-600 bg-gray-100', urgent: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: '마감', color: 'text-gray-400 bg-gray-100', urgent: false };
  }
  if (diffDays === 0) {
    return { text: 'D-DAY', color: 'text-red-600 bg-red-50', urgent: true };
  }
  if (diffDays <= 3) {
    return { text: `D-${diffDays}`, color: 'text-red-600 bg-red-50', urgent: true };
  }
  if (diffDays <= 7) {
    return { text: `D-${diffDays}`, color: 'text-orange-600 bg-orange-50', urgent: false };
  }
  return { text: `D-${diffDays}`, color: 'text-gray-600 bg-gray-100', urgent: false };
}

// 더미 데이터 (실제로는 API에서 가져옴)
const MOCK_JOB: AgentJobListing = {
  id: '1',
  title: '강남 아파트 전문 공인중개사 모집 (경력우대)',
  description: `
## 회사 소개
강남부동산은 20년 전통의 강남권 아파트 전문 중개사무소입니다.
압구정, 청담, 도곡동 일대 고급 아파트를 전문으로 취급하며,
업계 최고 수준의 고객 서비스를 자랑합니다.

## 담당 업무
- 아파트 매매/전세/월세 중개
- 고객 상담 및 매물 안내
- 계약서 작성 및 잔금 업무
- 매물 발굴 및 관리
- VIP 고객 관리

## 자격 요건
- 공인중개사 자격증 소지자
- 부동산 중개 경력 1년 이상 (우대)
- 강남권 지역 거주자 우대
- 성실하고 책임감 있는 분

## 우대 사항
- 아파트 전문 중개 경험자
- 자차 소유자
- 고객 관리 능력 우수자
- 장기 근무 가능자

## 근무 환경
- 쾌적한 사무실 환경
- 자유로운 출퇴근
- 성과에 따른 인센티브 지급
- 정기적인 교육 및 세미나 참여 기회
`,
  type: 'apartment',
  tier: 'premium',
  badges: ['hot', 'urgent'],
  salary: {
    type: 'mixed',
    amount: '월 300만원 + 인센티브',
    min: 300,
    max: 800,
  },
  experience: '1년 이상',
  experienceLevel: '1year',
  company: '강남부동산공인중개사사무소',
  companyLogo: undefined,
  region: '서울 강남구',
  address: '서울특별시 강남구 테헤란로 123',
  detailAddress: '5층 501호',
  views: 1523,
  applicants: 24,
  createdAt: '2025-01-20',
  deadline: '2025-01-31',
  isAlwaysRecruiting: false,
  benefits: ['insurance', 'incentive', 'parking', 'meal', 'education', 'flexible'],
  workHours: '09:00 ~ 18:00 (협의가능)',
  workDays: '주 5일 (토요일 협의)',
  contactName: '김대표',
  contactPhone: '02-1234-5678',
  isBookmarked: false,
};

// 관련 공고 더미 데이터
const RELATED_JOBS: AgentJobListing[] = [
  {
    id: '2',
    title: '분당 오피스텔 전문 중개사 급구',
    description: '',
    type: 'office',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'commission', amount: '수수료 50%' },
    experience: '경력무관',
    company: '분당공인중개사',
    region: '경기 성남시',
    views: 856,
    createdAt: '2025-01-19',
    deadline: '2025-02-15',
    benefits: ['insurance', 'parking'],
  },
  {
    id: '3',
    title: '송파구 빌라 전문 중개사 모집',
    description: '',
    type: 'villa',
    tier: 'normal',
    badges: ['hot'],
    salary: { type: 'monthly', amount: '월 250만원' },
    experience: '6개월 이상',
    company: '송파부동산',
    region: '서울 송파구',
    views: 623,
    applicants: 12,
    createdAt: '2025-01-18',
    isAlwaysRecruiting: true,
    benefits: ['insurance', 'meal'],
  },
  {
    id: '4',
    title: '강동구 원룸/투룸 전문 중개사',
    description: '',
    type: 'oneroom',
    tier: 'premium',
    badges: ['new', 'hot'],
    salary: { type: 'mixed', amount: '월 200만원 + α' },
    experience: '경력무관',
    company: '강동부동산',
    region: '서울 강동구',
    views: 412,
    createdAt: '2025-01-21',
    deadline: '2025-02-28',
    benefits: ['insurance', 'incentive', 'flexible'],
  },
];

const TYPE_COLORS: Record<string, string> = {
  apartment: 'bg-blue-100 text-blue-700',
  villa: 'bg-green-100 text-green-700',
  store: 'bg-purple-100 text-purple-700',
  oneroom: 'bg-orange-100 text-orange-700',
  office: 'bg-cyan-100 text-cyan-700',
};

const SALARY_LABELS = {
  monthly: '월급',
  commission: '수수료',
  mixed: '기본급+인센티브',
};

const BADGE_CONFIG = {
  new: { label: 'NEW', icon: Sparkles, color: 'bg-emerald-500 text-white' },
  hot: { label: 'HOT', icon: Flame, color: 'bg-red-500 text-white' },
  urgent: { label: '급구', icon: AlertCircle, color: 'bg-orange-500 text-white' },
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<AgentJobListing | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 실제로는 API에서 데이터를 가져옴
    const fetchJob = async () => {
      setIsLoading(true);
      // 시뮬레이션을 위한 딜레이
      await new Promise((resolve) => setTimeout(resolve, 300));
      setJob(MOCK_JOB);
      setIsBookmarked(MOCK_JOB.isBookmarked || false);
      setIsLoading(false);
    };

    fetchJob();
  }, [params.id]);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: API 호출하여 스크랩 상태 저장
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: job?.title,
        text: `${job?.company} - ${job?.title}`,
        url: window.location.href,
      });
    } catch {
      // 공유 기능이 지원되지 않는 경우 클립보드에 복사
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다.');
    }
  };

  const handleApply = () => {
    setShowApplyModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">공고를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">공고를 찾을 수 없습니다</h1>
          <p className="text-gray-500 mb-6">요청하신 공고가 삭제되었거나 존재하지 않습니다.</p>
          <Link
            href="/agent/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            공고 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const dday = getDDay(job.deadline, job.isAlwaysRecruiting);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">뒤로가기</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="공유하기"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                }`}
                title={isBookmarked ? '스크랩 취소' : '스크랩'}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 공고 헤더 */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm ${
              job.tier === 'premium'
                ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white'
                : 'border border-gray-200'
            }`}>
              {/* 상단 배지 */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {job.tier === 'premium' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold rounded-full">
                    <Award className="w-4 h-4" />
                    PREMIUM
                  </span>
                )}
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${dday.color}`}>
                  {dday.text}
                </span>
                {job.badges.map((badge) => {
                  const config = BADGE_CONFIG[badge];
                  const Icon = config.icon;
                  return (
                    <span
                      key={badge}
                      className={`inline-flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${config.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                  );
                })}
              </div>

              {/* 회사 정보 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} alt="" className="w-10 h-10 object-contain" />
                  ) : (
                    <Building2 className="w-7 h-7 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-gray-600 text-sm">{job.company}</p>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${TYPE_COLORS[job.type]}`}>
                    {AGENT_JOB_TYPE_LABELS[job.type]}
                  </span>
                </div>
              </div>

              {/* 제목 */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                {job.title}
              </h1>

              {/* 핵심 정보 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Banknote className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">{SALARY_LABELS[job.salary.type]}</p>
                  <p className="text-blue-600 font-bold">{job.salary.amount || '협의'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">근무지역</p>
                  <p className="font-semibold text-gray-900">{job.region}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Briefcase className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">경력</p>
                  <p className="font-semibold text-gray-900">{job.experience}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">마감일</p>
                  <p className={`font-semibold ${dday.urgent ? 'text-red-600' : 'text-gray-900'}`}>
                    {job.isAlwaysRecruiting ? '상시채용' : job.deadline || '채용시 마감'}
                  </p>
                </div>
              </div>
            </div>

            {/* 복리후생 */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                  복리후생
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {job.benefits.map((benefit) => {
                    const Icon = BENEFIT_ICONS[benefit];
                    return (
                      <div
                        key={benefit}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-gray-700 font-medium">
                          {AGENT_BENEFIT_LABELS[benefit]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 상세 내용 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                상세 내용
              </h2>
              <div className="prose prose-gray max-w-none">
                {job.description.split('\n').map((line, index) => {
                  if (line.startsWith('## ')) {
                    return (
                      <h3 key={index} className="text-lg font-bold text-gray-900 mt-6 mb-3 first:mt-0">
                        {line.replace('## ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <div key={index} className="flex items-start gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">{line.replace('- ', '')}</span>
                      </div>
                    );
                  }
                  if (line.trim()) {
                    return (
                      <p key={index} className="text-gray-600 mb-2">
                        {line}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* 근무 조건 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                근무 조건
              </h2>
              <div className="space-y-4">
                {job.workHours && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Timer className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">근무시간</p>
                      <p className="font-medium text-gray-900">{job.workHours}</p>
                    </div>
                  </div>
                )}
                {job.workDays && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">근무요일</p>
                      <p className="font-medium text-gray-900">{job.workDays}</p>
                    </div>
                  </div>
                )}
                {job.address && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">근무지 주소</p>
                      <p className="font-medium text-gray-900">
                        {job.address}
                        {job.detailAddress && ` ${job.detailAddress}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 지원하기 카드 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">예상 급여</p>
                <p className="text-3xl font-bold text-blue-600">
                  {job.salary.amount || '협의'}
                </p>
                {job.salary.min && job.salary.max && (
                  <p className="text-sm text-gray-500 mt-1">
                    월 {job.salary.min}만원 ~ {job.salary.max}만원
                  </p>
                )}
              </div>

              <button
                onClick={handleApply}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <Send className="w-5 h-5" />
                지원하기
              </button>

              <button
                onClick={handleBookmark}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                  isBookmarked
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="w-5 h-5" />
                    스크랩됨
                  </>
                ) : (
                  <>
                    <Bookmark className="w-5 h-5" />
                    스크랩하기
                  </>
                )}
              </button>

              {/* 공고 통계 */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">조회</span>
                  </div>
                  <p className="font-bold text-gray-900">{job.views.toLocaleString()}</p>
                </div>
                {job.applicants !== undefined && (
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">지원</span>
                    </div>
                    <p className="font-bold text-gray-900">{job.applicants}</p>
                  </div>
                )}
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">관심</span>
                  </div>
                  <p className="font-bold text-gray-900">128</p>
                </div>
              </div>
            </div>

            {/* 담당자 정보 */}
            {(job.contactName || job.contactPhone) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">채용 담당자</h3>
                <div className="space-y-3">
                  {job.contactName && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">담당자</p>
                        <p className="font-medium text-gray-900">{job.contactName}</p>
                      </div>
                    </div>
                  )}
                  {job.contactPhone && (
                    <a
                      href={`tel:${job.contactPhone}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">전화문의</p>
                        <p className="font-medium text-blue-600">{job.contactPhone}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 회사 정보 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">기업 정보</h3>
                <Link
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  상세보기
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} alt="" className="w-12 h-12 object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{job.company}</p>
                  <p className="text-sm text-gray-500">{job.region}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 관련 공고 */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">비슷한 공고</h2>
            <Link
              href="/agent/jobs"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
            >
              전체보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RELATED_JOBS.map((relatedJob) => (
              <AgentJobCard key={relatedJob.id} job={relatedJob} variant="card" />
            ))}
          </div>
        </section>
      </main>

      {/* 모바일 하단 고정 버튼 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3">
        <button
          onClick={handleBookmark}
          className={`p-3 rounded-xl transition-colors ${
            isBookmarked
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-6 h-6" />
          ) : (
            <Bookmark className="w-6 h-6" />
          )}
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          지원하기
        </button>
      </div>

      {/* 지원 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">지원하기</h3>
            <p className="text-gray-600 mb-6">
              <strong>{job.company}</strong>의 <strong>{job.title}</strong> 공고에 지원하시겠습니까?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  alert('지원이 완료되었습니다.');
                  setShowApplyModal(false);
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                등록된 이력서로 지원
              </button>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 여백 (모바일 고정 버튼용) */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
