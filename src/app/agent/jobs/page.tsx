'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Building,
  Home,
  Store,
  Landmark,
  Warehouse,
  Gavel,
  List,
  ArrowUpDown,
  Eye,
  Users,
  Crown,
  Flame,
  Bookmark,
  PenSquare,
  Star,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import { supabase } from '@/lib/supabase';
import type { AgentJobListing, AgentJobType, AgentJobTier, AgentSalaryType, AgentExperience } from '@/types';
import { REGIONS } from '@/types';

// 부동산 카테고리 (2-tier 시스템: 주거용/상업용)
type PropertyCategoryType = 'residential' | 'commercial';

const CATEGORY_CONFIG: Record<PropertyCategoryType, {
  label: string;
  icon: typeof Home;
  color: string;
  bgColor: string;
  textColor: string;
  types: Array<{ id: string; name: string; icon: typeof Home; color: string; bgColor: string; textColor: string; borderColor: string }>;
}> = {
  residential: {
    label: '주거용',
    icon: Home,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    types: [
      { id: 'apartment', name: '아파트', icon: Building2, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
      { id: 'officetel', name: '오피스텔', icon: Building, color: 'from-sky-500 to-sky-600', bgColor: 'bg-sky-50', textColor: 'text-sky-600', borderColor: 'border-sky-200' },
      { id: 'villa', name: '빌라/다세대', icon: Home, color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600', borderColor: 'border-indigo-200' },
    ],
  },
  commercial: {
    label: '상업용',
    icon: Store,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    types: [
      { id: 'store', name: '상가', icon: Store, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' },
      { id: 'office', name: '사무실', icon: Landmark, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-600', borderColor: 'border-orange-200' },
      { id: 'building', name: '빌딩매매', icon: Warehouse, color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
      { id: 'auction', name: '경매', icon: Gavel, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200' },
    ],
  },
};

// 모든 카테고리 평면화
const ALL_PROPERTY_TYPES = [
  ...CATEGORY_CONFIG.residential.types,
  ...CATEGORY_CONFIG.commercial.types,
];

// 샘플 데이터
const sampleJobs: AgentJobListing[] = [
  {
    id: '1',
    title: '강남 대형 아파트 전문 중개사 모집',
    description: '래미안, 자이, 힐스테이트 등 브랜드 아파트 전문',
    type: 'apartment',
    tier: 'vip',
    badges: ['hot', 'urgent'],
    salary: { type: 'mixed', amount: '300~450만', min: 300, max: 450 },
    experience: '2년 이상',
    experienceLevel: '2year',
    company: '강남프라임공인중개사',
    companyLogo: '',
    region: '서울',
    address: '강남구 테헤란로',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
    views: 3842,
    applicants: 67,
    createdAt: '2026.01.28',
    deadline: '2026-02-15',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus'],
  },
  {
    id: '10',
    title: '잠실 재건축 아파트 전문 고경력',
    description: '잠실 주공5단지 재건축 전문, 고수익',
    type: 'apartment',
    tier: 'vip',
    badges: ['hot'],
    salary: { type: 'mixed', amount: '400~600만', min: 400, max: 600 },
    experience: '5년 이상',
    experienceLevel: '5year',
    company: '잠실프레스티지공인',
    companyLogo: '',
    region: '서울',
    address: '송파구 잠실동',
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
    views: 5234,
    applicants: 112,
    createdAt: '2026.01.25',
    deadline: '2026-02-08',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus', 'vacation'],
  },
  {
    id: '2',
    title: '판교 IT밸리 오피스텔 전문 경력직',
    description: '판교 테크노밸리 오피스텔 임대/매매 전문',
    type: 'officetel',
    tier: 'premium',
    badges: ['new'],
    salary: { type: 'commission', amount: '수수료 75%' },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '판교밸리부동산',
    region: '경기',
    address: '성남시 분당구 판교역로',
    views: 2156,
    applicants: 34,
    createdAt: '2026.01.30',
    deadline: '2026-02-20',
    benefits: ['parking', 'flexible', 'laptop'],
  },
  {
    id: '3',
    title: '홍대 상권 상가 전문가 급구',
    description: '홍대/합정 상가, 프랜차이즈 입점 전문',
    type: 'store',
    tier: 'premium',
    badges: ['urgent', 'hot'],
    salary: { type: 'mixed', amount: '250만+α', min: 250 },
    experience: '3년 이상',
    experienceLevel: '3year',
    company: '홍대스타부동산',
    region: '서울',
    address: '마포구 양화로',
    views: 1987,
    applicants: 23,
    createdAt: '2026.01.29',
    deadline: '2026-02-03',
    benefits: ['insurance', 'incentive', 'meal'],
  },
  {
    id: '4',
    title: '여의도 프라임 오피스 임대 전문',
    description: 'IFC, 파크원 등 프라임 오피스 빌딩 전문',
    type: 'office',
    tier: 'premium',
    badges: ['hot'],
    salary: { type: 'monthly', amount: '350~500만', min: 350, max: 500 },
    experience: '5년 이상',
    experienceLevel: '5year',
    company: '여의도타워공인',
    region: '서울',
    address: '영등포구 여의대로',
    views: 4521,
    applicants: 89,
    createdAt: '2026.01.27',
    deadline: '2026-02-10',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus', 'vacation'],
  },
  {
    id: '5',
    title: '강남 꼬마빌딩 매매 전문 에이전트',
    description: '50억 이하 꼬마빌딩 매매 전문, 고수익',
    type: 'building',
    tier: 'premium',
    badges: ['new'],
    salary: { type: 'commission', amount: '건당 협의' },
    experience: '3년 이상',
    experienceLevel: '3year',
    company: '강남빌딩전문중개',
    region: '서울',
    address: '강남구 논현로',
    views: 2876,
    applicants: 41,
    createdAt: '2026.01.31',
    deadline: '2026-02-28',
    benefits: ['flexible', 'incentive'],
  },
  {
    id: '13',
    title: '서울 법원경매 전문 컨설턴트 모집',
    description: '경매/공매 전문, NPL 투자 컨설팅',
    type: 'auction',
    tier: 'premium',
    badges: ['hot'],
    salary: { type: 'commission', amount: '수수료 80%' },
    experience: '2년 이상',
    experienceLevel: '2year',
    company: '서울경매전문',
    region: '서울',
    views: 1567,
    applicants: 29,
    createdAt: '2026.01.29',
    deadline: '2026-02-15',
    benefits: ['flexible', 'incentive', 'education'],
  },
  {
    id: '6',
    title: '신림동 빌라/다세대 전문 신입환영',
    description: '관악구 빌라 전문, 초보자 교육 시스템 완비',
    type: 'villa',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'mixed', amount: '200만+α', min: 200 },
    experience: '경력무관',
    experienceLevel: 'none',
    company: '신림프라임부동산',
    region: '서울',
    views: 1234,
    applicants: 18,
    createdAt: '2026.01.30',
    isAlwaysRecruiting: true,
    benefits: ['insurance', 'education', 'transport'],
  },
  {
    id: '7',
    title: '분당 아파트 전문 경력 중개사',
    description: '분당 신도시 대단지 아파트 전문',
    type: 'apartment',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '250~320만', min: 250, max: 320 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '분당센트럴공인',
    region: '경기',
    views: 987,
    applicants: 21,
    createdAt: '2026.01.28',
    deadline: '2026-02-15',
    benefits: ['insurance', 'parking'],
  },
  {
    id: '8',
    title: '송도 오피스텔 임대 관리 전문',
    description: '송도국제도시 오피스텔 임대 관리',
    type: 'officetel',
    tier: 'normal',
    badges: [],
    salary: { type: 'monthly', amount: '280만' },
    experience: '6개월 이상',
    experienceLevel: '6month',
    company: '송도글로벌부동산',
    region: '인천',
    views: 654,
    applicants: 12,
    createdAt: '2026.01.27',
    deadline: '2026-02-20',
    benefits: ['insurance', 'meal'],
  },
  {
    id: '9',
    title: '강동구 상가 임대 전문 중개사',
    description: '천호/길동 상권 상가 전문',
    type: 'store',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '220만+α', min: 220 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '강동상가전문',
    region: '서울',
    views: 432,
    applicants: 8,
    createdAt: '2026.01.26',
    deadline: '2026-02-25',
    benefits: ['insurance', 'transport'],
  },
  {
    id: '11',
    title: '해운대 오피스텔 전문 중개사',
    description: '해운대 마린시티 오피스텔 전문',
    type: 'officetel',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'mixed', amount: '230~280만', min: 230, max: 280 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '해운대마린공인',
    region: '부산',
    views: 876,
    applicants: 15,
    createdAt: '2026.01.29',
    deadline: '2026-02-18',
    benefits: ['insurance', 'parking'],
  },
  {
    id: '12',
    title: '대전 둔산동 사무실 임대 전문',
    description: '둔산동 오피스 빌딩 임대 전문',
    type: 'office',
    tier: 'normal',
    badges: [],
    salary: { type: 'monthly', amount: '250만' },
    experience: '6개월 이상',
    experienceLevel: '6month',
    company: '대전오피스공인',
    region: '대전',
    views: 345,
    applicants: 6,
    createdAt: '2026.01.24',
    deadline: '2026-02-28',
    benefits: ['insurance'],
  },
  // ===== 상업용 VIP =====
  {
    id: '20',
    title: '강남역 프라임 상가 빌딩 전문 수석 컨설턴트',
    description: '강남역 메인 상권 프라임 상가, 연 매출 100억 이상 대형 프랜차이즈 입점 전문',
    type: 'store',
    tier: 'vip',
    badges: ['hot'],
    salary: { type: 'commission', amount: '건당 5,000만~1억', min: 5000, max: 10000 },
    experience: '5년 이상',
    experienceLevel: '5year',
    company: '강남프라임상가',
    companyLogo: '',
    region: '서울',
    address: '강남구 강남대로',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
    views: 8920,
    applicants: 156,
    createdAt: '2026.02.03',
    deadline: '2026-02-28',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus', 'vacation'],
  },
  {
    id: '21',
    title: '여의도 IFC 빌딩매매 전문 투자자문',
    description: 'IFC, 파크원 등 여의도 프라임 오피스 빌딩 매매/투자자문',
    type: 'building',
    tier: 'vip',
    badges: ['hot', 'new'],
    salary: { type: 'commission', amount: '건당 1억~', min: 10000 },
    experience: '10년 이상',
    experienceLevel: '5year',
    company: '여의도캐피탈부동산',
    companyLogo: '',
    region: '서울',
    address: '영등포구 국제금융로',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
    views: 12340,
    applicants: 203,
    createdAt: '2026.02.04',
    deadline: '2026-03-15',
    benefits: ['insurance', 'incentive', 'parking', 'meal', 'bonus', 'vacation', 'flexible'],
  },
  // ===== 상업용 Premium 추가 =====
  {
    id: '22',
    title: '판교 IT기업 사무실 임대 전문',
    description: '판교 테크노밸리 오피스 임대 전문, 대기업/스타트업 유치',
    type: 'office',
    tier: 'premium',
    badges: ['new'],
    salary: { type: 'mixed', amount: '300만+α', min: 300 },
    experience: '2년 이상',
    experienceLevel: '2year',
    company: '판교오피스전문',
    region: '경기',
    address: '성남시 분당구 판교역로',
    views: 3210,
    applicants: 47,
    createdAt: '2026.02.01',
    deadline: '2026-02-25',
    benefits: ['insurance', 'incentive', 'parking', 'laptop'],
  },
  {
    id: '23',
    title: '수원 인계동 상가 임대 전문 중개사',
    description: '수원 인계동 먹자골목/메인상권 상가 전문',
    type: 'store',
    tier: 'premium',
    badges: ['urgent'],
    salary: { type: 'mixed', amount: '250만+α', min: 250 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '수원스타부동산',
    region: '경기',
    address: '수원시 팔달구 인계동',
    views: 1890,
    applicants: 31,
    createdAt: '2026.01.30',
    deadline: '2026-02-10',
    benefits: ['insurance', 'incentive', 'meal'],
  },
  {
    id: '24',
    title: '부산 해운대 경매 전문 컨설턴트',
    description: '부산 상업시설/오피스 경매 전문, NPL 투자',
    type: 'auction',
    tier: 'premium',
    badges: ['hot'],
    salary: { type: 'commission', amount: '수수료 85%' },
    experience: '3년 이상',
    experienceLevel: '3year',
    company: '부산경매전문',
    region: '부산',
    views: 2340,
    applicants: 38,
    createdAt: '2026.01.28',
    deadline: '2026-02-20',
    benefits: ['flexible', 'incentive', 'education'],
  },
  // ===== 상업용 Normal 추가 =====
  {
    id: '25',
    title: '일산 상가 임대 관리 신입 환영',
    description: '일산 웨스턴돔/라페스타 상가 관리',
    type: 'store',
    tier: 'normal',
    badges: ['new'],
    salary: { type: 'mixed', amount: '200만+α', min: 200 },
    experience: '경력무관',
    experienceLevel: 'none',
    company: '일산프라임부동산',
    region: '경기',
    views: 567,
    applicants: 9,
    createdAt: '2026.01.27',
    isAlwaysRecruiting: true,
    benefits: ['insurance', 'education'],
  },
  {
    id: '26',
    title: '천안 사무실 임대 전문 중개사',
    description: '천안 불당동/쌍용동 오피스 임대',
    type: 'office',
    tier: 'normal',
    badges: [],
    salary: { type: 'monthly', amount: '230만' },
    experience: '6개월 이상',
    experienceLevel: '6month',
    company: '천안오피스공인',
    region: '충남',
    views: 234,
    applicants: 4,
    createdAt: '2026.01.25',
    deadline: '2026-02-28',
    benefits: ['insurance'],
  },
  {
    id: '27',
    title: '대구 동성로 상가 전문 중개사',
    description: '동성로/반월당 상권 상가 임대/매매',
    type: 'store',
    tier: 'normal',
    badges: [],
    salary: { type: 'mixed', amount: '220만+α', min: 220 },
    experience: '1년 이상',
    experienceLevel: '1year',
    company: '대구상가전문',
    region: '대구',
    views: 389,
    applicants: 7,
    createdAt: '2026.01.24',
    deadline: '2026-02-20',
    benefits: ['insurance', 'transport'],
  },
  {
    id: '28',
    title: '광주 충장로 빌딩매매 전문',
    description: '충장로/상무지구 빌딩 매매 중개',
    type: 'building',
    tier: 'normal',
    badges: [],
    salary: { type: 'commission', amount: '건당 협의' },
    experience: '3년 이상',
    experienceLevel: '3year',
    company: '광주빌딩전문',
    region: '광주',
    views: 198,
    applicants: 3,
    createdAt: '2026.01.23',
    deadline: '2026-03-10',
    benefits: ['flexible'],
  },
  {
    id: '29',
    title: '인천 송도 경매 물건 분석 보조',
    description: '송도/청라 상업시설 경매 분석 보조',
    type: 'auction',
    tier: 'normal',
    badges: [],
    salary: { type: 'monthly', amount: '220만' },
    experience: '경력무관',
    experienceLevel: 'none',
    company: '인천경매컨설팅',
    region: '인천',
    views: 312,
    applicants: 5,
    createdAt: '2026.01.22',
    deadline: '2026-02-15',
    benefits: ['insurance', 'education'],
  },
];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'views', label: '조회순' },
  { value: 'applicants', label: '지원자순' },
  { value: 'deadline', label: '마감임박순' },
  { value: 'salary', label: '급여순' },
];

const BADGE_CONFIG: Record<string, { label: string; icon: typeof Flame; color: string }> = {
  new: { label: 'NEW', icon: Sparkles, color: 'bg-emerald-500 text-white' },
  hot: { label: 'HOT', icon: Flame, color: 'bg-red-500 text-white' },
  urgent: { label: '급구', icon: AlertCircle, color: 'bg-orange-500 text-white' },
};

// D-Day 계산
function getDDay(deadline?: string, isAlwaysRecruiting?: boolean): { text: string; color: string; urgent: boolean } {
  if (isAlwaysRecruiting) return { text: '상시', color: 'bg-blue-100 text-blue-600', urgent: false };
  if (!deadline) return { text: '상시', color: 'bg-slate-100 text-slate-500', urgent: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: '마감', color: 'bg-slate-200 text-slate-400', urgent: false };
  if (diffDays === 0) return { text: 'D-DAY', color: 'bg-red-500 text-white', urgent: true };
  if (diffDays <= 3) return { text: `D-${diffDays}`, color: 'bg-red-500 text-white', urgent: true };
  if (diffDays <= 7) return { text: `D-${diffDays}`, color: 'bg-orange-500 text-white', urgent: true };
  return { text: `D-${diffDays}`, color: 'bg-slate-100 text-slate-600', urgent: false };
}

// 카테고리 찾기
function getCategory(type: string) {
  const found = ALL_PROPERTY_TYPES.find(c => c.id === type);
  return found || ALL_PROPERTY_TYPES[0];
}

export default function AgentJobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedMainCategory, setSelectedMainCategory] = useState<PropertyCategoryType>('residential');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [allJobs, setAllJobs] = useState<AgentJobListing[]>(sampleJobs);

  // VIP 슬라이더 상태
  const [vipSlideIndex, setVipSlideIndex] = useState(0);
  const [isVipAutoPlaying, setIsVipAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const ITEMS_PER_PAGE = 20;

  // Supabase에서 agent 공고 가져와서 샘플 데이터와 병합
  useEffect(() => {
    async function fetchAgentJobs() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('category', 'agent')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch agent jobs error:', error);
        return;
      }

      if (data && data.length > 0) {
        const dbJobs: AgentJobListing[] = data.map((job: any, index: number) => ({
          id: job.id,
          title: job.title,
          description: job.description || '',
          type: job.type as AgentJobType,
          // 최근 등록 2개는 VIP로 자동 승격
          tier: (index < 2 ? 'vip' : (job.tier || 'normal')) as AgentJobTier,
          badges: job.badges || [],
          salary: {
            type: (job.salary_type || 'monthly') as AgentSalaryType,
            amount: job.salary_amount || undefined,
          },
          experience: job.experience || '경력무관',
          experienceLevel: (job.experience || 'none') as AgentExperience,
          company: job.company || '',
          region: job.region || '',
          address: job.address || undefined,
          thumbnail: job.thumbnail || undefined,
          views: job.views || 0,
          applicants: 0,
          createdAt: new Date(job.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
          }).replace(/\. /g, '.').replace(/\.$/, ''),
          deadline: job.deadline || undefined,
          benefits: job.benefits || [],
          contactName: job.contact_name || undefined,
          contactPhone: job.phone || undefined,
        }));

        const dbIds = new Set(dbJobs.map(j => j.id));
        const merged = [...dbJobs, ...sampleJobs.filter(j => !dbIds.has(j.id))];
        setAllJobs(merged);
      }
    }

    fetchAgentJobs();
  }, []);

  const currentConfig = CATEGORY_CONFIG[selectedMainCategory];

  // 필터링 및 정렬
  const filteredJobs = useMemo(() => {
    const validTypes = currentConfig.types.map(t => t.id);

    let result = allJobs.filter((job) => {
      if (!validTypes.includes(job.type)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !job.title.toLowerCase().includes(query) &&
          !job.company.toLowerCase().includes(query) &&
          !job.region.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (selectedRegion !== '전체' && job.region !== selectedRegion) return false;
      if (selectedCategory && job.type !== selectedCategory) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'views': return b.views - a.views;
        case 'applicants': return (b.applicants || 0) - (a.applicants || 0);
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'salary': return (b.salary.min || 0) - (a.salary.min || 0);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [allJobs, searchQuery, selectedRegion, selectedCategory, sortBy, currentConfig]);

  // Tier별 분리
  const vipJobs = filteredJobs.filter(j => j.tier === 'vip');
  const premiumJobs = filteredJobs.filter(j => j.tier === 'premium');
  const normalJobs = filteredJobs.filter(j => j.tier === 'normal');

  // 일반 공고 페이지네이션
  const totalNormalPages = Math.ceil(normalJobs.length / ITEMS_PER_PAGE);
  const paginatedNormalJobs = normalJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalJobCount = filteredJobs.length;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('전체');
    setSelectedCategory(null);
    setCurrentPage(1);
  };

  const toggleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  // VIP 슬라이더 자동 재생
  const vipSliderJobs = vipJobs.slice(0, 8);
  useEffect(() => {
    if (!isVipAutoPlaying || vipSliderJobs.length <= 1) return;
    const timer = setInterval(() => {
      setVipSlideIndex(prev => (prev + 1) % vipSliderJobs.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isVipAutoPlaying, vipSliderJobs.length]);

  const goVipPrev = () => {
    setVipSlideIndex(prev => (prev - 1 + vipSliderJobs.length) % vipSliderJobs.length);
    setIsVipAutoPlaying(false);
    setTimeout(() => setIsVipAutoPlaying(true), 10000);
  };
  const goVipNext = () => {
    setVipSlideIndex(prev => (prev + 1) % vipSliderJobs.length);
    setIsVipAutoPlaying(false);
    setTimeout(() => setIsVipAutoPlaying(true), 10000);
  };
  const handleVipTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleVipTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleVipTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goVipNext();
      else goVipPrev();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header variant="agent" />

      {/* 검색 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 pt-4 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          {/* 검색바 & 지역 필터 (숨김 - 유료 광고 노출 우선) */}
          <div className="hidden flex-col md:flex-row gap-3">
            {/* 검색바 */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="회사명, 지역, 키워드로 검색"
                className="w-full bg-white text-slate-700 placeholder-slate-400 pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 지역 선택 */}
            <div className="relative md:w-40">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedRegion}
                onChange={(e) => { setSelectedRegion(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white text-slate-700 pl-10 pr-4 py-3.5 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="전체">전체 지역</option>
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 카테고리 선택 (주거용 / 상업용) */}
          <div className="flex gap-3 mt-4">
            {(Object.entries(CATEGORY_CONFIG) as [PropertyCategoryType, typeof CATEGORY_CONFIG.residential][]).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = selectedMainCategory === key;
              const subTypeNames = config.types.map(t => t.name).join(', ');
              return (
                <button
                  key={key}
                  onClick={() => { setSelectedMainCategory(key); setSelectedCategory(null); setCurrentPage(1); }}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-slate-800 shadow-lg'
                      : 'bg-white/10 text-white/90 hover:bg-white/20'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? config.textColor : ''}`} />
                  <div className="text-left">
                    <span className="font-semibold">{config.label}</span>
                    <p className={`text-xs ${isActive ? 'text-slate-500' : 'text-white/70'}`}>
                      ({subTypeNames})
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 (풀 너비) */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 상단 정보바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">채용공고</h1>
            <span className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">
              {totalJobCount}건
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 정렬 */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-sm text-slate-700 pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {totalJobCount > 0 ? (
          <div className="space-y-8">

            {/* ★ VIP 슬라이드 배너 */}
            {vipSliderJobs.length > 0 && (
              <section className="mb-6">
                <div
                  className="relative bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 overflow-hidden"
                  onTouchStart={handleVipTouchStart}
                  onTouchMove={handleVipTouchMove}
                  onTouchEnd={handleVipTouchEnd}
                  onMouseEnter={() => setIsVipAutoPlaying(false)}
                  onMouseLeave={() => setIsVipAutoPlaying(true)}
                >
                  {(() => {
                    const job = vipSliderJobs[vipSlideIndex];
                    if (!job) return null;
                    const dday = getDDay(job.deadline, job.isAlwaysRecruiting);
                    return (
                      <Link href={`/agent/jobs/${job.id}`} className="block">
                        <div className="flex flex-col sm:flex-row">
                          {/* 썸네일 */}
                          <div className="relative w-full sm:w-72 h-48 sm:h-52 bg-gradient-to-br from-amber-100 to-yellow-100 flex-shrink-0 overflow-hidden">
                            {job.thumbnail ? (
                              <img src={job.thumbnail} alt={job.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-16 h-16 text-amber-200" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-current" /> VIP
                              </span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${dday.color}`}>
                                {dday.text}
                              </span>
                            </div>
                            <div className="absolute bottom-3 right-3 text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                              {vipSlideIndex + 1} / {vipSliderJobs.length}
                            </div>
                          </div>
                          {/* 정보 */}
                          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                {job.type}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" /> {job.region}
                              </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5 line-clamp-2">
                              {job.title}
                            </h3>
                            {job.description && (
                              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{job.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-bold text-amber-600">{job.salary.amount || '면접 후 결정'}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{job.views}</span>
                                <span>{job.company}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })()}

                  {/* 네비게이션 버튼 */}
                  {vipSliderJobs.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.preventDefault(); goVipPrev(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); goVipNext(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </>
                  )}

                  {/* 도트 인디케이터 */}
                  {vipSliderJobs.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {vipSliderJobs.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.preventDefault(); setVipSlideIndex(idx); }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === vipSlideIndex ? 'bg-amber-500 w-5' : 'bg-amber-300/50 hover:bg-amber-400/70'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ★ VIP 공고 섹션 (4칸 x 2열 = 8개 고정) */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h2 className="text-lg font-bold text-slate-800">VIP 공고</h2>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                  {vipJobs.length}건
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* 실제 VIP 공고 */}
                {vipJobs.slice(0, 8).map((job) => {
                  const dday = getDDay(job.deadline, job.isAlwaysRecruiting);
                  const isBookmarked = bookmarkedJobs.includes(job.id);

                  return (
                    <div
                      key={job.id}
                      className="group bg-white rounded-xl border-2 border-amber-300 hover:border-amber-400 hover:shadow-xl transition-all overflow-hidden"
                      style={{ boxShadow: '0 0 12px rgba(245, 158, 11, 0.08)' }}
                    >
                      {/* 썸네일 */}
                      <div className="relative h-32 bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
                        {job.thumbnail ? (
                          <img src={job.thumbnail} alt={job.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-amber-200" />
                          </div>
                        )}
                        {/* 배지 오버레이 */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" /> VIP
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${dday.color}`}>
                            {dday.text}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleBookmark(job.id)}
                          className={`absolute top-2 right-2 p-1 rounded-full backdrop-blur-sm transition-colors ${
                            isBookmarked ? 'bg-emerald-500/90 text-white' : 'bg-white/80 text-slate-400 hover:text-emerald-600'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* 카드 내용 */}
                      <div className="p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-5 h-5 bg-amber-50 rounded flex items-center justify-center flex-shrink-0 overflow-hidden border border-amber-200">
                            {(job.companyLogo || job.thumbnail) ? (
                              <img src={job.companyLogo || job.thumbnail} alt="" className="w-5 h-5 object-cover" />
                            ) : (
                              <Building2 className="w-3 h-3 text-amber-400" />
                            )}
                          </div>
                          <span className="text-xs text-slate-500 truncate">{job.company}</span>
                        </div>

                        <Link href={`/agent/jobs/${job.id}`} className="block">
                          <h3 className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors mb-1.5 line-clamp-2 leading-tight">
                            {job.title}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-1 text-xs text-slate-400 mb-1.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{job.region}</span>
                        </div>

                        <p className="text-sm font-bold text-amber-600">{job.salary.amount}</p>
                      </div>
                    </div>
                  );
                })}

                {/* VIP 빈 슬롯 - 광고 가능 플레이스홀더 */}
                {Array.from({ length: Math.max(0, 8 - vipJobs.length) }).map((_, idx) => (
                  <Link
                    key={`vip-empty-${idx}`}
                    href="/event/premium"
                    className="group bg-gradient-to-br from-amber-50/50 to-yellow-50/50 rounded-xl border-2 border-dashed border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all overflow-hidden flex flex-col items-center justify-center min-h-[200px] cursor-pointer"
                  >
                    <div className="relative h-32 w-full flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors flex items-center justify-center">
                        <Star className="w-8 h-8 text-amber-300 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-sm font-bold text-amber-500 group-hover:text-amber-600 mb-1">VIP 광고</p>
                      <p className="text-xs text-amber-400">이 자리에 공고를 노출하세요</p>
                      <p className="text-[10px] text-amber-300 mt-1">클릭하여 자세히 보기 →</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ⭐ 프리미엄 공고 섹션 (5칸 x 3열 = 15개 고정) */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-800">프리미엄 공고</h2>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                  {premiumJobs.length}건
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 실제 프리미엄 공고 */}
                {premiumJobs.slice(0, 15).map((job) => {
                  const dday = getDDay(job.deadline, job.isAlwaysRecruiting);
                  const isBookmarked = bookmarkedJobs.includes(job.id);

                  return (
                    <div
                      key={job.id}
                      className="group bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all p-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full"></div>

                      <div className="relative">
                        {/* 배지 줄 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> P
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${dday.color}`}>
                              {dday.text}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleBookmark(job.id)}
                            className={`p-1 rounded transition-colors ${
                              isBookmarked ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-600'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* 회사 로고 + 회사명 */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-7 h-7 bg-blue-50 rounded flex items-center justify-center flex-shrink-0 overflow-hidden border border-blue-100">
                            {(job.companyLogo || job.thumbnail) ? (
                              <img src={job.companyLogo || job.thumbnail} alt="" className="w-7 h-7 object-cover" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-blue-400" />
                            )}
                          </div>
                          <span className="text-xs text-slate-500 truncate">{job.company}</span>
                        </div>

                        {/* 제목 */}
                        <Link href={`/agent/jobs/${job.id}`}>
                          <h3 className="font-semibold text-slate-800 text-xs group-hover:text-blue-600 transition-colors mb-2 line-clamp-2 leading-snug">
                            {job.title}
                          </h3>
                        </Link>

                        {/* 지역 + 급여 */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{job.region}</span>
                        </div>
                        <p className="text-xs font-bold text-blue-600">{job.salary.amount}</p>
                      </div>
                    </div>
                  );
                })}

                {/* 프리미엄 빈 슬롯 - 광고 가능 플레이스홀더 */}
                {Array.from({ length: Math.max(0, 15 - premiumJobs.length) }).map((_, idx) => (
                  <Link
                    key={`premium-empty-${idx}`}
                    href="/event/premium"
                    className="group bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all p-3 flex flex-col items-center justify-center min-h-[140px] cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors flex items-center justify-center mb-2">
                      <Crown className="w-5 h-5 text-blue-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p className="text-xs font-bold text-blue-400 group-hover:text-blue-600 mb-0.5">프리미엄 광고</p>
                    <p className="text-[10px] text-blue-300 text-center">공고를 노출하세요</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* 일반 공고 섹션 (텍스트 리스트) */}
            {normalJobs.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <List className="w-5 h-5 text-slate-500" />
                  <h2 className="text-lg font-bold text-slate-800">일반 공고</h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {normalJobs.length}건
                  </span>
                </div>

                {/* 테이블 헤더 (데스크톱) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-slate-100 rounded-t-lg text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <div className="col-span-5">공고제목</div>
                  <div className="col-span-2">회사명</div>
                  <div className="col-span-1">지역</div>
                  <div className="col-span-2">급여</div>
                  <div className="col-span-1 text-center">마감</div>
                  <div className="col-span-1 text-center">조회</div>
                </div>

                <div className="bg-white rounded-b-lg md:rounded-t-none rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {paginatedNormalJobs.map((job) => {
                    const category = getCategory(job.type);
                    const dday = getDDay(job.deadline, job.isAlwaysRecruiting);

                    return (
                      <Link
                        key={job.id}
                        href={`/agent/jobs/${job.id}`}
                        className="block hover:bg-slate-50 transition-colors"
                      >
                        {/* 데스크톱 뷰 */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3.5 items-center">
                          <div className="col-span-5 flex items-center gap-2 min-w-0">
                            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${category.bgColor} ${category.textColor}`}>
                              {category.name}
                            </span>
                            {job.badges.includes('new') && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500 text-white flex-shrink-0">N</span>
                            )}
                            <span className="text-sm font-medium text-slate-800 truncate">{job.title}</span>
                          </div>
                          <div className="col-span-2 text-sm text-slate-600 truncate">{job.company}</div>
                          <div className="col-span-1 text-sm text-slate-500">{job.region}</div>
                          <div className="col-span-2 text-sm font-medium text-emerald-600 truncate">{job.salary.amount}</div>
                          <div className="col-span-1 flex justify-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dday.color}`}>
                              {dday.text}
                            </span>
                          </div>
                          <div className="col-span-1 text-center text-xs text-slate-400">{job.views.toLocaleString()}</div>
                        </div>

                        {/* 모바일 뷰 */}
                        <div className="md:hidden px-4 py-3.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${category.bgColor} ${category.textColor}`}>
                              {category.name}
                            </span>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${dday.color}`}>
                              {dday.text}
                            </span>
                            {job.badges.includes('new') && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500 text-white">N</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-800 mb-1 line-clamp-1">{job.title}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{job.company}</span>
                            <span>·</span>
                            <span>{job.region}</span>
                            <span>·</span>
                            <span className="text-emerald-600 font-medium">{job.salary.amount}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* 페이지네이션 (일반 공고) */}
                {totalNormalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalNormalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalNormalPages <= 7) return true;
                          if (page === 1 || page === totalNormalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, index, arr) => {
                          const prevPage = arr[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          return (
                            <span key={page} className="flex items-center">
                              {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                {page}
                              </button>
                            </span>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalNormalPages, p + 1))}
                      disabled={currentPage === totalNormalPages}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </section>
            )}

          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">검색 결과가 없습니다</h3>
            <p className="text-slate-500 mb-6">다른 조건으로 검색해보세요</p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <X className="w-4 h-4" />
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {/* 구인글 작성 FAB */}
      <Link
        href="/agent/jobs/new"
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 flex items-center gap-2 bg-emerald-600 text-white pl-4 pr-5 py-3.5 rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:shadow-xl active:scale-95"
      >
        <PenSquare className="w-5 h-5" />
        <span className="font-semibold text-sm">구인글 작성</span>
      </Link>

      <MobileNav variant="agent" />
    </div>
  );
}
