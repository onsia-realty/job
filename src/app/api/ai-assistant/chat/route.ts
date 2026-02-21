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

// 메시지를 DB에 저장
async function saveMessageToDb(sessionId: string, role: 'user' | 'assistant', content: string) {
  const { error } = await supabaseAdmin
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content });
  if (error) {
    console.error('Failed to save message:', error);
  }
}

// 세션 updated_at 갱신
async function touchSession(sessionId: string) {
  const { error } = await supabaseAdmin
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) {
    console.error('Failed to touch session:', error);
  }
}

// 세션 생성 또는 소유권 확인
async function resolveSession(userId: string, sessionId: string | undefined, firstMessageContent: string): Promise<string | undefined> {
  // 기존 세션이면 소유권 확인
  if (sessionId) {
    const { data: session } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();
    if (session) return session.id;
  }

  // 새 세션 생성
  const title = firstMessageContent.slice(0, 50) + (firstMessageContent.length > 50 ? '...' : '');
  const { data: newSession } = await supabaseAdmin
    .from('chat_sessions')
    .insert({ user_id: userId, title })
    .select('id')
    .single();
  return newSession?.id;
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

    // 2. Parse request body
    const body = await request.json();
    const messages: ChatMessage[] = body.messages;
    const sessionId: string | undefined = body.sessionId;
    const isFirstMessage: boolean = body.isFirstMessage || false;
    const presetAnswer: string | undefined = body.presetAnswer;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '메시지를 입력해주세요' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user' || !lastMessage.content.trim()) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '올바른 메시지 형식이 아닙니다' },
        { status: 400 }
      );
    }

    if (lastMessage.content.length > 2000) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '메시지는 2000자 이내로 입력해주세요' },
        { status: 400 }
      );
    }

    // 3. 프리셋 답변인 경우: Gemini 호출 없이 DB 저장만
    if (presetAnswer) {
      const activeSessionId = await resolveSession(user.id, sessionId, lastMessage.content);

      if (activeSessionId) {
        await saveMessageToDb(activeSessionId, 'user', lastMessage.content);
        await saveMessageToDb(activeSessionId, 'assistant', presetAnswer);
        await touchSession(activeSessionId);
      }

      // SSE 형식으로 sessionId 반환
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', sessionId: activeSessionId })}\n\n`)
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      });
    }

    // 4. Rate limit check (Gemini API 호출만 카운트)
    const { allowed, remaining } = checkRateLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: '일일 사용 한도(5회)를 초과했습니다. 내일 다시 이용해주세요.' },
        { status: 429 }
      );
    }

    // 5. 세션 확인/생성
    const activeSessionId = await resolveSession(user.id, sessionId, lastMessage.content);

    // 유저 메시지 DB 저장
    if (activeSessionId) {
      await saveMessageToDb(activeSessionId, 'user', lastMessage.content);
    }

    // 6. Stream response via SSE
    const finalSessionId = activeSessionId;
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = '';

        try {
          const response = await streamChatResponse(messages);

          for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
              fullResponse += text;
              const data = JSON.stringify({ type: 'text', content: text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // AI 응답 DB 저장
          if (finalSessionId && fullResponse) {
            await saveMessageToDb(finalSessionId, 'assistant', fullResponse);
            await touchSession(finalSessionId);
          }

          // Send done signal with sessionId
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', remaining, sessionId: finalSessionId })}\n\n`)
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
