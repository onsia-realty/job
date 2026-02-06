// 온시아 Job Matching 타입 정의

// 공통 타입
export type UserType = 'agent' | 'sales';
export type UserRole = 'employer' | 'seeker';

// 분양상담사 구인공고 타입 (분양라인 스타일)
export type SalesJobType = 'apartment' | 'officetel' | 'store' | 'industrial';
export type SalesJobTier = 'unique' | 'superior' | 'premium' | 'normal';
export type SalesJobBadge = 'new' | 'hot' | 'jackpot' | 'popular';
export type SalesPosition = 'headTeam' | 'teamLead' | 'member';
export type SalaryType = 'commission' | 'base_incentive' | 'daily';
export type CompanyType = 'developer' | 'builder' | 'agency' | 'trust';
export type ExperienceLevel = 'none' | '1month' | '3month' | '6month' | '12month';

export interface SalesJobListing {
  id: string;
  title: string;
  description: string;
  type: SalesJobType;
  tier: SalesJobTier;
  badges: SalesJobBadge[];
  position: SalesPosition;
  salary: {
    type: SalaryType;
    amount?: string;
  };
  benefits: string[];
  experience: ExperienceLevel;
  company: string;
  companyType?: CompanyType;
  region: string;
  thumbnail?: string;
  views: number;
  createdAt: string;
}

// 공인중개사 구인공고 타입 (부동산 카테고리 확장)
export type AgentJobType =
  // 주거용
  | 'apartment'   // 아파트
  | 'officetel'   // 오피스텔
  | 'villa'       // 빌라/다세대
  // 상업용
  | 'store'       // 상가
  | 'office'      // 사무실
  | 'building'    // 빌딩매매
  | 'auction'     // 경매
  // 레거시
  | 'commercial';  // 상업시설 (레거시)

// 부동산 대분류
export type PropertyCategory = 'residential' | 'commercial';
export type AgentJobTier = 'vip' | 'premium' | 'normal';
export type AgentSalaryType = 'monthly' | 'commission' | 'mixed';
export type AgentExperience = 'none' | '6month' | '1year' | '2year' | '3year' | '5year';

// 복리후생 타입
export type AgentBenefit =
  | 'insurance' // 4대보험
  | 'incentive' // 인센티브
  | 'parking' // 주차지원
  | 'meal' // 식대지원
  | 'education' // 교육지원
  | 'flexible' // 유연근무
  | 'vacation' // 연차
  | 'transport' // 교통비
  | 'bonus' // 명절보너스
  | 'laptop'; // 업무장비

export interface AgentJobListing {
  id: string;
  title: string;
  description: string;
  type: AgentJobType;
  tier: AgentJobTier;
  badges: ('new' | 'hot' | 'urgent')[];
  salary: {
    type: AgentSalaryType;
    amount?: string;
    min?: number; // 최소 급여 (만원)
    max?: number; // 최대 급여 (만원)
  };
  experience: string;
  experienceLevel?: AgentExperience;
  company: string;
  companyLogo?: string; // 회사 로고
  region: string;
  address?: string;
  detailAddress?: string; // 상세 주소
  thumbnail?: string;
  views: number;
  applicants?: number; // 지원자 수
  createdAt: string;
  deadline?: string; // 마감일 (YYYY-MM-DD)
  isAlwaysRecruiting?: boolean; // 상시채용
  benefits?: AgentBenefit[]; // 복리후생
  workHours?: string; // 근무시간
  workDays?: string; // 근무요일
  contactName?: string; // 담당자명
  contactPhone?: string; // 연락처 (휴대폰)
  officePhone?: string; // 회사 전화 (지역번호)
  isBookmarked?: boolean; // 스크랩 여부
  agentImages?: { logo?: string; signboard?: string; interior?: string }; // 부동산 이미지
  htmlContent?: string; // HTML 형식 상세 내용 (알바몬/잡코리아 스타일)
}

// 공인중개사 필터 인터페이스
export interface AgentJobFilter {
  regions: string[];
  types: AgentJobType[];
  salaryTypes: AgentSalaryType[];
  experiences: AgentExperience[];
  tiers: AgentJobTier[];
  benefits: AgentBenefit[];
  salaryMin?: number;
  salaryMax?: number;
}

