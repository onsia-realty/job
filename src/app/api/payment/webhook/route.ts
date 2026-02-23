import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // 포트원 API로 결제 상태 재확인
    const apiSecret = process.env.PORTONE_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json({ success: false }, { status: 500 });
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
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const payment = await paymentResponse.json();

    // 포트원 상태 → DB 상태 매핑
    const statusMap: Record<string, string> = {
      PAID: 'completed',
      CANCELLED: 'refunded',
      FAILED: 'failed',
      READY: 'pending',
      VIRTUAL_ACCOUNT_ISSUED: 'pending',
    };
    const dbStatus = statusMap[payment.status] || 'pending';

    // DB에서 기존 결제 내역 업데이트
    const { error } = await supabaseAdmin
      .from('payments')
      .update({ payment_status: dbStatus })
      .eq('payment_id', paymentId);

    if (error) {
      console.error('웹훅 결제 상태 업데이트 실패:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
