'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Briefcase, CreditCard, Megaphone, Settings,
  TrendingUp, TrendingDown, UserPlus, DollarSign, FileText, Send,
  Search, ChevronDown, Ban, Trash2, CheckCircle2, XCircle, Eye,
  ArrowLeft, Crown, Star, Clock, AlertCircle, ToggleLeft, ToggleRight,
  Activity, Bell, Image as ImageIcon, Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================
// TYPES
// ============================================================
type TabId = 'dashboard' | 'members' | 'jobs' | 'payments' | 'ads' | 'settings';

interface Member {
  id: number;
  name: string;
  email: string;
  role: '구인' | '구직';
  type: '공인중개사' | '분양상담사';
  joinDate: string;
  status: '활성' | '정지';
}

interface Job {
  id: number;
  title: string;
  company: string;
  category: '공인중개사' | '분양상담사';
  tier: 'vip' | 'premium' | 'normal';
  createdAt: string;
  deadline: string;
  views: number;
  applications: number;
  status: '게시중' | '승인대기' | '반려' | '마감';
}

interface Payment {
  id: number;
  userName: string;
  product: string;
  amount: number;
  date: string;
  status: '완료' | '대기' | '취소';
  invoice: boolean;
}

interface Ad {
  id: number;
  advertiser: string;
  tier: 'VIP' | 'Premium' | 'Standard';
  startDate: string;
  endDate: string;
  remainDays: number;
  impressions: number;
  clicks: number;
  status: '활성' | '만료' | '일시중지';
}

interface Banner {
  id: number;
  title: string;
  position: '홈 상단' | '홈 중간' | '사이드바' | '공고 상세';
  active: boolean;
}

interface Notice {
  id: number;
  title: string;
  badge: '공지' | '이벤트' | '업데이트' | '긴급';
  active: boolean;
  createdAt: string;
}

// ============================================================
// MOCK DATA
// ============================================================
const mockMembers: Member[] = [
  { id: 1, name: '김영수', email: 'kim@test.com', role: '구인', type: '공인중개사', joinDate: '2025-01-05', status: '활성' },
  { id: 2, name: '이미영', email: 'lee@test.com', role: '구직', type: '분양상담사', joinDate: '2025-01-08', status: '활성' },
  { id: 3, name: '박준혁', email: 'park@test.com', role: '구인', type: '분양상담사', joinDate: '2025-01-12', status: '정지' },
  { id: 4, name: '최수진', email: 'choi@test.com', role: '구직', type: '공인중개사', joinDate: '2025-01-15', status: '활성' },
  { id: 5, name: '정다은', email: 'jung@test.com', role: '구인', type: '공인중개사', joinDate: '2025-01-18', status: '활성' },
  { id: 6, name: '한지민', email: 'han@test.com', role: '구직', type: '분양상담사', joinDate: '2025-01-20', status: '활성' },
  { id: 7, name: '오승우', email: 'oh@test.com', role: '구인', type: '공인중개사', joinDate: '2025-01-22', status: '정지' },
  { id: 8, name: '강민서', email: 'kang@test.com', role: '구직', type: '분양상담사', joinDate: '2025-01-25', status: '활성' },
  { id: 9, name: '윤서연', email: 'yoon@test.com', role: '구인', type: '공인중개사', joinDate: '2025-02-01', status: '활성' },
  { id: 10, name: '임재현', email: 'lim@test.com', role: '구직', type: '분양상담사', joinDate: '2025-02-03', status: '활성' },
  { id: 11, name: '송혜진', email: 'song@test.com', role: '구인', type: '공인중개사', joinDate: '2025-02-05', status: '활성' },
  { id: 12, name: '조성민', email: 'jo@test.com', role: '구직', type: '공인중개사', joinDate: '2025-02-08', status: '정지' },
  { id: 13, name: '배수현', email: 'bae@test.com', role: '구인', type: '분양상담사', joinDate: '2025-02-10', status: '활성' },
  { id: 14, name: '류지훈', email: 'ryu@test.com', role: '구직', type: '공인중개사', joinDate: '2025-02-12', status: '활성' },
  { id: 15, name: '홍은비', email: 'hong@test.com', role: '구인', type: '분양상담사', joinDate: '2025-02-15', status: '활성' },
];

