import { z } from 'zod';
import { STAY_TYPES, type StayType } from '@/lib/stay/constants';
import type { Stay } from '@/types/stay';

const MAX_WON = 2_000_000_000;

export const OWNER_LEAD_DETAIL_VERSION = 2;
export const PUBLICATION_CONSENT_VERSION = 1;

export const ownerLeadCreateSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요').max(50),
  phone: z.string().trim().min(7, '연락처를 확인해주세요').max(20, '연락처를 확인해주세요'),
  address: z.string().trim().min(1, '주소를 입력해주세요').max(500),
  detail_address: z.string().trim().max(200).nullish(),
  building_name: z.string().trim().max(200).optional(),
  unit_count: z.number().int().min(1).max(10_000).optional(),
  memo: z.string().trim().max(2_000).optional(),
  source_code: z.string().trim().max(30).optional(),
  stay_type: z.enum(STAY_TYPES).nullish(),
  desired_deposit_won: z.number().int().min(0).max(MAX_WON).nullish(),
  desired_weekly_fee_won: z.number().int().min(0).max(MAX_WON).nullish(),
  privacy_agreed: z.literal(true, { message: '개인정보 수집·이용 동의가 필요합니다' }),
  publication_agreed: z.literal(true, { message: '매물 작성·게시 위임 동의가 필요합니다' }),
  marketing_agreed: z.boolean().optional().default(false),
});

export const ownerLeadConfirmSchema = z.object({
  id: z.number().int().positive(),
  action: z.literal('confirm'),
  stay_updated_at: z.string().datetime({ offset: true }),
});

export const adminOwnerLeadDraftSchema = z.object({
  lead_id: z.number().int().positive(),
  stay: z.unknown(),
});

export type OwnerLeadStatus = 'new' | 'contacted' | 'converted' | 'dropped';

export interface OwnerLeadDetailV2 {
  stay_type: StayType | null;
  desired_deposit_won: number | null;
  desired_weekly_fee_won: number | null;
  detail_address: string | null;
}

type OwnerLeadDraftPrivateField = 'user_id' | 'source' | 'lead_id' | 'views'
  | 'agent_office_name' | 'agent_office_address' | 'agent_phone' | 'agent_reg_no'
  | 'agent_representative' | 'broker_office_id' | 'agent_snapshot_at';

/** Exact host-visible draft: every editable/publication field, without provenance/audit identifiers. */
export type OwnerLeadDraftPreview = Omit<Stay, OwnerLeadDraftPrivateField>;

export interface OwnerLeadConfirmation {
  confirmed_at: string;
  stay_updated_at: string;
  is_current: boolean;
}

export interface OwnerLeadMine {
  id: number;
  status: OwnerLeadStatus;
  name: string;
  phone: string;
  address: string;
  detail_address: string | null;
  building_name: string | null;
  unit_count: number | null;
  memo: string | null;
  privacy_agreed: true;
  publication_agreed: true;
  marketing_agreed: boolean;
  source_code: string | null;
  converted_stay_id: string | null;
  stay_type: StayType | null;
  desired_deposit_won: number | null;
  desired_weekly_fee_won: number | null;
  draft: OwnerLeadDraftPreview | null;
  confirmation: OwnerLeadConfirmation | null;
  latest_review: { note: string | null; created_at: string } | null;
  created_at: string;
  updated_at: string;
}

export const OWNER_LEAD_DRAFT_SELECT = [
  'id', 'stay_type', 'deal_type', 'title', 'description',
  'address', 'jibun_address', 'detail_address', 'region', 'sigungu', 'lawd_cd', 'bcode', 'pnu',
  'lat', 'lng', 'geocode_source', 'mgm_bldrgst_pk', 'building_name', 'main_purps_cd_nm',
  'use_apr_day', 'total_floors', 'elevator_cnt', 'parking_total', 'building_verified',
  'floor', 'exclusive_area', 'supply_area', 'rooms', 'baths', 'room_structure', 'max_guests',
  'deposit_won', 'daily_fee_won', 'weekly_fee_won', 'monthly_fee_won',
  'maintenance_fee_won', 'maintenance_included', 'utilities_included',
  'min_stay_days', 'max_stay_days', 'available_from', 'available_to',
  'amenities', 'appliances', 'parking_available', 'pets_allowed', 'smoking_allowed',
  'thumbnail', 'images', 'contact_name', 'phone', 'kakao_url', 'contact_hours',
  'owner_type', 'status', 'is_exclusive', 'is_active', 'is_approved', 'created_at', 'updated_at',
].join(', ');

export function isWorkflowMigrationMissing(error: unknown): boolean {
  const value = error as { code?: string; message?: string } | null;
  return value?.code === 'PGRST202'
    || value?.code === 'PGRST204'
    || value?.code === '42703'
    || value?.code === '42P01'
    || /schema cache|does not exist|could not find/i.test(value?.message ?? '');
}

export function workflowUnavailable() {
  return { error: '집주인 등록 절차를 준비 중입니다', code: 'MIGRATION_REQUIRED' as const };
}

export function ownerLeadDetail(detail: unknown): OwnerLeadDetailV2 | null {
  if (!detail || typeof detail !== 'object') return null;
  const parsed = z.object({
    stay_type: z.enum(STAY_TYPES).nullish().transform((value) => value ?? null),
    desired_deposit_won: z.number().int().min(0).nullish().transform((value) => value ?? null),
    desired_weekly_fee_won: z.number().int().min(0).nullish().transform((value) => value ?? null),
    detail_address: z.string().max(200).nullish().transform((value) => value ?? null),
  }).safeParse(detail);
  return parsed.success ? parsed.data : null;
}
