'use client';

import Link from 'next/link';
import { User, LogIn, Building2, HardHat } from 'lucide-react';

interface HeaderProps {
  variant?: 'landing' | 'agent' | 'sales';
}

export default function Header({ variant = 'landing' }: HeaderProps) {
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
              온시아 JOB
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

          {/* 로그인 버튼 */}
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>
    </header>
  );
}
