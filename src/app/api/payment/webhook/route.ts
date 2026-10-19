import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { recomputeJobAd } from '@/lib/ad-entitlement';
import { lookupPayment, matchesPayment, providerStatuses } from '@/lib/payment-provider';

const result = (status: number) => NextResponse.json({ success: status === 200 }, { status });

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.TOSS_WEBHOOK_SECRET;
    const providedSecret = req.headers.get('x-webhook-secret');
    // 토스 일반 웹훅은 커스텀 헤더가 없다. 인증된 API 재조회가 검증 근거다.
    if (secret && providedSecret !== null && providedSecret !== secret) return result(401);
    const body = await req.json();
    const key = body?.data?.paymentKey;
    if (typeof key !== 'string' || !key) return result(400);
    const payment = await lookupPayment(key);
    if (!payment || payment.paymentKey !== key || !Object.hasOwn(providerStatuses, payment.status)) return result(400);
    if (payment.cancels != null && !Array.isArray(payment.cancels)) return result(400);
    if (payment.balanceAmount != null && (!Number.isInteger(payment.balanceAmount) || payment.balanceAmount < 0 || payment.balanceAmount > payment.totalAmount)) return result(400);
    if (payment.status === 'PARTIAL_CANCELED' && (payment.balanceAmount == null || payment.balanceAmount >= payment.totalAmount || !Array.isArray(payment.cancels))) return result(400);
    const { data: order, error } = await supabaseAdmin.from('payment_orders').select('*').eq('order_id', payment.orderId).maybeSingle();
    if (error) return result(503);
    if (order) {
      // 인증된 승인 요청이 연결한 주문만 웹훅으로 복구한다.
      if (order.payment_key !== key || !matchesPayment(payment, order, key)) return result(409);
      const { error: applyError } = await supabaseAdmin.rpc('apply_payment_order', { p_order_id: order.order_id, p_payment_key: key, p_provider: payment });
      return result(applyError ? 503 : 200);
    }
    const { data: legacy, error: readError } = await supabaseAdmin.from('payments').select('*').eq('payment_id', key).maybeSingle();
    if (readError) return result(503);
    if (!legacy) return result(404);
    if (legacy.order_id || payment.totalAmount !== legacy.amount || payment.currency !== legacy.currency) return result(409);
    if (legacy.payment_status === 'refunded' && payment.status !== 'CANCELED') return result(409);
    if (legacy.payment_status === 'failed' && !['ABORTED', 'EXPIRED'].includes(payment.status)) return result(409);
    if (legacy.payment_status === 'completed' && !['DONE', 'PARTIAL_CANCELED', 'CANCELED'].includes(payment.status)) return result(409);
    const balance = payment.status === 'CANCELED' ? 0 : payment.balanceAmount ?? payment.totalAmount;
    if (legacy.balance_amount != null && balance > legacy.balance_amount) return result(409);
    if (legacy.provider_status === 'PARTIAL_CANCELED' && payment.status === 'DONE') return result(409);
    let update = supabaseAdmin.from('payments').update({
      payment_status: providerStatuses[payment.status], provider_status: payment.status,
      balance_amount: balance, cancels: payment.cancels ?? [],
    }).eq('payment_id', key).eq('payment_status', legacy.payment_status);
    update = legacy.provider_status == null ? update.is('provider_status', null) : update.eq('provider_status', legacy.provider_status);
    update = legacy.balance_amount == null ? update.is('balance_amount', null) : update.eq('balance_amount', legacy.balance_amount);
    const { data: updated, error: updateError } = await update.select('id');
    // 동시에 환불이 반영됐으면 재조회하도록 재전송을 요청한다.
    if (updateError || !updated?.length) return result(503);
    if (legacy.job_id) await recomputeJobAd(supabaseAdmin, legacy.job_id);
    return result(200);
  } catch {
    return result(503);
  }
}
