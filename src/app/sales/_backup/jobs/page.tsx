'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Filter, ChevronDown, X, MapPin, SlidersHorizontal,
  Star, Crown, Eye, Building2, Sparkles, Clock, ArrowRight,
  ChevronLeft, ChevronRight, Briefcase, Megaphone, AlertCircle,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import JobCard from '@/components/sales/JobCard';
import type { SalesJobListing, SalesJobType, SalesJobTier, SalaryType } from '@/types';
import { REGIONS } from '@/types';

// 확장된 임시 데이터 - 4단계 티어 분배
export const allJobs: SalesJobListing[] = [
  // ── 유니크 (최상위) ──
  {
    id: '1',
    title: '힐스테이트 지금이 타이밍입니다',
    description: '조건변경 수수료인상! 대박현장 급구합니다',
    type: 'apartment',
    tier: 'unique',
    badges: ['hot', 'jackpot'],
    position: 'member',
    salary: { type: 'commission', amount: '최대 400만' },
    benefits: ['숙소제공', '일비', '숙소비'],
    experience: 'none',
    company: '(주)분양프라자',
    region: '경기',
    views: 487,
    createdAt: '2026.01.17',
  },
  {
    id: '8',
    title: '세종시 지식산업센터 분양',
    description: '세종시 행복도시 내 첫 지산',
    type: 'industrial',
    tier: 'unique',
    badges: ['new', 'hot'],
    position: 'teamLead',
    salary: { type: 'commission', amount: '최대 600만' },
    benefits: ['숙소제공', '차량지원', '식대', '일비'],
    experience: '6month',
    company: '세종지산(주)',
    region: '세종',
    views: 412,
    createdAt: '2026.01.13',
  },
  // ── 슈페리어 ──
  {
    id: 's1',
    title: '강서 이안 신규 민간임대 아파트',
    description: '서울 강서구 공항동 | 팀 수수료 1,100 | 중식제공 | 광고지원 | 3월 3일 투입',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['중식제공', '광고지원'],
    experience: 'none',
    company: '강서이안PMC(주)',
    companyType: 'agency',
    region: '서울',
    views: 358,
    createdAt: '2026.03.02',
    phone: '010-9184-5593',
    address: '서울특별시 강서구 공항동 22번지',
    contactName: '이본부장',
    detailContent: '신규 민간임대 아파트 강서 이안 분양현장입니다.\n\n▶ 팀 수수료: 1,100 (팀장 300 / 직원 800)\n▶ 수수료 지급: 계약금 5% 입금 시 지급 (월 2회, 15일 단위)\n▶ 계약금 3,500 입금 시: 일주일 후 청구\n\n▶ 근무지: 서울 강서구 마곡중앙로 55 (문영 퀸즈파크13)\n▶ 투입일: 3월 3일\n▶ 그랜드 오픈: 3월 13일\n\n▶ 복리후생: 중식 제공, 광고 지원 (현수막 무제한 포함)\n▶ 안심보장증서 진행\n\n회사 광고로 계약 잘나오는 현장입니다.',
    ageRange: '30~60세',
    gender: '무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '2026.03.01 ~ 2026.03.31',
  },
  {
    id: 's2',
    title: '서울원 파크로쉬레지던스 상담사 모집',
    description: '서울 영등포 신축 레지던스 | 계약수수료 | 경력무관',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '파크로쉬PMC',
    companyType: 'agency',
    region: '서울',
    views: 423,
    createdAt: '2026.03.01',
    phone: '010-4412-7830',
    address: '서울특별시 영등포구 문래동',
    contactName: '박실장',
    detailContent: '서울원 파크로쉬레지던스 신축 분양현장 상담사를 모집합니다. 영등포 핵심 입지, 역세권 프리미엄 레지던스. 높은 계약률 보장, 팀장급 우대. 광고비 지원, 체계적인 영업 시스템 완비.',
    ageRange: '20~50세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's3',
    title: '인천시청역 민간임대 일비3만원',
    description: '인천 남동구 민간임대 | 일비3만원 지급 | 경력무관 | 즉시투입',
    type: 'apartment',
    tier: 'superior',
    badges: ['new', 'hot'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '인천시청분양(주)',
    companyType: 'agency',
    region: '인천',
    views: 472,
    createdAt: '2026.02.28',
    phone: '010-3847-2916',
    address: '인천광역시 남동구 구월동',
    contactName: '김팀장',
    detailContent: '인천시청역 도보 5분 민간임대 아파트 분양현장입니다. 일비 3만원 매일 지급! 계약수수료 별도. 초보자도 친절히 교육합니다. 인천 최고 입지, 높은 계약률 자랑하는 현장.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's4',
    title: '더자하 인 마곡 분양상담사',
    description: '서울 마곡 오피스텔 | 마곡지구 역세권 | 계약수수료',
    type: 'officetel',
    tier: 'superior',
    badges: ['new'],
    position: 'member',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: '마곡프라임PMC',
    companyType: 'agency',
    region: '서울',
    views: 389,
    createdAt: '2026.03.01',
    phone: '010-8261-4937',
    address: '서울특별시 강서구 마곡동',
    contactName: '정실장',
    detailContent: '마곡지구 핵심 입지 오피스텔 분양현장. 마곡나루역 초역세권, 직주근접 프리미엄. 오피스텔 분양 경험자 우대하나 초보도 환영합니다. 계약수수료 업계 최고 수준.',
    ageRange: '20~50세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's5',
    title: 'e편한세상 일산 메이포레 상담사',
    description: '경기 일산 대단지 아파트 | 계약수수료 | 광고비지원',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비', '숙소비'],
    experience: 'none',
    company: 'DL분양대행',
    companyType: 'agency',
    region: '경기',
    views: 445,
    createdAt: '2026.02.28',
    phone: '010-8253-4719',
    address: '경기도 고양시 일산서구 일대',
    contactName: '최팀장',
    detailContent: 'e편한세상 일산 메이포레 대단지 아파트 분양현장. 일산 최대 규모 브랜드 아파트. 광고비 전액 지원, 숙소비 별도 지급. 일산 지역 경험자 우대. 팀장급 본부장급 동시 모집.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's6',
    title: '숭의역 라온프라이빗 분양상담사',
    description: '인천 미추홀구 역세권 오피스텔 | 계약수수료 | 경력무관',
    type: 'officetel',
    tier: 'superior',
    badges: ['new'],
    position: 'member',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: '라온분양(주)',
    companyType: 'agency',
    region: '인천',
    views: 317,
    createdAt: '2026.03.01',
    phone: '010-6492-3158',
    address: '인천광역시 미추홀구 숭의동',
    contactName: '한실장',
    detailContent: '숭의역 초역세권 라온프라이빗 오피스텔 분양. 수인분당선 숭의역 도보 3분. 전매제한 없는 오피스텔, 투자+실거주 모두 가능. 계약수수료 높은 편, 오피스텔 분양 경험자 환영.',
    ageRange: '20~50세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's7',
    title: '의왕 포일 민간임대 일비2만원',
    description: '경기 의왕시 민간임대 | 일비2만원 | 최고입지 | 경력무관',
    type: 'apartment',
    tier: 'superior',
    badges: ['hot'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '의왕에셋(주)',
    companyType: 'agency',
    region: '경기',
    views: 461,
    createdAt: '2026.02.27',
    phone: '010-9284-6037',
    address: '경기도 의왕시 포일동',
    contactName: '윤팀장',
    detailContent: '의왕 포일지구 민간임대 아파트 분양현장. 일비 2만원 매일 지급, 계약수수료 별도. GTX-C노선 수혜지역, 판교 출퇴근 용이. 의왕시 최고 입지에 분양가 메리트까지!',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's8',
    title: '운정 아이파크 포레스트 상담사 모집',
    description: '경기 파주 운정 대단지 | 계약수수료 | 숙소제공 | 즉시투입',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['숙소제공', '일비'],
    experience: 'none',
    company: 'HDC분양서비스',
    companyType: 'agency',
    region: '경기',
    views: 398,
    createdAt: '2026.02.28',
    phone: '010-5173-8462',
    address: '경기도 파주시 운정신도시',
    contactName: '조실장',
    detailContent: '운정 아이파크 포레스트 대단지 아파트. 운정신도시 중심 입지, GTX-A 운정역 인접. 숙소 무료 제공, 일비 별도 지급. HDC현대산업개발 브랜드파워. 경력무관 초보 환영.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's9',
    title: '보라매 파크시티 분양상담사',
    description: '서울 동작구 보라매 대규모 복합단지 | 계약수수료 | 경력우대',
    type: 'apartment',
    tier: 'superior',
    badges: ['new', 'popular'],
    position: 'headTeam',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '보라매PMC(주)',
    companyType: 'agency',
    region: '서울',
    views: 503,
    createdAt: '2026.02.27',
    phone: '010-7638-2954',
    address: '서울특별시 동작구 신대방동',
    contactName: '이실장',
    detailContent: '보라매 파크시티 대규모 복합단지 분양현장. 보라매역 도보 5분, 서울 남부 최대 랜드마크. 본부장/팀장급 우대 모집. 높은 계약률과 업계 최고 수수료 지급. 3개월 이상 경력자 우대.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '3개월이상 경력자 우대',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's10',
    title: '파주 문산역 동문3차 아파트',
    description: '경기 파주 문산역 역세권 | 계약수수료 | 경력무관 | 숙소비지원',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['숙소비'],
    experience: 'none',
    company: '동문건설분양',
    companyType: 'agency',
    region: '경기',
    views: 342,
    createdAt: '2026.02.28',
    phone: '010-3917-5284',
    address: '경기도 파주시 문산읍',
    contactName: '김실장',
    detailContent: '파주 문산역 동문3차 아파트 분양현장. 경의중앙선 문산역 초역세권. 파주시 최저 분양가, 실수요자 문의 폭주 중. 숙소비 지원, 경력무관 초보 환영.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's11',
    title: '반포래미안트리니원 단지내상가',
    description: '서울 서초구 반포 단지내상가 | 계약수수료 | 상가분양 경험자 우대',
    type: 'store',
    tier: 'superior',
    badges: ['hot'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: [],
    experience: '3month',
    company: '반포상가PMC(주)',
    companyType: 'agency',
    region: '서울',
    views: 478,
    createdAt: '2026.02.27',
    phone: '010-4263-8791',
    address: '서울특별시 서초구 반포동',
    contactName: '박팀장',
    detailContent: '반포래미안트리니원 단지내상가 분양. 반포 최고급 브랜드 아파트 단지내 상가. 확정 수요 보장, 고소득 배후세대. 상가 분양 경험자 우대, 높은 수수료 지급.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '상가분양 3개월이상 우대',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's12',
    title: '회룡역 힐스테이트 분양상담사',
    description: '경기 의정부 역세권 브랜드아파트 | 계약수수료 | 경력무관',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '현대분양PMC',
    companyType: 'agency',
    region: '경기',
    views: 367,
    createdAt: '2026.03.01',
    phone: '010-8547-3629',
    address: '경기도 의정부시 장암동',
    contactName: '장실장',
    detailContent: '회룡역 힐스테이트 브랜드 아파트 분양현장. 1호선/7호선 더블역세권. 현대건설 프리미엄 브랜드. 일비 지급, 경력무관 초보 환영. 의정부 최고 입지.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's13',
    title: '김포 해링턴플레이스 풍무 상담사',
    description: '경기 김포 풍무역 브랜드아파트 | 계약수수료 | 경력무관',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '풍무에셋코리아(주)',
    companyType: 'agency',
    region: '경기',
    views: 429,
    createdAt: '2026.02.28',
    phone: '010-6381-4527',
    address: '경기도 김포시 풍무동',
    contactName: '오팀장',
    detailContent: '김포 해링턴플레이스 풍무 브랜드 아파트 분양현장. 김포골드라인 풍무역 인접. 김포시 최대 규모 대단지. 일비 지급, 경력무관. 김포 지역 영업 경험자 우대.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's14',
    title: '한남동 민간임대아파트 상담사',
    description: '서울 용산구 한남동 고급 민간임대 | 계약수수료 | 경력무관',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'member',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: '용산분양(주)',
    companyType: 'agency',
    region: '서울',
    views: 491,
    createdAt: '2026.03.01',
    phone: '010-2749-8163',
    address: '서울특별시 용산구 한남동',
    contactName: '신실장',
    detailContent: '한남동 민간임대 아파트 분양현장. 서울 최고급 주거지역 한남동. 고급 인테리어 민간임대, 높은 분양가 = 높은 수수료. 용산 한남 지역 네트워크 보유자 우대.',
    ageRange: '20~50세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's15',
    title: '신길AK푸르지오 아파트 분양상담사',
    description: '서울 영등포 신길동 브랜드아파트 | 계약수수료 | 일비지급',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '대우분양서비스',
    companyType: 'agency',
    region: '서울',
    views: 376,
    createdAt: '2026.02.28',
    phone: '010-5824-7396',
    address: '서울특별시 영등포구 신길동',
    contactName: '유팀장',
    detailContent: '신길AK푸르지오 아파트 분양현장. 1호선/5호선 더블역세권, 대우건설 브랜드. 서울 영등포 핵심 입지, 재개발 수혜지역. 일비 지급, 경력무관 누구나 환영.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's16',
    title: '눈담봄 112프라자 상가 분양상담사',
    description: '경기 수원 권선구 당수지구 근린상가 | 분양/임대 수수료 | 초보 및 경력자',
    type: 'store',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: '눈담봄 112프라자',
    companyType: 'agency',
    region: '경기',
    views: 334,
    createdAt: '2026.02.24',
    phone: '010-9768-1730',
    address: '경기도 수원시 권선구 당수로 112',
    contactName: '문본부장',
    detailContent: '수원 권선구 당수지구 중심상업지 눈담봄 112프라자 상가 분양/임대. 준공완료 상가. 메인 도로 3면 상가, 아파트 출입구 앞 상가, 버스정류장 앞 상가. 선임대완료 상가 내과검진센터, 아소비학원. 기타 병·의원, 학원, 프랜차이즈 식당, 스크린골프 등 입점 환영. 분양 수수료 및 임대 수수료 문의 주시면 친절히 안내드리겠습니다.',
    ageRange: '20~70세',
    gender: '남녀무관',
    requirements: '초보 및 경력자',
    headcount: '0명',
    recruitPeriod: '2026.02.24',
  },
  {
    id: 's17',
    title: '제주 민간임대 아파트 상담사',
    description: '제주시 민간임대 | 계약수수료 | 숙소제공 | 항공권지원',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['숙소제공'],
    experience: 'none',
    company: '제주분양PMC',
    companyType: 'agency',
    region: '제주',
    views: 452,
    createdAt: '2026.02.27',
    phone: '010-7493-2618',
    address: '제주특별자치도 제주시 노형동',
    contactName: '고팀장',
    detailContent: '제주 민간임대 아파트 분양현장. 제주시 노형동 중심상업지역 인접. 숙소 무료 제공, 항공권 지원. 제주도 관광+투자 수요 풍부. 내륙 상담사분들 환영합니다.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's18',
    title: '엘리프 검단 포레듀 상담사 모집',
    description: '인천 검단 신규분상제 아파트 | 최대수수료 | 주단위지급',
    type: 'apartment',
    tier: 'superior',
    badges: ['new', 'popular'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '검단하우징(주)',
    companyType: 'agency',
    region: '인천',
    views: 415,
    createdAt: '2026.02.28',
    phone: '010-3628-9471',
    address: '인천광역시 서구 검단동',
    contactName: '강실장',
    detailContent: '엘리프 검단 포레듀 분양현장. 인천 검단신도시 신규분상제 아파트. 인천권 최대 수수료, 주단위 지급 보장. 첫 조직투입 현장, 선점 기회. 검단/김포 지역 경험자 환영.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's19',
    title: '롯데캐슬 546세대 분양상담사',
    description: '경기 안양 브랜드 대단지 | 계약수수료 | 경력무관',
    type: 'apartment',
    tier: 'superior',
    badges: ['new'],
    position: 'teamLead',
    salary: { type: 'commission' },
    benefits: ['일비'],
    experience: 'none',
    company: '영종PMC(주)',
    companyType: 'agency',
    region: '경기',
    views: 383,
    createdAt: '2026.03.01',
    phone: '010-8517-3946',
    address: '경기도 안양시 만안구',
    contactName: '송팀장',
    detailContent: '롯데캐슬 546세대 대단지 아파트 분양현장. 안양 최대 규모 롯데건설 프리미엄 브랜드. 546세대 대단지, 실수요자 문의 쇄도. 일비 지급, 경력무관.',
    ageRange: '20~55세',
    gender: '남녀무관',
    requirements: '경력무관',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  {
    id: 's20',
    title: '영등포 C타워 지식산업센터',
    description: '서울 영등포 지산 | 계약수수료 | 지산경험 우대',
    type: 'industrial',
    tier: 'superior',
    badges: ['new'],
    position: 'member',
    salary: { type: 'commission' },
    benefits: [],
    experience: 'none',
    company: '개봉분양(주)',
    companyType: 'agency',
    region: '서울',
    views: 308,
    createdAt: '2026.03.01',
    phone: '010-4962-8137',
    address: '서울특별시 영등포구 양평동',
    contactName: '임실장',
    detailContent: '영등포 C타워 지식산업센터 분양현장. 영등포 도심 핵심 입지, 5호선 양평역 인접. 중소기업/스타트업 수요 풍부. 지산 분양 경험자 우대하나 초보도 교육 후 투입 가능.',
    ageRange: '20~50세',
    gender: '남녀무관',
    requirements: '경력무관(지산경험 우대)',
    headcount: '00명',
    recruitPeriod: '채용시까지',
  },
  // ── 프리미엄 (반짝이 효과) ──
  {
    id: '3',
    title: '송도 오피스텔 분양팀 모집',
    description: '인천 송도 핵심 상권 오피스텔 분양',
    type: 'officetel',
    tier: 'premium',
    badges: ['new'],
    position: 'member',
    salary: { type: 'commission', amount: '최대 300만' },
    benefits: ['숙소제공'],
    experience: 'none',
    company: '송도개발(주)',
    region: '인천',
    views: 467,
    createdAt: '2026.01.16',
  },
  {
    id: '5',
    title: '부산 해운대 상가 분양',
    description: '해운대 마린시티 프리미엄 상가',
    type: 'store',
    tier: 'premium',
    badges: ['hot'],
    position: 'teamLead',
    salary: { type: 'commission', amount: '최대 500만' },
    benefits: ['숙소제공', '차량지원', '식대'],
    experience: '6month',
    company: '해운대상가(주)',
    region: '부산',
    views: 392,
    createdAt: '2026.01.15',
  },
  {
    id: '7',
    title: '광주 상무지구 아파트 분양팀',
    description: '광주 최고 입지 브랜드 아파트',
    type: 'apartment',
    tier: 'premium',
    badges: ['popular'],
    position: 'member',
    salary: { type: 'base_incentive', amount: '협의' },
    benefits: ['숙소제공'],
    experience: '3month',
    company: '광주분양(주)',
    region: '광주',
    views: 341,
    createdAt: '2026.01.14',
  },
  // ── 무료 (24시간 만료) ──
  {
    id: '4',
    title: '김포 지식산업센터 분양상담사',
    description: '김포 골드라인 역세권 지산 분양',
    type: 'industrial',
    tier: 'normal',
    badges: [],
    position: 'member',
    salary: { type: 'daily', amount: '15만' },
    benefits: ['교통비'],
    experience: 'none',
    company: '김포지산(주)',
    region: '경기',
    views: 328,
    createdAt: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
  },
  {
    id: '9',
    title: '수원 광교 상가 분양상담사',
    description: '광교신도시 핵심상권 상가',
    type: 'store',
    tier: 'normal',
    badges: [],
    position: 'member',
    salary: { type: 'daily', amount: '12만' },
    benefits: ['교통비'],
    experience: 'none',
    company: '광교상가(주)',
    region: '경기',
    views: 456,
    createdAt: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
  },
  {
    id: '10',
    title: '제주 노형동 오피스텔',
    description: '제주 중심상업지역 오피스텔 분양',
    type: 'officetel',
    tier: 'normal',
    badges: [],
    position: 'member',
    salary: { type: 'commission', amount: '최대 250만' },
    benefits: ['항공권지원', '숙소제공'],
    experience: 'none',
    company: '제주분양(주)',
    region: '제주',
    views: 371,
    createdAt: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
  },
];

const TYPE_OPTIONS: { value: SalesJobType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'apartment', label: '아파트' },
  { value: 'officetel', label: '오피스텔' },
  { value: 'store', label: '상가' },
  { value: 'industrial', label: '지산' },
];

const TIER_OPTIONS: { value: SalesJobTier | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'unique', label: 'UNIQUE' },
  { value: 'superior', label: 'SUPERIOR' },
  { value: 'premium', label: 'PREMIUM' },
  { value: 'normal', label: '일반' },
];

const SALARY_OPTIONS: { value: SalaryType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'commission', label: '계약 수수료' },
  { value: 'base_incentive', label: '기본급+인센' },
  { value: 'daily', label: '일급' },
];

const PLACEHOLDER_THUMBNAILS = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=250&fit=crop',
];

const TYPE_LABELS: Record<SalesJobType, string> = {
  apartment: '아파트',
  officetel: '오피스텔',
  store: '상가',
  industrial: '지산',
};

const TYPE_COLORS: Record<SalesJobType, string> = {
  apartment: 'bg-blue-500',
  officetel: 'bg-purple-500',
  store: 'bg-orange-500',
  industrial: 'bg-green-500',
};

const BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-green-500', text: 'text-white', label: '신규' },
  hot: { bg: 'bg-red-500', text: 'text-white', label: 'HOT' },
  jackpot: { bg: 'bg-yellow-500', text: 'text-white', label: '대박' },
  popular: { bg: 'bg-orange-500', text: 'text-white', label: '인기현장' },
};

