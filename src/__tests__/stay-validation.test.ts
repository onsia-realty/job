import { describe, it, expect } from 'vitest';
import { stayCreateSchema, stayUpdateSchema, STAY_FIELD_MESSAGES } from '@/lib/validations/stay';
import { STAY_IMAGES_MAX } from '@/lib/stay/constants';

// DB 를 호출하지 않는 순수 Zod 유닛 테스트 (035 미적용 상태 전제)

const validInput = () => ({
  stay_type: 'officetel' as const,
  deal_type: 'short_term' as const,
  title: '역세권 풀옵션 오피스텔 단기임대',
  daily_fee_won: 50000,
});

// 라우트가 400 메시지를 만드는 방식과 동일 (api/stays/route.ts)
function messageFor(result: { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } }) {
  const issue = result.error.issues[0];
  const field = String(issue?.path?.[0] ?? '');
  return STAY_FIELD_MESSAGES[field] || issue?.message || '입력 내용을 확인해주세요';
}

describe('stayCreateSchema - 필수 필드', () => {
  it('정상 입력은 통과한다', () => {
    const r = stayCreateSchema.safeParse(validInput());
    expect(r.success).toBe(true);
  });

  it('title 누락 → 실패, 한글 메시지', () => {
    const { title: _t, ...rest } = validInput();
    const r = stayCreateSchema.safeParse(rest);
    expect(r.success).toBe(false);
    if (!r.success) expect(messageFor(r)).toBe('제목을 입력해주세요');
  });

  it('stay_type 누락 → 실패, 한글 메시지', () => {
    const { stay_type: _s, ...rest } = validInput();
    const r = stayCreateSchema.safeParse(rest);
    expect(r.success).toBe(false);
    if (!r.success) expect(messageFor(r)).toContain('숙소 유형');
  });

  it('deal_type 누락 → 실패, 한글 메시지', () => {
    const { deal_type: _d, ...rest } = validInput();
    const r = stayCreateSchema.safeParse(rest);
    expect(r.success).toBe(false);
    if (!r.success) expect(messageFor(r)).toContain('거래 유형');
  });

  it('빈 제목 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), title: '   ' });
    expect(r.success).toBe(false);
  });
});

describe('stayCreateSchema - 요금 CHECK (035:108 재현)', () => {
  it('요금 3종 전부 없음 → 실패', () => {
    const { daily_fee_won: _d, ...rest } = validInput();
    const r = stayCreateSchema.safeParse(rest);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(messageFor(r)).toBe('일 요금 / 주 요금 / 월 요금 중 최소 하나는 입력해야 합니다');
    }
  });

  it('요금 3종 전부 null → 실패', () => {
    const r = stayCreateSchema.safeParse({
      ...validInput(),
      daily_fee_won: null,
      weekly_fee_won: null,
      monthly_fee_won: null,
    });
    expect(r.success).toBe(false);
  });

  it('weekly_fee_won 만 있어도 통과', () => {
    const { daily_fee_won: _d, ...rest } = validInput();
    const r = stayCreateSchema.safeParse({ ...rest, weekly_fee_won: 300000 });
    expect(r.success).toBe(true);
  });

  it('monthly_fee_won 만 있어도 통과', () => {
    const { daily_fee_won: _d, ...rest } = validInput();
    const r = stayCreateSchema.safeParse({ ...rest, monthly_fee_won: 900000 });
    expect(r.success).toBe(true);
  });

  it('음수 금액 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), daily_fee_won: -1 });
    expect(r.success).toBe(false);
  });

  it('소수 금액(원 단위 아님) → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), daily_fee_won: 50000.5 });
    expect(r.success).toBe(false);
  });
});

