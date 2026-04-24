import Link from 'next/link';
import { Users, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '인재정보 (준비 중)',
  description: '공인중개사 인재정보 페이지를 준비 중입니다.',
};

export default function AgentTalentsComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center">
          <Users className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">인재정보</h1>
        <p className="text-gray-600 mb-2">공인중개사 인재 검색 기능을 준비 중입니다.</p>
        <p className="text-sm text-gray-500 mb-8">곧 만나보실 수 있습니다.</p>
        <Link
          href="/agent"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          공인중개사 메인으로
        </Link>
      </div>
    </div>
  );
}
