import type { Stay } from '@/types/stay';

export type HostQuoteStay = Pick<Stay, 'owner_type' | 'deal_type' | 'status' | 'weekly_fee_won' | 'daily_fee_won' | 'monthly_fee_won' | 'maintenance_fee_won' | 'maintenance_included' | 'utilities_included' | 'deposit_won' | 'min_stay_days' | 'max_stay_days' | 'available_from' | 'available_to'>;

export type HostQuote = { ok: false; error: string } | {
  ok: true; days: number; rentWon: number; maintenanceWon: number;
  depositWon: number | null; totalWon: number; pricingNote: string;
};

export function koreaToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** UTC calendar arithmetic: departure is exclusive; reject dates JS would normalize. */
function dateValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

export function calculateHostQuote(stay: HostQuoteStay, checkIn: string, checkOut: string, today = koreaToday()): HostQuote {
  const fail = (error: string): HostQuote => ({ ok: false, error });
  if (stay.owner_type !== 'owner' || stay.deal_type !== 'short_term') return fail('호스트 직접 단기임대 매물에서 이용할 수 있습니다.');
  if (!['available', 'inquiring', 'leaving'].includes(stay.status)) return fail('현재 선택 기간의 문의를 받을 수 없는 매물입니다.');
  const start = dateValue(checkIn), end = dateValue(checkOut), now = dateValue(today);
  if (start == null || end == null || now == null) return fail('올바른 입주일과 퇴실일을 선택해 주세요.');
  if (start < now) return fail('입주일은 오늘 이후로 선택해 주세요.');
  const days = (end - start) / 86400000;
  if (days <= 0) return fail('퇴실일은 입주일보다 늦어야 합니다.');
  if (days > 3650) return fail('최대 3650일까지 선택할 수 있습니다.');
  if (stay.min_stay_days != null && days < stay.min_stay_days) return fail(`최소 ${stay.min_stay_days}일 이상 선택해 주세요.`);
  if (stay.max_stay_days != null && days > stay.max_stay_days) return fail(`최대 ${stay.max_stay_days}일까지 선택할 수 있습니다.`);
  const from = stay.available_from == null ? null : dateValue(stay.available_from);
  const to = stay.available_to == null ? null : dateValue(stay.available_to);
  if ((stay.available_from != null && from == null) || (stay.available_to != null && to == null)) return fail('호스트의 임대 가능 날짜 확인이 필요합니다.');
  if ((from != null && start < from) || (to != null && end > to)) return fail('호스트가 설정한 임대 가능 기간 안에서 선택해 주세요.');
  const weekly = stay.weekly_fee_won;
  if (weekly == null || !Number.isSafeInteger(weekly) || weekly <= 0) return fail('주 임대료가 아직 등록되지 않았습니다. 호스트에게 요금을 문의해 주세요.');
  if (stay.daily_fee_won != null && (!Number.isSafeInteger(stay.daily_fee_won) || stay.daily_fee_won < 0)) return fail('추가 일 임대료 확인이 필요합니다.');
  if (stay.deposit_won != null && (!Number.isSafeInteger(stay.deposit_won) || stay.deposit_won < 0)) return fail('보증금 확인이 필요합니다.');
  if (!stay.maintenance_included && (stay.maintenance_fee_won == null || !Number.isSafeInteger(stay.maintenance_fee_won) || stay.maintenance_fee_won < 0)) return fail('관리비가 확정되지 않아 예상 금액을 계산할 수 없습니다. 호스트에게 문의해 주세요.');
  const rentWon = Math.round(Math.floor(days / 7) * weekly + (days % 7) * (stay.daily_fee_won ?? weekly / 7));
  const maintenanceWon = stay.maintenance_included ? 0 : Math.round(stay.maintenance_fee_won! * days / 30);
  const totalWon = rentWon + maintenanceWon;
  if (!Number.isSafeInteger(totalWon)) return fail('선택 기간의 금액을 계산할 수 없습니다.');
  return { ok: true, days, rentWon, maintenanceWon, depositWon: stay.deposit_won, totalWon,
    pricingNote: `7일 단위 주 임대료 + 남은 일수 ${stay.daily_fee_won == null ? '주 임대료의 1/7' : '추가 일 임대료'}. ${stay.maintenance_included ? '관리비 포함.' : '관리비는 월 금액을 30일 기준으로 일할 계산.'} 보증금은 별도이며 ${stay.utilities_included ? '공과금은 포함됩니다.' : '공과금은 별도 확인이 필요합니다.'} 실제 조건은 호스트 확인 후 확정됩니다.` };
}
