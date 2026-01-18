'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Upload, X, Building2, MapPin, Briefcase,
  DollarSign, Clock, Phone, User, FileText, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  { value: 'normal', label: '일반 (무료)', price: 0, color: 'bg-gray-500' },
  { value: 'premium', label: '프리미엄', price: 50000, color: 'bg-cyan-500' },
  { value: 'superior', label: '슈페리어', price: 100000, color: 'bg-blue-600' },
  { value: 'unique', label: '유니크', price: 200000, color: 'bg-purple-600' },
];

export default function NewJobPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

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
    let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출

    if (value.length > 11) value = value.slice(0, 11);

    // 하이픈 추가
    if (value.length > 7) {
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    }

    setFormData(prev => ({ ...prev, phone: value }));
  };

  // 수수료 금액 핸들러 (숫자만 입력, 표시시 만원 붙임)
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
    setFormData(prev => ({ ...prev, salary_amount: value }));
  };

  // 혜택 토글
  const toggleBenefit = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit]
    }));
  };

  // 썸네일 업로드 핸들러
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 썸네일 제거
  const removeThumbnail = () => {
    setThumbnailPreview(null);
    setThumbnailFile(null);
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let thumbnailUrl = null;

      // 1. 썸네일 업로드 (있으면)
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `thumbnails/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('job-images')
          .upload(filePath, thumbnailFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert('이미지 업로드에 실패했습니다.');
          setIsSubmitting(false);
          return;
        }

        // 공개 URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('job-images')
          .getPublicUrl(filePath);

        thumbnailUrl = publicUrl;
      }

      // 2. 공고 데이터 저장
      const { data, error } = await supabase
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
          contact_name: formData.contact_name || null,
          deadline: formData.deadline || null,
          is_active: true,
          is_approved: true, // 바로 게시
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/sales" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">공고 등록</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 광고 티어 선택 */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              광고 상품 선택
            </h2>
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
                  <p className="text-sm text-gray-500">
                    {tier.price === 0 ? '무료' : `${tier.price.toLocaleString()}원/월`}
                  </p>
                </button>
              ))}
            </div>
            {selectedTier && selectedTier.price > 0 && (
              <p className="mt-4 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                💡 {selectedTier.label} 상품은 상위 노출 및 강조 표시가 제공됩니다.
              </p>
            )}
          </section>

          {/* 기본 정보 */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              기본 정보
            </h2>

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

              {/* 간단 설명 */}
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

              {/* 상세 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세 내용
                </label>
                <textarea
                  name="html_content"
                  value={formData.html_content}
                  onChange={handleChange}
                  rows={8}
                  placeholder="모집 조건, 현장 소개, 근무 환경 등을 자세히 작성해주세요."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">HTML 태그 사용 가능</p>
              </div>
            </div>
          </section>

          {/* 썸네일 이미지 */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              썸네일 이미지
            </h2>

            {/* 숨겨진 파일 입력 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              style={{ display: 'none' }}
            />

            {thumbnailPreview ? (
              <div className="relative w-full max-w-md">
                <img
                  src={thumbnailPreview}
                  alt="썸네일 미리보기"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer bg-white"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">클릭하여 이미지 업로드</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (최대 5MB)</p>
              </button>
            )}
          </section>

          {/* 모집 조건 */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              모집 조건
            </h2>

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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
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
          </section>

          {/* 회사/현장 정보 */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              회사/현장 정보
            </h2>

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

              {/* 상세 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세 주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="예: 서울시 강남구 테헤란로 123"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </section>

          {/* 연락처 */}
          <section className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" />
              연락처
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자명
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  placeholder="예: 홍길동"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </section>

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
