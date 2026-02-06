-- 009: 이력서에 DNA 분석 결과 필드 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. DNA 유형 필드 추가
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS dna_type VARCHAR(10)
  CHECK (dna_type IN ('RS', 'RL', 'SL', 'LA', 'RF'));

-- 2. DNA 점수 필드 추가 (JSONB)
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS dna_scores JSONB;

-- 3. DNA 답변 상세 필드 추가 (JSONB) - 자기소개 생성용
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS dna_answer_details JSONB;

-- 4. 인덱스 생성 (DNA 유형으로 검색할 경우를 대비)
CREATE INDEX IF NOT EXISTS idx_resumes_dna_type ON resumes(dna_type);

-- 설명:
-- dna_type: 부동산 DNA 유형
--   - RS: 야수형 영업왕 (Risk + Social)
--   - RL: 승부사형 전략가 (Risk + Logic)
--   - SL: 카운셀러형 전문가 (Social + Logic)
--   - LA: 스마트 관리형 (Logic + low Social)
--   - RF: 자유영혼형 크리에이터 (Risk + Resilience)

-- dna_scores: 4가지 측정 변수 점수
--   - risk: 리스크 감수성 (공격성)
--   - social: 사교성
--   - logic: 분석력
--   - resilience: 회복탄력성

-- dna_answer_details: 퀴즈 답변 상세 (자기소개 AI 생성용)
--   - category: 질문 카테고리
--   - categoryKey: 카테고리 키
--   - selectedText: 선택한 답변 텍스트
--   - selectedLabel: 선택한 답변 라벨
