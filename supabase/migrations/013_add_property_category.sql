-- 공인중개사 구인공고: 주거용/상업용 대분류 컬럼 추가
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS property_category VARCHAR(20)
  CHECK (property_category IN ('residential', 'commercial'));

-- 기존 공인중개사 공고에 대해 type 기반으로 대분류 자동 채움
UPDATE jobs
SET property_category = 'residential'
WHERE category = 'agent' AND property_category IS NULL
  AND type IN ('apartment', 'officetel', 'villa');

UPDATE jobs
SET property_category = 'commercial'
WHERE category = 'agent' AND property_category IS NULL
  AND type IN ('store', 'office', 'building', 'auction', 'commercial');
