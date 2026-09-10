import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Header from '@/components/shared/Header';
import StayCreateForm from '@/components/stay/StayCreateForm';

export const dynamic = 'force-dynamic';

// 단기임대 매물 등록 페이지.
// - 플래그 가드는 /stay, /stay/owner 와 동일.
// - 인증 게이트는 서버가 아니라 StayCreateForm 안의 useAuth() 가 담당한다
//   (이 저장소에는 서버 세션 확인 패턴이 없어 새로 도입하지 않는다).
export default function StayNewPage() {
  const enabled = process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';
  if (!enabled) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="landing" />

      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
          <Link
            href="/stay"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            매물 목록으로
          </Link>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
            단기임대 · 공실임대
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">매물 등록</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            주소를 검색하면 좌표와 건축물대장 정보를 자동으로 채웁니다. 금액은 만원 단위로 입력합니다.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-20">
        <StayCreateForm />
        <p className="mt-10 text-xs leading-relaxed text-slate-400">
          부인은 통신판매중개자로서 임대차 계약의 당사자가 아니며, 계약과 입주 관리는 등록자(개업공인중개사 또는 임대인)가 수행합니다.
        </p>
      </main>
    </div>
  );
}