const mockJobs: Job[] = [
  { id: 1, title: '강남역 중개보조 구합니다', company: '강남부동산', category: '공인중개사', tier: 'vip', createdAt: '2025-01-10', deadline: '2025-03-10', views: 1254, applications: 23, status: '게시중' },
  { id: 2, title: '분양상담사 급구', company: '한화 포레나', category: '분양상담사', tier: 'premium', createdAt: '2025-01-12', deadline: '2025-02-28', views: 892, applications: 15, status: '게시중' },
  { id: 3, title: '역삼동 오피스텔 중개사', company: '역삼공인', category: '공인중개사', tier: 'normal', createdAt: '2025-01-15', deadline: '2025-03-15', views: 456, applications: 8, status: '승인대기' },
  { id: 4, title: '송도 래미안 분양팀', company: '래미안 송도', category: '분양상담사', tier: 'vip', createdAt: '2025-01-18', deadline: '2025-03-18', views: 2103, applications: 45, status: '게시중' },
  { id: 5, title: '마포구 상가 중개보조', company: '마포부동산', category: '공인중개사', tier: 'normal', createdAt: '2025-01-20', deadline: '2025-02-20', views: 324, applications: 5, status: '마감' },
  { id: 6, title: '위례 자이 분양상담사', company: '위례 자이', category: '분양상담사', tier: 'premium', createdAt: '2025-01-22', deadline: '2025-03-22', views: 1567, applications: 32, status: '게시중' },
  { id: 7, title: '판교 오피스텔 중개', company: '판교공인', category: '공인중개사', tier: 'normal', createdAt: '2025-01-25', deadline: '2025-03-25', views: 278, applications: 4, status: '반려' },
  { id: 8, title: '김포 한강신도시 분양팀장', company: '김포 e편한세상', category: '분양상담사', tier: 'vip', createdAt: '2025-01-28', deadline: '2025-03-28', views: 1890, applications: 38, status: '게시중' },
  { id: 9, title: '잠실 아파트 중개사 모집', company: '잠실부동산', category: '공인중개사', tier: 'premium', createdAt: '2025-02-01', deadline: '2025-04-01', views: 987, applications: 19, status: '게시중' },
  { id: 10, title: '수원 광교 분양상담', company: '광교 힐스테이트', category: '분양상담사', tier: 'normal', createdAt: '2025-02-03', deadline: '2025-04-03', views: 543, applications: 11, status: '승인대기' },
  { id: 11, title: '서초동 사무실 중개', company: '서초공인', category: '공인중개사', tier: 'normal', createdAt: '2025-02-05', deadline: '2025-04-05', views: 198, applications: 3, status: '게시중' },
  { id: 12, title: '하남 미사 분양팀 구성', company: '미사 포레스트', category: '분양상담사', tier: 'premium', createdAt: '2025-02-07', deadline: '2025-04-07', views: 1345, applications: 27, status: '게시중' },
  { id: 13, title: '동탄2 오피스텔 분양', company: '동탄 푸르지오', category: '분양상담사', tier: 'vip', createdAt: '2025-02-09', deadline: '2025-04-09', views: 2456, applications: 52, status: '게시중' },
  { id: 14, title: '분당 중개보조 파트타임', company: '분당공인', category: '공인중개사', tier: 'normal', createdAt: '2025-02-11', deadline: '2025-04-11', views: 167, applications: 2, status: '게시중' },
  { id: 15, title: '인천 청라 분양상담사', company: '청라 자이', category: '분양상담사', tier: 'premium', createdAt: '2025-02-13', deadline: '2025-04-13', views: 876, applications: 16, status: '승인대기' },
];

