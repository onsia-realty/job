'use client';

// 단기임대(/stay) 매물 등록 폼.
//
// ⚠️ 요금 정책: 이 서비스는 월 임대료 + 보증금 상품만 취급한다.
//    일 단가·주 단가 입력란을 만들지 않고, 월 임대료(monthly_fee_won)를 필수로 받아
//    서버 스키마의 "요금 3종 중 1개 이상" 제약을 충족한다.
//    '숙박/예약/체크인/1박' 어휘를 쓰지 않는다 (부동산 임대차 어휘: 월 임대료, 입주, 계약).
//
// ⚠️ 금액은 전부 만원 단위로 입력받아 manwonToWon 으로 원 단위 정수로 바꿔 보낸다 (_won 접미사).
// ⚠️ agent_* 법정표기 5항목은 서버(lib/stay/agent-snapshot.ts)가 채운다. 폼은 owner_type / is_exclusive 만 보낸다.
// ⚠️ 인증 게이트는 클라이언트 useAuth() 만 쓴다. 미로그인 → 로그인 유도, 사업자 미인증 → 승인 대기 배너.
// ⚠️ alert() 금지 — 필드 하단 인라인 에러 + 제출 성공 시 완료 화면 (OwnerLeadForm 패턴).

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  DoorOpen,
  FileText,
  Flag,
  Images,
  Info,
  ListChecks,
  Loader2,
  LockKeyhole,
  MapPin,
  Phone,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AddressSearch, { type AddressSearchMeta } from '@/components/shared/AddressSearch';
import FormSection from '@/components/shared/FormSection';
import StayImageUploader from '@/components/stay/StayImageUploader';
import StayAgentFields from '@/components/stay/StayAgentFields';
import {
  STAY_DEAL_TYPES,
  STAY_DEAL_TYPE_LABELS,
  STAY_TYPE_LABELS,
  STAY_ROOM_STRUCTURES,
  STAY_ROOM_STRUCTURE_LABELS,
  STAY_AMENITIES,
  STAY_AMENITY_LABELS,
  STAY_APPLIANCES,
  STAY_APPLIANCE_LABELS,
  STAY_STATUSES,
  STAY_STATUS_LABELS,
  STAY_GEOCODE_SOURCES,
  type StayDealType,
  type StayType,
  type StayRoomStructure,
  type StayAmenity,
  type StayAppliance,
  type StayStatus,
  type StayOwnerType,
  type StayGeocodeSource,
} from '@/lib/stay/constants';
import {
  SELECTABLE_STAY_TYPES,
  PHONE_PATTERN,
  formatPhone,
  manwonToWon,
  toNumberOrNull,
} from '@/lib/stay/form-utils';
import type { Stay, StayCreateInput, StayAgentSnapshot } from '@/types/stay';

// ---------- 상수 ----------

const LOOKUP_ENDPOINT = '/api/stays/lookup-building';
const CREATE_ENDPOINT = '/api/stays';
const LOGIN_PATH = '/agent/auth/login?redirect=/stay/new';

const inputBase =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500';
const labelBase = 'block text-sm font-medium text-slate-700 mb-1';
const errorText = 'mt-1 text-xs text-red-600';
const checkboxBase =
  'mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500';

type SelectableStayType = Exclude<StayType, 'living_facility'>;

/** lookup-building 응답 (route.ts 의 반환 형태와 1:1) */
interface LookupBuildingResponse {
  lat: number | null;
  lng: number | null;
  geocode_source: string | null;
  lawd_cd: string | null;
  bcode: string | null;
  pnu: string | null;
  building: {
    mgm_bldrgst_pk: string | null;
    building_name: string | null;
    main_purps_cd_nm: string | null;
    use_apr_day: string | null;
    total_floors: number | null;
    elevator_cnt: number | null;
    parking_total: number | null;
  } | null;
  source: 'cache' | 'api' | 'none';
  warnings: string[];
}

/** 서버 warnings 코드 → 사용자 문구. 모르는 코드는 일반 문구로. */
function describeWarning(code: string): string {
  if (code.startsWith('geocode')) return '주소의 좌표를 찾지 못했습니다. 지도 표시 없이 등록됩니다.';
  if (code === 'pnu_unavailable') return '지번 정보가 없어 건축물대장을 조회하지 못했습니다. 건물 정보를 직접 입력해 주세요.';
  if (code.startsWith('ledger_not_found')) return '해당 필지의 건축물대장을 찾지 못했습니다. 건물 정보를 직접 입력해 주세요.';
  if (code.startsWith('ledger_error') || code.startsWith('cache_error')) return '건축물대장 조회 중 오류가 있었습니다. 건물 정보를 직접 입력해 주세요.';
  if (code === 'DATA_GO_KR_API_KEY_missing') return '건축물대장 조회가 설정되어 있지 않습니다. 건물 정보를 직접 입력해 주세요.';
  if (code.startsWith('cache_upsert_failed')) return '';
  return '일부 자동 입력에 실패했습니다. 필요한 값은 직접 입력해 주세요.';
}

function toIntOrNull(input: string): number | null {
  const n = toNumberOrNull(input);
  if (n == null) return null;
  return Number.isInteger(n) ? n : Math.round(n);
}

