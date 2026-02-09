'use client';

import Link from 'next/link';
import { User, LogIn, Building2, HardHat, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  variant?: 'landing' | 'agent' | 'sales';
}

export default function Header({ variant = 'landing' }: HeaderProps) {
  const { user, isLoading } = useAuth();
  const getVariantStyles = () => {
    switch (variant) {
      case 'agent':
        return {
          bg: 'bg-white border-b border-gray-200',
          logo: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700',
          badgeText: '공인중개사',
        };
      case 'sales':
        return {
          bg: 'bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900',
          logo: 'text-white',
          badge: 'bg-purple-500/30 text-purple-200 border border-purple-400/50',
          badgeText: '분양상담사',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-600 to-cyan-600',
          logo: 'text-white',
          badge: '',
          badgeText: '',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <header className={`${styles.bg} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <div className={`text-xl md:text-2xl font-bold ${styles.logo}`}>
              부동산<span className="text-cyan-400">인</span>
            </div>
            {variant !== 'landing' && (
              <span className={`text-xs px-2 py-1 rounded-full ${styles.badge}`}>
                {styles.badgeText}
              </span>
            )}
          </Link>

          {/* 네비게이션 - 데스크톱 */}
          <nav className="hidden md:flex items-center gap-6">
            {variant === 'landing' && (
              <>
                <Link
                  href="/agent"
                  className="flex items-center gap-1 text-white/90 hover:text-white transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  <span>공인중개사</span>
                </Link>
                <Link
                  href="/sales"
                  className="flex items-center gap-1 text-white/90 hover:text-white transition-colors"
                >
                  <HardHat className="w-4 h-4" />
                  <span>분양상담사</span>
                </Link>
              </>
            )}
            {variant === 'agent' && (
              <>
                <Link href="/agent" className="text-gray-700 hover:text-blue-600 font-medium">
                  홈
                </Link>
                <Link href="/agent/jobs" className="text-gray-500 hover:text-blue-600">
                  구인공고
                </Link>
                <Link href="/agent/talents" className="text-gray-500 hover:text-blue-600">
                  인재정보
                </Link>
                <Link href="/agent/premium" className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  상품안내
                </Link>
                <Link href="/profile/ai-photo" className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI 이력서 사진
                </Link>
              </>
            )}
            {variant === 'sales' && (
              <>
                <Link href="/sales" className="text-white font-medium">
                  홈
                </Link>
                <Link href="/sales/jobs" className="text-white/80 hover:text-white">
                  현장구인
                </Link>
                <Link href="/sales/talents" className="text-white/80 hover:text-white">
                  인재정보
                </Link>
              </>
            )}
          </nav>

          {/* 로그인/마이페이지 버튼 */}
          <div className="flex items-center gap-2">
            {!isLoading && user && (
              <Link
                href="/profile/ai-photo"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-colors ${
                  variant === 'landing' || variant === 'sales'
                    ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 hover:from-blue-100 hover:to-cyan-100'
                }`}
                title="AI 이력서 사진"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs font-medium">AI 이력서 사진</span>
              </Link>
            )}
            {!isLoading && user ? (
              <Link
                href={variant === 'sales' ? '/sales/mypage' : '/agent/mypage'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  variant === 'landing' || variant === 'sales'
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {user.user_metadata?.name || user.email?.split('@')[0] || '마이페이지'}
                </span>
              </Link>
            ) : (
              <Link
                href={variant === 'sales' ? '/sales/auth/login' : '/agent/auth/login'}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  variant === 'landing' || variant === 'sales'
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">로그인</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
