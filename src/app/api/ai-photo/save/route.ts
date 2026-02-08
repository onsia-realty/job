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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { generationId } = body;

    if (!generationId || typeof generationId !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '잘못된 요청입니다' },
        { status: 400 }
      );
    }

    // Fetch the generation record and verify ownership
    const { data: generation, error: fetchError } = await supabaseAdmin
      .from('ai_photo_generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: '생성 이력을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (generation.status !== 'COMPLETED' && generation.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: '완료된 사진만 저장할 수 있습니다' },
        { status: 400 }
      );
    }

    if (!generation.generated_image_url) {
      return NextResponse.json(
        { error: 'NO_IMAGE', message: '생성된 이미지가 없습니다' },
        { status: 400 }
      );
    }

    // Update the user's resume photo field
    const { error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({ photo: generation.generated_image_url })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Resume photo update error:', updateError);
    }

    // Reset any previously ACCEPTED generation back to COMPLETED
    await supabaseAdmin
      .from('ai_photo_generations')
      .update({ status: 'COMPLETED' })
      .eq('user_id', user.id)
      .eq('status', 'ACCEPTED');

    // Mark this generation as accepted
    await supabaseAdmin
      .from('ai_photo_generations')
      .update({ status: 'ACCEPTED' })
      .eq('id', generationId);

    return NextResponse.json({
      success: true,
      profileImageUrl: generation.generated_image_url,
    });
  } catch (error) {
    console.error('AI photo save error:', error);
    return NextResponse.json(
      { error: 'SAVE_FAILED', message: '저장에 실패했습니다' },
      { status: 500 }
    );
  }
}