function toGeocodeSource(raw: string | null): StayGeocodeSource | null {
  if (!raw) return null;
  return (STAY_GEOCODE_SOURCES as readonly string[]).includes(raw) ? (raw as StayGeocodeSource) : null;
}

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
}

// ---------- 컴포넌트 ----------

export default function StayCreateForm() {
  const { user, session, isLoading: authLoading } = useAuth();

  // 1. 거래유형
  const [dealType, setDealType] = useState<StayDealType>('short_term');
  const [stayType, setStayType] = useState<SelectableStayType | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // 2. 위치
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [jibunAddress, setJibunAddress] = useState('');
  const [region, setRegion] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [bcode, setBcode] = useState('');
  const [lawdCd, setLawdCd] = useState<string | null>(null);
  const [pnu, setPnu] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geocodeSource, setGeocodeSource] = useState<StayGeocodeSource | null>(null);
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'done' | 'failed'>('idle');
  const [lookupWarnings, setLookupWarnings] = useState<string[]>([]);

  // 3. 건물정보
  const [mgmBldrgstPk, setMgmBldrgstPk] = useState<string | null>(null);
  const [buildingName, setBuildingName] = useState('');
  const [mainPurps, setMainPurps] = useState('');
  const [useAprDay, setUseAprDay] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [elevatorCnt, setElevatorCnt] = useState('');
  const [parkingTotal, setParkingTotal] = useState('');
  const [buildingVerified, setBuildingVerified] = useState(false);

  // 4. 호실
  const [floor, setFloor] = useState('');
  const [exclusiveArea, setExclusiveArea] = useState('');
  const [supplyArea, setSupplyArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [baths, setBaths] = useState('');
  const [roomStructure, setRoomStructure] = useState<StayRoomStructure | ''>('');

  // 5. 임대조건 (만원 단위 입력)
  const [depositManwon, setDepositManwon] = useState('');
  const [monthlyManwon, setMonthlyManwon] = useState('');
  const [maintenanceManwon, setMaintenanceManwon] = useState('');
  const [maintenanceIncluded, setMaintenanceIncluded] = useState(false);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [minStayDays, setMinStayDays] = useState('');
  const [maxStayDays, setMaxStayDays] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');

  // 6. 옵션
  const [amenities, setAmenities] = useState<StayAmenity[]>([]);
  const [appliances, setAppliances] = useState<StayAppliance[]>([]);
  const [parkingAvailable, setParkingAvailable] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);

  // 7. 사진 — StayImageUploader 가 선택 즉시 uploadImagesInOrder 로 올리고 URL 을 돌려준다
  const [images, setImages] = useState<string[]>([]);
  const [imagesUploading, setImagesUploading] = useState(false);

  // 8. 등록주체
  const [ownerType, setOwnerType] = useState<StayOwnerType>('agent');
  const [isExclusive, setIsExclusive] = useState(false);
  const [agentSnapshot, setAgentSnapshot] = useState<StayAgentSnapshot | null>(null);

  // 9. 연락처
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [kakaoUrl, setKakaoUrl] = useState('');
  const [contactHours, setContactHours] = useState('');

  // 10. 상태
  const [status, setStatus] = useState<StayStatus>('available');

  // 제출
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<Stay | null>(null);

  // ---------- 인증 ----------
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const isVerified = meta?.brokerVerified === true || meta?.businessVerified === true;
  const accessToken = session?.access_token ?? null;

  // 회원정보 prefill (sales/jobs/new 관행) — 사용자가 이미 입력한 값은 덮지 않는다
  useEffect(() => {
    if (!user) return;
    const m = user.user_metadata as Record<string, unknown> | undefined;
    setContactName((prev) => prev || (typeof m?.name === 'string' ? m.name : ''));
    setPhone((prev) => prev || (typeof m?.phone === 'string' ? formatPhone(m.phone) : ''));
  }, [user]);

  // ---------- 주소 확정 → 좌표·건축물대장 프리필 ----------
  const lookupAbortRef = useRef<AbortController | null>(null);

  async function runLookup(nextAddress: string, m: AddressSearchMeta) {
    lookupAbortRef.current?.abort();
    const controller = new AbortController();
    lookupAbortRef.current = controller;

    setLookupState('loading');
    setLookupWarnings([]);

    try {
      const res = await fetch(LOOKUP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ address: nextAddress, jibunAddress: m.jibunAddress, bcode: m.bcode }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // 401/400/429 — 프리필은 편의 기능이라 폼은 계속 진행
        setLookupState('failed');
        setLookupWarnings([
          res.status === 429
            ? '주소 조회 요청이 많습니다. 잠시 후 다시 검색하거나 건물 정보를 직접 입력해 주세요.'
            : '주소의 좌표·건물 정보를 자동으로 불러오지 못했습니다. 직접 입력해 주세요.',
        ]);
        return;
      }

      const data = (await res.json()) as LookupBuildingResponse;

      setLat(data.lat);
      setLng(data.lng);
      setGeocodeSource(toGeocodeSource(data.geocode_source));
      setLawdCd(data.lawd_cd);
      setPnu(data.pnu);

      if (data.building) {
        const b = data.building;
        setMgmBldrgstPk(b.mgm_bldrgst_pk);
        setBuildingName((prev) => b.building_name ?? prev);
        setMainPurps(b.main_purps_cd_nm ?? '');
        setUseAprDay(b.use_apr_day ?? '');
        setTotalFloors(b.total_floors != null ? String(b.total_floors) : '');
        setElevatorCnt(b.elevator_cnt != null ? String(b.elevator_cnt) : '');
        setParkingTotal(b.parking_total != null ? String(b.parking_total) : '');
        setBuildingVerified(true);
      } else {
        setMgmBldrgstPk(null);
        setBuildingVerified(false);
      }

      setLookupWarnings(
        Array.from(new Set(data.warnings.map(describeWarning).filter(Boolean)))
      );
      setLookupState('done');
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error('[stay/new] lookup-building failed', e);
      setLookupState('failed');
      setLookupWarnings(['네트워크 오류로 주소 정보를 불러오지 못했습니다. 건물 정보를 직접 입력해 주세요.']);
    }
  }

  function handleAddressChange(nextAddress: string, m?: AddressSearchMeta) {
    setAddress(nextAddress);
    setErrors((prev) => ({ ...prev, address: '' }));

    // 이전 주소의 파생값은 전부 초기화
    setLat(null);
    setLng(null);
    setGeocodeSource(null);
    setLawdCd(null);
    setPnu(null);
    setMgmBldrgstPk(null);
    setBuildingVerified(false);

    if (!m) {
      setJibunAddress('');
      setRegion('');
      setSigungu('');
      setBcode('');
      setLookupState('idle');
      setLookupWarnings([]);
      return;
    }

    setJibunAddress(m.jibunAddress);
    setRegion(m.sido);
    setSigungu(m.sigungu);
    setBcode(m.bcode);
    if (m.buildingName) setBuildingName(m.buildingName);

    void runLookup(nextAddress, m);
  }

  useEffect(() => () => lookupAbortRef.current?.abort(), []);

  // ---------- 검증 ----------
  const agentMissing = ownerType === 'agent' && !!agentSnapshot && agentSnapshot.missing.length > 0;

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    if (!stayType) next.stay_type = '매물 유형을 선택해 주세요.';
    if (!title.trim()) next.title = '제목을 입력해 주세요.';
    else if (title.trim().length > 200) next.title = '제목은 200자 이내로 입력해 주세요.';
    if (description.length > 20000) next.description = '상세 설명이 너무 깁니다.';

    if (!address.trim()) next.address = '주소를 검색해 주세요.';
    if (detailAddress.trim().length > 200) next.detail_address = '상세주소는 200자 이내로 입력해 주세요.';

    if (useAprDay && !/^\d{8}$/.test(useAprDay)) next.use_apr_day = '사용승인일은 YYYYMMDD 8자리로 입력해 주세요.';
    const tf = toNumberOrNull(totalFloors);
    if (totalFloors && (tf == null || !Number.isInteger(tf) || tf < 0 || tf > 200)) next.total_floors = '총 층수는 0~200 사이 정수로 입력해 주세요.';
    const ec = toNumberOrNull(elevatorCnt);
    if (elevatorCnt && (ec == null || !Number.isInteger(ec) || ec < 0 || ec > 100)) next.elevator_cnt = '엘리베이터 대수는 0~100 사이 정수로 입력해 주세요.';
    const pt = toNumberOrNull(parkingTotal);
    if (parkingTotal && (pt == null || !Number.isInteger(pt) || pt < 0)) next.parking_total = '총 주차대수는 0 이상 정수로 입력해 주세요.';

    const fl = toNumberOrNull(floor);
    if (floor && (fl == null || !Number.isInteger(fl) || fl < -10 || fl > 200)) next.floor = '층은 -10~200 사이 정수로 입력해 주세요.';
    const ea = toNumberOrNull(exclusiveArea);
    if (exclusiveArea && (ea == null || ea < 0)) next.exclusive_area = '전용면적은 0 이상 숫자로 입력해 주세요.';
    const sa = toNumberOrNull(supplyArea);
    if (supplyArea && (sa == null || sa < 0)) next.supply_area = '공급면적은 0 이상 숫자로 입력해 주세요.';
    const rm = toNumberOrNull(rooms);
    if (rooms && (rm == null || !Number.isInteger(rm) || rm < 0 || rm > 100)) next.rooms = '방 개수는 0~100 사이 정수로 입력해 주세요.';
    const bt = toNumberOrNull(baths);
    if (baths && (bt == null || !Number.isInteger(bt) || bt < 0 || bt > 100)) next.baths = '욕실 개수는 0~100 사이 정수로 입력해 주세요.';

    // 월 임대료 필수 — 서버 "요금 3종 중 1개" 제약을 월 임대료로 충족
    if (!monthlyManwon.trim()) next.monthly_fee_won = '월 임대료를 입력해 주세요.';
    else if (manwonToWon(monthlyManwon) == null) next.monthly_fee_won = '월 임대료는 0 이상 숫자(만원)로 입력해 주세요.';
    if (depositManwon.trim() && manwonToWon(depositManwon) == null) next.deposit_won = '보증금은 0 이상 숫자(만원)로 입력해 주세요.';
    if (maintenanceManwon.trim() && manwonToWon(maintenanceManwon) == null) next.maintenance_fee_won = '관리비는 0 이상 숫자(만원)로 입력해 주세요.';

    const minD = toNumberOrNull(minStayDays);
    if (minStayDays && (minD == null || !Number.isInteger(minD) || minD < 1 || minD > 3650)) next.min_stay_days = '최소 계약기간은 1~3650일 사이 정수로 입력해 주세요.';
    const maxD = toNumberOrNull(maxStayDays);
    if (maxStayDays && (maxD == null || !Number.isInteger(maxD) || maxD < 1 || maxD > 3650)) next.max_stay_days = '최대 계약기간은 1~3650일 사이 정수로 입력해 주세요.';
    if (minD != null && maxD != null && minD > maxD) next.min_stay_days = '최소 계약기간은 최대 계약기간보다 클 수 없습니다.';
    if (availableFrom && availableTo && availableFrom > availableTo) next.available_from = '입주 가능일은 임대 종료일보다 늦을 수 없습니다.';

    if (imagesUploading) next.images = '사진 등록이 끝난 뒤 제출해 주세요.';

    if (agentMissing) next.owner_type = '중개사 표기 정보가 비어 있습니다. 내 정보를 먼저 채워 주세요.';

    if (!contactName.trim()) next.contact_name = '담당자 이름을 입력해 주세요.';
    else if (contactName.trim().length > 50) next.contact_name = '담당자 이름은 50자 이내로 입력해 주세요.';
    if (!phone.trim()) next.phone = '연락처를 입력해 주세요.';
    else if (!PHONE_PATTERN.test(phone)) next.phone = '010-0000-0000 형식으로 입력해 주세요.';
    if (kakaoUrl.trim().length > 1000) next.kakao_url = '카카오톡 링크가 너무 깁니다.';
    if (contactHours.trim().length > 100) next.contact_hours = '연락 가능 시간은 100자 이내로 입력해 주세요.';

    return next;
  }

  const canSubmit = useMemo(
    () =>
      !!accessToken &&
      !submitting &&
      !imagesUploading &&
      !!stayType &&
      title.trim().length > 0 &&
      address.trim().length > 0 &&
      monthlyManwon.trim().length > 0 &&
      contactName.trim().length > 0 &&
      PHONE_PATTERN.test(phone),
    [accessToken, submitting, imagesUploading, stayType, title, address, monthlyManwon, contactName, phone]
  );

  // ---------- 제출 ----------
  function buildPayload(): StayCreateInput {
    return {
      stay_type: stayType as StayType,
      deal_type: dealType,
      title: title.trim(),
      description: description.trim() || null,

      address: address.trim() || null,
      jibun_address: jibunAddress.trim() || null,
      detail_address: detailAddress.trim() || null,
      region: region.trim() || null,
      sigungu: sigungu.trim() || null,
      lawd_cd: lawdCd && /^\d{5}$/.test(lawdCd) ? lawdCd : null,
      bcode: /^\d{10}$/.test(bcode) ? bcode : null,
      pnu: pnu && /^\d{19}$/.test(pnu) ? pnu : null,
      lat,
      lng,
      geocode_source: geocodeSource,

      mgm_bldrgst_pk: mgmBldrgstPk,
      building_name: buildingName.trim() || null,
      main_purps_cd_nm: mainPurps.trim() || null,
      use_apr_day: /^\d{8}$/.test(useAprDay) ? useAprDay : null,
      total_floors: toIntOrNull(totalFloors),
      elevator_cnt: toIntOrNull(elevatorCnt),
      parking_total: toIntOrNull(parkingTotal),
      building_verified: buildingVerified,

      floor: toIntOrNull(floor),
      exclusive_area: toNumberOrNull(exclusiveArea),
      supply_area: toNumberOrNull(supplyArea),
      rooms: toIntOrNull(rooms),
      baths: toIntOrNull(baths),
      room_structure: roomStructure || null,
      // 인원 입력란은 없다 (숙박 개념 배제)
      max_guests: null,

      // 만원 → 원 단위 정수. 일·주 단가는 사업모델상 없다.
      deposit_won: manwonToWon(depositManwon),
      daily_fee_won: null,
      weekly_fee_won: null,
      monthly_fee_won: manwonToWon(monthlyManwon),
      maintenance_fee_won: manwonToWon(maintenanceManwon),
      maintenance_included: maintenanceIncluded,
      utilities_included: utilitiesIncluded,

      min_stay_days: toIntOrNull(minStayDays),
      max_stay_days: toIntOrNull(maxStayDays),
      available_from: availableFrom || null,
      available_to: availableTo || null,

      amenities,
      appliances,
      parking_available: parkingAvailable,
      pets_allowed: petsAllowed,
      smoking_allowed: smokingAllowed,

      // 첫 장이 대표 사진
      thumbnail: images[0] ?? null,
      images,

      contact_name: contactName.trim() || null,
      phone: phone.trim() || null,
      kakao_url: kakaoUrl.trim() || null,
      contact_hours: contactHours.trim() || null,

      owner_type: ownerType,
      status,
      is_exclusive: ownerType === 'agent' ? isExclusive : false,
      // agent_* 5항목 / broker_office_id / agent_snapshot_at 은 서버가 채운다 — 보내지 않는다.
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstKey = Object.keys(found)[0];
      document.getElementById(`stay-field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!accessToken) {
      setSubmitError('로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(CREATE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload()),
      });

      const data = (await res.json().catch(() => null)) as (Stay & { error?: string }) | null;

      if (!res.ok) {
        setSubmitError(
          data?.error ||
            (res.status === 401
              ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
              : '매물 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        );
        return;
      }

      setCreated(data as Stay);
    } catch (err) {
      console.error('[stay/new] submit failed', err);
      setSubmitError('네트워크 오류로 등록하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- 인증 게이트 ----------
  if (authLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center" aria-busy="true">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" aria-hidden />
        <p className="mt-3 text-sm text-slate-500">로그인 정보를 확인하는 중입니다...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <LockKeyhole className="h-7 w-7 text-blue-600" aria-hidden />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">로그인이 필요합니다</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          매물 등록은 로그인한 회원만 할 수 있습니다.
          <br />
          로그인 후 이 페이지로 돌아옵니다.
        </p>
        <Link
          href={LOGIN_PATH}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          로그인하러 가기
        </Link>
      </div>
    );
  }

  // ---------- 완료 화면 ----------
  if (created) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">매물이 등록되었습니다</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {created.is_approved
            ? '등록한 매물이 목록에 노출됩니다.'
            : '사업자 인증 전 등록 매물은 관리자 승인 후 목록에 노출됩니다.'}
        </p>
        <div className="mt-5 inline-flex flex-col items-center rounded-xl bg-slate-50 px-6 py-3">
          <span className="text-xs text-slate-500">매물 번호</span>
          <span className="mt-0.5 font-mono text-sm font-semibold text-slate-900">{created.id}</span>
        </div>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href={`/stay/${created.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            등록한 매물 보기
          </Link>
          <Link
            href="/stay"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            매물 목록으로
          </Link>
        </div>
      </div>
    );
  }

  // ---------- 입력 폼 ----------
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* 사업자 미인증 배너 — 상시 노출 */}
      {!isVerified && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="leading-relaxed">
            사업자 인증 전 계정입니다. 등록 후 승인을 거쳐 목록에 노출됩니다.
          </p>
        </div>
      )}

      {/* 1. 거래유형 */}
      <FormSection icon={FileText} title="거래유형">
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="sm:col-span-2" id="stay-field-deal_type">
            <legend className={labelBase}>
              거래 유형 <span className="text-red-500">*</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {STAY_DEAL_TYPES.map((t) => {
                const checked = dealType === t;
                return (
                  <label
                    key={t}
                    htmlFor={`stay-deal-type-${t}`}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                      checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      id={`stay-deal-type-${t}`}
                      type="radio"
                      name="stay-deal-type"
                      value={t}
                      checked={checked}
                      onChange={() => setDealType(t)}
                      className="h-5 w-5 shrink-0 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-slate-900">{STAY_DEAL_TYPE_LABELS[t]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div id="stay-field-stay_type">
            <label htmlFor="stay-type" className={labelBase}>
              매물 유형 <span className="text-red-500">*</span>
            </label>
            <select
              id="stay-type"
              value={stayType}
              onChange={(e) => setStayType(e.target.value as SelectableStayType | '')}
              className={inputBase}
            >
              <option value="">선택해 주세요</option>
              {SELECTABLE_STAY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {STAY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {errors.stay_type && <p className={errorText}>{errors.stay_type}</p>}
          </div>

          <div id="stay-field-title">
            <label htmlFor="stay-title" className={labelBase}>
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              id="stay-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 강남역 도보 5분 풀옵션 오피스텔 단기임대"
              maxLength={200}
              className={inputBase}
            />
            {errors.title && <p className={errorText}>{errors.title}</p>}
          </div>

          <div className="sm:col-span-2" id="stay-field-description">
            <label htmlFor="stay-description" className={labelBase}>
              상세 설명
            </label>
            <textarea
              id="stay-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="입주 조건, 주변 환경, 계약 시 참고할 내용을 적어주세요."
              className={`${inputBase} resize-y`}
            />
            {errors.description && <p className={errorText}>{errors.description}</p>}
          </div>
        </div>
      </FormSection>

      {/* 2. 위치 */}
      <FormSection icon={MapPin} title="위치">
        <div id="stay-field-address">
          <AddressSearch
            address={address}
            detailAddress={detailAddress}
            onAddressChange={handleAddressChange}
            onDetailAddressChange={setDetailAddress}
          />
          {errors.address && <p className={errorText}>{errors.address}</p>}
          {errors.detail_address && <p className={errorText}>{errors.detail_address}</p>}
        </div>

        {lookupState === 'loading' && (
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500" role="status">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            좌표와 건축물대장을 조회하는 중입니다...
          </p>
        )}
        {lookupState === 'done' && lookupWarnings.length === 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700" role="status">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            좌표와 건물 정보를 자동으로 채웠습니다. 아래에서 확인·수정할 수 있습니다.
          </p>
        )}
        {lookupWarnings.length > 0 && (
          <ul className="mt-3 space-y-1" role="status" aria-live="polite">
            {lookupWarnings.map((w) => (
              <li key={w} className="flex items-start gap-1.5 text-xs text-amber-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {w}
              </li>
            ))}
          </ul>
        )}
        {(region || sigungu) && (
          <p className="mt-2 text-xs text-slate-500">
            지역: {[region, sigungu].filter(Boolean).join(' ')}
            {lat != null && lng != null ? ` · 좌표 확인됨` : ''}
          </p>
        )}
      </FormSection>

      {/* 3. 건물정보 */}
      <FormSection icon={Building2} title="건물정보">
        {buildingVerified && (
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            건축물대장 확인됨
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div id="stay-field-building_name">
            <label htmlFor="stay-building-name" className={labelBase}>
              건물명
            </label>
            <input
              id="stay-building-name"
              type="text"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="예: 한빛타워"
              maxLength={200}
              className={inputBase}
            />
          </div>
          <div id="stay-field-main_purps_cd_nm">
            <label htmlFor="stay-main-purps" className={labelBase}>
              주용도
            </label>
            <input
              id="stay-main-purps"
              type="text"
              value={mainPurps}
              onChange={(e) => setMainPurps(e.target.value)}
              placeholder="예: 업무시설"
              maxLength={100}
              className={inputBase}
            />
          </div>
          <div id="stay-field-use_apr_day">
            <label htmlFor="stay-use-apr-day" className={labelBase}>
              사용승인일 (YYYYMMDD)
            </label>
            <input
              id="stay-use-apr-day"
              type="text"
              inputMode="numeric"
              value={useAprDay}
              onChange={(e) => setUseAprDay(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="예: 20190412"
              maxLength={8}
              className={inputBase}
            />
            {errors.use_apr_day && <p className={errorText}>{errors.use_apr_day}</p>}
          </div>
          <div id="stay-field-total_floors">
            <label htmlFor="stay-total-floors" className={labelBase}>
              총 층수
            </label>
            <input
              id="stay-total-floors"
              type="text"
              inputMode="numeric"
              value={totalFloors}
              onChange={(e) => setTotalFloors(e.target.value)}
              placeholder="예: 15"
              className={inputBase}
            />
            {errors.total_floors && <p className={errorText}>{errors.total_floors}</p>}
          </div>
          <div id="stay-field-elevator_cnt">
            <label htmlFor="stay-elevator-cnt" className={labelBase}>
              엘리베이터 대수
            </label>
            <input
              id="stay-elevator-cnt"
              type="text"
              inputMode="numeric"
              value={elevatorCnt}
              onChange={(e) => setElevatorCnt(e.target.value)}
              placeholder="예: 2"
              className={inputBase}
            />
            {errors.elevator_cnt && <p className={errorText}>{errors.elevator_cnt}</p>}
          </div>
          <div id="stay-field-parking_total">
            <label htmlFor="stay-parking-total" className={labelBase}>
              총 주차대수
            </label>
            <input
              id="stay-parking-total"
              type="text"
              inputMode="numeric"
              value={parkingTotal}
              onChange={(e) => setParkingTotal(e.target.value)}
              placeholder="예: 40"
              className={inputBase}
            />
            {errors.parking_total && <p className={errorText}>{errors.parking_total}</p>}
          </div>
        </div>
      </FormSection>

      {/* 4. 호실 */}
      <FormSection icon={DoorOpen} title="호실">
        <div className="grid gap-4 sm:grid-cols-2">
          <div id="stay-field-floor">
            <label htmlFor="stay-floor" className={labelBase}>
              층
            </label>
            <input
              id="stay-floor"
              type="text"
              inputMode="numeric"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="예: 5"
              className={inputBase}
            />
            {errors.floor && <p className={errorText}>{errors.floor}</p>}
          </div>
          <div id="stay-field-room_structure">
            <label htmlFor="stay-room-structure" className={labelBase}>
              방 구조
            </label>
            <select
              id="stay-room-structure"
              value={roomStructure}
              onChange={(e) => setRoomStructure(e.target.value as StayRoomStructure | '')}
              className={inputBase}
            >
              <option value="">선택해 주세요</option>
              {STAY_ROOM_STRUCTURES.map((s) => (
                <option key={s} value={s}>
                  {STAY_ROOM_STRUCTURE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div id="stay-field-exclusive_area">
            <label htmlFor="stay-exclusive-area" className={labelBase}>
              전용면적 (㎡)
            </label>
            <input
              id="stay-exclusive-area"
              type="text"
              inputMode="decimal"
              value={exclusiveArea}
              onChange={(e) => setExclusiveArea(e.target.value)}
              placeholder="예: 33.5"
              className={inputBase}
            />
            {errors.exclusive_area && <p className={errorText}>{errors.exclusive_area}</p>}
          </div>
          <div id="stay-field-supply_area">
            <label htmlFor="stay-supply-area" className={labelBase}>
              공급면적 (㎡)
            </label>
            <input
              id="stay-supply-area"
              type="text"
              inputMode="decimal"
              value={supplyArea}
              onChange={(e) => setSupplyArea(e.target.value)}
              placeholder="예: 49.2"
              className={inputBase}
            />
            {errors.supply_area && <p className={errorText}>{errors.supply_area}</p>}
          </div>
          <div id="stay-field-rooms">
            <label htmlFor="stay-rooms" className={labelBase}>
              방 개수
            </label>
            <input
              id="stay-rooms"
              type="text"
              inputMode="numeric"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              placeholder="예: 1"
              className={inputBase}
            />
            {errors.rooms && <p className={errorText}>{errors.rooms}</p>}
          </div>
          <div id="stay-field-baths">
            <label htmlFor="stay-baths" className={labelBase}>
              욕실 개수
            </label>
            <input
              id="stay-baths"
              type="text"
              inputMode="numeric"
              value={baths}
              onChange={(e) => setBaths(e.target.value)}
              placeholder="예: 1"
              className={inputBase}
            />
            {errors.baths && <p className={errorText}>{errors.baths}</p>}
          </div>
        </div>
      </FormSection>

      {/* 5. 임대조건 */}
      <FormSection icon={Wallet} title="임대조건">
        <div className="grid gap-4 sm:grid-cols-2">
          <div id="stay-field-monthly_fee_won">
            <label htmlFor="stay-monthly" className={labelBase}>
              월 임대료 (만원) <span className="text-red-500">*</span>
            </label>
            <input
              id="stay-monthly"
              type="text"
              inputMode="numeric"
              value={monthlyManwon}
              onChange={(e) => setMonthlyManwon(e.target.value)}
              placeholder="예: 90"
              className={inputBase}
            />
            {errors.monthly_fee_won && <p className={errorText}>{errors.monthly_fee_won}</p>}
          </div>
          <div id="stay-field-deposit_won">
            <label htmlFor="stay-deposit" className={labelBase}>
              보증금 (만원)
            </label>
            <input
              id="stay-deposit"
              type="text"
              inputMode="numeric"
              value={depositManwon}
              onChange={(e) => setDepositManwon(e.target.value)}
              placeholder="예: 300"
              className={inputBase}
            />
            {errors.deposit_won && <p className={errorText}>{errors.deposit_won}</p>}
          </div>
          <div id="stay-field-maintenance_fee_won">
            <label htmlFor="stay-maintenance" className={labelBase}>
              관리비 (만원)
            </label>
            <input
              id="stay-maintenance"
              type="text"
              inputMode="numeric"
              value={maintenanceManwon}
              onChange={(e) => setMaintenanceManwon(e.target.value)}
              placeholder="예: 10"
              className={inputBase}
            />
            {errors.maintenance_fee_won && <p className={errorText}>{errors.maintenance_fee_won}</p>}
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label htmlFor="stay-maintenance-included" className="flex cursor-pointer items-start gap-3">
              <input
                id="stay-maintenance-included"
                type="checkbox"
                checked={maintenanceIncluded}
                onChange={(e) => setMaintenanceIncluded(e.target.checked)}
                className={checkboxBase}
              />
              <span className="text-sm text-slate-800">관리비 임대료 포함</span>
            </label>
            <label htmlFor="stay-utilities-included" className="flex cursor-pointer items-start gap-3">
              <input
                id="stay-utilities-included"
                type="checkbox"
                checked={utilitiesIncluded}
                onChange={(e) => setUtilitiesIncluded(e.target.checked)}
                className={checkboxBase}
              />
              <span className="text-sm text-slate-800">공과금(전기·수도·가스) 포함</span>
            </label>
          </div>

          <div id="stay-field-min_stay_days">
            <label htmlFor="stay-min-days" className={labelBase}>
              최소 계약기간 (일)
            </label>
            <input
              id="stay-min-days"
              type="text"
              inputMode="numeric"
              value={minStayDays}
              onChange={(e) => setMinStayDays(e.target.value)}
              placeholder="예: 30"
              className={inputBase}
            />
            {errors.min_stay_days && <p className={errorText}>{errors.min_stay_days}</p>}
          </div>
          <div id="stay-field-max_stay_days">
            <label htmlFor="stay-max-days" className={labelBase}>
              최대 계약기간 (일)
            </label>
            <input
              id="stay-max-days"
              type="text"
              inputMode="numeric"
              value={maxStayDays}
              onChange={(e) => setMaxStayDays(e.target.value)}
              placeholder="예: 180"
              className={inputBase}
            />
            {errors.max_stay_days && <p className={errorText}>{errors.max_stay_days}</p>}
          </div>
          <div id="stay-field-available_from">
            <label htmlFor="stay-available-from" className={labelBase}>
              입주 가능일
            </label>
            <input
              id="stay-available-from"
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className={inputBase}
            />
            {errors.available_from && <p className={errorText}>{errors.available_from}</p>}
          </div>
          <div id="stay-field-available_to">
            <label htmlFor="stay-available-to" className={labelBase}>
              임대 종료일
            </label>
            <input
              id="stay-available-to"
              type="date"
              value={availableTo}
              onChange={(e) => setAvailableTo(e.target.value)}
              className={inputBase}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          금액은 만원 단위로 입력합니다. 실제 계약 조건은 임대차 계약서로 확정됩니다.
        </p>
      </FormSection>

      {/* 6. 옵션 */}
      <FormSection icon={ListChecks} title="옵션">
        <div className="space-y-5">
          <fieldset>
            <legend className={labelBase}>시설·환경</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {STAY_AMENITIES.map((a) => {
                const checked = amenities.includes(a);
                return (
                  <label
                    key={a}
                    htmlFor={`stay-amenity-${a}`}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      checked ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      id={`stay-amenity-${a}`}
                      type="checkbox"
                      checked={checked}
                      onChange={() => setAmenities((prev) => toggleInList(prev, a))}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {STAY_AMENITY_LABELS[a]}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className={labelBase}>가전·비품</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {STAY_APPLIANCES.map((a) => {
                const checked = appliances.includes(a);
                return (
                  <label
                    key={a}
                    htmlFor={`stay-appliance-${a}`}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      checked ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      id={`stay-appliance-${a}`}
                      type="checkbox"
                      checked={checked}
                      onChange={() => setAppliances((prev) => toggleInList(prev, a))}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {STAY_APPLIANCE_LABELS[a]}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className={labelBase}>이용 조건</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              <label htmlFor="stay-parking-available" className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  id="stay-parking-available"
                  type="checkbox"
                  checked={parkingAvailable}
                  onChange={(e) => setParkingAvailable(e.target.checked)}
                  className={checkboxBase}
                />
                <span className="text-sm text-slate-800">주차 가능</span>
              </label>
              <label htmlFor="stay-pets-allowed" className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  id="stay-pets-allowed"
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className={checkboxBase}
                />
                <span className="text-sm text-slate-800">반려동물 가능</span>
              </label>
              <label htmlFor="stay-smoking-allowed" className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  id="stay-smoking-allowed"
                  type="checkbox"
                  checked={smokingAllowed}
                  onChange={(e) => setSmokingAllowed(e.target.checked)}
                  className={checkboxBase}
                />
                <span className="text-sm text-slate-800">흡연 가능</span>
              </label>
            </div>
          </fieldset>
        </div>
      </FormSection>

      {/* 7. 사진 */}
      <FormSection icon={Images} title="사진">
        <div id="stay-field-images">
          <StayImageUploader
            value={images}
            onChange={setImages}
            onUploadingChange={setImagesUploading}
            error={errors.images}
          />
        </div>
      </FormSection>

      {/* 8. 등록주체 · 중개사표기 */}
      <FormSection icon={UserCheck} title="등록 주체 · 중개사 표기">
        <div id="stay-field-owner_type">
          <StayAgentFields
            ownerType={ownerType}
            onOwnerTypeChange={setOwnerType}
            isExclusive={isExclusive}
            onIsExclusiveChange={setIsExclusive}
            onSnapshotLoaded={setAgentSnapshot}
            error={errors.owner_type}
          />
        </div>
      </FormSection>

      {/* 9. 연락처 */}
      <FormSection icon={Phone} title="연락처">
        <div className="grid gap-4 sm:grid-cols-2">
          <div id="stay-field-contact_name">
            <label htmlFor="stay-contact-name" className={labelBase}>
              담당자 이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="stay-contact-name"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
              maxLength={50}
              className={inputBase}
            />
            {errors.contact_name && <p className={errorText}>{errors.contact_name}</p>}
          </div>
          <div id="stay-field-phone">
            <label htmlFor="stay-phone" className={labelBase}>
              휴대폰 번호 <span className="text-red-500">*</span>
            </label>
            <input
              id="stay-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-0000-0000"
              autoComplete="tel"
              maxLength={13}
              className={inputBase}
            />
            {errors.phone && <p className={errorText}>{errors.phone}</p>}
          </div>
          <div id="stay-field-kakao_url">
            <label htmlFor="stay-kakao-url" className={labelBase}>
              카카오톡 오픈채팅 링크
            </label>
            <input
              id="stay-kakao-url"
              type="url"
              value={kakaoUrl}
              onChange={(e) => setKakaoUrl(e.target.value)}
              placeholder="https://open.kakao.com/o/..."
              maxLength={1000}
              className={inputBase}
            />
            {errors.kakao_url && <p className={errorText}>{errors.kakao_url}</p>}
          </div>
          <div id="stay-field-contact_hours">
            <label htmlFor="stay-contact-hours" className={labelBase}>
              연락 가능 시간
            </label>
            <input
              id="stay-contact-hours"
              type="text"
              value={contactHours}
              onChange={(e) => setContactHours(e.target.value)}
              placeholder="예: 평일 09:00~18:00"
              maxLength={100}
              className={inputBase}
            />
            {errors.contact_hours && <p className={errorText}>{errors.contact_hours}</p>}
          </div>
        </div>
      </FormSection>

      {/* 10. 상태 */}
      <FormSection icon={Flag} title="임대 진행 상태">
        <div id="stay-field-status">
          <label htmlFor="stay-status" className={labelBase}>
            현재 상태
          </label>
          <select
            id="stay-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StayStatus)}
            className={inputBase}
          >
            {STAY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STAY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            등록 후에도 상태를 바꿀 수 있습니다. 노출 여부와는 별개로 매물의 진행 단계를 나타냅니다.
          </p>
        </div>
      </FormSection>

      {/* 제출 */}
      {submitError && (
        <p className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {submitError}
        </p>
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            등록 중...
          </span>
        ) : imagesUploading ? (
          '사진 등록이 끝나면 제출할 수 있습니다'
        ) : (
          '매물 등록하기'
        )}
      </button>
      <p className="text-center text-xs text-slate-500">
        매물 유형 · 제목 · 주소 · 월 임대료 · 담당자 이름 · 휴대폰 번호는 필수입니다.
      </p>
    </form>
  );
}
