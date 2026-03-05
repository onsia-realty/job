import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, data } = body;

    console.log(`웹훅 수신: ${eventType}`, data?.paymentKey);

    // 토스페이먼츠 웹훅 이벤트 처리
    if (!data?.paymentKey) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // 토스페이먼츠 API로 결제 상태 재확인 (서명 대신 API 검증으로 보안 확보)
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const auth = Buffer.from(`${secretKey}:`).toString('base64');

    const paymentResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${data.paymentKey}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const payment = await paymentResponse.json();

    // 토스 상태 → DB 상태 매핑
    const statusMap: Record<string, string> = {
      DONE: 'completed',
      CANCELED: 'refunded',
      PARTIAL_CANCELED: 'refunded',
      ABORTED: 'failed',
      EXPIRED: 'failed',
      WAITING_FOR_DEPOSIT: 'pending',
      IN_PROGRESS: 'pending',
    };
    const dbStatus = statusMap[payment.status] || 'pending';

    // DB에서 기존 결제 내역 업데이트
    const { error } = await supabaseAdmin
      .from('payments')
      .update({ payment_status: dbStatus })
      .eq('payment_id', data.paymentKey);

    if (error) {
      console.error('웹훅 결제 상태 업데이트 실패:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
