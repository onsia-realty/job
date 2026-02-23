'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Upload, X, Building2, Briefcase,
  DollarSign, Clock, Phone, FileText, Image as ImageIcon,
  ShieldAlert, Loader2, CheckCircle2, Lock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImage, uploadMultipleImages } from '@/lib/upload';
import { useAuth } from '@/contexts/AuthContext';
import FormSection from '@/components/shared/FormSection';
import ThumbnailUpload from '@/components/shared/ThumbnailUpload';
import ContactSection from '@/components/shared/ContactSection';
import AddressSearch from '@/components/shared/AddressSearch';
import type { AgentJobType, AgentSalaryType, AgentExperience, AgentJobTier, SalesJobType, PropertyCategory } from '@/types';
import { PROPERTY_CATEGORY_LABELS, PROPERTY_CATEGORY_TYPES } from '@/types';

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

const AGENT_JOB_TYPES: { value: AgentJobType; label: string }[] = [
  { value: 'apartment', label: '아파트' },
  { value: 'officetel', label: '오피스텔' },
  { value: 'villa', label: '빌라/다세대' },
  { value: 'store', label: '상가' },
  { value: 'office', label: '사무실' },
  { value: 'building', label: '빌딩매매' },
  { value: 'auction', label: '경매' },
];

const SALES_JOB_TYPES: { value: SalesJobType; label: string }[] = [
  { value: 'apartment', label: '아파트' },
  { value: 'officetel', label: '오피스텔' },
  { value: 'store', label: '상가' },
  { value: 'industrial', label: '지식산업센터' },
];

const SALARY_TYPES: { value: AgentSalaryType; label: string }[] = [
  { value: 'monthly', label: '월급' },
  { value: 'commission', label: '비율제' },
  { value: 'mixed', label: '월급 + 비율제' },
];

const EXPERIENCES: { value: AgentExperience; label: string }[] = [
  { value: 'none', label: '경력무관' },
  { value: '6month', label: '6개월 이상' },
  { value: '1year', label: '1년 이상' },
  { value: '2year', label: '2년 이상' },
  { value: '3year', label: '3년 이상' },
  { value: '5year', label: '5년 이상' },
];

const IMAGE_SLOTS = [
  { key: 'logo', label: '부동산 로고', placeholder: '로고 이미지를 업로드하세요' },
  { key: 'signboard', label: '옥외 간판', placeholder: '옥외 간판 사진을 업로드하세요' },
  { key: 'interior', label: '내부 이미지', placeholder: '사무소 내부 사진을 업로드하세요' },
] as const;

const TIERS: { value: AgentJobTier; label: string; price: number; originalPrice: number; duration: string; color: string }[] = [
  { value: 'normal', label: '무료', price: 0, originalPrice: 0, duration: '24시간', color: 'bg-gray-500' },
  { value: 'basic', label: 'BASIC', price: 4900, originalPrice: 49000, duration: '5일', color: 'bg-gradient-to-r from-amber-400 to-yellow-400' },
  { value: 'premium', label: '프리미엄', price: 9900, originalPrice: 99000, duration: '1주일', color: 'bg-blue-500' },
  { value: 'vip', label: 'VIP', price: 24900, originalPrice: 249000, duration: '1주일', color: 'bg-gradient-to-r from-amber-500 to-yellow-500' },
];

const WORK_DAYS_OPTIONS = [
  '월~금', '월~토', '주5일', '주6일', '협의',
];

const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

// 마감일 제한: 오늘 ~ 오늘+10일
const today = new Date().toISOString().split('T')[0];
const maxDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

function NewAgentJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user: authUser, session, isLoading: authLoading } = useAuth();
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'agent' | 'sales' | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(!!editId);

  // 부동산 이미지 3장 (로고, 옥외 간판, 내부)
  const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({ logo: null, signboard: null, interior: null });
  const [imagePreviews, setImagePreviews] = useState<Record<string, string | null>>({ logo: null, signboard: null, interior: null });

  // 인증 상태 확인
  const meta = authUser?.user_metadata;
  const isVerified = meta?.brokerVerified === true || meta?.businessVerified === true || meta?.cardVerified === true;
  const hasBrokerVerified = meta?.brokerVerified === true;
  const hasBusinessVerified = meta?.businessVerified === true;
  const hasCardVerified = meta?.cardVerified === true;
  const canPostSales = hasBusinessVerified || hasCardVerified; // 분양상담사 구인: 사업자 or 명함

  // 인증된 회사/사무소명 가져오기
  const verifiedCompanyName = meta?.brokerOfficeName || meta?.bizName || meta?.cardCompany || '';

  useEffect(() => {
    if (!authLoading && authUser && !isVerified) {
      setShowVerificationModal(true);
    }
    // 인증된 회사명으로 자동 채우기 (신규 작성시만)
    if (!editId && verifiedCompanyName && !formData.company) {
      setFormData(prev => ({ ...prev, company: verifiedCompanyName }));
    }
  }, [authUser, authLoading, isVerified, verifiedCompanyName]);

  // 수정 모드: 기존 공고 데이터 불러오기
  useEffect(() => {
    if (!editId || !authUser || !session?.access_token) return;
    setIsEditLoading(true);
    (async () => {
      const res = await fetch(`/api/jobs/${editId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = res.ok ? await res.json() : null;

      if (!data || data.error) {
        alert('공고를 불러올 수 없습니다.');
        router.push('/agent/employer');
        return;
      }

      // 카테고리 설정
      setSelectedCategory((data.category || 'agent') as 'agent' | 'sales');

      // 주거용/상업용 대분류 복원
      if (data.property_category) {
        setPropertyCategory(data.property_category as PropertyCategory);
      } else if (data.type) {
        // 기존 데이터에 property_category가 없으면 type으로 추론
        const isCommercial = PROPERTY_CATEGORY_TYPES.commercial.includes(data.type);
        setPropertyCategory(isCommercial ? 'commercial' : 'residential');
      }

      // 주소에서 상세주소 분리
      const address = data.address || '';
      const workHoursMatch = data.html_content?.match(/근무시간: (.+?) ~ (.+)/);
      const workDaysMatch = data.html_content?.match(/근무요일: (.+)/);

      // 폼 데이터 복원
      setFormData({
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'apartment',
        tier: data.tier || 'normal',
        salary_type: data.salary_type || 'monthly',
        salary_amount: data.salary_amount ? data.salary_amount.replace(/[^0-9]/g, '') : '',
        experience: data.experience || 'none',
        company: data.company || '',
        region: data.region || '서울',
        address: address,
        detail_address: '',
        phone: data.phone || '',
        office_phone: data.office_phone || '',
        contact_name: data.contact_name || '',
        deadline: data.deadline || '',
        is_always_recruiting: !data.deadline,
        work_start: workHoursMatch?.[1] || '09:00',
        work_end: workHoursMatch?.[2] || '18:00',
        work_days: workDaysMatch?.[1] || '',
        html_content: data.html_content || '',
      });

      // 썸네일 복원
      if (data.thumbnail) {
        setThumbnailPreview(data.thumbnail);
      }

      // 부동산 이미지 복원
      const imgMatch = data.html_content?.match(/<!-- AGENT_IMAGES:(.*?) -->/);
      if (imgMatch) {
        try {
          const imgs = JSON.parse(imgMatch[1]);
          setImagePreviews({
            logo: imgs.logo || null,
            signboard: imgs.signboard || null,
            interior: imgs.interior || null,
          });
        } catch {}
      }

      setIsEditLoading(false);
    })();
  }, [editId, authUser, session]);

  // 주거용/상업용 대분류 상태
  const [propertyCategory, setPropertyCategory] = useState<PropertyCategory>('residential');

  // 대분류 변경 시 매물유형도 해당 대분류의 첫 번째로 리셋
  const handlePropertyCategoryChange = (cat: PropertyCategory) => {
    setPropertyCategory(cat);
    const firstType = PROPERTY_CATEGORY_TYPES[cat][0];
    setFormData(prev => ({ ...prev, type: firstType }));
  };

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'apartment' as AgentJobType,
    tier: 'normal' as AgentJobTier,
    salary_type: 'monthly' as AgentSalaryType,
    salary_amount: '',
    experience: 'none' as AgentExperience,
    company: '',
    region: '서울',
    address: '',
    detail_address: '',
    phone: '',
    office_phone: '',
    contact_name: '',
    deadline: '',
    is_always_recruiting: false,
    work_start: '09:00',
    work_end: '18:00',
    work_days: '',
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

  // 회사 전화번호 포맷팅 핸들러
  // 서울: 02-XXX-XXXX(9자리) / 02-XXXX-XXXX(10자리)
  // 기타: 0XX-XXX-XXXX(10자리) / 0XX-XXXX-XXXX(11자리)
  const handleOfficePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.startsWith('02')) {
      if (value.length > 10) value = value.slice(0, 10);
      if (value.length >= 10) {
        value = `${value.slice(0,2)}-${value.slice(2,6)}-${value.slice(6)}`;
      } else if (value.length >= 6) {
        value = `${value.slice(0,2)}-${value.slice(2,5)}-${value.slice(5)}`;
      } else if (value.length > 2) {
        value = `${value.slice(0,2)}-${value.slice(2)}`;
      }
    } else {
      if (value.length > 11) value = value.slice(0, 11);
      if (value.length >= 11) {
        value = `${value.slice(0,3)}-${value.slice(3,7)}-${value.slice(7)}`;
      } else if (value.length >= 7) {
        value = `${value.slice(0,3)}-${value.slice(3,6)}-${value.slice(6)}`;
      } else if (value.length > 3) {
        value = `${value.slice(0,3)}-${value.slice(3)}`;
      }
    }
    setFormData(prev => ({ ...prev, office_phone: value }));
  };

  // 급여 금액 핸들러
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, salary_amount: value }));
  };

  // WYSIWYG 에디터 변경 핸들러
  const handleEditorChange = useCallback((html: string) => {
    setFormData(prev => ({ ...prev, html_content: html }));
  }, []);

  // 배너 제목/부제목 ↔ 공고제목/한줄요약 동기화
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

  // 부동산 이미지 업로드 핸들러
  const handleImageChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFiles(prev => ({ ...prev, [key]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (key: string) => {
    setImageFiles(prev => ({ ...prev, [key]: null }));
    setImagePreviews(prev => ({ ...prev, [key]: null }));
  };

  // 상시채용 토글
  const toggleAlwaysRecruiting = () => {
    setFormData(prev => ({
      ...prev,
      is_always_recruiting: !prev.is_always_recruiting,
      deadline: !prev.is_always_recruiting ? '' : prev.deadline,
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

    // 담당자 정보 필수 체크
    if (!formData.contact_name.trim()) {
      alert('담당자명을 입력해주세요.');
      return;
    }
    if (!formData.phone.trim() && !formData.office_phone.trim()) {
      alert('연락처(휴대폰 또는 회사전화)를 하나 이상 입력해주세요.');
      return;
    }

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
      } else if (editId && thumbnailPreview) {
        // 수정 모드: 기존 썸네일 유지
        thumbnailUrl = thumbnailPreview;
      }

      // 2. 부동산 이미지 3장 업로드
      const imageUrls = await uploadMultipleImages(imageFiles, 'agent-images');

      // 3. 추가 정보를 html_content에 포함
      const workHours = formData.work_start && formData.work_end
        ? `${formData.work_start} ~ ${formData.work_end}`
        : '';

      // 기존 html_content에서 이전에 append된 extra info/이미지 데이터 제거 (중복 방지)
      let cleanHtml = formData.html_content
        .replace(/\n*상세주소: .+/g, '')
        .replace(/\n*근무시간: .+/g, '')
        .replace(/\n*근무요일: .+/g, '')
        .replace(/\n*상시채용/g, '')
        .replace(/\n*<!-- AGENT_IMAGES:.*? -->/g, '')
        .trimEnd();

      const extraInfo = [
        formData.detail_address && `상세주소: ${formData.detail_address}`,
        workHours && `근무시간: ${workHours}`,
        formData.work_days && `근무요일: ${formData.work_days}`,
        formData.is_always_recruiting && '상시채용',
      ].filter(Boolean).join('\n');

      // 수정 모드: 기존 이미지 유지 (새 업로드가 없으면)
      let imageData = '';
      if (Object.keys(imageUrls).length > 0) {
        imageData = `<!-- AGENT_IMAGES:${JSON.stringify(imageUrls)} -->`;
      } else if (editId) {
        // 기존 이미지 데이터 보존
        const existingImgMatch = formData.html_content.match(/<!-- AGENT_IMAGES:(.*?) -->/);
        if (existingImgMatch) {
          imageData = existingImgMatch[0];
        }
      }

      const fullHtmlContent = [cleanHtml, extraInfo, imageData].filter(Boolean).join('\n\n') || null;

      // 4. 공고 데이터 저장
      const jobPayload = {
        title: formData.title,
        description: formData.description,
        html_content: fullHtmlContent,
        category: selectedCategory || 'agent',
        property_category: selectedCategory === 'agent' ? propertyCategory : null,
        type: formData.type,
        tier: 'normal',
        salary_type: formData.salary_type,
        salary_amount: formData.salary_amount ? `${formData.salary_amount}만원` : null,
        experience: formData.experience,
        company: verifiedCompanyName || formData.company,
        region: formData.region,
        address: formData.address ? `${formData.address}${formData.detail_address ? ` ${formData.detail_address}` : ''}` : null,
        thumbnail: thumbnailUrl,
        phone: formData.phone || null,
        office_phone: formData.office_phone || null,
        contact_name: formData.contact_name || null,
        deadline: formData.is_always_recruiting ? null : (formData.deadline || null),
      };

      let apiError: string | null = null;
      let newJobId: string | null = null;
      const authHeaders = {
        'Authorization': `Bearer ${session!.access_token}`,
        'Content-Type': 'application/json',
      };

      if (editId) {
        // 수정 모드 — API 라우트로 업데이트 (서버에서 service role 사용)
        const res = await fetch(`/api/jobs/${editId}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(jobPayload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          apiError = err.error || '수정 권한이 없거나 공고를 찾을 수 없습니다.';
        }
      } else {
        // 신규 등록 — API 라우트로 등록
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            ...jobPayload,
            badges: [],
            position: 'member',
            benefits: [],
            company_type: null,
            is_active: true,
            is_approved: true,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          newJobId = data?.id || null;
        } else {
          const err = await res.json().catch(() => ({}));
          apiError = err.error || '공고 등록에 실패했습니다.';
        }
      }

      if (apiError) {
        console.error(editId ? 'Update error:' : 'Insert error:', apiError);
        alert(`공고 ${editId ? '수정' : '등록'}에 실패했습니다: ${apiError}`);
        setIsSubmitting(false);
        return;
      }

      alert(editId ? '공고가 수정되었습니다!' : '공고가 등록되었습니다! 내 공고보기에서 유료 업그레이드가 가능합니다.');
      router.push('/agent/employer');

    } catch (err) {
      console.error('Submit error:', err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isEditLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          {isEditLoading && <p className="text-sm text-gray-500">공고 데이터를 불러오는 중...</p>}
        </div>
      </div>
    );
  }

  // 비로그인 유저 → 로그인 안내
  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <Link href="/agent/jobs" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">구인글 작성</h1>
          </div>
        </header>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 text-sm mb-6">구인글을 작성하려면 먼저 로그인해주세요.</p>
          <Link
            href="/agent/auth/login"
            className="inline-block px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </Link>
          <p className="mt-4 text-xs text-gray-400">
            아직 회원이 아니신가요?{' '}
            <Link href="/agent/auth/signup" className="text-blue-600 hover:underline">회원가입</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 인증 필요 모달 (카테고리 선택 후에만 표시) */}
      {showVerificationModal && !isVerified && selectedCategory && (
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
                className="block w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-center hover:bg-blue-700 transition-colors"
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
          {editId ? (
            <Link href="/agent/employer" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          ) : selectedCategory ? (
            <button onClick={() => setSelectedCategory(null)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <Link href="/agent/mypage" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          )}
          <h1 className="text-lg font-bold text-gray-900">
            {editId
              ? (selectedCategory === 'agent' ? '공인중개사 구인글 수정' : selectedCategory === 'sales' ? '분양상담사 구인글 수정' : '구인글 수정')
              : (selectedCategory === 'agent' ? '공인중개사 구인글 등록' : selectedCategory === 'sales' ? '분양상담사 구인글 등록' : '구인글 작성')
            }
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* 카테고리 선택 화면 */}
        {!selectedCategory && (
          <div className="max-w-2xl mx-auto py-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">구인글 유형 선택</h2>
              <p className="text-gray-500 text-sm">작성할 구인글 유형을 선택해주세요</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 공인중개사 구인글 */}
              <button
                type="button"
                onClick={() => hasBrokerVerified && setSelectedCategory('agent')}
                disabled={!hasBrokerVerified}
                className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                  hasBrokerVerified
                    ? 'border-blue-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 cursor-pointer bg-white'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                }`}
              >
                {!hasBrokerVerified && (
                  <div className="absolute top-3 right-3">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                  hasBrokerVerified ? 'bg-blue-100' : 'bg-gray-200'
                }`}>
                  <Building2 className={`w-7 h-7 ${hasBrokerVerified ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-lg font-bold mb-1 ${hasBrokerVerified ? 'text-gray-900' : 'text-gray-400'}`}>
                  공인중개사
                </h3>
                <p className={`text-sm mb-3 ${hasBrokerVerified ? 'text-gray-500' : 'text-gray-400'}`}>
                  구인글 작성
                </p>
                {hasBrokerVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 중개업소 인증됨
                  </span>
                ) : (
                  <span className="text-xs text-red-500 font-medium">
                    중개업소 인증 필요
                  </span>
                )}
              </button>

              {/* 분양상담사 구인글 */}
              <button
                type="button"
                onClick={() => canPostSales && setSelectedCategory('sales')}
                disabled={!canPostSales}
                className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                  canPostSales
                    ? 'border-teal-200 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-100 cursor-pointer bg-white'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                }`}
              >
                {!canPostSales && (
                  <div className="absolute top-3 right-3">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                  canPostSales ? 'bg-teal-100' : 'bg-gray-200'
                }`}>
                  <Briefcase className={`w-7 h-7 ${canPostSales ? 'text-teal-600' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-lg font-bold mb-1 ${canPostSales ? 'text-gray-900' : 'text-gray-400'}`}>
                  분양상담사
                </h3>
                <p className={`text-sm mb-3 ${canPostSales ? 'text-gray-500' : 'text-gray-400'}`}>
                  구인글 작성
                </p>
                {canPostSales ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {hasBusinessVerified ? '사업자 인증됨' : '명함 인증됨'}
                  </span>
                ) : (
                  <span className="text-xs text-red-500 font-medium">
                    사업자 또는 명함 인증 필요
                  </span>
                )}
              </button>
            </div>

            {/* 인증 안내 */}
            {!isVerified && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-sm text-amber-800 mb-3">
                  구인글을 작성하려면 기업 인증이 필요합니다.
                </p>
                <Link
                  href="/agent/mypage/verification"
                  className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  인증하러 가기
                </Link>
              </div>
            )}

            {!hasBrokerVerified && canPostSales && (
              <p className="mt-4 text-center text-xs text-gray-500">
                공인중개사 구인글은 중개업소 등록번호 인증이 필요합니다. {' '}
                <Link href="/agent/mypage/verification#broker" className="text-blue-600 hover:underline">
                  중개업소 인증하기
                </Link>
              </p>
            )}

            {hasBrokerVerified && !canPostSales && (
              <p className="mt-4 text-center text-xs text-gray-500">
                분양상담사 구인글은 사업자 또는 명함 인증이 필요합니다. {' '}
                <Link href="/agent/mypage/verification#business" className="text-blue-600 hover:underline">
                  사업자 인증
                </Link>
                {' / '}
                <Link href="/agent/mypage/verification#card" className="text-teal-600 hover:underline">
                  명함 인증
                </Link>
              </p>
            )}
          </div>
        )}

        {/* 구인글 작성 폼 */}
        {selectedCategory && (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 공고 등급 안내 */}
          <FormSection icon={DollarSign} title="공고 등급 안내">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium">
                모든 공고는 무료(일반)로 등록됩니다
              </p>
              <p className="text-xs text-blue-600 mt-1">
                등록 후 &apos;내 공고보기&apos;에서 유료 등급으로 업그레이드할 수 있습니다.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TIERS.map((tier) => (
                <div
                  key={tier.value}
                  className={`relative p-4 rounded-xl border-2 ${
                    tier.value === 'normal'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 opacity-70'
                  }`}
                >
                  <div className={`w-full h-2 rounded ${tier.color} mb-3`} />
                  <p className="font-bold text-gray-900">{tier.label}</p>
                  {tier.price === 0 ? (
                    <p className="text-sm text-green-600 font-medium">무료 · {tier.duration}</p>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-gray-500">{tier.price.toLocaleString()}원/{tier.duration}</p>
                    </div>
                  )}
                  {tier.value === 'normal' && (
                    <span className="absolute top-2 right-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      기본
                    </span>
                  )}
                </div>
              ))}
            </div>
          </FormSection>

          {/* 기본 정보 + WYSIWYG 에디터 */}
          <FormSection icon={FileText} title="기본 정보">
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
                  placeholder="예: 강남역 부동산 경력 중개사 모집"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 한줄 요약 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  한줄 요약 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="예: 경력 중개사 우대, 월급+인센티브 지원"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
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
                  placeholder="모집 조건, 업무 내용, 근무 환경 등을 자세히 작성해주세요. 이미지, 표 삽입 가능합니다."
                  templateCategory="agent"
                  defaultTitle={formData.title}
                  defaultSubtitle={formData.description}
                />
                <p className="text-xs text-gray-500 mt-1">비주얼 에디터, HTML 소스, 미리보기 모드를 전환할 수 있습니다.</p>
              </div>
            </div>
          </FormSection>

          {/* 썸네일 이미지 */}
          <FormSection icon={ImageIcon} title="썸네일 이미지">
            <ThumbnailUpload
              preview={thumbnailPreview}
              onFileChange={handleThumbnailChange}
              onRemove={removeThumbnail}
            />
          </FormSection>

          {/* 모집 조건 */}
          <FormSection icon={Briefcase} title="모집 조건">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* 주거용/상업용 대분류 (공인중개사만) */}
              {selectedCategory === 'agent' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    부동산 분야 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {(Object.entries(PROPERTY_CATEGORY_LABELS) as [PropertyCategory, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePropertyCategoryChange(key)}
                        className={`flex-1 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                          propertyCategory === key
                            ? key === 'residential'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className="block text-lg mb-0.5">{key === 'residential' ? '🏠' : '🏢'}</span>
                        {label}
                        <span className="block text-xs font-normal mt-0.5 text-gray-400">
                          {PROPERTY_CATEGORY_TYPES[key].length}개 유형
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 매물유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매물유형 <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                >
                  {(selectedCategory === 'sales'
                    ? SALES_JOB_TYPES
                    : AGENT_JOB_TYPES.filter(t => PROPERTY_CATEGORY_TYPES[propertyCategory].includes(t.value))
                  ).map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                >
                  {SALARY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* 급여 금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  급여 금액
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="salary_amount"
                    value={formData.salary_amount}
                    onChange={handleSalaryChange}
                    placeholder={formData.salary_type === 'monthly' ? '예: 250' : formData.salary_type === 'commission' ? '예: 50' : '예: 200+α'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-16 focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    {formData.salary_type === 'commission' ? '%' : '만원'}
                  </span>
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                >
                  {EXPERIENCES.map((exp) => (
                    <option key={exp.value} value={exp.value}>{exp.label}</option>
                  ))}
                </select>
              </div>

              {/* 마감일 + 상시채용 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  모집 마감일
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    min={today}
                    max={maxDeadline}
                    disabled={formData.is_always_recruiting}
                    className={`flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 ${
                      formData.is_always_recruiting ? 'bg-gray-100 text-gray-400' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={toggleAlwaysRecruiting}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all whitespace-nowrap ${
                      formData.is_always_recruiting
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${formData.is_always_recruiting ? 'text-blue-600' : 'text-gray-400'}`} />
                    상시채용
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">등록일로부터 최대 10일까지 설정 가능</p>
              </div>
            </div>

            {/* 부동산 이미지 업로드 */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부동산 이미지
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {IMAGE_SLOTS.map((slot) => (
                  <div key={slot.key}>
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">{slot.label}</p>
                    <input
                      ref={(el) => { imageInputRefs.current[slot.key] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(slot.key, e)}
                      className="hidden"
                    />
                    {imagePreviews[slot.key] ? (
                      <div className="relative">
                        <img
                          src={imagePreviews[slot.key]!}
                          alt={slot.label}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(slot.key)}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => imageInputRefs.current[slot.key]?.click()}
                        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 transition-colors cursor-pointer bg-white"
                      >
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">{slot.placeholder}</p>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF (최대 2MB)</p>
            </div>
          </FormSection>

          {/* 근무 조건 */}
          <FormSection icon={Clock} title="근무 조건">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  근무시간
                </label>
                <div className="flex items-center gap-2">
                  <select
                    name="work_start"
                    value={formData.work_start}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-gray-500 font-medium">~</span>
                  <select
                    name="work_end"
                    value={formData.work_end}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-blue-500"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  근무요일
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORK_DAYS_OPTIONS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, work_days: day }))}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        formData.work_days === day
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          {/* 회사/사무소 정보 */}
          <FormSection icon={Building2} title="회사/사무소 정보">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사/사무소명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={verifiedCompanyName || formData.company}
                  onChange={verifiedCompanyName ? undefined : handleChange}
                  readOnly={!!verifiedCompanyName}
                  required
                  placeholder="예: 강남부동산중개사무소"
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none ${
                    verifiedCompanyName
                      ? 'border-blue-200 bg-blue-50 text-gray-900 font-medium cursor-not-allowed'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {verifiedCompanyName && (
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    인증된 사무소명이 자동 적용됩니다
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지역 <span className="text-red-500">*</span>
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                >
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <AddressSearch
                  address={formData.address}
                  detailAddress={formData.detail_address}
                  onAddressChange={(addr) => setFormData(prev => ({ ...prev, address: addr }))}
                  onDetailAddressChange={(detail) => setFormData(prev => ({ ...prev, detail_address: detail }))}
                  accentColor="blue"
                />
              </div>
            </div>
          </FormSection>

          {/* 담당자 정보 */}
          <FormSection icon={Phone} title="담당자 정보">
            <ContactSection
              contactName={formData.contact_name}
              phone={formData.phone}
              officePhone={formData.office_phone}
              onContactNameChange={handleChange}
              onPhoneChange={handlePhoneChange}
              onOfficePhoneChange={handleOfficePhoneChange}
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
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="flex-1 py-4 text-center bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-4 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedCategory === 'sales'
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting
                ? (editId ? '수정 중...' : '등록 중...')
                : editId
                  ? '구인글 수정하기'
                  : (selectedCategory === 'sales' ? '분양상담사 구인글 등록하기' : '공인중개사 구인글 등록하기')
              }
            </button>
          </div>

        </form>
        )}
      </main>
    </div>
  );
}

export default function NewAgentJobPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <NewAgentJobContent />
    </Suspense>
  );
}
