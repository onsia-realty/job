# Database Schema - 부동산 파트너 (썸네일 추천 시스템 포함)

## 📊 테이블 구조

### 1. users (사용자)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('advertiser', 'admin', 'super_admin')),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  company_name VARCHAR(200),
  business_number VARCHAR(50), -- 사업자등록번호
  subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium', 'vip')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan);
```

**역할 설명:**
- `advertiser`: 광고주 (공고 등록, 썸네일 승인)
- `admin`: 직원 (썸네일 생성, 추천 발송, 품질 관리)
- `super_admin`: 최고 관리자

**구독 플랜:**
- `free`: 무료 (1회 추천)
- `premium`: 월 3만원 (무제한 추천 + 영상 썸네일)
- `vip`: 월 10만원 (전담 디자인 + 상단 노출)

---

### 2. job_listings (구인공고)
```sql
CREATE TABLE job_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 기본 정보
  title VARCHAR(200) NOT NULL,
  company VARCHAR(200) NOT NULL,
  location VARCHAR(200) NOT NULL,
  region VARCHAR(50) NOT NULL, -- 서울, 경기, 인천 등
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('아파트', '오피스텔', '지산', '상가')),

  -- 급여 및 조건
  salary VARCHAR(100), -- "400-600만원", "협의"
  commission VARCHAR(50), -- "8%", "협의"
  deadline VARCHAR(100), -- "상시모집", "2025-01-31까지"

  -- 상세 정보
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  tags TEXT[], -- ["숙소제공", "즉시투입", "4대보험"]

  -- 썸네일 시스템 (핵심!)
  original_thumbnail VARCHAR(500), -- 원본 이미지 URL
  recommended_thumbnail VARCHAR(500), -- AI 추천 이미지 URL
  current_thumbnail VARCHAR(500), -- 현재 사용 중인 썸네일
  thumbnail_status VARCHAR(20) DEFAULT 'none' CHECK (
    thumbnail_status IN ('none', 'pending', 'recommended', 'approved', 'rejected')
  ),
  recommended_at TIMESTAMP WITH TIME ZONE, -- 추천 발송 시간
  approved_at TIMESTAMP WITH TIME ZONE, -- 승인 시간
  rejected_at TIMESTAMP WITH TIME ZONE, -- 거절 시간
  rejection_reason TEXT, -- 거절 사유 (광고주 피드백)

  -- 노출 및 통계
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'expired')),
  is_premium BOOLEAN DEFAULT FALSE, -- 프리미엄 공고 여부
  views INTEGER DEFAULT 0, -- 조회수
  favorites INTEGER DEFAULT 0, -- 관심 등록 수

  -- 배지 시스템
  badges TEXT[], -- ["HOT", "신규", "대박"]

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX idx_job_listings_user_id ON job_listings(user_id);
CREATE INDEX idx_job_listings_region ON job_listings(region);
CREATE INDEX idx_job_listings_property_type ON job_listings(property_type);
CREATE INDEX idx_job_listings_status ON job_listings(status);
CREATE INDEX idx_job_listings_thumbnail_status ON job_listings(thumbnail_status);
CREATE INDEX idx_job_listings_created_at ON job_listings(created_at DESC);
CREATE INDEX idx_job_listings_views ON job_listings(views DESC);
```

**썸네일 상태 흐름:**
1. `none`: 썸네일 없음 (텍스트만 등록)
2. `pending`: 직원이 검토 중
3. `recommended`: 직원이 추천 발송
4. `approved`: 광고주 승인 완료
5. `rejected`: 광고주 거절

---

### 3. thumbnail_recommendations (썸네일 추천 이력)
```sql
CREATE TABLE thumbnail_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id), -- 추천한 직원

  -- 추천 이미지
  thumbnail_url VARCHAR(500) NOT NULL,
  generation_method VARCHAR(50), -- "midjourney", "dalle", "template", "manual"
  generation_prompt TEXT, -- AI 생성 시 사용한 프롬프트

  -- 상태
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'approved', 'rejected')),
  response_at TIMESTAMP WITH TIME ZONE, -- 광고주 응답 시간
  rejection_reason TEXT,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_thumbnail_recommendations_job_listing_id ON thumbnail_recommendations(job_listing_id);
CREATE INDEX idx_thumbnail_recommendations_status ON thumbnail_recommendations(status);
```

---

### 4. notifications (알림)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 알림 내용
  type VARCHAR(50) NOT NULL, -- "thumbnail_recommended", "thumbnail_approved", "job_expired" 등
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,

  -- 연결된 데이터
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE SET NULL,
  recommendation_id UUID REFERENCES thumbnail_recommendations(id) ON DELETE SET NULL,

  -- 상태
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- 발송 정보
  sent_via TEXT[], -- ["push", "kakao", "sms"]
  kakao_sent_at TIMESTAMP WITH TIME ZONE,
  push_sent_at TIMESTAMP WITH TIME ZONE,
  sms_sent_at TIMESTAMP WITH TIME ZONE,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

### 5. subscriptions (구독 이력)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 플랜 정보
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'premium', 'vip')),
  price INTEGER NOT NULL, -- 원 단위

  -- 기간
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- 결제 정보
  payment_method VARCHAR(50), -- "card", "transfer", "kakao_pay"
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  transaction_id VARCHAR(200),

  -- 자동 갱신
  auto_renew BOOLEAN DEFAULT TRUE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
```

