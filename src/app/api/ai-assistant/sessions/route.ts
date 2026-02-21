import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET: 세션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch sessions:', error);
      return NextResponse.json({ error: '세션 목록 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({ sessions: data || [] });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// POST: 새 세션 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title?.slice(0, 200) || '새 대화';

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({ user_id: user.id, title })
      .select('id, title, created_at, updated_at')
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return NextResponse.json({ error: '세션 생성 실패' }, { status: 500 });
    }

    return NextResponse.json({ session: data });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
