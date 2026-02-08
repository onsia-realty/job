import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { ACCOUNT_LIMIT } from '@/lib/validations/ai-photo';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // Fetch generation history (latest 20)
    const { data: generations, error: fetchError } = await supabaseAdmin
      .from('ai_photo_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error('History fetch error:', fetchError);
      return NextResponse.json(
        { error: 'FETCH_FAILED', message: '이력 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    // Count total usage (exclude FAILED)
    const { count } = await supabaseAdmin
      .from('ai_photo_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'FAILED');

    return NextResponse.json({
      generations: generations || [],
      totalUsage: count ?? 0,
      accountLimit: ACCOUNT_LIMIT,
      remaining: Math.max(0, ACCOUNT_LIMIT - (count ?? 0)),
    });
  } catch (error) {
    console.error('AI photo history error:', error);
    return NextResponse.json(
      { error: 'FETCH_FAILED', message: '이력 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}