---

### 6. news_articles (뉴스)
```sql
CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 기본 정보
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT, -- AI 요약

  -- 미디어
  thumbnail_url VARCHAR(500),
  source_url VARCHAR(500), -- 원본 기사 링크
  source_name VARCHAR(100), -- "네이버뉴스", "매일경제" 등

  -- 카테고리
  category VARCHAR(50), -- "정책", "시장동향", "금리" 등
  tags TEXT[],

  -- 통계
  views INTEGER DEFAULT 0,

  -- 상태
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),

  -- 타임스탬프
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_category ON news_articles(category);
```

---

### 7. ai_videos (AI 영상)
```sql
CREATE TABLE ai_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 기본 정보
  title VARCHAR(300) NOT NULL,
  description TEXT,

  -- 영상 정보
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration INTEGER, -- 초 단위

  -- AI 생성 정보
  generation_method VARCHAR(50), -- "runway", "pika", "manual"
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

-- 인덱스
CREATE INDEX idx_ai_videos_published_at ON ai_videos(published_at DESC);
CREATE INDEX idx_ai_videos_category ON ai_videos(category);
```

---

### 8. community_posts (커뮤니티)
```sql
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 기본 정보
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,

  -- 카테고리
  category VARCHAR(50), -- "자유게시판", "노하우공유", "질문답변"
  tags TEXT[],

  -- 미디어
  images TEXT[], -- 이미지 URL 배열

  -- 통계
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- 상태
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'deleted')),
  is_pinned BOOLEAN DEFAULT FALSE, -- 공지 고정

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_category ON community_posts(category);
```

---

### 9. favorites (관심 공고)
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, job_listing_id)
);

-- 인덱스
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_job_listing_id ON favorites(job_listing_id);
```

---

## 🔄 RLS (Row Level Security) 정책

### users 테이블
```sql
-- 사용자는 자신의 정보만 조회/수정 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- 어드민은 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

### job_listings 테이블
```sql
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 활성 공고 조회 가능
CREATE POLICY "Anyone can view active listings"
  ON job_listings FOR SELECT
  USING (status = 'active');

-- 광고주는 자신의 공고만 생성/수정 가능
CREATE POLICY "Advertisers can create own listings"
  ON job_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advertisers can update own listings"
  ON job_listings FOR UPDATE
  USING (auth.uid() = user_id);

-- 어드민은 모든 공고 수정 가능
CREATE POLICY "Admins can update all listings"
  ON job_listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

---

## 📈 주요 쿼리 예시

### 1. 썸네일 추천 대기 중인 공고 조회 (어드민용)
```sql
SELECT
  jl.*,
  u.name as advertiser_name,
  u.email as advertiser_email,
  u.phone as advertiser_phone
FROM job_listings jl
JOIN users u ON jl.user_id = u.id
WHERE jl.thumbnail_status = 'pending'
ORDER BY jl.created_at ASC;
```

### 2. 광고주별 썸네일 추천 통계
```sql
SELECT
  u.id,
  u.name,
  u.subscription_plan,
  COUNT(DISTINCT jl.id) as total_listings,
  COUNT(DISTINCT CASE WHEN jl.thumbnail_status = 'approved' THEN jl.id END) as approved_count,
  COUNT(DISTINCT CASE WHEN jl.thumbnail_status = 'rejected' THEN jl.id END) as rejected_count
FROM users u
LEFT JOIN job_listings jl ON u.id = jl.user_id
WHERE u.role = 'advertiser'
GROUP BY u.id, u.name, u.subscription_plan;
```

### 3. 프리미엄 공고 우선 정렬
```sql
SELECT *
FROM job_listings
WHERE status = 'active'
ORDER BY
  is_premium DESC,
  views DESC,
  created_at DESC
LIMIT 20;
```

---

## 🎯 MVP Phase 구현 순서

### Phase 1: 수동 추천 (MVP)
✅ 필수 테이블: `users`, `job_listings`, `thumbnail_recommendations`, `notifications`
- 직원이 수동으로 이미지 업로드
- 광고주가 승인/거절
- 알림톡 수동 발송

### Phase 2: AI 자동 생성
✅ 추가: AI 생성 메서드 통합
- Midjourney/DALL-E API 연동
- `generation_method`, `generation_prompt` 필드 활용

### Phase 3: 완전 자동화
✅ 추가: `subscriptions` 테이블 활성화
- 알림톡 자동 발송
- 구독 플랜별 차등 기능
- 통계 대시보드

---

## 💡 확장 가능성

### 1. A/B 테스팅
- 썸네일 A vs B 성과 비교
- 클릭률, 조회수 자동 추적

### 2. 템플릿 시스템
- 업종별 썸네일 템플릿 제공
- 드래그앤드롭 커스터마이징

### 3. 영상 썸네일
- VIP 플랜: 움직이는 썸네일 (MP4 → GIF)
- Runway API 연동

### 4. 추천 알고리즘
- 광고주의 과거 승인 패턴 학습
- 업종별 인기 스타일 자동 반영
