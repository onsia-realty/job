import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#141517] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-center"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/agent/jobs"
            className="w-full sm:w-auto px-6 py-3 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/5 transition-colors text-center"
          >
            채용공고 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
