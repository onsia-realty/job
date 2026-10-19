'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [productName, setProductName] = useState('');
  const confirmedRef = useRef(false);
  const [retry, setRetry] = useState(0);

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const productKey = searchParams.get('productKey');
  const daysParam = searchParams.get('days');
  const days = daysParam ? Number(daysParam) : undefined;
  const jobId = searchParams.get('jobId');

  useEffect(() => {
    const confirmPayment = async () => {
    // 세션 로딩 중이면 대기
    if (authLoading) return;

    if (!session?.access_token) {
      setStatus('error');
      setMessage('로그인이 필요합니다. 다시 로그인 후 시도해주세요.');
      return;
    }

    if (!paymentKey || !orderId || !amount || !Number.isSafeInteger(Number(amount))) {
      setStatus('error');
      setMessage('결제 정보가 누락되었습니다.');
      return;
    }

    // 이미 호출됐으면 중복 실행 방지 (StrictMode, 새로고침)
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    setStatus('loading');

      try {
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            productKey,
            days: days ?? null,
            jobId: jobId || null,
          }),
        });

        const result = await res.json();

        if (result.success) {
          const product = result.data;
          setProductName(product.productName);
          setStatus('success');
          const expiresAt: string | null = result.data?.expires_at ?? null;
          const until = expiresAt
            ? new Date(expiresAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' })
            : null;
          setMessage(until
            ? `${product.productName} 결제가 완료되었습니다!\n${product.duration} 광고가 ${until}까지 적용됩니다.`
            : `${product.productName} 결제가 완료되었습니다!\n${product.duration}간 광고가 노출됩니다.`);

          // 3초 후 자동 이동
          setTimeout(() => {
            if (product.jobId) {
              router.push(product.category === 'agent' ? '/agent/employer' : '/sales/mypage');
            } else {
              router.push(product.category === 'agent'
                ? `/agent/jobs/new?tier=${product.tier}`
                : `/sales/jobs/new?tier=${product.tier}`);
            }
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.message || '결제 승인에 실패했습니다.');
        }
      } catch {
        setStatus('error');
        setMessage('결제 상태를 확인하지 못했습니다. 새로 결제하지 말고 같은 결제를 다시 확인해주세요.');
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount, productKey, days, jobId, session, authLoading, router, retry]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">결제 승인 중...</h1>
            <p className="text-gray-400 text-sm">잠시만 기다려주세요.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">결제 완료!</h1>
            <p className="text-cyan-400 font-medium mb-2">{productName}</p>
            <p className="text-gray-400 text-sm whitespace-pre-line">{message}</p>
            <p className="text-gray-500 text-xs mt-4">3초 후 자동으로 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">결제 상태 확인</h1>
            <p className="text-gray-400 text-sm mb-6">{message}</p>
            <button
              onClick={() => { confirmedRef.current = false; setRetry((value) => value + 1); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all"
            >
              같은 결제 다시 확인하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
