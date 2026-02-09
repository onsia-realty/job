'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Camera,
  Save,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Info,
  MapPin,
  Phone,
  Globe,
  Users,
  Calendar,
  Image,
} from 'lucide-react';
import type { CompanyProfile, CompanyBusinessType } from '@/types';
import { COMPANY_BUSINESS_TYPE_LABELS, REGIONS } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyCompanyProfile, saveCompanyProfile } from '@/lib/supabase';
import { uploadImage, deleteUploadedImage } from '@/lib/upload';

const EMPTY_PROFILE: CompanyProfile = {
  id: '',
  userId: '',
  companyName: '',
  businessType: undefined,
  description: '',
  address: '',
  detailAddress: '',
  region: '',
  phone: '',
  website: '',
  employeeCount: undefined,
  foundedYear: undefined,
  logoUrl: '',
  signboardUrl: '',
  interiorUrls: [],
  createdAt: '',
  updatedAt: '',
};

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  // 이미지 파일 & 미리보기
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signboardFile, setSignboardFile] = useState<File | null>(null);
  const [signboardPreview, setSignboardPreview] = useState<string | null>(null);
  const [interiorFiles, setInteriorFiles] = useState<(File | null)[]>([]);
  const [interiorPreviews, setInteriorPreviews] = useState<string[]>([]);

  const [uploadingImages, setUploadingImages] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signboardInputRef = useRef<HTMLInputElement>(null);
  const interiorInputRef = useRef<HTMLInputElement>(null);

  // employer 모드 아닌 경우 리다이렉트
  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role;
      if (role !== 'employer') {
        router.replace('/agent/mypage');
      }
    }
  }, [user, router]);

  // 기존 프로필 로드
  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const existing = await fetchMyCompanyProfile(user.id);
        if (existing) {
          setProfile(existing);
          setIsExisting(true);
          if (existing.logoUrl) setLogoPreview(existing.logoUrl);
          if (existing.signboardUrl) setSignboardPreview(existing.signboardUrl);
          if (existing.interiorUrls.length > 0) {
            setInteriorPreviews(existing.interiorUrls);
          }
        } else {
          // user_metadata에서 프리필
          const meta = user.user_metadata;
          setProfile({
            ...EMPTY_PROFILE,
            companyName: meta?.brokerOfficeName || meta?.company_name || '',
            address: meta?.brokerAddress || '',
            phone: meta?.phone || '',
          });
        }
      } catch (err) {
        console.error('Failed to load company profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user?.id]);

  // 이미지 선택 핸들러
  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'signboard' | 'interior'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'logo') {
      const file = files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else if (type === 'signboard') {
      const file = files[0];
      setSignboardFile(file);
      setSignboardPreview(URL.createObjectURL(file));
    } else if (type === 'interior') {
      const remaining = 5 - interiorPreviews.length;
      const newFiles = Array.from(files).slice(0, remaining);
      const newPreviews = newFiles.map(f => URL.createObjectURL(f));
      setInteriorFiles(prev => [...prev, ...newFiles]);
      setInteriorPreviews(prev => [...prev, ...newPreviews]);
    }

    // input 초기화
    e.target.value = '';
  };

  // 이미지 삭제 핸들러
  const handleRemoveImage = async (type: 'logo' | 'signboard' | 'interior', index?: number) => {
    if (type === 'logo') {
      // 기존 Storage URL이면 삭제
      if (profile.logoUrl && !logoFile) {
        await deleteUploadedImage(profile.logoUrl);
      }
      setLogoFile(null);
      setLogoPreview(null);
      setProfile(prev => ({ ...prev, logoUrl: '' }));
    } else if (type === 'signboard') {
      if (profile.signboardUrl && !signboardFile) {
        await deleteUploadedImage(profile.signboardUrl);
      }
      setSignboardFile(null);
      setSignboardPreview(null);
      setProfile(prev => ({ ...prev, signboardUrl: '' }));
    } else if (type === 'interior' && index !== undefined) {
      // 기존 URL인지 새 파일인지 판별
      const existingCount = profile.interiorUrls.length;
      if (index < existingCount) {
        // 기존 Storage URL 삭제
        await deleteUploadedImage(profile.interiorUrls[index]);
        setProfile(prev => ({
          ...prev,
          interiorUrls: prev.interiorUrls.filter((_, i) => i !== index),
        }));
        setInteriorPreviews(prev => prev.filter((_, i) => i !== index));
      } else {
        // 새로 추가한 파일 삭제
        const fileIndex = index - existingCount;
        setInteriorFiles(prev => prev.filter((_, i) => i !== fileIndex));
        setInteriorPreviews(prev => prev.filter((_, i) => i !== index));
      }
    }
  };

  // 저장
  const handleSave = async () => {
    if (!user?.id) {
      setSaveError('로그인이 필요합니다');
      return;
    }

    if (!profile.companyName.trim()) {
      setSaveError('회사명은 필수 입력 항목입니다');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // 1. 이미지 업로드
      setUploadingImages(true);
      let logoUrl = profile.logoUrl || '';
      let signboardUrl = profile.signboardUrl || '';
      let interiorUrls = [...profile.interiorUrls];

      if (logoFile) {
        const url = await uploadImage(logoFile, 'company-images');
        if (url) logoUrl = url;
      }

      if (signboardFile) {
        const url = await uploadImage(signboardFile, 'company-images');
        if (url) signboardUrl = url;
      }

      // 새 인테리어 사진 업로드
      for (const file of interiorFiles) {
        if (file) {
          const url = await uploadImage(file, 'company-images');
          if (url) interiorUrls.push(url);
        }
      }

      setUploadingImages(false);

      // 2. 프로필 저장
      const saved = await saveCompanyProfile(
        {
          ...profile,
          logoUrl,
          signboardUrl,
          interiorUrls,
        },
        user.id
      );

      if (saved) {
        setProfile(saved);
        setIsExisting(true);
        setSaveSuccess(true);
        // 파일 상태 초기화
        setLogoFile(null);
        setSignboardFile(null);
        setInteriorFiles([]);
        if (saved.logoUrl) setLogoPreview(saved.logoUrl);
        if (saved.signboardUrl) setSignboardPreview(saved.signboardUrl);
        setInteriorPreviews(saved.interiorUrls);
        // 3초 후 성공 메시지 숨기기
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError('기업 정보 저장에 실패했습니다');
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveError('저장 중 오류가 발생했습니다');
    } finally {
      setIsSaving(false);
      setUploadingImages(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">기업 정보 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <Link
            href="/agent/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/mypage"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">마이페이지</span>
            </Link>
            <h1 className="font-bold text-gray-900">기업 정보 {isExisting ? '수정' : '등록'}</h1>
            <button
              onClick={handleSave}
              disabled={!profile.companyName.trim() || isSaving}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? (uploadingImages ? '업로드 중...' : '저장 중...') : '저장'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 에러/성공 메시지 */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{saveError}</p>
            <button onClick={() => setSaveError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 text-sm font-medium">기업 정보가 저장되었습니다</p>
          </div>
        )}

        {/* 프리필 안내 */}
        {!isExisting && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 text-sm font-medium">인증 정보 자동 입력</p>
              <p className="text-blue-600 text-xs mt-1">
                사업자 인증 시 등록한 정보가 자동으로 입력됩니다. 수정 후 저장해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 기본 정보 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            기본 정보
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                회사명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                placeholder="회사명을 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">업종</label>
              <select
                value={profile.businessType || ''}
                onChange={(e) => setProfile({ ...profile, businessType: (e.target.value || undefined) as CompanyBusinessType | undefined })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {(Object.keys(COMPANY_BUSINESS_TYPE_LABELS) as CompanyBusinessType[]).map((type) => (
                  <option key={type} value={type}>
                    {COMPANY_BUSINESS_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">회사 소개</label>
              <textarea
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="회사에 대한 간단한 소개를 작성해주세요"
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 회사 이미지 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-600" />
            회사 이미지
          </h2>
          <div className="space-y-6">
            {/* 회사 로고 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">회사 로고</label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, 'logo')}
                className="hidden"
              />
              {logoPreview ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={logoPreview} alt="로고" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleRemoveImage('logo')}
                      className="p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-xs">로고 업로드</span>
                </button>
              )}
            </div>

            {/* 옥외 간판 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">옥외 간판</label>
              <input
                ref={signboardInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, 'signboard')}
                className="hidden"
              />
              {signboardPreview ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={signboardPreview} alt="간판" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                    <button
                      onClick={() => signboardInputRef.current?.click()}
                      className="p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleRemoveImage('signboard')}
                      className="p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => signboardInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-xs">간판 사진 업로드</span>
                </button>
              )}
            </div>

            {/* 내부 사진 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  내부 사진 <span className="text-xs text-gray-400 ml-1">({interiorPreviews.length}/5)</span>
                </label>
              </div>
              <input
                ref={interiorInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageSelect(e, 'interior')}
                className="hidden"
              />
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {interiorPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={preview} alt={`내부 ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage('interior', index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {interiorPreviews.length < 5 && (
                  <button
                    onClick={() => interiorInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <Plus className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px]">추가</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 연락처 & 위치 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            연락처 & 위치
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <input
                type="text"
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="사업장 주소를 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상세주소</label>
              <input
                type="text"
                value={profile.detailAddress || ''}
                onChange={(e) => setProfile({ ...profile, detailAddress: e.target.value })}
                placeholder="상세주소 (동, 호수 등)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
              <select
                value={profile.region || ''}
                onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />
                  대표 전화
                </label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="02-000-0000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-3.5 h-3.5 inline mr-1" />
                  웹사이트
                </label>
                <input
                  type="url"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            추가 정보
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                직원 수
              </label>
              <input
                type="number"
                value={profile.employeeCount || ''}
                onChange={(e) => setProfile({ ...profile, employeeCount: parseInt(e.target.value) || undefined })}
                placeholder="직원 수"
                min={1}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                설립 연도
              </label>
              <input
                type="number"
                value={profile.foundedYear || ''}
                onChange={(e) => setProfile({ ...profile, foundedYear: parseInt(e.target.value) || undefined })}
                placeholder="2020"
                min={1900}
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 하단 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={!profile.companyName.trim() || isSaving}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSaving ? (uploadingImages ? '이미지 업로드 중...' : '저장 중...') : '저장하기'}
        </button>
      </main>
    </div>
  );
}
