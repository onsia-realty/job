'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Building2, Briefcase,
  DollarSign, Phone, FileText, Image as ImageIcon,
  ShieldAlert, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { useAuth } from '@/contexts/AuthContext';
import FormSection from '@/components/shared/FormSection';
import ThumbnailUpload from '@/components/shared/ThumbnailUpload';
import ContactSection from '@/components/shared/ContactSection';
import AddressSearch from '@/components/shared/AddressSearch';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-lg bg-gray-50 min-h-[250px] flex items-center justify-center text-gray-400">
      에디터 로딩 중...
    </div>
  ),
});

// 옵션 데이터
const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

const JOB_TYPES = [
  { value: 'apartment', label: '아파트' },
  { value: 'officetel', label: '오피스텔' },
  { value: 'store', label: '상가' },
  { value: 'industrial', label: '지식산업센터' },
];

const POSITIONS = [
  { value: 'headTeam', label: '본부장' },
  { value: 'teamLead', label: '팀장' },
  { value: 'member', label: '팀원' },
];

const SALARY_TYPES = [
  { value: 'per_contract', label: '건당' },
  { value: 'percentage', label: '% 비율제' },
];

const EXPERIENCES = [
  { value: 'none', label: '경력무관' },
  { value: '1month', label: '1개월 이상' },
  { value: '3month', label: '3개월 이상' },
  { value: '6month', label: '6개월 이상' },
  { value: '12month', label: '12개월 이상' },
];

const COMPANY_TYPES = [
  { value: 'developer', label: '시행사' },
  { value: 'builder', label: '시공사' },
  { value: 'agency', label: '분양대행사' },
  { value: 'trust', label: '신탁사' },
];

const BENEFITS_OPTIONS = [
  '숙소제공', '숙소비', '일비', '교통비', '식대', '차량지원', '4대보험'
];

const TIERS = [
  { value: 'normal', label: '무료 (24시간)', price: 0, originalPrice: 0, duration: '24시간', color: 'bg-gray-500' },
  { value: 'premium', label: '프리미엄', price: 4900, originalPrice: 49000, duration: '5일', color: 'bg-cyan-500' },
  { value: 'superior', label: '슈페리어', price: 9900, originalPrice: 99000, duration: '1주일', color: 'bg-blue-600' },
  { value: 'unique', label: '유니크 (광고대행사)', price: 24900, originalPrice: 249000, duration: '1주일', color: 'bg-purple-600' },
];

