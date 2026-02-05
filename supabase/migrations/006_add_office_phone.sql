-- 회사 전화번호 컬럼 추가 (지역번호 포함, 마스킹 없이 노출)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS office_phone VARCHAR(20);
