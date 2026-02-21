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

// GET: 세션의 메시지 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: sessionId } = await params;

    // 세션 소유권 확인
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch messages:', error);
      return NextResponse.json({ error: '메시지 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// DELETE: 세션 삭제 (cascade로 메시지도 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: sessionId } = await params;

    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete session:', error);
      return NextResponse.json({ error: '세션 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// PATCH: 세션 제목 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const title = body.title?.slice(0, 200);

    if (!title) {
      return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to update session:', error);
      return NextResponse.json({ error: '세션 수정 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
