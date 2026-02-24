-- news_toon_episodes 테이블: AI 뉴스툰 에피소드
CREATE TABLE news_toon_episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_number SERIAL,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(200),
  slug VARCHAR(200) UNIQUE,

  -- 원본 뉴스
  source_news_url TEXT,
  source_news_title TEXT,
  category VARCHAR(50) DEFAULT '부동산',

  -- AI 생성 콘텐츠
  article_html TEXT,              -- 좌측: AI 해설 기사 (HTML)
  article_summary VARCHAR(500),   -- 공유용 요약

  -- 4컷 웹툰 패널
  panels JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- panels 구조: [{character, dialogue, scene, thought?, sfx?}, ...]

  -- 이미지
  thumbnail_url TEXT,

  -- 상태
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_toon_status ON news_toon_episodes(status);
CREATE INDEX idx_toon_published ON news_toon_episodes(published_at DESC);
CREATE INDEX idx_toon_slug ON news_toon_episodes(slug);
