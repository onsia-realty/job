import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { streamChatResponse, checkRateLimit } from '@/lib/ai-assistant';
import type { ChatMessage } from '@/lib/ai-assistant';

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

    // 2. Rate limit check
    const { allowed, remaining } = checkRateLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: '일일 사용 한도(5회)를 초과했습니다. 내일 다시 이용해주세요.' },
        { status: 429 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const messages: ChatMessage[] = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '메시지를 입력해주세요' },
        { status: 400 }
      );
    }

    // Validate message format
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user' || !lastMessage.content.trim()) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '올바른 메시지 형식이 아닙니다' },
        { status: 400 }
      );
    }

    // Limit message content length
    if (lastMessage.content.length > 2000) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '메시지는 2000자 이내로 입력해주세요' },
        { status: 400 }
      );
    }

    // 4. Stream response via SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const response = await streamChatResponse(messages);

          for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
              const data = JSON.stringify({ type: 'text', content: text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Send done signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', remaining })}\n\n`)
          );
        } catch (error: any) {
          console.error('AI stream error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            content: 'AI 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Remaining-Requests': String(remaining),
      },
    });
  } catch (error: any) {
    console.error('AI assistant chat error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
