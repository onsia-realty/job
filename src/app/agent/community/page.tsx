import Link from "next/link";
import { ArrowLeft, Users, MessageCircle, ExternalLink } from "lucide-react";

const chatRooms = [
  { id: 1, name: "서울 중개사 모임", members: 234, desc: "서울 지역 중개사 정보 공유" },
  { id: 2, name: "경기 중개사 네트워크", members: 189, desc: "경기도 중개사 소통 공간" },
  { id: 3, name: "전세사기 대응 모임", members: 567, desc: "전세사기 예방 및 대응 논의" },
  { id: 4, name: "신입 중개사 멘토링", members: 123, desc: "신입 중개사 질문 환영" },
];

export default function AgentCommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/agent" className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-900">중개사 놀이터</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 안내 배너 */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold">동료 중개사와 소통하세요</h2>
              <p className="text-sm text-green-100">카카오톡 오픈채팅방 연동</p>
            </div>
          </div>
        </div>

        {/* 채팅방 리스트 */}
        <h3 className="font-bold text-gray-900 mb-3">💬 오픈채팅방</h3>
        <div className="space-y-3">
          {chatRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-xl p-4 border border-gray-100 hover:border-green-200 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{room.name}</h4>
                    <p className="text-sm text-gray-500">{room.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">참여자 {room.members}명</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {/* 게시판 섹션 */}
        <h3 className="font-bold text-gray-900 mt-8 mb-3">📝 자유게시판</h3>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center text-gray-400">
          <p>게시판 기능 준비 중입니다</p>
        </div>
      </div>
    </div>
  );
}
