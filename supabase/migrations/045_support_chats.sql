-- 045: 공개 고객센터 챗봇 대화 로그 (support_chats)
-- Apply manually after 044. 서버(service_role)만 읽고 쓴다 — 브라우저 직접 접근 없음.
-- /api/chat 은 이 테이블이 없어도 동작한다(best-effort 로깅).

CREATE TABLE IF NOT EXISTS public.support_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  handoff boolean NOT NULL DEFAULT false,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_chats_session_created
  ON public.support_chats (session_id, created_at);

ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;

-- All access goes through server routes with the service-role key.
REVOKE ALL ON public.support_chats FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.support_chats TO service_role;
