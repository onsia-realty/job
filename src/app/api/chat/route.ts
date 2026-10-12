import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';
import { sanitizeChatMessages, type ChatMessage } from '@/lib/ai-assistant';
import { verifyUser } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { GEMINI_TEXT_MODEL, GEMINI_LOW_THINKING } from '@/lib/gemini-models';
import { buildSupportSystemPrompt, extractHandoff, getSupportContact } from '@/lib/support-knowledge';
import { fetchMemberContext } from '@/lib/support-member-context';
import { resolveCanned } from '@/lib/support-faq';
import { AnswerCache, isCacheable } from '@/lib/support-answer-cache';

// 공개 고객센터 챗봇
// body: { messages: [{ role: 'user'|'assistant', content }], sessionId? }  (하위호환: { message })
// res : { answer, handoff, sessionId, source, contact? }  — contact 는 handoff=true 일 때만
//
// 답변 순서 (Gemini 호출 절감):
//   1) handoff — 상담원·환불 요청·결제 문제 → AI 없이 상담원 연결
//   2) faq     — 맥락 없는 단순 질문 → support-faq 빌더 답변
//   3) cache   — 비로그인 첫 턴 질문의 이전 AI 답변 (인스턴스별 메모리, best-effort)
//   4) ai      — Gemini
// source 는 로그/분석용 — 위젯은 사용자에게 표시하지 않는다.

type AnswerSource = 'handoff' | 'faq' | 'cache' | 'ai';

// 서버리스 인스턴스별 메모리 캐시 — 인스턴스 간 공유되지 않고 콜드스타트 시 비어 있음 (best-effort)
const answerCache = new AnswerCache({ maxEntries: 200, ttlMs: 60 * 60 * 1000 });

const SUPPORT_CHAT_MODEL = GEMINI_TEXT_MODEL;
const MAX_USER_MESSAGE_CHARS = 500;
const HISTORY_LIMITS = { maxMessages: 12, maxContentChars: 2000, maxTotalChars: 24000 } as const;
const SESSION_ID_RE = /^[A-Za-z0-9-]{8,64}$/;

const checkRateLimit = createRateLimiter(10); // 10회/분/IP

let ai: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return ai;
}

// ── 대화 로그 (best-effort) ──
let logUnavailableWarned = false;

interface TranscriptRow {
  session_id: string;
  user_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  handoff: boolean;
  model: string | null;
}

async function logTranscript(rows: TranscriptRow[]) {
  if (process.env.SUPPORT_CHAT_LOG_DISABLED === 'true') return;
  try {
    const { error } = await supabaseAdmin.from('support_chats').insert(rows);
    // 테이블 미적용(045 마이그레이션 전) 등 — 한 번만 경고하고 챗은 계속
    if (error && !logUnavailableWarned) {
      logUnavailableWarned = true;
      console.warn('[support-chat] transcript logging unavailable:', error.message);
    }
  } catch (e) {
    if (!logUnavailableWarned) {
      logUnavailableWarned = true;
      console.warn('[support-chat] transcript logging failed:', e instanceof Error ? e.message : e);
    }
  }
}

function parseMessages(body: Record<string, unknown>): ChatMessage[] | { error: string } {
  const raw: unknown = Array.isArray(body.messages)
    ? body.messages
    : typeof body.message === 'string'
      ? [{ role: 'user', content: body.message }]
      : null;
  if (!Array.isArray(raw) || raw.length === 0) return { error: '메시지를 입력해 주세요.' };

  // 마지막(이번) 사용자 메시지 길이는 잘라내기 전에 검사 — 500자 제한 유지
  const last = raw[raw.length - 1] as Partial<ChatMessage> | undefined;
  if (!last || last.role !== 'user' || typeof last.content !== 'string' || !last.content.trim()) {
    return { error: '메시지를 입력해 주세요.' };
  }
  if (last.content.length > MAX_USER_MESSAGE_CHARS) {
    return { error: `메시지는 ${MAX_USER_MESSAGE_CHARS}자 이내로 입력해 주세요.` };
  }

  const messages = sanitizeChatMessages(raw, HISTORY_LIMITS)
    // 과거 사용자 메시지도 500자로 제한 (히스토리 조작으로 긴 프롬프트 주입 방지)
    .map((m) => (m.role === 'user' ? { ...m, content: m.content.slice(0, MAX_USER_MESSAGE_CHARS) } : m));
  // Gemini contents 는 user 로 시작해야 한다 (위젯 환영 인사 등 선행 assistant 제거)
  while (messages.length > 0 && messages[0].role !== 'user') messages.shift();
  if (messages.length === 0) return { error: '메시지를 입력해 주세요.' };
  return messages;
}

