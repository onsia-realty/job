import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { recomputeJobAd } from '@/lib/ad-entitlement';
import { lookupPayment, matchesPayment, providerHeaders, type ProviderPayment } from '@/lib/payment-provider';

const fail = (message: string, status: number, retryable = false) => NextResponse.json({ success: false, message, retryable }, { status });

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return fail('로그인이 필요합니다.', 401);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return fail('로그인이 필요합니다.', 401);
    const body = await req.json();
    const { paymentKey, orderId, amount, productKey, days, jobId } = body ?? {};
    if (typeof paymentKey !== 'string' || !paymentKey || typeof orderId !== 'string' || !orderId
      || !Number.isInteger(amount) || amount <= 0
      || (productKey != null && typeof productKey !== 'string')
      || (days != null && !Number.isInteger(days)) || (jobId != null && typeof jobId !== 'string')) return fail('결제 정보를 확인해주세요.', 400);

    const { data: order, error: orderError } = await supabaseAdmin.from('payment_orders').select('*').eq('order_id', orderId).maybeSingle();
    if (orderError) return fail('결제 준비 상태를 확인 중입니다. 같은 결제를 다시 확인해주세요.', 503, true);
    if (!order) {
      // 이전에 이미 저장된 결제만 복구한다. 새 결제를 승인하는 경로는 없다.
      const { data: legacy, error } = await supabaseAdmin.from('payments').select('*').eq('payment_id', paymentKey).maybeSingle();
      if (error) return fail('결제 기록 조회에 실패했습니다.', 503, true);
      if (!legacy || legacy.user_id !== user.id) return fail('서버 주문을 찾을 수 없습니다.', 404);
      if (legacy.order_id || legacy.amount !== amount || legacy.payment_status !== 'completed'
        || (productKey != null && legacy.product_key !== productKey)
        || (jobId != null && (legacy.job_id_snapshot ?? legacy.job_id) !== jobId)) return fail('기존 결제 정보와 일치하지 않습니다.', 409);
      if (legacy.job_id) await recomputeJobAd(supabaseAdmin, legacy.job_id);
      return NextResponse.json({ success: true, data: {
        paymentKey, orderId, productName: legacy.product_name, amount: legacy.amount, tier: legacy.tier,
        duration: legacy.duration, category: legacy.category, jobId: legacy.job_id_snapshot ?? legacy.job_id,
        starts_at: legacy.starts_at, expires_at: legacy.expires_at,
      } });
    }
    if (order.user_id !== user.id) return fail('서버 주문을 찾을 수 없습니다.', 404);
    if (amount !== order.amount || (productKey != null && productKey !== order.product_key)
      || (days != null && days !== order.days)
      || (jobId != null && jobId !== order.job_id_snapshot)) return fail('주문 정보와 일치하지 않습니다.', 409);
    if (order.payment_key && order.payment_key !== paymentKey) return fail('이미 다른 결제에 연결된 주문입니다.', 409);
    if (order.status === 'refunded' || order.status === 'failed') return fail('취소되거나 종료된 주문입니다.', 409);
    const { error: claimError } = await supabaseAdmin.rpc('claim_payment_order', { p_order_id: orderId, p_payment_key: paymentKey });
    if (claimError) {
      if (['23505', 'P0001'].includes(claimError.code)) return fail('이미 연결되었거나 종료된 주문입니다.', 409);
      return fail('주문 연결 상태를 확인할 수 없습니다. 같은 결제를 다시 확인해주세요.', 503, true);
    }

    let payment: ProviderPayment | null;
    try {
      payment = await lookupPayment(paymentKey);
      if (payment && !matchesPayment(payment, order, paymentKey)) return fail('결제 정보 검증에 실패했습니다.', 409);
      if (payment && ['ABORTED', 'EXPIRED'].includes(payment.status)) return fail('종료된 결제입니다.', 409);
      if (!payment || !['DONE', 'PARTIAL_CANCELED', 'CANCELED'].includes(payment.status)) {
        try {
          const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST', headers: { ...providerHeaders(), 'Content-Type': 'application/json', 'Idempotency-Key': order.idempotency_key },
            body: JSON.stringify({ paymentKey, orderId, amount: order.amount }), signal: AbortSignal.timeout(10000),
          });
          if (!response.ok) throw new Error('Approval response requires verification');
          payment = await response.json();
        } catch {
          payment = await lookupPayment(paymentKey);
        }
      }
    } catch {
      return fail('결제 상태를 확인 중입니다. 새로 결제하지 말고 같은 결제를 다시 확인해주세요.', 503, true);
    }
    if (!payment) return fail('결제 상태를 확인 중입니다. 같은 결제를 다시 확인해주세요.', 503, true);
    if (!matchesPayment(payment, order, paymentKey)) return fail('결제 정보 검증에 실패했습니다.', 409);
    if (!['DONE', 'PARTIAL_CANCELED', 'CANCELED'].includes(payment.status)) return fail('결제가 아직 완료되지 않았습니다. 같은 결제를 다시 확인해주세요.', 503, true);
    const { data: saved, error: applyError } = await supabaseAdmin.rpc('apply_payment_order', { p_order_id: orderId, p_payment_key: paymentKey, p_provider: payment });
    if (applyError) return fail('결제 반영을 확인 중입니다. 새로 결제하지 말고 같은 결제를 다시 확인해주세요.', 503, true);
    if (!saved || saved.payment_status !== 'completed') return fail('취소되거나 종료된 결제입니다.', 409);
    return NextResponse.json({ success: true, data: {
      paymentKey, orderId, productName: order.product_name, amount: order.amount, tier: order.tier,
      duration: order.duration, category: order.category, jobId: order.job_id_snapshot,
      starts_at: saved.starts_at, expires_at: saved.expires_at,
    } });
  } catch {
    return fail('결제 상태 확인에 실패했습니다. 새로 결제하지 말고 같은 결제를 다시 확인해주세요.', 503, true);
  }
}
