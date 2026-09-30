import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { recomputeJobAd } from '@/lib/ad-entitlement';

export async function POST(req: NextRequest) {
  try {
    // 기본 웹훅 시크릿 검증 (설정된 경우)
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const headerSecret = req.headers.get('x-webhook-secret');
      if (headerSecret !== webhookSecret) {
        console.warn('웹훅: 시크릿 불일치');
        return NextResponse.json({ success: false }, { status: 401 });
      }
    }

    const body = await req.json();
    const { eventType, data } = body;

    console.log(`웹훅 수신: ${eventType}`, data?.paymentKey);

    // 토스페이먼츠 웹훅 이벤트 처리
    if (!data?.paymentKey) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // 토스페이먼츠 API로 결제 상태 재확인 (핵심 보안: 서버 → 토스 직접 검증)
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const auth = Buffer.from(`${secretKey}:`).toString('base64');

    const paymentResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${encodeURIComponent(data.paymentKey)}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      console.warn('웹훅: 토스 API 결제 조회 실패:', data.paymentKey);
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const payment = await paymentResponse.json();

    // DB에서 기존 결제 내역 조회 (job_id 포함)
    const { data: paymentRecord } = await supabaseAdmin
      .from('payments')
      .select('id, job_id, payment_status')
      .eq('payment_id', data.paymentKey)
      .maybeSingle();

    if (!paymentRecord) {
      console.warn('웹훅: 결제 내역 없음:', data.paymentKey);
      return NextResponse.json({ success: true });
    }

    // 부분 취소: 기록만 남기고 광고 권리는 그대로 둔다 (payments.payment_status 에 부분취소 값이 없음)
    if (payment.status === 'PARTIAL_CANCELED') {
      console.warn('웹훅: 부분 취소 — 광고 기간은 변경하지 않음', {
        paymentKey: data.paymentKey,
        jobId: paymentRecord.job_id,
        totalAmount: payment.totalAmount,
        balanceAmount: payment.balanceAmount,
        cancels: Array.isArray(payment.cancels)
          ? payment.cancels.map((c: { cancelAmount?: number; canceledAt?: string; cancelReason?: string }) => ({
              cancelAmount: c.cancelAmount, canceledAt: c.canceledAt, cancelReason: c.cancelReason,
            }))
          : undefined,
      });
      return NextResponse.json({ success: true });
    }

    // 토스 상태 → DB 상태 매핑
    const statusMap: Record<string, string> = {
      DONE: 'completed',
      CANCELED: 'refunded',
      ABORTED: 'failed',
      EXPIRED: 'failed',
      WAITING_FOR_DEPOSIT: 'pending',
      IN_PROGRESS: 'pending',
    };
    const dbStatus = statusMap[payment.status] || 'pending';

    // 결제 상태 업데이트 (같은 상태면 생략)
    if (paymentRecord.payment_status !== dbStatus) {
      const { error } = await supabaseAdmin
        .from('payments')
        .update({ payment_status: dbStatus })
        .eq('payment_id', data.paymentKey);

      if (error) {
        console.error('웹훅 결제 상태 업데이트 실패:', error);
        return NextResponse.json({ success: false }, { status: 500 }); // 토스가 재전송하도록
      }
    }

    // 남은 완료 결제로 공고 등급·만료일을 다시 계산한다 (멱등 — 재전송 시에도 다시 맞춘다).
    // (환불돼도 다른 유효 결제가 있으면 그 등급이 유지된다 — 무조건 normal 로 내리지 않음)
    if (paymentRecord.job_id) {
      try {
        const projection = await recomputeJobAd(supabaseAdmin, paymentRecord.job_id);
        console.log(`웹훅: 공고 ${paymentRecord.job_id} 재계산 → ${projection?.tier ?? '(공고 없음)'}`);
      } catch (recomputeError) {
        console.error('웹훅: 공고 등급 재계산 실패:', recomputeError);
        return NextResponse.json({ success: false }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
