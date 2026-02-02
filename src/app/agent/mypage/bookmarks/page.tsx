'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bookmark,
  BookmarkX,
  Building2,
  MapPin,
  Banknote,
  Calendar,
  ChevronRight,
  AlertCircle,
  Search,
  Briefcase,
  Trash2,
} from 'lucide-react';
import type { Bookmark as BookmarkType } from '@/types';

// D-Day 계산 함수
function getDDay(deadline?: string): { text: string; color: string; urgent: boolean } {
  if (!deadline) {
    return { text: '채용중', color: 'text-gray-600 bg-gray-100', urgent: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: '마감', color: 'text-gray-400 bg-gray-100', urgent: false };
  }
  if (diffDays === 0) {
    return { text: 'D-DAY', color: 'text-red-600 bg-red-50', urgent: true };
  }
  if (diffDays <= 3) {
    return { text: `D-${diffDays}`, color: 'text-red-600 bg-red-50', urgent: true };
  }
  if (diffDays <= 7) {
    return { text: `D-${diffDays}`, color: 'text-orange-600 bg-orange-50', urgent: false };
  }
  return { text: `D-${diffDays}`, color: 'text-gray-600 bg-gray-100', urgent: false };
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // localStorage에서 북마크 불러오기
    const savedBookmarks = JSON.parse(localStorage.getItem('agent_bookmarks') || '[]');
    // 최신순 정렬
    savedBookmarks.sort((a: BookmarkType, b: BookmarkType) =>
      new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()
    );
    setBookmarks(savedBookmarks);
  }, []);

  const filteredBookmarks = searchQuery
    ? bookmarks.filter(
        (b) =>
          b.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarks;

  const handleRemoveBookmark = (id: string) => {
    const newBookmarks = bookmarks.filter((b) => b.id !== id);
    setBookmarks(newBookmarks);
    localStorage.setItem('agent_bookmarks', JSON.stringify(newBookmarks));
    setShowDeleteConfirm(null);
  };

  const handleRemoveAll = () => {
    setBookmarks([]);
    localStorage.setItem('agent_bookmarks', JSON.stringify([]));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/mypage"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">마이페이지</span>
            </Link>
            {bookmarks.length > 0 && (
              <button
                onClick={handleRemoveAll}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                전체삭제
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">스크랩한 공고</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {bookmarks.length}개
          </span>
        </div>

        {/* 검색바 */}
        {bookmarks.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="공고명, 회사명, 지역으로 검색"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 북마크 목록 */}
        {filteredBookmarks.length > 0 ? (
          <div className="space-y-3">
            {filteredBookmarks.map((bookmark) => {
              const dday = getDDay(bookmark.deadline);
              return (
                <div
                  key={bookmark.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${dday.color}`}>
                            {dday.text}
                          </span>
                          <span className="text-xs text-gray-400">
                            스크랩 {formatDate(bookmark.bookmarkedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{bookmark.company}</p>
                        <Link href={`/agent/jobs/${bookmark.jobId}`}>
                          <h3 className="font-medium text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors">
                            {bookmark.jobTitle}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {bookmark.region}
                          </span>
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <Banknote className="w-4 h-4" />
                            {bookmark.salary}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(bookmark.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <BookmarkX className="w-5 h-5" />
                        </button>
                        <Link
                          href={`/agent/jobs/${bookmark.jobId}`}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          지원하기
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* 삭제 확인 */}
                  {showDeleteConfirm === bookmark.id && (
                    <div className="p-4 bg-red-50 border-t border-red-100">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-700">스크랩을 취소하시겠습니까?</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 py-2 bg-white text-gray-700 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleRemoveBookmark(bookmark.id)}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                        >
                          스크랩 취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '스크랩한 공고가 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? '다른 검색어로 시도해보세요' : '관심있는 공고를 스크랩해보세요!'}
            </p>
            {!searchQuery && (
              <Link
                href="/agent/jobs"
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Briefcase className="w-5 h-5" />
                채용공고 보러가기
              </Link>
            )}
          </div>
        )}

        {/* 마감 임박 알림 */}
        {filteredBookmarks.some((b) => getDDay(b.deadline).urgent) && (
          <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">마감 임박 공고가 있습니다!</p>
                <p className="text-sm text-orange-600 mt-1">
                  스크랩한 공고 중 마감이 3일 이내인 공고가 있습니다. 서둘러 지원해보세요.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