// 복리후생 라벨
export const AGENT_BENEFIT_LABELS: Record<AgentBenefit, string> = {
  insurance: '4대보험',
  incentive: '인센티브',
  parking: '주차지원',
  meal: '식대지원',
  education: '교육지원',
  flexible: '유연근무',
  vacation: '연차보장',
  transport: '교통비',
  bonus: '명절보너스',
  laptop: '업무장비',
};

// 경력 라벨 (공인중개사)
export const AGENT_EXPERIENCE_LABELS: Record<AgentExperience, string> = {
  none: '경력무관',
  '6month': '6개월 이상',
  '1year': '1년 이상',
  '2year': '2년 이상',
  '3year': '3년 이상',
  '5year': '5년 이상',
};

// 급여 타입 라벨 (공인중개사)
export const AGENT_SALARY_TYPE_LABELS: Record<AgentSalaryType, string> = {
  monthly: '월급',
  commission: '비율제',
  mixed: '월급 + 비율제',
};

// 사용자 프로필 타입 (매칭 시스템용)
export interface UserProfile {
  id: string;
  type: UserType;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  // 구직자용
  experience?: string;
  preferredRegions?: string[];
  preferredSalary?: string;
  resumeUrl?: string;
  // 구인자용
  company?: string;
  companyType?: string;
  businessNumber?: string;
  businessVerified?: boolean;
  brokerVerified?: boolean;
  createdAt: string;
}

// 기업회원 인증 상태 타입
export type VerificationStatus = 'unverified' | 'broker_verified' | 'business_verified';

// 인증 상태 라벨
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  unverified: '미인증',
  broker_verified: '중개사무소 인증',
  business_verified: '사업자 인증',
};

// 인증 상태 색상
export const VERIFICATION_STATUS_COLORS: Record<VerificationStatus, string> = {
  unverified: 'bg-gray-100 text-gray-500',
  broker_verified: 'bg-green-100 text-green-700',
  business_verified: 'bg-blue-100 text-blue-700',
};

// 뉴스 타입
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: 'market' | 'policy' | 'investment' | 'development';
  imageUrl?: string;
}

// 통계 타입
export interface Statistics {
  agentJobs: number;
  salesJobs: number;
  activeUsers: number;
  matchesThisMonth: number;
}

// 지역 타입
export const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
] as const;

export type Region = typeof REGIONS[number];

// 분양상담사 현장 유형 라벨
export const SALES_JOB_TYPE_LABELS: Record<SalesJobType, string> = {
  apartment: '아파트',
  officetel: '오피스텔',
  store: '상가',
  industrial: '지산',
};

// 공인중개사 업무 유형 라벨
export const AGENT_JOB_TYPE_LABELS: Record<AgentJobType, string> = {
  // 주거용
  apartment: '아파트',
  officetel: '오피스텔',
  villa: '빌라/다세대',
  // 상업용
  store: '상가',
  office: '사무실',
  building: '빌딩매매',
  auction: '경매',
  // 레거시
  commercial: '상업시설',
};

// 대분류 라벨
export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  residential: '주거용',
  commercial: '상업용',
};

// 대분류별 세부 카테고리 매핑
export const PROPERTY_CATEGORY_TYPES: Record<PropertyCategory, AgentJobType[]> = {
  residential: ['apartment', 'officetel', 'villa'],
  commercial: ['store', 'office', 'building', 'auction'],
};

// 분양상담사 티어 색상 (분양라인 스타일)
export const SALES_TIER_COLORS: Record<SalesJobTier, { bg: string; text: string; border: string }> = {
  unique: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-500' },
  superior: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-500' },
  premium: { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-500' },
  normal: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
};

// 직급 라벨
export const POSITION_LABELS: Record<SalesPosition, string> = {
  headTeam: '본부장',
  teamLead: '팀장',
  member: '팀원',
};

// 급여 타입 라벨
export const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  commission: '계약 수수료',
  base_incentive: '기본급+인센',
  daily: '일급',
};

// 업체 유형 라벨
export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  developer: '시행사',
  builder: '시공사',
  agency: '분양대행사',
  trust: '신탁사',
};

// 경력 라벨
export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  none: '경력무관',
  '1month': '1개월이상',
  '3month': '3개월이상',
  '6month': '6개월이상',
  '12month': '12개월이상',
};

