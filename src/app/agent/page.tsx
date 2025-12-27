import Link from "next/link";
import { Building2, Newspaper, Lightbulb, Users, ArrowRight, Home, ChevronRight, MessageCircle } from "lucide-react";

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">부동산 파트너</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="text-blue-600 font-medium">공인중개사</span>
          </div>
          <Link 
            href="/auth/login"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">공인중개사 채널</h1>
          <p className="text-blue-100">정보 · 콘텐츠 · 커뮤니티</p>
        </div>
      </section>

      {/* 메뉴 카드 */}
      <section className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid md:grid-cols-3 gap-4">
          {/* AI 뉴스 */}
          <Link href="/agent/news" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Newspaper className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI 뉴스/정보</h3>
              <p className="text-sm text-gray-500 mb-4">
                부동산 정책, 판례, 법개정 소식을 AI가 요약해드립니다
              </p>
              <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                바로가기 <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* 실무 노하우 */}
          <Link href="/agent/tips" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors">
                <Lightbulb className="w-6 h-6 text-amber-600 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">실무 노하우</h3>
              <p className="text-sm text-gray-500 mb-4">
                중개 사고, 계약서 실수, 민원 대응 등 현장 꿀팁
              </p>
              <div className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                바로가기 <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* 중개사 놀이터 */}
          <Link href="/agent/community" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                <Users className="w-6 h-6 text-green-600 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">중개사 놀이터</h3>
              <p className="text-sm text-gray-500 mb-4">
                동료 중개사들과 소통하는 커뮤니티
              </p>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                바로가기 <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 최신 뉴스 섹션 */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">📰 최신 AI 뉴스</h2>
          <Link href="/agent/news" className="text-sm text-blue-600 hover:underline">
            더보기
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* 뉴스 카드 예시 */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-blue-600 font-medium">정책</span>
                  <h3 className="font-medium text-gray-900 mt-1 line-clamp-2">
                    2025년 부동산 정책 변화 요약
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">2025.01.01</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 카톡방 연동 배너 */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">카카오톡 오픈채팅방</h3>
              <p className="text-sm text-gray-700">실시간으로 동료 중개사들과 소통하세요</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
            입장하기
          </button>
        </div>
      </section>

      {/* 하단 네비게이션 (모바일) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden">
        <div className="grid grid-cols-4 py-2">
          <Link href="/" className="flex flex-col items-center py-2 text-gray-400">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">홈</span>
          </Link>
          <Link href="/agent/news" className="flex flex-col items-center py-2 text-blue-600">
            <Newspaper className="w-6 h-6" />
            <span className="text-xs mt-1">뉴스</span>
          </Link>
          <Link href="/agent/tips" className="flex flex-col items-center py-2 text-gray-400">
            <Lightbulb className="w-6 h-6" />
            <span className="text-xs mt-1">노하우</span>
          </Link>
          <Link href="/agent/community" className="flex flex-col items-center py-2 text-gray-400">
            <Users className="w-6 h-6" />
            <span className="text-xs mt-1">커뮤니티</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
