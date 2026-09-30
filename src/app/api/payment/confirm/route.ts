import { NextRequest, NextResponse } from 'next/server';
import { resolveProduct, getTotalPrice, isProductPurchasable } from '@/lib/toss';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  computeWindow,
  loadJobWindows,
  recomputeJobAd,
  toKstDate,
  type AdWindowInput,
} from '@/lib/ad-entitlement';

type JobRow = { id: string; user_id: string; category: string | null; tier: string; deadline: string | null };

// 결제 반영: tier/ad_expires_at 재계산 + 공고 활성화 + 모집 마감일을 광고 끝(KST 날짜)까지 끌어올림.
// (무료 등록 시 붙은 +24h deadline 때문에 유료 광고가 다음 날 닫히는 것을 막는다)
async function applyJobEntitlement(job: JobRow, windows: AdWindowInput[]) {
  const latestEnd = windows.reduce((m, w) => {
    const t = w.expires_at ? new Date(w.expires_at).getTime() : 0;
    return Number.isFinite(t) && t > m ? t : m;
  }, 0);
  const extraUpdate: Record<string, unknown> = { is_active: true };
  if (latestEnd > 0) {
    const adEndDate = toKstDate(new Date(latestEnd));
    // 마감일이 없는 공고(상시채용)는 그대로 둔다 — 광고 종료 후 닫는 것은 크론의 24시간 규칙이 맡는다
    if (job.deadline && job.deadline < adEndDate) extraUpdate.deadline = adEndDate;
  }
  return recomputeJobAd(supabaseAdmin, job.id, new Date(), { category: job.category, extraUpdate });
}

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, productKey, days, jobId } = await req.json();

    if (!paymentKey || !orderId || !amount || !productKey) {
      return NextResponse.json(
        { success: false, message: '결제 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const product = resolveProduct(productKey, typeof days === 'number' ? days : undefined);
    if (!product) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 상품입니다.' },
        { status: 400 }
      );
    }

    if (!isProductPurchasable(productKey)) {
      return NextResponse.json(
        { success: false, message: '현재 구매할 수 없는 상품입니다.' },
        { status: 400 }
      );
    }

    // 금액 검증 (클라이언트 전송 금액 vs 상품 총액 = 공급가액 + 부가세)
    const totalPrice = getTotalPrice(product.price);
    if (amount !== totalPrice) {
      return NextResponse.json(
        { success: false, message: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 사용자 인증 필수
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 인증입니다.' },
        { status: 401 }
      );
    }
    const userId = user.id;

    // 공고 결제는 소유자와 상품 카테고리가 모두 일치해야 한다.
    let job: JobRow | null = null;
    if (jobId) {
      const { data } = await supabaseAdmin
        .from('jobs')
        .select('id, user_id, category, tier, deadline')
        .eq('id', jobId)
        .maybeSingle();
      job = data;

      if (!job) {
        return NextResponse.json(
          { success: false, message: '존재하지 않는 공고입니다.' },
          { status: 404 }
        );
      }
      if (job.user_id !== userId) {
        return NextResponse.json(
          { success: false, message: '본인의 공고만 업그레이드할 수 있습니다.' },
          { status: 403 }
        );
      }
      if (job.category !== product.category) {
        return NextResponse.json(
          { success: false, message: '공고와 상품의 카테고리가 일치하지 않습니다.' },
          { status: 400 }
        );
      }
    }

    // 멱등성 체크: 이미 처리된 결제인지 확인
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, job_id, product_key, amount, payment_status, starts_at, expires_at')
      .eq('payment_id', paymentKey)
      .maybeSingle();

    if (existingPayment) {
      if (existingPayment.user_id !== userId) {
        return NextResponse.json({ success: false, message: '결제 내역을 찾을 수 없습니다.' }, { status: 404 });
      }
      if (existingPayment.payment_status !== 'completed'
        || existingPayment.job_id !== (jobId || null)
        || existingPayment.product_key !== productKey
        || existingPayment.amount !== totalPrice) {
        return NextResponse.json({ success: false, message: '기존 결제 정보와 일치하지 않습니다.' }, { status: 409 });
      }
      // 공고 반영이 중간에 실패했을 수 있으므로 재계산만 다시 수행 (새 창은 만들지 않음)
      if (job) {
        try {
          await applyJobEntitlement(job, await loadJobWindows(supabaseAdmin, job.id));
        } catch (retryError) {
          console.error('결제 후 공고 반영 재시도 실패:', retryError);
          return NextResponse.json(
            { success: false, message: '결제 처리 상태를 확인 중입니다. 고객센터에 문의해주세요.' },
            { status: 500 }
          );
        }
      }
      // 이미 처리된 결제 → 성공 응답 (중복 호출 방지)
      return NextResponse.json({
        success: true,
        message: '이미 처리된 결제입니다.',
        data: {
          paymentKey,
          orderId,
          productName: product.name,
          amount: totalPrice,
          tier: product.tier,
          duration: product.durationLabel,
          starts_at: existingPayment.starts_at ?? null,
          expires_at: existingPayment.expires_at ?? null,
        },
      });
    }

    // 기존 광고 창은 토스 승인 "전에" 읽는다 — DB 문제(046 미적용 등)면 과금 전에 멈춘다.
    let existingWindows: AdWindowInput[] = [];
    if (job) {
      try {
        existingWindows = await loadJobWindows(supabaseAdmin, job.id);
      } catch {
        return NextResponse.json(
          { success: false, message: '결제 준비 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 500 }
        );
      }
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

    // Toss 확인 금액 vs 상품 총액(공급가액+부가세) 재검증
    if (payment.totalAmount !== totalPrice) {
      console.error('결제 금액 불일치:', { toss: payment.totalAmount, expected: totalPrice });
      return NextResponse.json(
        { success: false, message: '결제 금액 검증에 실패했습니다.' },
        { status: 400 }
      );
    }

    // 광고 창 계산 — 노출일(구매일 + 보너스일). 같은/낮은 등급은 기존 끝에 이어 붙이고, 상위 등급은 즉시 시작.
    const paidAt = payment.approvedAt ? new Date(payment.approvedAt) : new Date();
    const { startsAt, expiresAt } = computeWindow({
      newTier: product.tier,
      category: product.category,
      exposureDays: product.exposureDays,
      approvedAt: paidAt,
      existing: existingWindows,
    });

    // Supabase에 결제 내역 저장
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        payment_id: paymentKey,
        user_id: userId,
        product_key: productKey,
        product_name: product.name,
        amount: totalPrice,
        currency: 'KRW',
        payment_status: 'completed',
        payment_method: payment.method || 'CARD',
        tier: product.tier,
        category: product.category,
        duration: product.durationLabel,
        pg_provider: 'tosspayments',
        paid_at: paidAt.toISOString(),
        starts_at: startsAt.toISOString(),
        start_date: startsAt.toISOString(),
        end_date: expiresAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        job_id: jobId || null,
      });

    if (insertError) {
      console.error('결제 내역 저장 실패 (migration 046 payments.starts_at 적용 여부 확인):', insertError);
      return NextResponse.json(
        { success: false, message: '결제는 완료되었으나 기록 저장에 실패했습니다. 고객센터에 문의해주세요.' },
        { status: 500 }
      );
    }

    // 공고 반영 (소유자 검증 완료 상태)
    if (job) {
      try {
        await applyJobEntitlement(job, [
          ...existingWindows,
          { tier: product.tier, starts_at: startsAt, expires_at: expiresAt },
        ]);
      } catch (jobUpdateError) {
        console.error('결제 후 공고 반영 실패:', jobUpdateError);
        return NextResponse.json(
          { success: false, message: '결제 처리 상태를 확인 중입니다. 고객센터에 문의해주세요.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '결제가 완료되었습니다.',
      data: {
        paymentKey,
        orderId,
        productName: product.name,
        amount: totalPrice,
        tier: product.tier,
        duration: product.durationLabel,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
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
