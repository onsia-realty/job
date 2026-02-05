'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  Building2,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import type { UserRole } from '@/types';
import { signUpWithEmail } from '@/lib/auth';
import type { BrokerOfficeInfo } from '@/app/api/broker/route';

interface SignUpFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  nickname: string;
  phone: string;
  role: UserRole;
  // 중개사무소 정보 (구직자용)
  brokerRegNo: string;
  brokerOfficeName: string;
  brokerAddress: string;
  brokerRegDate: string;
  brokerStatus: string;
  // 약관
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

const INITIAL_FORM: SignUpFormData = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
  phone: '',
  role: 'seeker',
  brokerRegNo: '',
  brokerOfficeName: '',
  brokerAddress: '',
  brokerRegDate: '',
  brokerStatus: '',
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false,
};

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignUpFormData>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isFetchingBroker, setIsFetchingBroker] = useState(false);
  const [brokerVerified, setBrokerVerified] = useState(false);

  // 중개사무소 정보 조회
  const fetchBrokerInfo = async () => {
    if (!form.brokerRegNo) {
      setErrors({ ...errors, brokerRegNo: '개설등록번호를 입력해주세요' });
      return;
    }

    setIsFetchingBroker(true);
    setErrors({ ...errors, brokerRegNo: undefined });
    setBrokerVerified(false);

    try {
      const response = await fetch(`/api/broker?regNo=${encodeURIComponent(form.brokerRegNo)}`);
      const result = await response.json();

      if (!response.ok) {
        setErrors({ ...errors, brokerRegNo: result.error || '조회에 실패했습니다' });
        return;
      }

      const data: BrokerOfficeInfo = result.data;
      setForm({
        ...form,
        brokerOfficeName: data.medOfficeNm,
        brokerAddress: data.lctnRoadNmAddr || data.lctnLotnoAddr,
        brokerRegDate: data.estblRegDe,
        brokerStatus: data.sttusSeNm || '영업중',
      });
      setBrokerVerified(true);
    } catch (error) {
      console.error('Broker fetch error:', error);
      setErrors({ ...errors, brokerRegNo: '조회 중 오류가 발생했습니다' });
    } finally {
      setIsFetchingBroker(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 개설등록번호 포맷 (제11710-2022-00250호 → 11710-2022-00250)
  const formatBrokerRegNo = (value: string) => {
    // "제", "호" 제거하고 숫자와 하이픈만 추출
    const cleaned = value.replace(/[제호\s]/g, '');
    const numbers = cleaned.replace(/[^\d]/g, '');

    // 14자리 숫자인 경우 자동 포맷 (XXXXX-YYYY-NNNNN)
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 9) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}-${numbers.slice(9, 14)}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SignUpFormData, string>> = {};

    if (!form.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!form.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (form.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password)) {
      newErrors.password = '영문과 숫자를 포함해야 합니다';
    }

    if (!form.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요';
    } else if (form.password !== form.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    }

    if (!form.name) {
      newErrors.name = '이름을 입력해주세요';
    }

    if (!form.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요';
    } else if (form.nickname.length < 2 || form.nickname.length > 12) {
      newErrors.nickname = '닉네임은 2~12자로 입력해주세요';
    } else if (!/^[가-힣a-zA-Z0-9_]+$/.test(form.nickname)) {
      newErrors.nickname = '한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다';
    }

    if (!form.phone) {
      newErrors.phone = '연락처를 입력해주세요';
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(form.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 연락처 형식이 아닙니다';
    }

    if (!form.agreeTerms) {
      newErrors.agreeTerms = '이용약관에 동의해주세요';
    }

    if (!form.agreePrivacy) {
      newErrors.agreePrivacy = '개인정보 처리방침에 동의해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await signUpWithEmail(form.email, form.password, {
        name: form.name,
        nickname: form.nickname,
        phone: form.phone,
        role: form.role,
        userType: 'agent',
        // 중개사무소 정보 (기업회원이고 인증된 경우)
        ...(form.role === 'employer' && brokerVerified && {
          brokerRegNo: form.brokerRegNo,
          brokerOfficeName: form.brokerOfficeName,
          brokerAddress: form.brokerAddress,
          brokerRegDate: form.brokerRegDate,
        }),
      });

      setStep('success');
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setErrors({ email: '이미 가입된 이메일입니다' });
      } else {
        setErrors({ email: err.message || '회원가입 중 오류가 발생했습니다' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgreeAll = () => {
    const allChecked = form.agreeTerms && form.agreePrivacy && form.agreeMarketing;
    setForm({
      ...form,
      agreeTerms: !allChecked,
      agreePrivacy: !allChecked,
      agreeMarketing: !allChecked,
    });
  };

  // 가입 완료 화면
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">가입이 완료되었습니다!</h1>
          <p className="text-gray-600 mb-8">
            온시아 Job의 회원이 되신 것을 환영합니다.<br />
            이제 다양한 채용 공고를 확인해보세요.
          </p>
          <div className="space-y-3">
            <Link
              href="/agent/jobs"
              className="block w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              채용공고 둘러보기
            </Link>
            <Link
              href="/agent/mypage/resume"
              className="block w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              이력서 등록하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/auth/login"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-gray-900">회원가입</h1>
            <div className="w-5" />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* 회원 유형 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">회원 유형</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'seeker' })}
              className={`p-4 rounded-xl border-2 transition-colors ${
                form.role === 'seeker'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  form.role === 'seeker' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <User className={`w-6 h-6 ${form.role === 'seeker' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <p className={`font-medium ${form.role === 'seeker' ? 'text-blue-600' : 'text-gray-900'}`}>
                  구직자
                </p>
                <p className="text-xs text-gray-500 mt-1">일자리를 찾고 있어요</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'employer' })}
              className={`p-4 rounded-xl border-2 transition-colors ${
                form.role === 'employer'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  form.role === 'employer' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <User className={`w-6 h-6 ${form.role === 'employer' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <p className={`font-medium ${form.role === 'employer' ? 'text-blue-600' : 'text-gray-900'}`}>
                  기업회원
                </p>
                <p className="text-xs text-gray-500 mt-1">인재를 찾고 있어요</p>
              </div>
            </button>
          </div>
        </div>

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="이메일을 입력하세요"
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="영문, 숫자 포함 8자 이상"
                className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                value={form.passwordConfirm || ''}
                onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                placeholder="비밀번호를 다시 입력하세요"
                className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.passwordConfirm ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.passwordConfirm && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.passwordConfirm}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="이름을 입력하세요"
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              닉네임 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-2">커뮤니티 활동명</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
              <input
                type="text"
                value={form.nickname || ''}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="닉네임 (2~12자)"
                maxLength={12}
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nickname ? 'border-red-300' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.nickname && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.nickname}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: formatPhoneNumber(e.target.value) })}
                placeholder="010-0000-0000"
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* 중개사무소 정보 (기업회원만) */}
          {form.role === 'employer' && (
            <div className="pt-4">
              <div className="p-4 bg-blue-50 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Building2 className="w-5 h-5" />
                  <span className="font-semibold">중개사무소 정보</span>
                  <span className="text-xs text-blue-500 ml-auto">선택사항</span>
                </div>

                {/* 개설등록번호 입력 및 조회 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    개설등록번호
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={form.brokerRegNo || ''}
                        onChange={(e) => {
                          setForm({ ...form, brokerRegNo: formatBrokerRegNo(e.target.value) });
                          setBrokerVerified(false);
                        }}
                        placeholder="예: 11710-2022-00250"
                        maxLength={16}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.brokerRegNo ? 'border-red-300' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={fetchBrokerInfo}
                      disabled={isFetchingBroker || !form.brokerRegNo}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isFetchingBroker ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      조회
                    </button>
                  </div>
                  {errors.brokerRegNo && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.brokerRegNo}
                    </p>
                  )}
                </div>

                {/* 조회된 정보 표시 */}
                {brokerVerified && (
                  <div className="p-4 bg-white rounded-xl border border-green-200 space-y-3">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">확인된 중개사무소</span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">중개사무소명</p>
                          <p className="font-medium text-gray-900">{form.brokerOfficeName}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">소재지</p>
                          <p className="font-medium text-gray-900">{form.brokerAddress}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">개설등록일</p>
                          <p className="font-medium text-gray-900">{form.brokerRegDate}</p>
                        </div>
                      </div>

                      {form.brokerStatus && (
                        <div className="pt-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            form.brokerStatus === '영업중'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {form.brokerStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  * 개설등록번호를 입력하면 공공데이터를 통해 중개사무소 정보가 자동으로 조회됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 약관 동의 */}
          <div className="pt-4">
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              {/* 전체 동의 */}
              <label className="flex items-center gap-3 cursor-pointer pb-3 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={form.agreeTerms && form.agreePrivacy && form.agreeMarketing}
                  onChange={handleAgreeAll}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900">전체 동의</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  <span className="text-red-500">[필수]</span> 이용약관 동의
                </span>
                <Link href="/terms" className="ml-auto text-gray-400 hover:text-gray-600">
                  <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                </Link>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreePrivacy}
                  onChange={(e) => setForm({ ...form, agreePrivacy: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  <span className="text-red-500">[필수]</span> 개인정보 처리방침 동의
                </span>
                <Link href="/privacy" className="ml-auto text-gray-400 hover:text-gray-600">
                  <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                </Link>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeMarketing}
                  onChange={(e) => setForm({ ...form, agreeMarketing: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  <span className="text-gray-400">[선택]</span> 마케팅 정보 수신 동의
                </span>
              </label>
            </div>
            {(errors.agreeTerms || errors.agreePrivacy) && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                필수 약관에 동의해주세요
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-6 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                가입 중...
              </>
            ) : (
              '가입하기'
            )}
          </button>
        </form>

        {/* 로그인 링크 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          이미 회원이신가요?{' '}
          <Link href="/agent/auth/login" className="text-blue-600 font-medium hover:text-blue-700">
            로그인
          </Link>
        </p>
      </main>
    </div>
  );
}
