'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Users, User, Search, Crown } from 'lucide-react';

interface MobileNavProps {
  variant: 'agent' | 'sales';
}

export default function MobileNav({ variant }: MobileNavProps) {
  const pathname = usePathname();
  const baseUrl = variant === 'agent' ? '/agent' : '/sales';

  const navItems = variant === 'agent'
    ? [
        { href: baseUrl, label: '홈', icon: Home },
        { href: `${baseUrl}/jobs`, label: '구인', icon: Briefcase },
        { href: `${baseUrl}/talents`, label: '인재', icon: Users },
        { href: `${baseUrl}/premium`, label: '상품', icon: Crown },
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
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
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
