import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

async function verifyUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET /api/resumes/[id] - 이력서 조회 (인증된 사용자만)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json({ error: '이력서를 불러올 수 없습니다' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '이력서를 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json(data);
}
