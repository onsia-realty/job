import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, isAdminUserId } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { inquirySchema, inquiryReplySchema } from '@/lib/stay/inquiry';
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
const unavailable = () => fail('문의 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.', 503);
export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return fail('로그인이 필요합니다.', 401);
  const admin = await isAdminUserId(user.id);
  let query = supabaseAdmin.from('stay_inquiries').select('id,stay_id,host_id,message,reply,created_at,replied_at,stays(title)').order('created_at', { ascending: false }).limit(100);
  if (!admin) query = query.or(`guest_id.eq.${user.id},host_id.eq.${user.id}`);
  const { data, error } = await query;
  if (error) return unavailable();
  return NextResponse.json({ inquiries: (data ?? []).map(({ host_id, stays, ...row }) => ({ ...row, is_host: host_id === user.id || admin, stay_title: (stays as unknown as { title: string } | null)?.title ?? '매물' })) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return fail('로그인이 필요합니다.', 401);
  const raw = await req.text();
  if (raw.length > 5000) return fail('문의 내용이 너무 깁니다.', 413);
  let body;
  try { body = JSON.parse(raw); } catch { return fail('잘못된 요청입니다.', 400); }
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);
  const { data: stay, error: stayError } = await supabaseAdmin.from('stays').select('id,user_id,is_active,is_approved,status').eq('id', parsed.data.stay_id).maybeSingle();
  if (stayError) return unavailable();
  if (!stay || !stay.user_id || stay.is_active !== true || stay.is_approved !== true || stay.status === 'occupied') return fail('현재 문의할 수 없는 매물입니다.', 404);
  if (stay.user_id === user.id) return fail('내 매물에는 문의할 수 없습니다.', 400);
  const { count, error: countError } = await supabaseAdmin.from('stay_inquiries').select('id', { count: 'exact', head: true }).eq('guest_id', user.id).gte('created_at', new Date(Date.now() - 86400000).toISOString());
  if (countError) return unavailable();
  if ((count ?? 0) >= 10) return fail('하루 문의 한도에 도달했습니다.', 429);
  const { error } = await supabaseAdmin.from('stay_inquiries').insert({ stay_id: stay.id, guest_id: user.id, host_id: stay.user_id, message: parsed.data.message });
  if (error?.code === '23505') return fail('이미 문의한 매물입니다. 문의함에서 답변을 확인해주세요.', 409);
  if (error) return unavailable();
  return NextResponse.json({ success: true }, { status: 201 });
}
export async function PATCH(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return fail('로그인이 필요합니다.', 401);
  const raw = await req.text();
  if (raw.length > 5000) return fail('답변이 너무 깁니다.', 413);
  let body;
  try { body = JSON.parse(raw); } catch { return fail('잘못된 요청입니다.', 400); }
  const parsed = inquiryReplySchema.safeParse(body);
  if (!parsed.success) return fail('답변 내용을 확인해주세요.', 400);
  const admin = await isAdminUserId(user.id);
  let query = supabaseAdmin.from('stay_inquiries').update({ reply: parsed.data.reply, replied_at: new Date().toISOString() }).eq('id', parsed.data.id);
  if (!admin) query = query.eq('host_id', user.id);
  const { data, error } = await query.select('id').maybeSingle();
  if (error) return unavailable();
  if (!data) return fail('답변 권한이 없습니다.', 403);
  return NextResponse.json({ success: true });
}
