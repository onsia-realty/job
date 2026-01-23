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

// 공인중개사 구인공고 타입
export type AgentJobType = 'apartment' | 'villa' | 'store' | 'oneroom' | 'office';
export type AgentJobTier = 'premium' | 'normal';
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
  contactPhone?: string; // 연락처
  isBookmarked?: boolean; // 스크랩 여부
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
  commission: '수수료',
  mixed: '기본급+수수료',
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
  createdAt: string;
}

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
  apartment: '아파트',
  villa: '빌라',
  store: '상가',
  oneroom: '원룸',
  office: '오피스',
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
