-- AI 사용량 원자적 증가 RPC (race condition 방지)
--
-- 문제: 기존 checkRateLimit은 SELECT count → 계산 → UPSERT(count+1) 2-step이라
--       동시 요청이 같은 count를 읽고 각각 +1 하면 한 번만 증가 → 일일 5회 초과 사용 가능.
-- 해결: INSERT ... ON CONFLICT DO UPDATE ... WHERE 로 단일 원자 쿼리 처리.
--       동시 요청은 같은 (user_id, used_date) 행 잠금에 직렬화되어 정확히 1씩 증가.
--
-- 반환값:
--   - 증가 후 count (정수) → 허용됨. remaining = limit - count
--   - NULL → 이미 한도 도달(>= limit). 증가 안 함(차단)

CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id uuid,
  p_date date,
  p_limit integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO ai_usage (user_id, used_date, count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, used_date)
  DO UPDATE SET count = ai_usage.count + 1
    WHERE ai_usage.count < p_limit
  RETURNING count INTO new_count;

  -- 충돌 시 WHERE(count < limit)가 false면 UPDATE가 스킵되어 RETURNING이 없음 → NULL
  -- (이 경우 차단. 신규 행 INSERT 경로는 항상 count=1 반환)
  RETURN new_count;
END;
$$;
