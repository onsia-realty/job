import Link from "next/link";
import { ArrowLeft, Newspaper, Play } from "lucide-react";

const newsItems = [
  { id: 1, category: "정책", title: "2025년 부동산 정책 총정리", date: "2025.01.01", views: 1234 },
  { id: 2, category: "법률", title: "공인중개사법 개정안 주요 내용", date: "2024.12.28", views: 892 },
  { id: 3, category: "판례", title: "중개사고 관련 최신 판례 분석", date: "2024.12.25", views: 567 },
  { id: 4, category: "정책", title: "전세사기 방지 대책 시행 안내", date: "2024.12.20", views: 2341 },
];

export default function AgentNewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/agent" className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-900">AI 뉴스/정보</h1>
        </div>
      </header>

      {/* 카테고리 탭 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 flex gap-4 overflow-x-auto">
          {["전체", "정책", "법률", "판례", "실무팁"].map((cat, i) => (
            <button
              key={cat}
              className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${
                i === 0
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 뉴스 리스트 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {newsItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 cursor-pointer transition-colors"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-blue-600 font-medium">{item.category}</span>
                  <h3 className="font-medium text-gray-900 mt-1 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                    <span>{item.date}</span>
                    <span>·</span>
                    <span>조회 {item.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
