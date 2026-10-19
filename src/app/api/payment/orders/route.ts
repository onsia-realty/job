import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getTotalPrice, isProductPurchasable, resolveProduct } from '@/lib/toss';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const body = await req.json();
    if (!body || typeof body.productKey !== 'string'
      || (body.days !== undefined && (!Number.isInteger(body.days) || body.days <= 0))
      || (body.jobId != null && (typeof body.jobId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.jobId)))) {
      return NextResponse.json({ message: '상품 정보를 확인해주세요.' }, { status: 400 });
    }
    const product = resolveProduct(body.productKey, body.days);
    if (!product || !isProductPurchasable(body.productKey)) return NextResponse.json({ message: '현재 구매할 수 없는 상품입니다.' }, { status: 400 });
    let jobTitle: string | null = null;
    if (body.jobId) {
      const { data: job, error } = await supabaseAdmin.from('jobs').select('id,user_id,category,title').eq('id', body.jobId).maybeSingle();
      if (error) return NextResponse.json({ message: '공고 조회에 실패했습니다.' }, { status: 503 });
      if (!job) return NextResponse.json({ message: '공고를 찾을 수 없습니다.' }, { status: 404 });
      if (job.user_id !== user.id) return NextResponse.json({ message: '본인의 공고만 결제할 수 있습니다.' }, { status: 403 });
      if (job.category !== product.category) return NextResponse.json({ message: '공고와 상품의 카테고리가 일치하지 않습니다.' }, { status: 400 });
      jobTitle = job.title;
    }
    const order = {
      order_id: `order-${randomUUID()}`, idempotency_key: randomUUID(), user_id: user.id,
      job_id: body.jobId ?? null, job_id_snapshot: body.jobId ?? null, job_title: jobTitle,
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
