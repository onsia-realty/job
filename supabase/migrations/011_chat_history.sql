-- 011: AI 비서 채팅 내역 저장
-- chat_sessions: 대화 세션
-- chat_messages: 개별 메시지

-- 1. 대화 세션 테이블
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL DEFAULT '새 대화',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- 4. RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 본인 세션만 관리
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 본인 세션의 메시지만 관리
CREATE POLICY "Users can manage own chat messages" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- 5. updated_at 자동 갱신
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 30일 지난 세션 자동 삭제 (Supabase pg_cron 또는 수동 실행)
-- SELECT cron.schedule('cleanup-old-chats', '0 3 * * *',
--   $$DELETE FROM chat_sessions WHERE updated_at < NOW() - INTERVAL '30 days'$$
-- );
