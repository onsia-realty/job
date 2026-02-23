'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Users, User, Search, Sparkles, ClipboardList, PenSquare, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface MobileNavProps {
  variant: 'agent' | 'sales';
}

export default function MobileNav({ variant }: MobileNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const baseUrl = variant === 'agent' ? '/agent' : '/sales';
  const role = user?.user_metadata?.role as UserRole | undefined;
  const isEmployer = role === 'employer';

  const navItems = variant === 'agent'
    ? isEmployer
      ? [
          { href: baseUrl, label: '홈', icon: Home },
          { href: `${baseUrl}/employer`, label: '채용관리', icon: ClipboardList },
          { href: `${baseUrl}/jobs/create`, label: '구인작성', icon: PenSquare },
          { href: `${baseUrl}/ai-assistant`, label: 'AI', icon: Sparkles },
          { href: `${baseUrl}/mypage`, label: 'MY', icon: User },
        ]
      : [
          { href: baseUrl, label: '홈', icon: Home },
          { href: `${baseUrl}/jobs`, label: '구인', icon: Briefcase },
          { href: `${baseUrl}/ai-assistant`, label: 'AI', icon: Sparkles },
          { href: `${baseUrl}/mypage/scraps`, label: '스크랩', icon: Bookmark },
          { href: `${baseUrl}/mypage`, label: 'MY', icon: User },
        ]
    : [
        { href: baseUrl, label: '홈', icon: Home },
        { href: `${baseUrl}/jobs`, label: '현장', icon: Briefcase },
        { href: `${baseUrl}/search`, label: '검색', icon: Search },
        { href: `${baseUrl}/talents`, label: '인재', icon: Users },
        { href: `${baseUrl}/mypage`, label: 'MY', icon: User },
      ];

  const isActive = (href: string) => {
    if (href === baseUrl) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const getActiveStyles = () => {
    if (variant === 'agent') {
      return 'text-blue-600';
    }
    return 'text-purple-500';
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 ${
                active ? getActiveStyles() : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
