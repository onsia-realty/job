import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Header from '@/components/shared/Header';
import StayCreateForm from '@/components/stay/StayCreateForm';

export const dynamic = 'force-dynamic';

// 단기임대 매물 등록 / 수정 페이지.
// - 플래그 가드는 /stay, /stay/owner 와 동일.
// - 인증 게이트는 서버가 아니라 StayCreateForm 안의 useAuth() 가 담당한다
//   (이 저장소에는 서버 세션 확인 패턴이 없어 새로 도입하지 않는다).
// - ?edit={id} 면 수정 모드. 소유권 확인/데이터 로딩은 StayCreateForm 이 담당한다
//   (여기서 서버 조회를 하면 세션 확인 패턴을 새로 들여야 한다).
export default async function StayNewPage({
  searchParams,
}: {
  // Next 16: searchParams 는 Promise 다
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const enabled = process.env.NEXT_PUBLIC_STAY_ENABLED === 'true';
  if (!enabled) {
    redirect('/');
  }

  const params = await searchParams;
  const rawEdit = params.edit;
  // 배열(?edit=a&edit=b)로 올 수 있으니 문자열만 취한다
  const editId = typeof rawEdit === 'string' && rawEdit.trim() ? rawEdit.trim() : null;
  const isEdit = !!editId;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="landing" />

      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
          <Link
            href={isEdit ? '/agent/stays' : '/stay'}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {isEdit ? '내 매물 관리로' : '매물 목록으로'}
          </Link>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
            단기임대 · 공실임대
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">{isEdit ? '매물 수정' : '매물 등록'}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            {isEdit
              ? '등록한 매물의 내용을 고칩니다. 주소를 다시 검색하면 좌표와 건축물대장 정보를 새로 채웁니다. 금액은 만원 단위로 입력합니다.'
              : '주소를 검색하면 좌표와 건축물대장 정보를 자동으로 채웁니다. 금액은 만원 단위로 입력합니다.'}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-20">
        <StayCreateForm editId={editId} />
        <p className="mt-10 text-xs leading-relaxed text-slate-400">
          부인은 통신판매중개자로서 임대차 계약의 당사자가 아니며, 계약과 입주 관리는 등록자(개업공인중개사 또는 임대인)가 수행합니다.
        </p>
      </main>
    </div>
  );
}
