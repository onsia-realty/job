'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PAYMENT_PRODUCTS } from '@/lib/toss';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [productName, setProductName] = useState('');

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const productKey = searchParams.get('productKey');
  const jobId = searchParams.get('jobId');

  useEffect(() => {
    if (!paymentKey || !orderId || !amount || !productKey) {
      setStatus('error');
      setMessage('결제 정보가 누락되었습니다.');
      return;
    }

    const product = PAYMENT_PRODUCTS[productKey];
    if (!product) {
      setStatus('error');
      setMessage('유효하지 않은 상품입니다.');
      return;
    }

    // 금액 검증 (클라이언트 조작 방지)
    if (parseInt(amount) !== product.price) {
      setStatus('error');
      setMessage('결제 금액이 일치하지 않습니다.');
      return;
    }

    setProductName(product.name);

    const confirmPayment = async () => {
      try {
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
            productKey,
            jobId: jobId || null,
          }),
        });

        const result = await res.json();

        if (result.success) {
          setStatus('success');
          setMessage(`${product.name} 결제가 완료되었습니다!\n${product.duration}간 광고가 노출됩니다.`);

          // 3초 후 자동 이동
          setTimeout(() => {
            if (jobId) {
              router.push(product.category === 'agent' ? '/agent/employer' : '/sales/jobs');
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
        setMessage('결제 승인 중 오류가 발생했습니다.');
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount, productKey, jobId, session, router]);

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
            <h1 className="text-xl font-bold text-white mb-2">결제 실패</h1>
            <p className="text-gray-400 text-sm mb-6">{message}</p>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all"
            >
              다시 시도하기
            </Link>
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
