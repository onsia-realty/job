'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full text-center">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">결제 실패</h1>
        {message && (
          <p className="text-gray-400 text-sm mb-2">{decodeURIComponent(message)}</p>
        )}
        {code && (
          <p className="text-gray-500 text-xs mb-6">오류 코드: {code}</p>
        )}
        <Link
          href="/premium"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all"
        >
          다시 시도하기
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
