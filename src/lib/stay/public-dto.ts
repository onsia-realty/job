import type { Stay } from '@/types/stay';

// Only reviewed advertising fields cross the public API boundary. Owner contact,
// unit detail, user identifiers and internal lead/provenance fields stay private.
export const PUBLIC_STAY_FIELDS = [
  'id', 'stay_type', 'deal_type', 'title', 'description',
  'address', 'jibun_address', 'region', 'sigungu', 'lawd_cd', 'lat', 'lng',
  'building_name', 'main_purps_cd_nm', 'use_apr_day', 'total_floors',
  'elevator_cnt', 'parking_total', 'building_verified', 'floor',
  'exclusive_area', 'supply_area', 'rooms', 'baths', 'room_structure', 'max_guests',
  'deposit_won', 'daily_fee_won', 'weekly_fee_won', 'monthly_fee_won',
  'maintenance_fee_won', 'maintenance_included', 'utilities_included',
  'min_stay_days', 'max_stay_days', 'available_from', 'available_to',
  'amenities', 'appliances', 'parking_available', 'pets_allowed', 'smoking_allowed',
  'thumbnail', 'images', 'owner_type', 'views', 'is_active', 'is_approved',
  'created_at', 'updated_at', 'status', 'is_exclusive',
  // Registration belongs only in the detail broker block, never list responses.
  'agent_office_name', 'agent_office_address',
  'agent_representative',
] as const satisfies readonly (keyof Stay)[];

export type PublicStay = Pick<Stay, (typeof PUBLIC_STAY_FIELDS)[number]>;
export const PUBLIC_STAY_SELECT = PUBLIC_STAY_FIELDS.join(',');
export const PUBLIC_STAY_DETAIL_SELECT = `${PUBLIC_STAY_SELECT},agent_reg_no`;
export type PublicStayDetail = PublicStay & Partial<Pick<Stay, 'agent_reg_no' | 'agent_phone'>>;

export function toPublicStay(row: unknown): PublicStay {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new TypeError('Invalid stay row');
  const record = row as Record<string, unknown>;
  return Object.fromEntries(PUBLIC_STAY_FIELDS.map((field) => [
    field,
    // Direct-owner rows must not expose a stale broker snapshot.
    field.startsWith('agent_') && record.owner_type !== 'agent' ? null : record[field],
  ])) as PublicStay;
}

export function toPublicStayDetail(row: unknown, officePhone: string | null = null): PublicStayDetail {
  const stay = toPublicStay(row);
  return stay.owner_type === 'agent'
    ? { ...stay, agent_reg_no: (row as Stay).agent_reg_no, agent_phone: officePhone }
    : stay;
}
