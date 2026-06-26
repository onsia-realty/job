'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { TOSS_CONFIG, resolveProduct, generateOrderId, getVat, getTotalPrice } from '@/lib/toss';
import { ChevronLeft, Loader2, ShieldCheck } from 'lucide-react';
import type { TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const productKey = searchParams.get('productKey');
  const daysParam = searchParams.get('days');
  const days = daysParam ? Number(daysParam) : undefined;
  const jobId = searchParams.get('jobId');

  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  const product = productKey ? resolveProduct(productKey, days) : null;

  useEffect(() => {
    if (!product || initRef.current) return;
    initRef.current = true;

    const initWidget = async () => {
      try {
        const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');

        const tossPayments = await loadTossPayments(TOSS_CONFIG.clientKey);

        const widgetInstance = tossPayments.widgets({ customerKey: ANONYMOUS });

        await widgetInstance.setAmount({
          currency: 'KRW',
          value: getTotalPrice(product.price),
        });

        await Promise.all([
          widgetInstance.renderPaymentMethods({
            selector: '#payment-method',
            variantKey: 'DEFAULT',
          }),
          widgetInstance.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          }),
        ]);

        setWidgets(widgetInstance);
      } catch (err) {
        console.error('토스 위젯 초기화 실패:', err);
        setError('결제 위젯을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    initWidget();
  }, [product]);

  const handlePayment = async () => {
    if (!widgets || !product || !productKey) return;
    setPaying(true);

    try {
      const orderId = generateOrderId();

      const successUrl = new URL('/payment/success', window.location.origin);
      successUrl.searchParams.set('productKey', productKey);
      if (days != null) successUrl.searchParams.set('days', String(days));
      if (jobId) successUrl.searchParams.set('jobId', jobId);

      const failUrl = new URL('/payment/fail', window.location.origin);

      await widgets.requestPayment({
        orderId,
        orderName: product.name,
        customerName: user?.user_metadata?.name || '사용자',
        customerEmail: user?.email || undefined,
        customerMobilePhone: user?.user_metadata?.phone || undefined,
        successUrl: successUrl.toString(),
        failUrl: failUrl.toString(),
      });
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      if (errObj?.code === 'USER_CANCEL' || errObj?.message?.includes('취소')) {
        // 사용자 취소 - 무시
      } else {
        console.error('결제 요청 실패:', err);
        alert('결제 요청 중 오류가 발생했습니다.');
      }
      setPaying(false);
    }
  };

  if (!productKey || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">유효하지 않은 상품입니다.</p>
          <Link href="/premium" className="text-cyan-400 hover:underline">
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* 헤더 */}
      <header className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/premium" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-xl font-bold">
              부동산<span className="text-cyan-400">인</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 상품 정보 */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 mb-6">
          <h1 className="text-lg font-bold mb-3">결제 정보</h1>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-gray-400">{product.durationLabel} 노출</p>
            </div>
            <p className="text-lg font-medium text-gray-300">
              {product.price.toLocaleString()}원
            </p>
          </div>
          <div className="border-t border-slate-700 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-400">
              <span>공급가액</span>
              <span>{product.price.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>부가세 (10%)</span>
              <span>{getVat(product.price).toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-600">
              <span>총 결제금액</span>
              <span className="text-cyan-400">{getTotalPrice(product.price).toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-3" />
            <p className="text-gray-400 text-sm">결제 위젯을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/premium" className="text-cyan-400 hover:underline text-sm">
              돌아가기
            </Link>
          </div>
        )}

        {/* 토스 결제 위젯 영역 */}
        <div id="payment-method" className="mb-4 rounded-xl overflow-hidden" />
        <div id="agreement" className="mb-6 rounded-xl overflow-hidden" />

        {/* 결제 버튼 */}
        {!loading && !error && (
          <button
            onClick={handlePayment}
            disabled={!widgets || paying}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                결제 진행 중...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                {getTotalPrice(product.price).toLocaleString()}원 결제하기
              </>
            )}
          </button>
        )}

        {/* 안내 */}
        <p className="text-center text-xs text-gray-500 mt-4">
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
        </p>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
