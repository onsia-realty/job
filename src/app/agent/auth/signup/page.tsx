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
} from 'lucide-react';
import type { UserRole } from '@/types';

interface SignUpFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
  role: UserRole;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

const INITIAL_FORM: SignUpFormData = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phone: '',
  role: 'seeker',
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

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
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

    // Mock 회원가입 (실제로는 API 호출)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 사용자 정보 저장
    const newUser = {
      id: `user_${Date.now()}`,
      email: form.email,
      name: form.name,
      phone: form.phone,
      provider: 'email',
      role: form.role,
      userType: 'agent',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    localStorage.setItem('agent_user', JSON.stringify(newUser));

    setIsLoading(false);
    setStep('success');
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
                value={form.email}
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
                value={form.password}
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
                value={form.passwordConfirm}
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
                value={form.name}
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
              연락처 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
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
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-6"
          >
            {isLoading ? '가입 중...' : '가입하기'}
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
