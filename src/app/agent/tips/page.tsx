import Link from "next/link";
import { ArrowLeft, Lightbulb, MessageSquare, Heart, Eye } from "lucide-react";

const tips = [
  { id: 1, title: "계약서 작성 시 꼭 확인해야 할 5가지", author: "김중개", likes: 45, comments: 12, views: 234 },
  { id: 2, title: "세입자 민원 대응 매뉴얼", author: "박공인", likes: 38, comments: 8, views: 189 },
  { id: 3, title: "전세사기 예방을 위한 체크리스트", author: "이실장", likes: 92, comments: 23, views: 567 },
  { id: 4, title: "중개사고 발생 시 대처 방법", author: "최소장", likes: 67, comments: 15, views: 423 },
];

export default function AgentTipsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/agent" className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <h1 className="font-bold text-gray-900">실무 노하우</h1>
          </div>
          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium">
            글쓰기
          </button>
        </div>
      </header>

      {/* 게시글 리스트 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="bg-white rounded-xl p-4 border border-gray-100 hover:border-amber-200 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 line-clamp-1">{tip.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{tip.author}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" /> {tip.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" /> {tip.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {tip.views}
                    </span>
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
