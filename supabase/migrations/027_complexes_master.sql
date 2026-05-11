-- 027: 단지 마스터 테이블
-- complex_key 단위로 좌표 + 단지 메타(세대수/입주연도 등) 보관
-- price_transactions, building_ledgers 와는 별도. cron 동기화 후 신규 단지 발견 시 geocode.

CREATE TABLE IF NOT EXISTS complexes (
  complex_key TEXT PRIMARY KEY,
  complex_name TEXT NOT NULL,

  -- 위치
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  road_address TEXT,
  jibun_address TEXT,
  sigungu_cd CHAR(5),
  bjdong_cd VARCHAR(10),

  -- 단지 메타 (건축물대장에서 채움)
  pnu VARCHAR(19),                    -- 고유지번번호 (building_ledgers 연결)
  hhld_cnt INTEGER,                   -- 세대수
  build_year INTEGER,                 -- 사용승인연도
  grnd_flr_cnt INTEGER,               -- 지상층수
  bld_nm TEXT,                        -- 건물명
  property_type VARCHAR(20),          -- 'apt' | 'officetel' | ...

  -- geocoding 출처/타임스탬프
  geocode_source VARCHAR(20),         -- 'building_ledger' | 'vworld' | 'manual' | NULL
  geocoded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_complexes_geo ON complexes(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_complexes_name ON complexes(complex_name);
CREATE INDEX IF NOT EXISTS idx_complexes_lawd ON complexes(sigungu_cd);

-- RLS: 누구나 조회
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view complexes" ON complexes
  FOR SELECT TO public
  USING (true);

-- INSERT/UPDATE는 service_role만 (cron + 백필 스크립트)

-- complex_aggregates 뷰에 좌표 join 편의용 뷰 (선택)
CREATE OR REPLACE VIEW complex_aggregates_with_geo AS
SELECT
  ca.*,
  c.lat,
  c.lng,
  c.hhld_cnt,
  c.build_year,
  c.road_address
FROM complex_aggregates ca
LEFT JOIN complexes c USING (complex_key);

-- 검증
-- SELECT COUNT(*) FROM complexes;
-- SELECT complex_key, complex_name, lat, lng, hhld_cnt, build_year FROM complexes WHERE lat IS NOT NULL LIMIT 10;
