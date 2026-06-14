-- 029: 시군구 코드 갱신 — 화성 4개 구 신설 + 부천 구 코드 복원
-- 배경: 시군구 행정구 변경 시 국토부 실거래가가 새 코드로 재배치되는데,
--       region_codes가 옛 코드만 가지면 해당 지역 전체가 0건 조회되어 단지 누락.
--       (49개 is_mvp 지역 라이브 감사 결과 stale은 화성·부천 2곳)
--
-- [화성] 인구 105만 돌파 → 만세·효행·병점·동탄구 4개 일반구 신설(행안부 2025-08-22, 시행 2026-02-01).
--   41591 만세구 (향남·남양·우정·서신·마도·송산·팔탄·장안·양감, 새솔동) — 서부
--   41593 효행구 (봉담·비봉·매송·정남, 기안동) — 중부
--   41595 병점구 (병점1·2·진안·반월·화산동) — 동부
--   41597 동탄구 (동탄1~9) — 동탄신도시
-- [부천] 실거래가는 옛 행정구 코드(원미·소사·오정) 기준으로 제공됨. 41190 단일코드는 0건.
--   41192 원미구 / 41194 소사구 / 41196 오정구
-- (코드↔지역 매핑은 모두 실거래가 라이브 프로브로 확인)

-- 1) 화성 4개 구 추가 (is_mvp=true → daily 실거래가 cron 동기화 대상)
INSERT INTO region_codes (lawd_cd, sido, sigungu, full_name, lat, lng, is_mvp)
VALUES
  ('41591', '경기도', '화성시 만세구', '경기도 화성시 만세구', 37.1389, 126.8700, true),
  ('41593', '경기도', '화성시 효행구', '경기도 화성시 효행구', 37.2080, 126.9500, true),
  ('41595', '경기도', '화성시 병점구', '경기도 화성시 병점구', 37.2010, 127.0500, true),
  ('41597', '경기도', '화성시 동탄구', '경기도 화성시 동탄구', 37.2000, 127.0950, true)
ON CONFLICT (lawd_cd) DO UPDATE
  SET sigungu = EXCLUDED.sigungu,
      full_name = EXCLUDED.full_name,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      is_mvp = true;

-- 2) 부천 3개 구 추가 (실거래가가 구 코드 기준으로 제공됨)
INSERT INTO region_codes (lawd_cd, sido, sigungu, full_name, lat, lng, is_mvp)
VALUES
  ('41192', '경기도', '부천시 원미구', '경기도 부천시 원미구', 37.5035, 126.7660, true),
  ('41194', '경기도', '부천시 소사구', '경기도 부천시 소사구', 37.4836, 126.7950, true),
  ('41196', '경기도', '부천시 오정구', '경기도 부천시 오정구', 37.5350, 126.7990, true)
ON CONFLICT (lawd_cd) DO UPDATE
  SET sigungu = EXCLUDED.sigungu,
      full_name = EXCLUDED.full_name,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      is_mvp = true;

-- 3) 옛 단일코드 비활성 — 실거래가 0건 (cron 낭비 방지)
UPDATE region_codes SET is_mvp = false WHERE lawd_cd IN ('41590', '41190');

-- 검증
-- SELECT lawd_cd, sigungu, is_mvp FROM region_codes WHERE lawd_cd LIKE '4159%' OR lawd_cd LIKE '4119%' ORDER BY lawd_cd;
