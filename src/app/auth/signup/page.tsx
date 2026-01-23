'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, User } from 'lucide-react';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import SignupForm from '@/components/auth/SignupForm';

type UserType = 'jobseeker' | 'employer';

export default function SignupPage() {
  const [userType, setUserType] = useState<UserType>('jobseeker');

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        {/* 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* 로고 */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-2xl font-black text-gray-900">
                온시아 <span className="text-blue-600">JOB</span>
              </h1>
            </Link>
            <p className="text-sm text-gray-500 mt-1">부동산 전문가 구인구직</p>
          </div>

          {/* 회원 유형 선택 탭 */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => setUserType('jobseeker')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                userType === 'jobseeker'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              구직자(중개사)
            </button>
            <button
              type="button"
              onClick={() => setUserType('employer')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                userType === 'employer'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              구인자(사장님)
            </button>
          </div>

          {/* 간편 가입 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400">간편 가입</span>
            </div>
          </div>

          <SocialLoginButtons userType={userType} />

          {/* 또는 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400">또는</span>
            </div>
          </div>

          {/* 폰 인증 폼 */}
          <SignupForm userType={userType} />

          {/* 로그인 링크 */}
          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
