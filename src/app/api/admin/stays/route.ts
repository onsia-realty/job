import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// 관리자 검증 — api/admin/jobs/route.ts 와 동일 패턴.
async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  if (!dbUser || dbUser.user_type !== 'admin') return null;
  return user;
}

// 목록 카드/테이블이 실제로 쓰는 컬럼만. select('*') 는 description/images/agent_* 까지
// 끌고 와 응답이 불필요하게 커진다.
const LIST_COLUMNS = [
  'id',
  'title',
  'stay_type',
  'deal_type',
  'address',
  'region',
  'sigungu',
  'deposit_won',
  'monthly_fee_won',
  'daily_fee_won',
  'weekly_fee_won',
  'owner_type',
  'status',
  'is_active',
  'is_approved',
  'views',
  'source',
  'contact_name',
  'phone',
  'created_at',
].join(', ');

// GET /api/admin/stays - 전체 단기임대 매물 목록 (승인 여부 무관)
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  try {
    const { data: stays, error } = await supabaseAdmin
      .from('stays')
      .select(LIST_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(stays || []);
  } catch (error) {
    console.error('Admin stays error:', error);
    return NextResponse.json({ error: '매물 목록 조회 실패' }, { status: 500 });
  }
}