// 필터 인터페이스
export interface SalesJobFilter {
  regions: string[];
  types: SalesJobType[];
  salaryTypes: SalaryType[];
  positions: SalesPosition[];
  experiences: ExperienceLevel[];
  companyTypes: CompanyType[];
  tiers: SalesJobTier[];
}

// ========== 지원 시스템 타입 ==========

// 지원 상태
export type ApplicationStatus = 'pending' | 'viewed' | 'contacted' | 'rejected' | 'hired';

// 간편 지원 인터페이스
export interface QuickApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  status: ApplicationStatus;
  appliedAt: string;
  viewedAt?: string;
}

// 지원 상태 라벨
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: '검토중',
  viewed: '열람완료',
  contacted: '연락완료',
  rejected: '불합격',
  hired: '채용확정',
};

// 지원 상태 색상
export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  viewed: 'bg-blue-100 text-blue-700',
  contacted: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-500',
  hired: 'bg-emerald-100 text-emerald-700',
};

// ========== 이력서 타입 ==========

// 이력서 인터페이스
export interface AgentResume {
  id: string;
  userId?: string;
  // 기본 정보
  name: string;
  phone: string;
  email: string;
  birthYear?: number;
  gender?: 'male' | 'female';
  photo?: string;
  // 자격증 정보
  licenseNumber?: string; // 공인중개사 자격번호
  licenseDate?: string; // 자격 취득일
  // 경력 정보
  totalExperience: AgentExperience;
  careers: AgentCareer[];
  // 희망 조건
  preferredRegions: string[];
  preferredTypes: AgentJobType[];
  preferredSalary: {
    type: AgentSalaryType;
    min?: number;
    max?: number;
  };
  availableDate?: string; // 입사 가능일
  // 자기소개
  introduction?: string;
  strengths?: string[];
  // DNA 분석 결과
  dnaType?: AgentDNAType;
  dnaScores?: {
    risk: number;
    social: number;
    logic: number;
    resilience: number;
  };
  dnaAnswerDetails?: {
    category: string;
    categoryKey: string;
    question: string;
    selectedText: string;
    selectedLabel: string;
  }[];
  // 메타 정보
  createdAt: string;
  updatedAt: string;
  isPublic: boolean; // 이력서 공개 여부
}

// DNA 유형
export type AgentDNAType = 'RS' | 'RL' | 'SL' | 'LA' | 'RF';

export const DNA_TYPE_INFO: Record<AgentDNAType, {
  name: string;
  emoji: string;
  color: string;
  description: string;
}> = {
  RS: { name: '야수형 영업왕', emoji: '🦁', color: 'from-orange-500 to-red-500', description: '숨만 쉬어도 영업을 하는 천재적 재능!' },
  RL: { name: '승부사형 전략가', emoji: '🎯', color: 'from-blue-600 to-indigo-600', description: '차가운 머리와 뜨거운 심장을 가진 전략가' },
  SL: { name: '카운셀러형 전문가', emoji: '🤝', color: 'from-emerald-500 to-teal-500', description: '고객의 마음을 읽고 신뢰를 파는 전문가' },
  LA: { name: '스마트 관리형', emoji: '📊', color: 'from-violet-500 to-purple-500', description: '빈틈없는 일 처리, 뒤에서 받쳐주는 핵심 인재' },
  RF: { name: '자유영혼형 크리에이터', emoji: '🚀', color: 'from-pink-500 to-rose-500', description: '어디에도 얽매이지 않고 성과를 내는 디지털 노마드' },
};

// 경력 항목
export interface AgentCareer {
  id: string;
  company: string;
  position?: string;
  type: AgentJobType;
  region: string;
  startDate: string;
  endDate?: string; // 미입력시 현재 재직중
  isCurrent: boolean;
  description?: string;
}

// ========== 북마크 타입 ==========

export interface Bookmark {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  region: string;
  salary: string;
  deadline?: string;
  bookmarkedAt: string;
}

// ========== 사용자 인증 타입 ==========

export type AuthProvider = 'email' | 'kakao' | 'naver' | 'google';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  provider: AuthProvider;
  role: UserRole;
  userType: UserType;
  createdAt: string;
  lastLoginAt: string;
}

// 로그인 폼
export interface LoginForm {
  email: string;
  password: string;
}

// 회원가입 폼
export interface SignUpForm {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
  role: UserRole;
  userType: UserType;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing?: boolean;
}
