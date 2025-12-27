-- Migration: 001_initial_schema
-- Created: 2025-01-XX
-- Description: 부동산 파트너 초기 스키마 (썸네일 추천 시스템 포함)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. users (사용자)
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('advertiser', 'admin', 'super_admin')),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  company_name VARCHAR(200),
  business_number VARCHAR(50),
  subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium', 'vip')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan);

-- ==========================================
-- 2. job_listings (구인공고)
-- ==========================================
CREATE TABLE job_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 기본 정보
  title VARCHAR(200) NOT NULL,
  company VARCHAR(200) NOT NULL,
  location VARCHAR(200) NOT NULL,
  region VARCHAR(50) NOT NULL,
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('아파트', '오피스텔', '지산', '상가')),

  -- 급여 및 조건
  salary VARCHAR(100),
  commission VARCHAR(50),
  deadline VARCHAR(100),

  -- 상세 정보
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  tags TEXT[],

  -- 썸네일 시스템
  original_thumbnail VARCHAR(500),
  recommended_thumbnail VARCHAR(500),
  current_thumbnail VARCHAR(500),
  thumbnail_status VARCHAR(20) DEFAULT 'none' CHECK (
    thumbnail_status IN ('none', 'pending', 'recommended', 'approved', 'rejected')
  ),
  recommended_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- 노출 및 통계
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'expired')),
  is_premium BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,

  -- 배지 시스템
  badges TEXT[],

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_job_listings_user_id ON job_listings(user_id);
CREATE INDEX idx_job_listings_region ON job_listings(region);
CREATE INDEX idx_job_listings_property_type ON job_listings(property_type);
CREATE INDEX idx_job_listings_status ON job_listings(status);
CREATE INDEX idx_job_listings_thumbnail_status ON job_listings(thumbnail_status);
CREATE INDEX idx_job_listings_created_at ON job_listings(created_at DESC);
CREATE INDEX idx_job_listings_views ON job_listings(views DESC);

-- ==========================================
-- 3. thumbnail_recommendations (썸네일 추천 이력)
-- ==========================================
CREATE TABLE thumbnail_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id),

  -- 추천 이미지
  thumbnail_url VARCHAR(500) NOT NULL,
  generation_method VARCHAR(50),
  generation_prompt TEXT,

  -- 상태
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'approved', 'rejected')),
  response_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_thumbnail_recommendations_job_listing_id ON thumbnail_recommendations(job_listing_id);
CREATE INDEX idx_thumbnail_recommendations_status ON thumbnail_recommendations(status);

-- ==========================================
-- 4. notifications (알림)
-- ==========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 알림 내용
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,

  -- 연결된 데이터
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE SET NULL,
  recommendation_id UUID REFERENCES thumbnail_recommendations(id) ON DELETE SET NULL,

  -- 상태
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- 발송 정보
  sent_via TEXT[],
  kakao_sent_at TIMESTAMP WITH TIME ZONE,
  push_sent_at TIMESTAMP WITH TIME ZONE,
  sms_sent_at TIMESTAMP WITH TIME ZONE,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ==========================================
-- 5. subscriptions (구독 이력)
-- ==========================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 플랜 정보
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'premium', 'vip')),
  price INTEGER NOT NULL,

  -- 기간
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- 결제 정보
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  transaction_id VARCHAR(200),

  -- 자동 갱신
  auto_renew BOOLEAN DEFAULT TRUE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);

-- ==========================================
-- 6. news_articles (뉴스)
-- ==========================================
CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 기본 정보
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,

  -- 미디어
  thumbnail_url VARCHAR(500),
  source_url VARCHAR(500),
  source_name VARCHAR(100),

  -- 카테고리
  category VARCHAR(50),
  tags TEXT[],

  -- 통계
  views INTEGER DEFAULT 0,

  -- 상태
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),

  -- 타임스탬프
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_category ON news_articles(category);

-- ==========================================
-- 7. ai_videos (AI 영상)
-- ==========================================
CREATE TABLE ai_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 기본 정보
  title VARCHAR(300) NOT NULL,
  description TEXT,

  -- 영상 정보
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration INTEGER,

  -- AI 생성 정보
  generation_method VARCHAR(50),
  generation_prompt TEXT,

  -- 카테고리
  category VARCHAR(50),
  tags TEXT[],

  -- 통계
  views INTEGER DEFAULT 0,

  -- 상태
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),

  -- 타임스탬프
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_videos_published_at ON ai_videos(published_at DESC);
CREATE INDEX idx_ai_videos_category ON ai_videos(category);

-- ==========================================
-- 8. community_posts (커뮤니티)
-- ==========================================
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 기본 정보
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,

  -- 카테고리
  category VARCHAR(50),
  tags TEXT[],

  -- 미디어
  images TEXT[],

  -- 통계
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- 상태
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'deleted')),
  is_pinned BOOLEAN DEFAULT FALSE,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_category ON community_posts(category);

-- ==========================================
-- 9. favorites (관심 공고)
-- ==========================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, job_listing_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_job_listing_id ON favorites(job_listing_id);

-- ==========================================
-- RLS (Row Level Security) 정책
-- ==========================================

-- users 테이블
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- job_listings 테이블
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings"
  ON job_listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Advertisers can create own listings"
  ON job_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advertisers can update own listings"
  ON job_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all listings"
  ON job_listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- notifications 테이블
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- favorites 테이블
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- ==========================================
-- Functions & Triggers
-- ==========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- job_listings 테이블 트리거
CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- community_posts 테이블 트리거
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Initial Data (테스트용)
-- ==========================================

-- 슈퍼 관리자 생성 (비밀번호는 나중에 해시로 변경 필요)
INSERT INTO users (email, password_hash, role, name) VALUES
  ('admin@budongsan.com', 'CHANGE_ME', 'super_admin', '시스템 관리자');

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Initial schema migration completed successfully!';
  RAISE NOTICE '📊 Created 9 tables with RLS policies';
  RAISE NOTICE '🔐 Security policies enabled';
  RAISE NOTICE '⚡ Triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Next steps:';
  RAISE NOTICE '1. Update admin password hash';
  RAISE NOTICE '2. Configure Supabase Auth';
  RAISE NOTICE '3. Set up Storage buckets';
END $$;
