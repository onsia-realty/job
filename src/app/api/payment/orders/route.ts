import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getTotalPrice, isProductPurchasable, resolveProduct } from '@/lib/toss';
import { isAdvertisementJobEligible, isAdvertisementJobId } from '@/lib/advertisement-job';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const body = await req.json();
    if (!body || typeof body.productKey !== 'string'
      || (body.days !== undefined && (!Number.isInteger(body.days) || body.days <= 0))) {
      return NextResponse.json({ message: '상품 정보를 확인해주세요.' }, { status: 400 });
    }
    if (!isAdvertisementJobId(body.jobId)) {
      return NextResponse.json({ message: '광고를 적용할 공고를 먼저 등록하고 선택해주세요.' }, { status: 400 });
    }
    const product = resolveProduct(body.productKey, body.days);
    if (!product || !isProductPurchasable(body.productKey)) return NextResponse.json({ message: '현재 구매할 수 없는 상품입니다.' }, { status: 400 });
    const { data: job, error: jobError } = await supabaseAdmin.from('jobs').select('id,user_id,category,title,is_active,is_approved,deadline').eq('id', body.jobId).maybeSingle();
    if (jobError) return NextResponse.json({ message: '공고 조회에 실패했습니다.' }, { status: 503 });
    if (!job) return NextResponse.json({ message: '공고를 찾을 수 없습니다.' }, { status: 404 });
    if (job.user_id !== user.id) return NextResponse.json({ message: '본인의 공고만 결제할 수 있습니다.' }, { status: 403 });
    if (job.category !== product.category) return NextResponse.json({ message: '공고와 상품의 카테고리가 일치하지 않습니다.' }, { status: 400 });
    if (!isAdvertisementJobEligible(job)) return NextResponse.json({ message: '승인된 활성 공고 중 모집 마감일이 지나지 않은 공고만 결제할 수 있습니다. 미승인 공고는 승인 후 다시 선택해주세요.' }, { status: 400 });
    const order = {
      order_id: `order-${randomUUID()}`, idempotency_key: randomUUID(), user_id: user.id,
      job_id: job.id, job_id_snapshot: job.id, job_title: job.title,
      product_key: product.productKey, product_name: product.name, tier: product.tier,
      category: product.category, days: product.days, exposure_days: product.exposureDays,
      duration: product.durationLabel, amount: getTotalPrice(product.price), currency: 'KRW', status: 'pending',
    };
    const { error } = await supabaseAdmin.from('payment_orders').insert(order);
    if (error) return NextResponse.json({ message: '결제 준비에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 503 });
    return NextResponse.json({ success: true, data: { orderId: order.order_id, orderName: order.product_name, amount: order.amount, currency: order.currency } });
  } catch {
    return NextResponse.json({ message: '결제 요청을 확인해주세요.' }, { status: 400 });
  }
}
