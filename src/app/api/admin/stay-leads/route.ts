import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

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

// GET /api/admin/stay-leads - 소유주 랜딩(/stay/owner) 접수 리드 목록 (조회 전용)
//
// stay_owner_leads 는 RLS 정책이 0건인 서버 전용 잠금 테이블이다(036:59-65).
// 개인정보(이름·연락처·주소)가 담기므로 service_role 로만 읽고, 쓰기는 여기서 제공하지 않는다.
// ip_hash 는 어뷰징 추적용 내부 값이라 응답에 싣지 않는다.
const LEAD_COLUMNS = [
  'id',
  'name',
  'phone',
  'address',
  'building_name',
  'unit_count',
  'memo',
  'privacy_agreed',
  'marketing_agreed',
  'source_code',
  'status',
  'converted_stay_id',
  'detail',
  'detail_version',
  'created_at',
].join(', ');

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  try {
    const { data: leads, error } = await supabaseAdmin
      .from('stay_owner_leads')
      .select(LEAD_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    return NextResponse.json(leads || []);
  } catch (error) {
    console.error('Admin stay leads error:', error);
    return NextResponse.json({ error: '리드 목록 조회 실패' }, { status: 500 });
  }
}