const SALARY_LABELS: Record<SalaryType, string> = {
  commission: '계약수수료',
  base_incentive: '기본급+인센',
  daily: '일급',
};

export default function SalesJobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<SalesJobType | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<SalesJobTier | 'all'>('all');
  const [selectedSalary, setSelectedSalary] = useState<SalaryType | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 유니크 슬라이더 상태
  const [uniqueSlideIndex, setUniqueSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !job.title.toLowerCase().includes(query) &&
          !job.description.toLowerCase().includes(query) &&
          !job.company.toLowerCase().includes(query) &&
          !job.region.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (selectedRegion !== '전체' && job.region !== selectedRegion) return false;
      if (selectedType !== 'all' && job.type !== selectedType) return false;
      if (selectedTier !== 'all' && job.tier !== selectedTier) return false;
      if (selectedSalary !== 'all' && job.salary.type !== selectedSalary) return false;
      return true;
    });
  }, [searchQuery, selectedRegion, selectedType, selectedTier, selectedSalary]);

  // 티어별 분류
  const uniqueJobs = filteredJobs.filter(j => j.tier === 'unique');
  const superiorJobs = filteredJobs.filter(j => j.tier === 'superior');
  const premiumJobs = filteredJobs.filter(j => j.tier === 'premium');
  const normalJobs = filteredJobs.filter(j => j.tier === 'normal');

  // 유니크 슬라이더 자동 재생
  useEffect(() => {
    if (!isAutoPlaying || uniqueJobs.length === 0) return;
    const interval = setInterval(() => {
      setUniqueSlideIndex(prev => (prev + 1) % uniqueJobs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, uniqueJobs.length]);

  const goToPrevSlide = () => { setUniqueSlideIndex(prev => (prev - 1 + uniqueJobs.length) % uniqueJobs.length); setIsAutoPlaying(false); };
  const goToNextSlide = () => { setUniqueSlideIndex(prev => (prev + 1) % uniqueJobs.length); setIsAutoPlaying(false); };
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) { if (diff > 0) goToNextSlide(); else goToPrevSlide(); }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('전체');
    setSelectedType('all');
    setSelectedTier('all');
    setSelectedSalary('all');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedRegion !== '전체' ||
    selectedType !== 'all' ||
    selectedTier !== 'all' ||
    selectedSalary !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header variant="sales" />

      {/* CSS 애니메이션 */}
      <style jsx global>{`
        @keyframes premiumGlow {
          0%, 100% { box-shadow: 0 0 4px rgba(6, 182, 212, 0.15), inset 0 0 4px rgba(6, 182, 212, 0.05); }
          50% { box-shadow: 0 0 12px rgba(6, 182, 212, 0.25), inset 0 0 8px rgba(6, 182, 212, 0.08); }
        }
        @keyframes premiumBadgeShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rainbowBorder {
          0% { border-color: #a855f7; }
          25% { border-color: #ec4899; }
          50% { border-color: #8b5cf6; }
          75% { border-color: #d946ef; }
          100% { border-color: #a855f7; }
        }
      `}</style>

      {/* 검색 영역 */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="현장명, 지역, 회사명으로 검색"
                className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/60 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                hasActiveFilters
                  ? 'bg-white text-purple-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden md:inline">필터</span>
              {hasActiveFilters && (
                <span className="bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">!</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 필터 패널 */}
      {isFilterOpen && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">지역</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="전체">전체</option>
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">현장유형</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as SalesJobType | 'all')}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">노출등급</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as SalesJobTier | 'all')}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {TIER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <label className="text-xs text-gray-500 mb-1 block">급여형태</label>
                <select
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value as SalaryType | 'all')}
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {SALARY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                  >
                    <X className="w-4 h-4" />
                    초기화
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 결과 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">분양상담사 채용공고</h1>
            <span className="text-sm text-gray-500">
              총 {filteredJobs.length}건
            </span>
          </div>
          <select className="text-sm text-gray-600 bg-transparent focus:outline-none">
            <option>최신순</option>
            <option>조회순</option>
            <option>급여순</option>
          </select>
        </div>

        {/* 활성 필터 태그 */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedRegion !== '전체' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                <MapPin className="w-3 h-3" />{selectedRegion}
                <button onClick={() => setSelectedRegion('전체')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                {TYPE_OPTIONS.find((o) => o.value === selectedType)?.label}
                <button onClick={() => setSelectedType('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedTier !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                {TIER_OPTIONS.find((o) => o.value === selectedTier)?.label}
                <button onClick={() => setSelectedTier('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedSalary !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                {SALARY_OPTIONS.find((o) => o.value === selectedSalary)?.label}
                <button onClick={() => setSelectedSalary('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* 1. 유니크 섹션 - 레인보우 네온 슬라이더 + 그리드 */}
        {/* ============================================ */}
        {uniqueJobs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-purple-500 fill-purple-500" />
              <h2 className="text-lg font-bold text-gray-900">UNIQUE 광고대행사</h2>
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold">최상위</span>
            </div>

            {/* 유니크 슬라이더 */}
            <div
              className="relative rounded-xl overflow-hidden mb-4"
              style={{ animation: 'rainbowBorder 3s linear infinite', borderWidth: '3px', borderStyle: 'solid' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {uniqueJobs[uniqueSlideIndex % uniqueJobs.length] && (() => {
                const job = uniqueJobs[uniqueSlideIndex % uniqueJobs.length];
                const thumbUrl = job.thumbnail || PLACEHOLDER_THUMBNAILS[parseInt(job.id) % PLACEHOLDER_THUMBNAILS.length];
                return (
                  <Link href={`/sales/jobs/${job.id}`}>
                    <div className="flex flex-col md:flex-row bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900">
                      <div className="relative w-full md:w-1/2 h-48 md:h-64 overflow-hidden">
                        <Image src={thumbUrl} alt={job.title} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-900/60" />
                        <div className="absolute top-3 left-3">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">UNIQUE</span>
                        </div>
                        {job.badges.length > 0 && (
                          <div className="absolute bottom-3 left-3 flex gap-1">
                            {job.badges.map(badge => {
                              const bs = BADGE_STYLES[badge];
                              return bs ? (
                                <span key={badge} className={`text-xs px-2 py-0.5 rounded font-bold ${bs.bg} ${bs.text}`}>{bs.label}</span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4 md:p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${TYPE_COLORS[job.type]} text-white text-xs px-2 py-0.5 rounded`}>{TYPE_LABELS[job.type]}</span>
                          <span className="text-white/70 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{job.region}</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">{job.title}</h3>
                        <p className="text-white/80 text-sm mb-3 line-clamp-2">{job.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded">{SALARY_LABELS[job.salary.type]} {job.salary.amount}</span>
                          {job.benefits.slice(0, 3).map(b => (
                            <span key={b} className="bg-white/10 text-white/80 px-2 py-1 rounded">{b}</span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-white/60 text-xs">{job.company}</span>
                          <span className="text-purple-400 text-sm font-medium flex items-center gap-1">자세히 보기 <ArrowRight className="w-3 h-3" /></span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })()}
              {uniqueJobs.length > 1 && (
                <>
                  <button onClick={goToPrevSlide} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={goToNextSlide} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {uniqueJobs.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setUniqueSlideIndex(idx); setIsAutoPlaying(false); }}
                        className={`w-2 h-2 rounded-full transition-all ${idx === (uniqueSlideIndex % uniqueJobs.length) ? 'bg-white w-4' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute top-3 right-3">
                <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {(uniqueSlideIndex % uniqueJobs.length) + 1} / {uniqueJobs.length}
                </span>
              </div>
            </div>

            {/* 유니크 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {uniqueJobs.map(job => (
                <JobCard key={job.id} job={job} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* ============================================ */}
        {/* 2. 슈페리어 섹션 - 전용 그리드 */}
        {/* ============================================ */}
        {superiorJobs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">SUPERIOR</h2>
              <span className="text-xs bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">슈페리어</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {superiorJobs.map(job => (
                <JobCard key={job.id} job={job} variant="card" />
              ))}
            </div>
          </section>
        )}

        {/* ============================================ */}
        {/* 배너 광고 슬롯 */}
        {/* ============================================ */}
        <div className="mb-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-6 text-center border border-gray-300 border-dashed">
          <Megaphone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">광고 배너 영역</p>
          <p className="text-xs text-gray-400 mt-1">이 자리에 광고를 게재하세요 · 월 200,000원~</p>
          <Link href="/sales/premium" className="inline-flex items-center gap-1 mt-2 text-xs text-purple-600 hover:text-purple-700">
            광고 문의 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* ============================================ */}
        {/* 3. 프리미엄 섹션 - 반짝이 효과 */}
        {/* ============================================ */}
        {premiumJobs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-bold text-gray-900">PREMIUM</h2>
                <span className="text-xs bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-2 py-0.5 rounded-full font-bold">프리미엄</span>
              </div>
              <span className="text-xs text-gray-400">잔여 {Math.max(0, 30 - premiumJobs.length)}슬롯</span>
            </div>

            <div className="space-y-3">
              {premiumJobs.slice(0, 30).map(job => {
                const thumbUrl = job.thumbnail || PLACEHOLDER_THUMBNAILS[parseInt(job.id) % PLACEHOLDER_THUMBNAILS.length];
                return (
                  <Link key={job.id} href={`/sales/jobs/${job.id}`}>
                    <div
                      className="bg-white rounded-xl border border-cyan-200 overflow-hidden hover:shadow-md transition-all group"
                      style={{
                        animation: 'premiumGlow 2s ease-in-out infinite',
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.03) 0%, white 50%, rgba(20, 184, 166, 0.03) 100%)',
                      }}
                    >
                      <div className="flex gap-3 p-3">
                        {/* 썸네일 */}
                        <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <Image src={thumbUrl} alt={job.title} fill className="object-cover" unoptimized />
                          <div className="absolute top-1 left-1">
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
                              style={{
                                background: 'linear-gradient(90deg, #06b6d4, #14b8a6, #06b6d4)',
                                backgroundSize: '200% auto',
                                animation: 'premiumBadgeShimmer 3s linear infinite',
                              }}
                            >
                              PREMIUM
                            </span>
                          </div>
                        </div>
                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[job.type]} text-white`}>{TYPE_LABELS[job.type]}</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{job.region}</span>
                            {job.badges.map(badge => {
                              const bs = BADGE_STYLES[badge];
                              return bs ? (
                                <span key={badge} className={`text-[10px] px-1 py-0.5 rounded ${bs.bg} ${bs.text} font-bold`}>{bs.label}</span>
                              ) : null;
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mb-0.5 font-bold">{job.company}</p>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-purple-600 transition-colors">{job.title}</h3>
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <span className="text-cyan-600 font-bold">{job.salary.amount || '협의'}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500">{SALARY_LABELS[job.salary.type]}</span>
                            {job.benefits.slice(0, 2).map(b => (
                              <span key={b} className="text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px]">{b}</span>
                            ))}
                          </div>
                        </div>
                        {/* 조회수 */}
                        <div className="flex flex-col items-end justify-between flex-shrink-0">
                          <Eye className="w-3.5 h-3.5 text-gray-300" />
                          <span className="text-[10px] text-gray-400">{job.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {premiumJobs.length > 0 && (
              <div className="mt-3 text-center">
                <Link href="/sales/premium" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
                  프리미엄 광고 신청하기 (₩4,900/5일) →
                </Link>
              </div>
            )}
          </section>
        )}

        {/* ============================================ */}
        {/* 4. 무료 섹션 - 24시간 만료 */}
        {/* ============================================ */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">일반 공고</h2>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">무료 · 24시간 한정</span>
            </div>
          </div>

          {/* 업그레이드 안내 */}
          <div className="bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <p className="text-xs text-purple-700">
                무료 공고는 24시간 후 자동 만료됩니다. <strong>프리미엄 ₩4,900</strong>으로 5일간 노출하세요 →
              </p>
            </div>
            <Link href="/sales/premium" className="text-xs text-purple-600 font-bold hover:text-purple-800 whitespace-nowrap ml-2">
              업그레이드
            </Link>
          </div>

          {normalJobs.length > 0 ? (
            <div className="space-y-2">
              {normalJobs.map(job => {
                // 24시간 만료 계산
                const now = new Date();
                const createdDate = new Date(job.createdAt.replace(/\./g, '-'));
                const expiryDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);
                const hoursLeft = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

                return (
                  <Link key={job.id} href={`/sales/jobs/${job.id}`}>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[job.type]} text-white`}>{TYPE_LABELS[job.type]}</span>
                            <span className="text-[10px] text-gray-400">{job.region}</span>
                            <span className="text-[10px] text-gray-400">·</span>
                            <span className="text-[10px] text-gray-500">{SALARY_LABELS[job.salary.type]}</span>
                          </div>
                          <h3 className="text-sm text-gray-700 line-clamp-1 group-hover:text-purple-600 transition-colors">{job.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className="text-xs text-gray-500">{job.salary.amount || '협의'}</span>
                          <div className="flex items-center gap-1 text-[10px]">
                            {hoursLeft > 0 ? (
                              <span className={`px-1.5 py-0.5 rounded ${hoursLeft <= 6 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                                {hoursLeft}시간 남음
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">만료</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              현재 등록된 무료 공고가 없습니다.
            </div>
          )}
        </section>

        {/* 공고 없을 때 */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500 text-sm mb-4">다른 검색어나 필터를 시도해보세요</p>
            <button onClick={clearFilters} className="text-purple-600 text-sm font-medium hover:underline">필터 초기화</button>
          </div>
        )}

        {/* 공고 등록 CTA */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center border border-purple-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">분양상담사를 찾고 계신가요?</h3>
          <p className="text-sm text-gray-500 mb-4">무료로 공고를 등록하거나, 프리미엄 상품으로 더 많은 지원자를 받으세요.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sales/jobs/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              <Briefcase className="w-4 h-4" />공고 등록하기
            </Link>
            <Link
              href="/sales/premium"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-purple-300 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-colors"
            >
              광고 상품 안내 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* 푸터 사업자 정보 */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <Link href="/terms" className="hover:text-purple-600">이용약관</Link>
            <Link href="/privacy" className="hover:text-purple-600 font-medium text-gray-700">개인정보처리방침</Link>
            <Link href="/refund" className="hover:text-purple-600">환불정책</Link>
            <a href="mailto:onsia777@gmail.com" className="hover:text-purple-600">문의하기</a>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>온시아 공인중개사ㅣ대표이사: 연대겸ㅣ사업자등록번호: 846-23-01501</p>
            <p>주소: 서울특별시 송파구 중대로 197, 3동 305층 A169(가락동)ㅣ대표전화: <a href="tel:1555-1245" className="text-gray-600 hover:text-purple-600">1555-1245</a></p>
            <p>업태: 정보통신업ㅣ종목: 소프트웨어 개발 및 공급업, 포털 및 인터넷 정보 매개 서비스업</p>
            <p className="mt-2">© {new Date().getFullYear()} BOOIN Corp. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <MobileNav variant="sales" />
    </div>
  );
}