// 마감일 제한: 오늘 ~ 오늘+10일
const today = new Date().toISOString().split('T')[0];
const maxDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export default function NewJobPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // 인증 상태 확인
  const meta = authUser?.user_metadata;
  const isVerified = meta?.brokerVerified === true || meta?.businessVerified === true;

  useEffect(() => {
    if (!authLoading && authUser && !isVerified) {
      setShowVerificationModal(true);
    }
  }, [authUser, authLoading, isVerified]);

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'apartment',
    tier: 'normal',
    position: 'member',
    salary_type: 'per_contract',
    salary_amount: '',
    benefits: [] as string[],
    experience: 'none',
    company: '',
    company_type: 'agency',
    region: '서울',
    address: '',
    phone: '',
    office_phone: '',
    contact_name: '',
    deadline: '',
    html_content: '',
  });

  // 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 전화번호 포맷팅 핸들러 (010-XXXX-XXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 7) {
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    }
    setFormData(prev => ({ ...prev, phone: value }));
  };

  // 회사 전화번호 포맷팅 핸들러 (02-XXXX-XXXX / 031-XXX-XXXX)
  const handleOfficePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 12) value = value.slice(0, 12);
    if (value.startsWith('02')) {
      if (value.length > 6) value = `${value.slice(0,2)}-${value.slice(2,6)}-${value.slice(6)}`;
      else if (value.length > 2) value = `${value.slice(0,2)}-${value.slice(2)}`;
    } else {
      if (value.length > 7) value = `${value.slice(0,3)}-${value.slice(3,7)}-${value.slice(7)}`;
      else if (value.length > 3) value = `${value.slice(0,3)}-${value.slice(3)}`;
    }
    setFormData(prev => ({ ...prev, office_phone: value }));
  };

  // 수수료 금액 핸들러
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, salary_amount: value }));
  };

  // WYSIWYG 에디터 변경 핸들러
  const handleEditorChange = useCallback((html: string) => {
    setFormData(prev => ({ ...prev, html_content: html }));
  }, []);

  // 배너 제목/부제목 ↔ 공고제목/한줄설명 동기화
  const handleBannerTitleChange = useCallback((title: string, subtitle: string) => {
    setFormData(prev => ({
      ...prev,
      title: title || prev.title,
      description: subtitle || prev.description,
    }));
  }, []);

  // 에디터 이미지 업로드 핸들러
  const handleEditorImageUpload = useCallback(async (file: File): Promise<string | null> => {
    return uploadImage(file, 'editor-images');
  }, []);

  // 혜택 토글
  const toggleBenefit = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit]
    }));
  };

  // 썸네일 핸들러
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailPreview(null);
    setThumbnailFile(null);
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. 썸네일 업로드
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        thumbnailUrl = await uploadImage(thumbnailFile, 'thumbnails');
        if (!thumbnailUrl) {
          alert('이미지 업로드에 실패했습니다.');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. 공고 데이터 저장
      const { error } = await supabase
        .from('jobs')
        .insert({
          title: formData.title,
          description: formData.description,
          html_content: formData.html_content || null,
          category: 'sales',
          type: formData.type,
          tier: formData.tier,
          badges: [],
          position: formData.position,
          salary_type: formData.salary_type,
          salary_amount: formData.salary_amount ? `${formData.salary_amount}만원` : null,
          benefits: formData.benefits,
          experience: formData.experience,
          company: formData.company,
          company_type: formData.company_type,
          region: formData.region,
          address: formData.address || null,
          thumbnail: thumbnailUrl,
          phone: formData.phone || null,
          office_phone: formData.office_phone || null,
          contact_name: formData.contact_name || null,
          deadline: formData.deadline || null,
          is_active: true,
          is_approved: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        alert('공고 등록에 실패했습니다: ' + error.message);
        setIsSubmitting(false);
        return;
      }

      alert('공고가 등록되었습니다!');
      router.push('/sales');

    } catch (err) {
      console.error('Submit error:', err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTier = TIERS.find(t => t.value === formData.tier);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 인증 필요 모달 */}
      {showVerificationModal && !isVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              기업 인증이 필요합니다
            </h2>
            <p className="text-gray-600 text-center mb-6 text-sm">
              구인글을 작성하려면 중개사무소 등록번호 또는<br />
              사업자등록번호 인증이 필요합니다.
            </p>
            <div className="space-y-3">
              <Link
                href="/agent/mypage/verification"
                className="block w-full py-3.5 bg-purple-600 text-white rounded-xl font-bold text-center hover:bg-purple-700 transition-colors"
              >
                인증하러 가기
              </Link>
              <button
                type="button"
                onClick={() => router.back()}
                className="block w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-center hover:bg-gray-200 transition-colors"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/sales" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">분양상담사 공고 등록</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 광고 티어 선택 */}
          <FormSection icon={DollarSign} title="광고 상품 선택" iconColor="text-purple-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TIERS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tier: tier.value }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.tier === tier.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-2 rounded ${tier.color} mb-3`} />
                  <p className="font-bold text-gray-900">{tier.label}</p>
                  {tier.originalPrice > 0 ? (
                    <div>
                      <p className="text-xs text-gray-400 line-through">{tier.originalPrice.toLocaleString()}원</p>
                      <p className="text-sm font-bold text-purple-600">
                        {tier.price.toLocaleString()}원<span className="text-xs text-gray-500 font-normal">/{tier.duration}</span>
                      </p>
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">90% OFF</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">무료 · {tier.duration}</p>
                  )}
                </button>
              ))}
            </div>
            {selectedTier && (
              <p className="mt-4 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                {selectedTier.price === 0
                  ? '무료 공고는 24시간 후 자동 만료됩니다. 프리미엄(₩4,900)으로 5일간 반짝이 효과 노출!'
                  : selectedTier.value === 'premium'
                  ? '프리미엄 상품은 일반 목록에서 반짝이 효과 + 시안 배지가 제공됩니다.'
                  : selectedTier.value === 'superior'
                  ? '슈페리어 상품은 유니크 아래 전용 그리드에 블루 배지로 강조 노출됩니다.'
                  : '유니크(광고대행사) 상품은 레인보우 네온 슬라이더 최상단 + 전용 그리드에 노출됩니다.'}
              </p>
            )}
          </FormSection>

          {/* 기본 정보 + WYSIWYG 에디터 */}
          <FormSection icon={FileText} title="기본 정보" iconColor="text-purple-600">
            <div className="space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  공고 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="예: 힐스테이트 분양상담사 급구"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 한줄 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  한줄 설명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="예: 최고 수수료 조건! 숙소+일비 지원"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* WYSIWYG 에디터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세 내용 (에디터)
                </label>
                <RichTextEditor
                  value={formData.html_content}
                  onChange={handleEditorChange}
                  onImageUpload={handleEditorImageUpload}
                  onBannerTitleChange={handleBannerTitleChange}
                  placeholder="모집 조건, 현장 소개, 근무 환경 등을 자세히 작성해주세요. 이미지, 표 삽입 가능합니다."
                  templateCategory="sales"
                  defaultTitle={formData.title}
                  defaultSubtitle={formData.description}
                />
                <p className="text-xs text-gray-500 mt-1">비주얼 에디터, HTML 소스, 미리보기 모드를 전환할 수 있습니다.</p>
              </div>
            </div>
          </FormSection>

          {/* 썸네일 이미지 */}
          <FormSection icon={ImageIcon} title="썸네일 이미지" iconColor="text-purple-600">
            <ThumbnailUpload
              preview={thumbnailPreview}
              onFileChange={handleThumbnailChange}
              onRemove={removeThumbnail}
              accentColor="purple"
            />
          </FormSection>

          {/* 모집 조건 */}
          <FormSection icon={Briefcase} title="모집 조건" iconColor="text-purple-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 현장 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  현장 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                >
                  {JOB_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* 모집 직급 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  모집 직급 <span className="text-red-500">*</span>
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                  ))}
                </select>
              </div>

              {/* 급여 형태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  급여 형태 <span className="text-red-500">*</span>
                </label>
                <select
                  name="salary_type"
                  value={formData.salary_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                >
                  {SALARY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* 수수료 금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수수료
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="salary_amount"
                    value={formData.salary_amount}
                    onChange={handleSalaryChange}
                    placeholder="예: 1200"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-16 focus:outline-none focus:border-purple-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">만원</span>
                </div>
              </div>

              {/* 경력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  요구 경력
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                >
                  {EXPERIENCES.map((exp) => (
                    <option key={exp.value} value={exp.value}>{exp.label}</option>
                  ))}
                </select>
              </div>

              {/* 마감일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  모집 마감일
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={today}
                  max={maxDeadline}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">등록일로부터 최대 10일까지 설정 가능</p>
              </div>
            </div>

            {/* 복리후생 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                복리후생
              </label>
              <div className="flex flex-wrap gap-2">
                {BENEFITS_OPTIONS.map((benefit) => (
                  <button
                    key={benefit}
                    type="button"
                    onClick={() => toggleBenefit(benefit)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      formData.benefits.includes(benefit)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {benefit}
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          {/* 회사/현장 정보 */}
          <FormSection icon={Building2} title="회사/현장 정보" iconColor="text-purple-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 현장명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  현장명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  placeholder="예: 힐스테이트 광교"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 업체 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업체 유형
                </label>
                <select
                  name="company_type"
                  value={formData.company_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                >
                  {COMPANY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* 지역 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지역 <span className="text-red-500">*</span>
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                >
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* 주소 검색 */}
              <div className="md:col-span-2">
                <AddressSearch
                  address={formData.address}
                  onAddressChange={(addr) => setFormData(prev => ({ ...prev, address: addr }))}
                  accentColor="purple"
                />
              </div>
            </div>
          </FormSection>

          {/* 연락처 */}
          <FormSection icon={Phone} title="연락처" iconColor="text-purple-600">
            <ContactSection
              contactName={formData.contact_name}
              phone={formData.phone}
              officePhone={formData.office_phone}
              onContactNameChange={handleChange}
              onPhoneChange={handlePhoneChange}
              onOfficePhoneChange={handleOfficePhoneChange}
              accentColor="purple"
            />
          </FormSection>

          {/* 공고 등록 안내사항 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-2.5 mb-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <h3 className="text-sm font-bold text-amber-800">공고 등록 시 유의사항</h3>
            </div>
            <ul className="space-y-2 text-xs text-amber-900/80 leading-relaxed pl-7">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold mt-px">·</span>
                <span>등록하는 이미지 및 영상물에 대한 <strong className="text-amber-900">저작권·초상권 확인 책임</strong>은 등록자에게 있으며, 부동산인은 이에 대한 어떠한 책임도 지지 않습니다.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold mt-px">·</span>
                <span><strong className="text-amber-900">최저임금 미만의 급여</strong> 또는 <strong className="text-amber-900">연령·성별 제한</strong> 내용이 포함된 공고는 사전 경고 없이 삭제될 수 있습니다.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold mt-px">·</span>
                <span>파일 링크 첨부 시 반드시 <strong className="text-amber-900">HTTPS 보안 링크</strong>를 사용해 주세요.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold mt-px">·</span>
                <span>등록된 공고의 로고·이미지·상세요강은 제휴를 통해 외부 채널에 게시될 수 있습니다.</span>
              </li>
            </ul>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-3">
            <Link
              href="/sales"
              className="flex-1 py-4 text-center bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '등록 중...' : '공고 등록하기'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
