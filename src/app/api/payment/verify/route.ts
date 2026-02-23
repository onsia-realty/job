import { NextRequest, NextResponse } from 'next/server';
import { PAYMENT_PRODUCTS } from '@/lib/portone';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { paymentId, productKey, jobId } = await req.json();

    if (!paymentId || !productKey) {
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

    // 포트원 API로 결제 정보 조회
    const apiSecret = process.env.PORTONE_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json(
        { success: false, message: '서버 설정 오류' },
        { status: 500 }
      );
    }

    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `PortOne ${apiSecret}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      return NextResponse.json(
        { success: false, message: '결제 정보를 조회할 수 없습니다.' },
        { status: 400 }
      );
    }

    const payment = await paymentResponse.json();

    // 결제 상태 & 금액 검증
    if (payment.status !== 'PAID') {
      return NextResponse.json(
        { success: false, message: `결제가 완료되지 않았습니다. (상태: ${payment.status})` },
        { status: 400 }
      );
    }

    if (payment.amount.total !== product.price) {
      return NextResponse.json(
        { success: false, message: '결제 금액이 일치하지 않습니다.' },
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
    const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date();
    const expiresAt = new Date(paidAt);
    if (product.duration === '24시간') expiresAt.setHours(expiresAt.getHours() + 24);
    else if (product.duration === '5일') expiresAt.setDate(expiresAt.getDate() + 5);
    else if (product.duration === '1주일') expiresAt.setDate(expiresAt.getDate() + 7);

    // Supabase에 결제 내역 저장
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        payment_id: paymentId,
        user_id: userId,
        product_key: productKey,
        product_name: product.name,
        amount: product.price,
        currency: 'KRW',
        payment_status: 'completed',
        payment_method: payment.payMethod || 'CARD',
        tier: product.tier,
        category: product.category,
        duration: product.duration,
        pg_provider: payment.pgProvider || 'kcp_v2',
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
        paymentId,
        productName: product.name,
        amount: product.price,
        tier: product.tier,
        duration: product.duration,
      },
    });
  } catch (error) {
    console.error('결제 검증 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