const FALLBACK_ANSWER = '죄송해요, 지금은 답변을 만들지 못했어요. 상담원이 도와드릴게요.';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' },
        { status: 429 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 });
    }

    const parsed = parseMessages(body);
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const messages = parsed;

    const sessionId = typeof body.sessionId === 'string' && SESSION_ID_RE.test(body.sessionId)
      ? body.sessionId
      : randomUUID();

    // 로그인 여부 (토큰 검증 실패 시 비회원으로 처리)
    let userId: string | null = null;
    if (request.headers.get('authorization')?.startsWith('Bearer ')) {
      const user = await verifyUser(request).catch(() => null);
      if (user) userId = user.id;
    }

    const lastUser = messages[messages.length - 1];
    const ctx = { text: lastUser.content, hasHistory: messages.length > 1, loggedIn: userId !== null };

    const respond = async (answer: string, handoff: boolean, source: AnswerSource, model: string) => {
      await logTranscript([
        { session_id: sessionId, user_id: userId, role: 'user', content: lastUser.content, handoff: false, model: null },
        { session_id: sessionId, user_id: userId, role: 'assistant', content: answer, handoff, model },
      ]);
      return NextResponse.json({
        answer,
        handoff,
        sessionId,
        source,
        ...(handoff ? { contact: getSupportContact() } : {}),
      });
    };

    // 1) 상담원 요청 / 2) FAQ — AI 호출 없음
    const canned = resolveCanned(ctx);
    if (canned) return respond(canned.answer, canned.handoff, canned.source, canned.source);

    // 3) 캐시 — 비로그인 첫 턴만
    const cacheable = isCacheable(ctx);
    if (cacheable) {
      const cached = answerCache.get(lastUser.content);
      if (cached) return respond(cached, false, 'cache', 'cache');
    }

    // 4) AI — 로그인 회원이면 본인 결제·공고 요약만 주입
    const memberBlock = userId ? await fetchMemberContext(userId) : null;

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));

    let answer = FALLBACK_ANSWER;
    let handoff = true;
    let aiOk = false;
    try {
      const response = await getAi().models.generateContent({
        model: SUPPORT_CHAT_MODEL,
        contents,
        config: {
          systemInstruction: buildSupportSystemPrompt(memberBlock),
          temperature: 0.4,
          // thinking 토큰이 maxOutputTokens 에 포함 → 1500 + thinking LOW 로 잘림 방지
          maxOutputTokens: 1500,
          thinkingConfig: GEMINI_LOW_THINKING,
        },
      });
      const text = (response.text ?? '').trim();
      if (text) {
        ({ answer, handoff } = extractHandoff(text));
        // 위젯은 일반 텍스트로 렌더링 — 모델이 넣은 굵게(**) 표시 제거
        answer = answer.replace(/\*\*/g, '');
        if (!answer) answer = FALLBACK_ANSWER;
        else aiOk = true;
      }
      const finish = response.candidates?.[0]?.finishReason;
      if (finish && finish !== 'STOP') {
        console.warn('[support-chat] finishReason:', finish, JSON.stringify(response.usageMetadata ?? {}));
      }
    } catch (aiErr) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.error('[support-chat] Gemini error:', msg);
      const rateLimited = /429|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg);
      answer = rateLimited
        ? '지금 문의가 많아 AI 상담이 잠시 어려워요. 잠시 후 다시 시도하시거나 상담원에게 문의해 주세요.'
        : FALLBACK_ANSWER;
      handoff = true;
    }

    // 정상 AI 답변(핸드오프 아님)만 캐시 — 오류·폴백 답변은 저장하지 않음
    if (cacheable && aiOk && !handoff) answerCache.set(lastUser.content, answer);

    return respond(answer, handoff, 'ai', SUPPORT_CHAT_MODEL);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