const mockPayments: Payment[] = [
  { id: 1, userName: '김영수', product: 'VIP 공고 (30일)', amount: 990000, date: '2025-02-13', status: '완료', invoice: true },
  { id: 2, userName: '정다은', product: 'Premium 공고 (30일)', amount: 590000, date: '2025-02-12', status: '완료', invoice: false },
  { id: 3, userName: '윤서연', product: 'VIP 공고 (30일)', amount: 990000, date: '2025-02-11', status: '완료', invoice: true },
  { id: 4, userName: '송혜진', product: 'Standard 공고 (30일)', amount: 290000, date: '2025-02-10', status: '대기', invoice: false },
  { id: 5, userName: '배수현', product: 'Premium 공고 (30일)', amount: 590000, date: '2025-02-09', status: '완료', invoice: true },
  { id: 6, userName: '홍은비', product: 'VIP 공고 (60일)', amount: 1690000, date: '2025-02-08', status: '완료', invoice: true },
  { id: 7, userName: '오승우', product: 'Standard 공고 (30일)', amount: 290000, date: '2025-02-07', status: '취소', invoice: false },
  { id: 8, userName: '박준혁', product: 'Premium 공고 (60일)', amount: 990000, date: '2025-02-06', status: '완료', invoice: false },
  { id: 9, userName: '한지민', product: '배너 광고 (상단)', amount: 1500000, date: '2025-02-05', status: '완료', invoice: true },
  { id: 10, userName: '강민서', product: 'VIP 공고 (30일)', amount: 990000, date: '2025-02-04', status: '완료', invoice: false },
  { id: 11, userName: '임재현', product: 'Premium 공고 (30일)', amount: 590000, date: '2025-02-03', status: '대기', invoice: false },
  { id: 12, userName: '조성민', product: 'Standard 공고 (30일)', amount: 290000, date: '2025-02-02', status: '완료', invoice: true },
  { id: 13, userName: '류지훈', product: 'VIP 공고 (30일)', amount: 990000, date: '2025-02-01', status: '완료', invoice: false },
  { id: 14, userName: '이미영', product: '배너 광고 (사이드)', amount: 800000, date: '2025-01-30', status: '완료', invoice: true },
  { id: 15, userName: '최수진', product: 'Premium 공고 (30일)', amount: 590000, date: '2025-01-28', status: '취소', invoice: false },
];

const mockAds: Ad[] = [
  { id: 1, advertiser: '강남부동산', tier: 'VIP', startDate: '2025-01-01', endDate: '2025-03-01', remainDays: 22, impressions: 45230, clicks: 1234, status: '활성' },
  { id: 2, advertiser: '한화 포레나', tier: 'Premium', startDate: '2025-01-15', endDate: '2025-03-15', remainDays: 36, impressions: 32100, clicks: 890, status: '활성' },
  { id: 3, advertiser: '래미안 송도', tier: 'VIP', startDate: '2024-11-01', endDate: '2025-01-01', remainDays: 0, impressions: 89450, clicks: 3456, status: '만료' },
  { id: 4, advertiser: '위례 자이', tier: 'Premium', startDate: '2025-02-01', endDate: '2025-04-01', remainDays: 53, impressions: 12300, clicks: 456, status: '활성' },
  { id: 5, advertiser: '마포부동산', tier: 'Standard', startDate: '2025-01-20', endDate: '2025-02-20', remainDays: 13, impressions: 8900, clicks: 234, status: '활성' },
  { id: 6, advertiser: '김포 e편한세상', tier: 'VIP', startDate: '2025-01-10', endDate: '2025-04-10', remainDays: 62, impressions: 56700, clicks: 2345, status: '활성' },
  { id: 7, advertiser: '판교공인', tier: 'Standard', startDate: '2025-01-05', endDate: '2025-02-05', remainDays: 0, impressions: 15600, clicks: 567, status: '만료' },
  { id: 8, advertiser: '잠실부동산', tier: 'Premium', startDate: '2025-02-05', endDate: '2025-05-05', remainDays: 87, impressions: 5400, clicks: 189, status: '일시중지' },
  { id: 9, advertiser: '광교 힐스테이트', tier: 'VIP', startDate: '2025-02-10', endDate: '2025-05-10', remainDays: 92, impressions: 3200, clicks: 98, status: '활성' },
  { id: 10, advertiser: '미사 포레스트', tier: 'Premium', startDate: '2024-12-15', endDate: '2025-02-15', remainDays: 8, impressions: 67800, clicks: 2890, status: '활성' },
  { id: 11, advertiser: '동탄 푸르지오', tier: 'VIP', startDate: '2025-02-01', endDate: '2025-05-01', remainDays: 83, impressions: 8900, clicks: 345, status: '활성' },
  { id: 12, advertiser: '분당공인', tier: 'Standard', startDate: '2025-01-25', endDate: '2025-02-25', remainDays: 18, impressions: 4500, clicks: 123, status: '일시중지' },
  { id: 13, advertiser: '청라 자이', tier: 'Premium', startDate: '2025-02-08', endDate: '2025-04-08', remainDays: 60, impressions: 6700, clicks: 234, status: '활성' },
  { id: 14, advertiser: '서초공인', tier: 'Standard', startDate: '2024-12-01', endDate: '2025-01-31', remainDays: 0, impressions: 23400, clicks: 876, status: '만료' },
  { id: 15, advertiser: '역삼공인', tier: 'Standard', startDate: '2025-02-12', endDate: '2025-03-12', remainDays: 33, impressions: 1200, clicks: 45, status: '활성' },
];

