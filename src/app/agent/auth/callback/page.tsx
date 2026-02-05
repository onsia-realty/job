'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 code 파라미터 확인
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || '로그인 중 오류가 발생했습니다.');
          return;
        }

        if (code) {
          // Supabase가 자동으로 세션을 처리함
          const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            setError(sessionError.message);
            return;
          }

          if (data.session) {
            // AuthContext가 세션 변경을 감지할 시간 확보
            await new Promise(resolve => setTimeout(resolve, 500));
            // 로그인 성공 - 마이페이지로 이동
            router.replace('/agent/mypage');
            return;
          }
        }

        // 세션 확인
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          router.replace('/agent/mypage');
        } else {
          router.replace('/agent/auth/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('인증 처리 중 오류가 발생했습니다.');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">로그인 실패</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push('/agent/auth/login')}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            다시 로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">로그인 처리 중</h1>
        <p className="text-gray-500">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">로딩 중</h1>
        <p className="text-gray-500">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
