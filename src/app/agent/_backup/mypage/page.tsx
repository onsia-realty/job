'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  FileText,
  Bookmark,
  Settings,
  LogOut,
  ChevronRight,
  Briefcase,
  Bell,
  Shield,
  HelpCircle,
  Award,
  Eye,
  Send,
  Heart,
  Building2,
} from 'lucide-react';
import type { QuickApplication, Bookmark as BookmarkType } from '@/types';

export default function MyPage() {
  const [user, setUser] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [recentApplications, setRecentApplications] = useState<QuickApplication[]>([]);

  useEffect(() => {
    // localStorage에서 사용자 정보 확인
    const savedUser = localStorage.getItem('agent_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // 지원 내역 카운트
    const applications = JSON.parse(localStorage.getItem('agent_applications') || '[]');
    setApplicationCount(applications.length);
    setRecentApplications(applications.slice(0, 3));

    // 북마크 카운트
    const bookmarks = JSON.parse(localStorage.getItem('agent_bookmarks') || '[]');
    setBookmarkCount(bookmarks.length);
  }, []);

  const menuItems = [
    {
      icon: FileText,
      label: '지원 내역',
      href: '/agent/mypage/applications',
      badge: applicationCount > 0 ? applicationCount : undefined,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: Bookmark,
      label: '스크랩한 공고',
      href: '/agent/mypage/bookmarks',
      badge: bookmarkCount > 0 ? bookmarkCount : undefined,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      icon: Award,
      label: '내 이력서',
      href: '/agent/mypage/resume',
      color: 'text-emerald-600 bg-emerald-100',
    },
  ];

  const settingsItems = [
    { icon: Bell, label: '알림 설정', href: '/agent/mypage/notifications' },
    { icon: Shield, label: '개인정보 설정', href: '/agent/mypage/privacy' },
    { icon: HelpCircle, label: '고객센터', href: '/agent/help' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-gray-900">마이페이지</h1>
            <Link
              href="/agent/mypage/settings"
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <Link
                href="/agent/mypage/profile"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                수정
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">로그인이 필요합니다</h2>
              <p className="text-sm text-gray-500 mb-4">
                로그인하고 더 많은 기능을 이용해보세요
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/agent/auth/login"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/agent/auth/signup"
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  회원가입
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 활동 통계 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Link
            href="/agent/mypage/applications"
            className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow"
          >
            <Send className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{applicationCount}</p>
            <p className="text-xs text-gray-500">지원완료</p>
          </Link>
          <Link
            href="/agent/mypage/bookmarks"
            className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow"
          >
            <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{bookmarkCount}</p>
            <p className="text-xs text-gray-500">스크랩</p>
          </Link>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <Eye className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">프로필 열람</p>
          </div>
        </div>

        {/* 메뉴 섹션 */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
          <h3 className="px-4 py-3 text-sm font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
            구직 활동
          </h3>
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="flex-1 font-medium text-gray-900">{item.label}</span>
              {item.badge && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>

        {/* 최근 지원 내역 */}
        {recentApplications.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">최근 지원 내역</h3>
              <Link
                href="/agent/mypage/applications"
                className="text-sm text-blue-600 font-medium flex items-center gap-1"
              >
                전체보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {recentApplications.map((app, index) => (
              <Link
                key={app.id}
                href={`/agent/jobs/${app.jobId}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  index !== recentApplications.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{app.company}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{app.jobTitle}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(app.appliedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* 설정 섹션 */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
          <h3 className="px-4 py-3 text-sm font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
            설정
          </h3>
          {settingsItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors ${
                index !== settingsItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <item.icon className="w-5 h-5 text-gray-400" />
              <span className="flex-1 text-gray-700">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>

        {/* 로그아웃 버튼 */}
        {user && (
          <button
            onClick={() => {
              localStorage.removeItem('agent_user');
              window.location.reload();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>로그아웃</span>
          </button>
        )}
      </main>
    </div>
  );
}