const mockBanners: Banner[] = [
  { id: 1, title: '프리미엄 광고 50% 할인 배너', position: '홈 상단', active: true },
  { id: 2, title: 'AI 매칭 서비스 소개 배너', position: '홈 상단', active: true },
  { id: 3, title: '신규 가입 이벤트 배너', position: '홈 중간', active: false },
  { id: 4, title: '분양 현장 VIP 광고', position: '사이드바', active: true },
  { id: 5, title: '공인중개사 특별 프로모션', position: '공고 상세', active: true },
  { id: 6, title: '앱 다운로드 유도 배너', position: '홈 중간', active: false },
];

const mockNotices: Notice[] = [
  { id: 1, title: '부동산인 정식 오픈!', badge: '공지', active: true, createdAt: '2025-01-01' },
  { id: 2, title: '프리미엄 광고 50% 할인 이벤트', badge: '이벤트', active: true, createdAt: '2025-01-15' },
  { id: 3, title: 'AI 매칭 시스템 업그레이드', badge: '업데이트', active: true, createdAt: '2025-02-01' },
  { id: 4, title: '설 연휴 고객센터 운영 안내', badge: '공지', active: false, createdAt: '2025-01-20' },
  { id: 5, title: '시스템 점검 안내 (2/20)', badge: '긴급', active: true, createdAt: '2025-02-10' },
];

const recentActivities = [
  { id: 1, type: 'user', message: '김영수님이 VIP 공고를 등록했습니다', time: '5분 전' },
  { id: 2, type: 'payment', message: '정다은님이 Premium 결제를 완료했습니다', time: '12분 전' },
  { id: 3, type: 'job', message: '역삼동 오피스텔 중개사 공고가 승인 대기 중입니다', time: '25분 전' },
  { id: 4, type: 'user', message: '류지훈님이 신규 가입했습니다', time: '1시간 전' },
  { id: 5, type: 'ad', message: '판교공인 광고가 만료되었습니다', time: '2시간 전' },
  { id: 6, type: 'payment', message: '한지민님이 배너 광고를 결제했습니다', time: '3시간 전' },
  { id: 7, type: 'job', message: '분당 중개보조 파트타임 공고가 등록되었습니다', time: '4시간 전' },
  { id: 8, type: 'user', message: '오승우님의 계정이 정지되었습니다', time: '5시간 전' },
  { id: 9, type: 'payment', message: '홍은비님이 VIP 60일 결제를 완료했습니다', time: '6시간 전' },
  { id: 10, type: 'ad', message: '서초공인 광고가 만료되었습니다', time: '8시간 전' },
];

// 차트 데이터
const signupChartData = [
  { month: '8월', value: 45 },
  { month: '9월', value: 68 },
  { month: '10월', value: 92 },
  { month: '11월', value: 78 },
  { month: '12월', value: 134 },
  { month: '1월', value: 189 },
  { month: '2월', value: 156 },
];

const revenueChartData = [
  { month: '8월', value: 12500000 },
  { month: '9월', value: 18900000 },
  { month: '10월', value: 24300000 },
  { month: '11월', value: 21700000 },
  { month: '12월', value: 31200000 },
  { month: '1월', value: 38500000 },
  { month: '2월', value: 29800000 },
];

// ============================================================
// TABS CONFIG
// ============================================================
const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'members', label: '회원관리', icon: Users },
  { id: 'jobs', label: '공고관리', icon: Briefcase },
  { id: 'payments', label: '결제관리', icon: CreditCard },
  { id: 'ads', label: '광고관리', icon: Megaphone },
  { id: 'settings', label: '사이트설정', icon: Settings },
];

