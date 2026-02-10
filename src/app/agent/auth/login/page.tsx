'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { signInWithProvider, signInWithEmail, resendConfirmationEmail, supabase } from '@/lib/auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

// 카카오 로고 컴포넌트
const KakaoLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.83 1.9 5.31 4.75 6.72l-.92 3.38c-.08.28.28.5.52.33l4.08-2.73c.52.07 1.05.1 1.57.1 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // GIS 콜백 → Supabase signInWithIdToken
  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });
      if (authError) throw authError;
      if (data.session) {
        router.replace('/agent/mypage');
      }
    } catch (err: any) {
      setError(err.message || '구글 로그인 중 오류가 발생했습니다.');
    }
  }, [router]);

  // GIS 초기화
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGis = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        auto_select: false,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 400,
        text: 'continue_with',
      });
    };

    if (window.google?.accounts?.id) {
      initGis();
      return;
    }

    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initGis;
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGis();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [handleGoogleCredential]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
      router.replace('/agent/mypage');
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        setNeedsEmailConfirmation(false);
      } else if (err.message.includes('Email not confirmed')) {
        setError('이메일 인증이 필요합니다. 아래 버튼을 눌러 인증 메일을 재발송하세요.');
        setNeedsEmailConfirmation(true);
      } else {
        setError(err.message || '로그인 중 오류가 발생했습니다.');
        setNeedsEmailConfirmation(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    setResendingEmail(true);
    setResendSuccess(false);
    try {
      await resendConfirmationEmail(email);
      setResendSuccess(true);
      setError('');
    } catch (err: any) {
      setError(err.message || '인증 메일 재발송 중 오류가 발생했습니다.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSocialLogin = async (provider: 'kakao') => {
    setError('');
    setLoadingProvider(provider);

    try {
      await signInWithProvider(provider);
    } catch (err: any) {
      setError(err.message || '소셜 로그인 중 오류가 발생했습니다.');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center h-14">
            <Link
              href="/agent"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">부동산<span className="text-cyan-500">인</span></h1>
          <p className="text-slate-500">공인중개사를 위한 구인구직 플랫폼</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
            {needsEmailConfirmation && (
              <button
                onClick={handleResendConfirmation}
                disabled={resendingEmail}
                className="mt-3 w-full py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {resendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  '인증 메일 재발송'
                )}
              </button>
            )}
          </div>
        )}

        {/* 인증 메일 재발송 성공 */}
        {resendSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-700">
            <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">인증 메일이 재발송되었습니다. 이메일을 확인해주세요.</p>
          </div>
        )}

        {/* 소셜 로그인 (메인) */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => handleSocialLogin('kakao')}
            disabled={!!loadingProvider}
            className="w-full py-4 bg-[#FEE500] text-[#191919] rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-[#FADA0A] disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
          >
            {loadingProvider === 'kakao' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <KakaoLogo />
            )}
            카카오로 시작하기
          </button>

          {/* Google GIS 공식 버튼 */}
          <div ref={googleBtnRef} className="flex justify-center" />
        </div>

        {/* 구분선 */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gradient-to-b from-slate-50 to-slate-100 text-slate-400">
              또는 이메일로 로그인
            </span>
          </div>
        </div>

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">이메일</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-600 group-hover:text-slate-800 transition-colors">
                로그인 상태 유지
              </span>
            </label>
            <Link
              href="/agent/auth/forgot-password"
              className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              비밀번호 찾기
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-cyan-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <p className="text-center text-sm text-slate-500">
          아직 회원이 아니신가요?{' '}
          <Link
            href="/agent/auth/signup"
            className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
          >
            회원가입
          </Link>
        </p>

        {/* 안내 문구 */}
        <div className="mt-8 p-4 bg-slate-100 rounded-xl">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            소셜 로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
            <br />
            <Link href="/terms" className="text-emerald-600 hover:underline">이용약관</Link>
            {' · '}
            <Link href="/privacy" className="text-emerald-600 hover:underline">개인정보 처리방침</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