describe('stayCreateSchema - 화이트리스트 strip (passthrough 금지)', () => {
  it('서버 통제 컬럼이 파싱 결과에서 제거된다', () => {
    const r = stayCreateSchema.safeParse({
      ...validInput(),
      is_approved: true,
      user_id: '00000000-0000-0000-0000-000000000000',
      views: 99999,
      is_active: false,
      source: 'owner_lead',
      lead_id: 1,
      id: 'attacker-supplied-id',
      created_at: '2000-01-01T00:00:00Z',
      updated_at: '2000-01-01T00:00:00Z',
    });

    expect(r.success).toBe(true);
    if (!r.success) return;

    const keys = Object.keys(r.data);
    for (const forbidden of [
      'is_approved',
      'user_id',
      'views',
      'is_active',
      'source',
      'lead_id',
      'id',
      'created_at',
      'updated_at',
    ]) {
      expect(keys).not.toContain(forbidden);
    }
    expect(r.data).not.toHaveProperty('is_approved');
    expect(r.data).not.toHaveProperty('user_id');
  });

  it('스키마에 없는 임의 컬럼도 제거된다', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), tier: 'premium', evil: 'x' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty('tier');
      expect(r.data).not.toHaveProperty('evil');
    }
  });

  it('038 agent_* 스냅샷 컬럼은 클라이언트가 보내도 제거된다', () => {
    const r = stayCreateSchema.safeParse({
      ...validInput(),
      agent_office_name: 'x',
      agent_office_address: 'x',
      agent_phone: '02-000-0000',
      agent_reg_no: '11710-2022-00250',
      agent_representative: 'x',
      broker_office_id: '00000000-0000-0000-0000-000000000000',
      agent_snapshot_at: '2026-09-01T00:00:00Z',
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    for (const forbidden of [
      'agent_office_name',
      'agent_office_address',
      'agent_phone',
      'agent_reg_no',
      'agent_representative',
      'broker_office_id',
      'agent_snapshot_at',
    ]) {
      expect(r.data).not.toHaveProperty(forbidden);
    }
  });

  it('PATCH 스키마도 서버 통제 컬럼을 제거한다 (is_active 는 소유자 허용)', () => {
    const r = stayUpdateSchema.safeParse({
      title: '수정된 제목',
      is_active: false,
      is_approved: true,
      user_id: '00000000-0000-0000-0000-000000000000',
      views: 12345,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty('is_approved');
      expect(r.data).not.toHaveProperty('user_id');
      expect(r.data).not.toHaveProperty('views');
      expect(r.data.is_active).toBe(false);
    }
  });
});

describe('stayCreateSchema - enum 위반', () => {
  it('stay_type 위반값 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), stay_type: 'hotel' });
    expect(r.success).toBe(false);
    if (!r.success) expect(messageFor(r)).toContain('숙소 유형');
  });

  it('deal_type 위반값 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), deal_type: 'jeonse' });
    expect(r.success).toBe(false);
  });

  it('owner_type 위반값 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), owner_type: 'admin' });
    expect(r.success).toBe(false);
  });

  it('amenities 화이트리스트 밖 값 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), amenities: ['wifi', 'jacuzzi_gold'] });
    expect(r.success).toBe(false);
  });

  it('amenities 정상값 → 통과', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), amenities: ['wifi', 'aircon'] });
    expect(r.success).toBe(true);
  });
});

describe('stayCreateSchema - 038 status / is_exclusive', () => {
  it("status:'available' → 통과, 값이 보존된다", () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), status: 'available', is_exclusive: true });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.status).toBe('available');
      expect(r.data.is_exclusive).toBe(true);
    }
  });

  it("status:'reserved' (CHECK 밖 값) → 실패, 한글 메시지", () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), status: 'reserved' });
    expect(r.success).toBe(false);
    if (!r.success) expect(messageFor(r)).toContain('임대 진행 상태');
  });

  it('is_exclusive 에 문자열 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), is_exclusive: 'yes' });
    expect(r.success).toBe(false);
  });

  it('PATCH 스키마도 status / is_exclusive 를 받는다', () => {
    const r = stayUpdateSchema.safeParse({ status: 'leaving', is_exclusive: false });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.status).toBe('leaving');
      expect(r.data.is_exclusive).toBe(false);
    }
  });
});

describe('stayCreateSchema - 배열/범위 상한', () => {
  it(`images ${STAY_IMAGES_MAX + 1}장 → 실패`, () => {
    const images = Array.from({ length: STAY_IMAGES_MAX + 1 }, (_, i) => `https://cdn/${i}.jpg`);
    const r = stayCreateSchema.safeParse({ ...validInput(), images });
    expect(r.success).toBe(false);
    if (!r.success) expect(messageFor(r)).toContain(`최대 ${STAY_IMAGES_MAX}장`);
  });

  it(`images ${STAY_IMAGES_MAX}장 → 통과`, () => {
    const images = Array.from({ length: STAY_IMAGES_MAX }, (_, i) => `https://cdn/${i}.jpg`);
    const r = stayCreateSchema.safeParse({ ...validInput(), images });
    expect(r.success).toBe(true);
  });

  it('min_stay_days > max_stay_days → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), min_stay_days: 30, max_stay_days: 7 });
    expect(r.success).toBe(false);
  });

  it('available_from > available_to → 실패', () => {
    const r = stayCreateSchema.safeParse({
      ...validInput(),
      available_from: '2026-12-01',
      available_to: '2026-11-01',
    });
    expect(r.success).toBe(false);
  });

  it('날짜 형식 위반 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), available_from: '2026/12/01' });
    expect(r.success).toBe(false);
    if (!r.success) expect(messageFor(r)).toContain('YYYY-MM-DD');
  });

  it('lawd_cd 5자리 아님 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), lawd_cd: '1234' });
    expect(r.success).toBe(false);
  });

  it('exclusive_area 음수 → 실패', () => {
    const r = stayCreateSchema.safeParse({ ...validInput(), exclusive_area: -1 });
    expect(r.success).toBe(false);
  });
});

describe('stayUpdateSchema - 부분 수정', () => {
  it('제목만 보내도 통과', () => {
    const r = stayUpdateSchema.safeParse({ title: '새 제목' });
    expect(r.success).toBe(true);
  });

  it('요금 컬럼 하나만 null 로 보내는 것은 통과 (DB CHECK 가 최종 방어)', () => {
    const r = stayUpdateSchema.safeParse({ daily_fee_won: null });
    expect(r.success).toBe(true);
  });

  it('요금 3종을 모두 보내면서 전부 null → 실패', () => {
    const r = stayUpdateSchema.safeParse({
      daily_fee_won: null,
      weekly_fee_won: null,
      monthly_fee_won: null,
    });
    expect(r.success).toBe(false);
  });
});
