import Link from "next/link";
import { Building2, MessageCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">부동산 파트너</h1>
          <p className="text-gray-500 mt-1">부동산 전문 플랫폼</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              로그인
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400">또는</span>
            </div>
          </div>

          {/* 소셜 로그인 */}
          <button className="w-full py-3 bg-[#FEE500] text-gray-900 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#FDD800] transition-colors">
            <MessageCircle className="w-5 h-5" />
            카카오로 시작하기
          </button>
        </div>

        {/* 회원가입 링크 */}
        <p className="text-center mt-6 text-sm text-gray-500">
          아직 계정이 없으신가요?{" "}
          <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
            회원가입
          </Link>
        </p>

        {/* 홈으로 */}
        <Link
          href="/"
          className="block text-center mt-4 text-sm text-gray-400 hover:text-gray-600"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
