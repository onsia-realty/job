import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, uploadImage } from '@/lib/supabase-server';
import { generateAiPhoto } from '@/lib/ai-photo';
import { AI_PHOTO_STYLES, ALLOWED_MIME_TYPES, MAX_FILE_SIZE, ACCOUNT_LIMIT } from '@/lib/validations/ai-photo';
import type { AiPhotoStyle } from '@/lib/ai-photo-styles';

export const maxDuration = 60;

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
    // 1. Auth check
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const style = formData.get('style') as string | null;

    // 3. Validate style
    if (!style || !AI_PHOTO_STYLES.includes(style as any)) {
      return NextResponse.json(
        { error: 'INVALID_STYLE', message: '유효하지 않은 스타일입니다' },
        { status: 400 }
      );
    }

    // 4. Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'INVALID_FILE', message: '사진을 업로드해주세요' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'INVALID_FILE', message: 'JPG, PNG, WebP만 가능합니다' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'INVALID_FILE', message: '사진 크기는 5MB 이하로 올려주세요' },
        { status: 400 }
      );
    }

    // 5. Check account-wide limit (exclude FAILED)
    const { count, error: countError } = await supabaseAdmin
      .from('ai_photo_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'FAILED');

    if (countError) {
      console.error('Rate limit check error:', countError);
    }

    if ((count ?? 0) >= ACCOUNT_LIMIT) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: `생성 한도(${ACCOUNT_LIMIT}회)를 초과했습니다` },
        { status: 429 }
      );
    }

    // 6. Upload original to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const timestamp = Date.now();
    const originalPath = `originals/${user.id}/${timestamp}.${ext}`;

    const originalImageUrl = await uploadImage('ai-photos', originalPath, buffer, file.type);

    // 7. Create DB record (status: GENERATING)
    const { data: generation, error: insertError } = await supabaseAdmin
      .from('ai_photo_generations')
      .insert({
        user_id: user.id,
        original_image_url: originalImageUrl,
        style: style as AiPhotoStyle,
        status: 'GENERATING',
      })
      .select()
      .single();

    if (insertError || !generation) {
      console.error('DB insert error:', insertError);
      return NextResponse.json(
        { error: 'GENERATION_FAILED', message: '서버 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 8. Call Gemini API
    try {
      const result = await generateAiPhoto(buffer, file.type, style as AiPhotoStyle);

      // 9. Upload generated image
      const generatedExt = result.mimeType.includes('png') ? 'png' : 'jpg';
      const generatedPath = `generated/${user.id}/${generation.id}.${generatedExt}`;
      const generatedImageUrl = await uploadImage(
        'ai-photos',
        generatedPath,
        result.imageBuffer,
        result.mimeType
      );

      // 10. Update DB (COMPLETED)
      await supabaseAdmin
        .from('ai_photo_generations')
        .update({
          generated_image_url: generatedImageUrl,
          status: 'COMPLETED',
          generation_time_ms: result.generationTimeMs,
        })
        .eq('id', generation.id);

      return NextResponse.json({
        success: true,
        generation: {
          id: generation.id,
          originalImageUrl,
          generatedImageUrl,
          style,
          generationTimeMs: result.generationTimeMs,
        },
      });
    } catch (aiError: any) {
      const errorMessage =
        aiError.message === 'AI_SAFETY_BLOCKED'
          ? '적합하지 않은 사진입니다. 다른 사진을 사용해주세요'
          : aiError.message === 'AI_NO_IMAGE'
            ? '얼굴이 잘 보이는 사진을 올려주세요'
            : '생성에 실패했습니다. 다시 시도해주세요';

      await supabaseAdmin
        .from('ai_photo_generations')
        .update({
          status: 'FAILED',
          error_message: aiError.message || 'Unknown error',
        })
        .eq('id', generation.id);

      return NextResponse.json(
        { error: 'GENERATION_FAILED', message: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('AI photo generate error:', error);
    return NextResponse.json(
      { error: 'GENERATION_FAILED', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
