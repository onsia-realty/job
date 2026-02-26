import { NextRequest, NextResponse } from 'next/server';
import { PAYMENT_PRODUCTS } from '@/lib/toss';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, productKey, jobId } = await req.json();

    if (!paymentKey || !orderId || !amount || !productKey) {
      return NextResponse.json(
        { success: false, message: '결제 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const product = PAYMENT_PRODUCTS[productKey];
    if (!product) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 상품입니다.' },
        { status: 400 }
      );
    }

    // 금액 검증
    if (amount !== product.price) {
      return NextResponse.json(
        { success: false, message: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: '서버 설정 오류' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${secretKey}:`).toString('base64');

    const confirmResponse = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, paymentKey, amount }),
      }
    );

    const payment = await confirmResponse.json();

    if (!confirmResponse.ok) {
      return NextResponse.json(
        { success: false, message: payment.message || '결제 승인에 실패했습니다.' },
        { status: 400 }
      );
    }

    if (payment.status !== 'DONE') {
      return NextResponse.json(
        { success: false, message: `결제가 완료되지 않았습니다. (상태: ${payment.status})` },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    // 만료일 계산
    const paidAt = payment.approvedAt ? new Date(payment.approvedAt) : new Date();
    const expiresAt = new Date(paidAt);
    if (product.duration === '24시간') expiresAt.setHours(expiresAt.getHours() + 24);
    else if (product.duration === '5일') expiresAt.setDate(expiresAt.getDate() + 5);
    else if (product.duration === '1주일') expiresAt.setDate(expiresAt.getDate() + 7);

    // Supabase에 결제 내역 저장
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        payment_id: paymentKey,
        user_id: userId,
        product_key: productKey,
        product_name: product.name,
        amount: product.price,
        currency: 'KRW',
        payment_status: 'completed',
        payment_method: payment.method || 'CARD',
        tier: product.tier,
        category: product.category,
        duration: product.duration,
        pg_provider: 'tosspayments',
        paid_at: paidAt.toISOString(),
        start_date: paidAt.toISOString(),
        end_date: expiresAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        job_id: jobId || null,
      });

    if (insertError) {
      console.error('결제 내역 저장 실패:', insertError);
    }

    // 공고 ID가 있으면 해당 공고의 tier 업데이트
    if (jobId) {
      const { error: jobUpdateError } = await supabaseAdmin
        .from('jobs')
        .update({ tier: product.tier })
        .eq('id', jobId);

      if (jobUpdateError) {
        console.error('공고 티어 업데이트 실패:', jobUpdateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: '결제가 완료되었습니다.',
      data: {
        paymentKey,
        orderId,
        productName: product.name,
        amount: product.price,
        tier: product.tier,
        duration: product.duration,
      },
    });
  } catch (error) {
    console.error('결제 승인 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
