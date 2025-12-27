import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Users, Share2, Heart, Phone, MessageCircle, Building2, Clock, DollarSign, Home as HomeIcon, Car } from "lucide-react";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  // 임시 데이터 (실제로는 API에서 가져옴)
  const job = {
    id: params.id,
    title: "용인 반도체클러스터 팀원 모집",
    company: "○○분양대행",
    location: "경기 용인시 처인구 양지면",
    type: "아파트",
    commission: "8%",
    deadline: "상시모집",
    createdAt: "2025.01.01",
    views: 234,
    description: `
용인 반도체클러스터 인근 대규모 아파트 분양 현장입니다.

▶ 현장 정보
- 세대수: 1,200세대
- 분양가: 4억~6억대
- 입주예정: 2027년 12월

▶ 근무 조건
- 수수료: 8% (정산 주 1회)
- 숙소 제공 (1인 1실)
- 식대 별도 지급

▶ 우대 사항
- 해당 지역 경험자
- 차량 소지자
- 즉시 투입 가능자

문의: 010-1234-5678
    `,
    tags: ["숙소제공", "즉시투입", "경력우대"],
    benefits: [
      { icon: "home", label: "숙소 제공", value: "1인 1실" },
      { icon: "car", label: "교통비", value: "지원" },
      { icon: "clock", label: "정산", value: "주 1회" },
      { icon: "dollar", label: "수수료", value: "8%" },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/sales" className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-rose-600">
              <Heart className="w-6 h-6" />
            </button>
            <button className="p-2 text-gray-400 hover:text-rose-600">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* 이미지 영역 (영상/사진) */}
      <div className="bg-gray-200 h-48 flex items-center justify-center">
        <p className="text-gray-400">현장 이미지/영상</p>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 태그 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded">
            HOT
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
            {job.type}
          </span>
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
        <p className="text-gray-500 mb-4">{job.company}</p>

        {/* 핵심 정보 카드 */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">수수료</p>
                <p className="font-bold text-rose-600">{job.commission}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">위치</p>
                <p className="font-medium text-gray-900">용인시</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">마감</p>
                <p className="font-medium text-gray-900">{job.deadline}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">정산</p>
                <p className="font-medium text-gray-900">주 1회</p>
              </div>
            </div>
          </div>
        </div>

        {/* 혜택 태그 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {job.tags.map((tag) => (
            <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* 상세 설명 */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <h2 className="font-bold text-gray-900 mb-3">상세 정보</h2>
          <div className="text-gray-600 whitespace-pre-line text-sm leading-relaxed">
            {job.description}
          </div>
        </div>

        {/* 위치 정보 */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <h2 className="font-bold text-gray-900 mb-3">현장 위치</h2>
          <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center mb-2">
            <p className="text-gray-400">지도</p>
          </div>
          <p className="text-sm text-gray-600">{job.location}</p>
        </div>

        {/* 조회수/등록일 */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <span>등록일 {job.createdAt}</span>
          <span>조회 {job.views}</span>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <a
            href="tel:010-1234-5678"
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            전화
          </a>
          <button className="flex-[2] py-3 bg-rose-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors">
            <MessageCircle className="w-5 h-5" />
            카카오톡 문의
          </button>
        </div>
      </div>
    </div>
  );
}