// ============================================================
// HELPER COMPONENTS
// ============================================================
function MetricCard({ label, value, sub, trend, icon: Icon, color }: {
  label: string;
  value: string;
  sub: string;
  trend: 'up' | 'down';
  icon: typeof Users;
  color: string;
}) {
  return (
    <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {sub}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function CSSBarChart({ data, formatValue, color }: {
  data: { month: string; value: number }[];
  formatValue: (v: number) => string;
  color: string;
}) {
  const max = Math.max(...data.map(d => d.value));
  const maxHeight = 120; // px
  return (
    <div className="flex items-end gap-2" style={{ height: `${maxHeight + 40}px` }}>
      {data.map((d) => {
        const barH = Math.max((d.value / max) * maxHeight, 4);
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
            <span className="text-[10px] text-gray-500 hidden sm:block">{formatValue(d.value)}</span>
            <div className="w-full relative group">
              <div
                className={`w-full rounded-t-md ${color} transition-all duration-300 hover:opacity-80`}
                style={{ height: `${barH}px` }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {formatValue(d.value)}
              </div>
            </div>
            <span className="text-[10px] text-gray-500">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    vip: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
    VIP: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
    premium: 'bg-blue-600 text-white',
    Premium: 'bg-blue-600 text-white',
    normal: 'bg-gray-600 text-gray-300',
    Standard: 'bg-gray-600 text-gray-300',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${styles[tier] || 'bg-gray-600 text-gray-300'}`}>
      {tier === 'vip' ? 'VIP' : tier === 'premium' ? 'PREMIUM' : tier === 'normal' ? '일반' : tier}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    '활성': 'bg-green-500/20 text-green-400',
    '게시중': 'bg-green-500/20 text-green-400',
    '완료': 'bg-green-500/20 text-green-400',
    '승인대기': 'bg-amber-500/20 text-amber-400',
    '대기': 'bg-amber-500/20 text-amber-400',
    '정지': 'bg-red-500/20 text-red-400',
    '반려': 'bg-red-500/20 text-red-400',
    '취소': 'bg-red-500/20 text-red-400',
    '마감': 'bg-gray-500/20 text-gray-400',
    '만료': 'bg-gray-500/20 text-gray-400',
    '일시중지': 'bg-orange-500/20 text-orange-400',
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Member filters
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('전체');
  const [memberTypeFilter, setMemberTypeFilter] = useState('전체');
  const [memberStatusFilter, setMemberStatusFilter] = useState('전체');
  const [members, setMembers] = useState<Member[]>(mockMembers);

  // Job filters
  const [jobSearch, setJobSearch] = useState('');
  const [jobCategoryFilter, setJobCategoryFilter] = useState('전체');
  const [jobTierFilter, setJobTierFilter] = useState('전체');
  const [jobStatusFilter, setJobStatusFilter] = useState('전체');
  const [jobs, setJobs] = useState<Job[]>(mockJobs);

  // Payment state
  const [payments, setPayments] = useState<Payment[]>(mockPayments);

  // Ad filter
  const [adFilter, setAdFilter] = useState('전체');

  // Settings state
  const [banners, setBanners] = useState<Banner[]>(mockBanners);
  const [notices, setNotices] = useState<Notice[]>(mockNotices);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = !memberSearch || m.name.includes(memberSearch) || m.email.includes(memberSearch);
      const matchRole = memberRoleFilter === '전체' || m.role === memberRoleFilter;
      const matchType = memberTypeFilter === '전체' || m.type === memberTypeFilter;
      const matchStatus = memberStatusFilter === '전체' || m.status === memberStatusFilter;
      return matchSearch && matchRole && matchType && matchStatus;
    });
  }, [members, memberSearch, memberRoleFilter, memberTypeFilter, memberStatusFilter]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = !jobSearch || j.title.includes(jobSearch) || j.company.includes(jobSearch);
      const matchCategory = jobCategoryFilter === '전체' || j.category === jobCategoryFilter;
      const matchTier = jobTierFilter === '전체' || j.tier === jobTierFilter;
      const matchStatus = jobStatusFilter === '전체' || j.status === jobStatusFilter;
      return matchSearch && matchCategory && matchTier && matchStatus;
    });
  }, [jobs, jobSearch, jobCategoryFilter, jobTierFilter, jobStatusFilter]);

  // Filtered ads
  const filteredAds = useMemo(() => {
    if (adFilter === '전체') return mockAds;
    return mockAds.filter(a => a.status === adFilter);
  }, [adFilter]);

  // Payment summary
  const paymentSummary = useMemo(() => {
    const completed = payments.filter(p => p.status === '완료');
    const total = completed.reduce((s, p) => s + p.amount, 0);
    const thisMonth = completed.filter(p => p.date.startsWith('2025-02')).reduce((s, p) => s + p.amount, 0);
    return { total, thisMonth, count: completed.length };
  }, [payments]);

  // Member action handlers
  const toggleMemberStatus = (id: number) => {
    setMembers(prev => prev.map(m =>
      m.id === id ? { ...m, status: m.status === '활성' ? '정지' : '활성' } : m
    ));
  };
  const deleteMember = (id: number) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  // Job action handlers
  const approveJob = (id: number) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: '게시중' } : j));
  };
  const rejectJob = (id: number) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: '반려' } : j));
  };
  const deleteJob = (id: number) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  // Payment invoice toggle
  const toggleInvoice = (id: number) => {
    setPayments(prev => prev.map(p =>
      p.id === id ? { ...p, invoice: !p.invoice } : p
    ));
  };

  // Banner toggle
  const toggleBanner = (id: number) => {
    setBanners(prev => prev.map(b =>
      b.id === id ? { ...b, active: !b.active } : b
    ));
  };

  // Notice toggle
  const toggleNotice = (id: number) => {
    setNotices(prev => prev.map(n =>
      n.id === id ? { ...n, active: !n.active } : n
    ));
  };

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#141517] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // For now, allow access without strict admin check (mock mode)
  // In production: if (!user || user.user_metadata?.role !== 'admin') { ... redirect }

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard label="총 가입자" value="1,247" sub="+12.5%" trend="up" icon={Users} color="bg-blue-600" />
        <MetricCard label="신규 가입 (이번달)" value="156" sub="+8.3%" trend="up" icon={UserPlus} color="bg-green-600" />
        <MetricCard label="총 매출" value="₩176.8M" sub="+15.2%" trend="up" icon={DollarSign} color="bg-purple-600" />
        <MetricCard label="월 매출" value="₩29.8M" sub="-4.2%" trend="down" icon={CreditCard} color="bg-cyan-600" />
        <MetricCard label="활성 공고" value="342" sub="+6.7%" trend="up" icon={FileText} color="bg-orange-600" />
        <MetricCard label="총 지원 수" value="2,847" sub="+22.1%" trend="up" icon={Send} color="bg-pink-600" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">가입자 추이 (최근 7개월)</h3>
          <CSSBarChart
            data={signupChartData}
            formatValue={(v) => `${v}명`}
            color="bg-gradient-to-t from-blue-600 to-cyan-500"
          />
        </div>
        <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">매출 추이 (최근 7개월)</h3>
          <CSSBarChart
            data={revenueChartData}
            formatValue={(v) => `${(v / 1000000).toFixed(0)}M`}
            color="bg-gradient-to-t from-purple-600 to-pink-500"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" /> 최근 활동
        </h3>
        <div className="space-y-3">
          {recentActivities.map(a => {
            const icons: Record<string, typeof Users> = { user: Users, payment: CreditCard, job: Briefcase, ad: Megaphone };
            const colors: Record<string, string> = { user: 'text-blue-400', payment: 'text-green-400', job: 'text-orange-400', ad: 'text-purple-400' };
            const Icon = icons[a.type] || Activity;
            return (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <Icon className={`w-4 h-4 ${colors[a.type] || 'text-gray-400'} shrink-0`} />
                <p className="text-sm text-gray-300 flex-1 truncate">{a.message}</p>
                <span className="text-xs text-gray-600 shrink-0">{a.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="이름 또는 이메일 검색..."
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              className="w-full bg-[#252628] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={memberRoleFilter}
              onChange={e => setMemberRoleFilter(e.target.value)}
              className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="전체">역할: 전체</option>
              <option value="구인">구인</option>
              <option value="구직">구직</option>
            </select>
            <select
              value={memberTypeFilter}
              onChange={e => setMemberTypeFilter(e.target.value)}
              className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="전체">유형: 전체</option>
              <option value="공인중개사">공인중개사</option>
              <option value="분양상담사">분양상담사</option>
            </select>
            <select
              value={memberStatusFilter}
              onChange={e => setMemberStatusFilter(e.target.value)}
              className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="전체">상태: 전체</option>
              <option value="활성">활성</option>
              <option value="정지">정지</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-[#1C1D1F] rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-500 font-medium px-4 py-3">이름</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">이메일</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">역할</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">유형</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">가입일</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">상태</th>
              <th className="text-right text-gray-500 font-medium px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map(m => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white font-medium">{m.name}</td>
                <td className="px-4 py-3 text-gray-400">{m.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === '구인' ? 'bg-blue-500/20 text-blue-400' : 'bg-teal-500/20 text-teal-400'}`}>
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{m.type}</td>
                <td className="px-4 py-3 text-gray-500">{m.joinDate}</td>
                <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => toggleMemberStatus(m.id)}
                      className={`p-1.5 rounded-md transition-colors ${m.status === '활성' ? 'text-amber-400 hover:bg-amber-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                      title={m.status === '활성' ? '정지' : '해제'}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMember(m.id)}
                      className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMembers.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">검색 결과가 없습니다</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filteredMembers.map(m => (
          <div key={m.id} className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{m.name}</span>
              <StatusBadge status={m.status} />
            </div>
            <p className="text-xs text-gray-500 mb-1">{m.email}</p>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === '구인' ? 'bg-blue-500/20 text-blue-400' : 'bg-teal-500/20 text-teal-400'}`}>
                {m.role}
              </span>
              <span className="text-xs text-gray-500">{m.type}</span>
              <span className="text-xs text-gray-600">{m.joinDate}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleMemberStatus(m.id)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${m.status === '활성' ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}
              >
                {m.status === '활성' ? '정지' : '해제'}
              </button>
              <button
                onClick={() => deleteMember(m.id)}
                className="flex-1 text-xs py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">검색 결과가 없습니다</div>
        )}
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="제목 또는 회사명 검색..."
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              className="w-full bg-[#252628] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={jobCategoryFilter}
              onChange={e => setJobCategoryFilter(e.target.value)}
              className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="전체">카테고리: 전체</option>
              <option value="공인중개사">공인중개사</option>
              <option value="분양상담사">분양상담사</option>
            </select>
            <select
              value={jobTierFilter}
              onChange={e => setJobTierFilter(e.target.value)}
              className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="전체">티어: 전체</option>
              <option value="vip">VIP</option>
              <option value="premium">Premium</option>
              <option value="normal">일반</option>
            </select>
            <select
              value={jobStatusFilter}
              onChange={e => setJobStatusFilter(e.target.value)}
              className="bg-[#252628] text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="전체">상태: 전체</option>
              <option value="게시중">게시중</option>
              <option value="승인대기">승인대기</option>
              <option value="반려">반려</option>
              <option value="마감">마감</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-[#1C1D1F] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-500 font-medium px-4 py-3">제목</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">회사</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">티어</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">등록일</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">마감일</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">조회</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">지원</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">상태</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(j => (
                <tr key={j.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{j.title}</td>
                  <td className="px-4 py-3 text-gray-400">{j.company}</td>
                  <td className="px-4 py-3"><TierBadge tier={j.tier} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{j.createdAt}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{j.deadline}</td>
                  <td className="px-4 py-3 text-gray-400 text-right">{j.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-right">{j.applications}</td>
                  <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {j.status === '승인대기' && (
                        <>
                          <button
                            onClick={() => approveJob(j.id)}
                            className="p-1.5 rounded-md text-green-400 hover:bg-green-500/10 transition-colors"
                            title="승인"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rejectJob(j.id)}
                            className="p-1.5 rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="반려"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteJob(j.id)}
                        className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredJobs.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">검색 결과가 없습니다</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filteredJobs.map(j => (
          <div key={j.id} className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TierBadge tier={j.tier} />
                  <StatusBadge status={j.status} />
                </div>
                <h4 className="text-white font-medium text-sm truncate">{j.title}</h4>
                <p className="text-xs text-gray-500">{j.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{j.views.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Send className="w-3 h-3" />{j.applications}</span>
              <span>{j.createdAt} ~ {j.deadline}</span>
            </div>
            <div className="flex gap-2">
              {j.status === '승인대기' && (
                <>
                  <button onClick={() => approveJob(j.id)} className="flex-1 text-xs py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">승인</button>
                  <button onClick={() => rejectJob(j.id)} className="flex-1 text-xs py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">반려</button>
                </>
              )}
              <button onClick={() => deleteJob(j.id)} className="flex-1 text-xs py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">삭제</button>
            </div>
          </div>
        ))}
        {filteredJobs.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">검색 결과가 없습니다</div>
        )}
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
          <p className="text-xs text-gray-500 mb-1">이번달 매출</p>
          <p className="text-xl font-bold text-white">₩{(paymentSummary.thisMonth / 10000).toLocaleString()}만</p>
        </div>
        <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
          <p className="text-xs text-gray-500 mb-1">누적 매출</p>
          <p className="text-xl font-bold text-white">₩{(paymentSummary.total / 10000).toLocaleString()}만</p>
        </div>
        <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
          <p className="text-xs text-gray-500 mb-1">결제 건수</p>
          <p className="text-xl font-bold text-white">{paymentSummary.count}건</p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-[#1C1D1F] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-500 font-medium px-4 py-3">결제자</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">상품</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">금액</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">결제일</th>
                <th className="text-left text-gray-500 font-medium px-4 py-3">상태</th>
                <th className="text-center text-gray-500 font-medium px-4 py-3">세금계산서</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{p.userName}</td>
                  <td className="px-4 py-3 text-gray-400">{p.product}</td>
                  <td className="px-4 py-3 text-gray-300 text-right font-medium">₩{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.date}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleInvoice(p.id)} className="inline-flex">
                      {p.invoice ? (
                        <ToggleRight className="w-6 h-6 text-cyan-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-600" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {payments.map(p => (
          <div key={p.id} className="bg-[#1C1D1F] rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{p.userName}</span>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-xs text-gray-500 mb-1">{p.product}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">₩{p.amount.toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{p.date}</span>
                <button onClick={() => toggleInvoice(p.id)} className="inline-flex">
                  {p.invoice ? (
                    <ToggleRight className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAds = () => (
    <div className="space-y-4">
      {/* Sub filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['전체', '활성', '만료', '일시중지'].map(f => (
          <button
            key={f}
            onClick={() => setAdFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              adFilter === f
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : 'bg-[#1C1D1F] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            {f} {f !== '전체' && (
              <span className="ml-1 text-xs opacity-70">
                ({mockAds.filter(a => a.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Ad cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAds.map(ad => (
          <div key={ad.id} className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium text-sm">{ad.advertiser}</span>
              <StatusBadge status={ad.status} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <TierBadge tier={ad.tier} />
              <span className="text-xs text-gray-600">{ad.startDate} ~ {ad.endDate}</span>
            </div>
            {ad.remainDays > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">잔여일</span>
                  <span className={`font-medium ${ad.remainDays <= 10 ? 'text-red-400' : 'text-cyan-400'}`}>{ad.remainDays}일</span>
                </div>
                <div className="w-full bg-[#252628] rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${ad.remainDays <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
                    style={{ width: `${Math.min((ad.remainDays / 90) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
              <div>
                <p className="text-xs text-gray-500">노출수</p>
                <p className="text-sm font-medium text-white">{ad.impressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">클릭수</p>
                <p className="text-sm font-medium text-white">{ad.clicks.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2 text-right">
              <span className="text-[10px] text-gray-600">CTR {((ad.clicks / ad.impressions) * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
      {filteredAds.length === 0 && (
        <div className="text-center py-10 text-gray-500 text-sm">해당 상태의 광고가 없습니다</div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Banner Management */}
      <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> 배너 관리
        </h3>
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{b.title}</p>
                <span className="text-xs text-gray-600">{b.position}</span>
              </div>
              <button onClick={() => toggleBanner(b.id)} className="ml-3 shrink-0">
                {b.active ? (
                  <ToggleRight className="w-7 h-7 text-cyan-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notice Management */}
      <div className="bg-[#1C1D1F] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" /> 공지사항 관리
        </h3>
        <div className="space-y-3">
          {notices.map(n => {
            const badgeColors: Record<string, string> = {
              '공지': 'bg-blue-500/20 text-blue-400',
              '이벤트': 'bg-pink-500/20 text-pink-400',
              '업데이트': 'bg-green-500/20 text-green-400',
              '긴급': 'bg-red-500/20 text-red-400',
            };
            return (
              <div key={n.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColors[n.badge] || 'bg-gray-500/20 text-gray-400'}`}>
                      {n.badge}
                    </span>
                    <span className="text-xs text-gray-600">{n.createdAt}</span>
                  </div>
                  <p className="text-sm text-white truncate">{n.title}</p>
                </div>
                <button onClick={() => toggleNotice(n.id)} className="ml-3 shrink-0">
                  {n.active ? (
                    <ToggleRight className="w-7 h-7 text-cyan-400" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-600" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'members': return renderMembers();
      case 'jobs': return renderJobs();
      case 'payments': return renderPayments();
      case 'ads': return renderAds();
      case 'settings': return renderSettings();
    }
  };

  return (
    <div className="min-h-screen bg-[#141517] text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-50 bg-[#141517]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h1 className="text-lg font-bold">
                  <span className="text-white">관리자</span>
                  <span className="text-cyan-400 ml-1">대시보드</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:block">
                {user?.email || 'admin@onsia.city'}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-xs font-bold">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-white/5 sticky top-[57px] z-40 bg-[#141517]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderTabContent()}
      </main>
    </div>
  );
}
