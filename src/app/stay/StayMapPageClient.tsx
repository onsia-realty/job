'use client';

// 단기임대(/stay) 지도 중심 스플릿 레이아웃 — 네모(nemoapp.kr/store) 구조 이식.
//
// 구조는 src/app/market/MarketPageClient.tsx 를 그대로 따랐다:
//   지도 idle → bounds 갱신 → 목록 재조회 / 응답 레이스 가드(seq) / URL 디바운스 동기화 /
//   데스크톱 좌측 고정 패널 + 모바일 바텀시트.
// 시세지도 코드는 수정 금지라 공통화 대신 복사해서 쓴다(추후 공통 훅으로 뺄 여지 있음).
//
// 필터 상태의 단일 출처는 여전히 URL 이다(기존 /stay 설계 유지). 지도 위치(lat/lng/zoom)만
// 추가로 URL 에 얹어 딥링크가 지도까지 복원되게 한다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, Home, List, MapPin, Search, SearchX, X } from 'lucide-react';
import Header from '@/components/shared/Header';
import StayCard from '@/components/stay/StayCard';
import StayFilterBar from '@/components/stay/StayFilterBar';
import StayBottomSheet, { type StaySheetSnap } from '@/components/stay/StayBottomSheet';
import type { StayMapPoint } from '@/components/stay/StayMap.client';
import {
  isBlockedStayType,
  STAY_DEFAULT_DEAL_TYPE,
  STAY_DEFAULT_SORT,
  STAY_FILTER_TYPES,
  STAY_LIST_SORTS,
  STAY_QUERY_KEYS,
  type StayListSort,
} from '@/lib/stay/list-options';
import {
  STAY_DEAL_TYPES,
  STAY_LIST_MAX_LIMIT,
  STAY_STATUSES,
  type StayDealType,
  type StayStatus,
  type StayType,
} from '@/lib/stay/constants';
import type { Stay, StayListResponse } from '@/types/stay';
import type { MapAggregatePoint, MapComplexPoint } from '@/lib/market/marker-html';
import { aggregateByDong } from '@/lib/market/aggregateMarkers';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

// 이 화면이 사는 경로. 3화면 구조 재편으로 /stay → /stay/map 으로 옮겼다.
// URL 동기화(router.replace)가 '/stay' 로 하드코딩돼 있으면 지도를 움직일 때마다
// 메인 화면으로 튕긴다.
const MAP_PATH = '/stay/map';

// SSR 금지 (네이버 지도 SDK 는 window 의존)
const StayMap = dynamic(() => import('@/components/stay/StayMap.client'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-400">
      지도를 불러오는 중…
    </div>
  ),
});

// 시드 매물이 서울 5개구 + 경기 7개 시군구에 흩어져 있어, 초기 뷰는 수도권 전체가 들어오도록 넓게 잡는다.
const DEFAULT_CENTER: [number, number] = [37.42, 127.0];
const DEFAULT_ZOOM = 10;

const SORT_VALUES = STAY_LIST_SORTS.map((o) => o.value);

// ---------- 실거래 레이어 ----------
// 네이버 부동산처럼 지도 우상단에서 "매물 / 실거래" 를 전환한다.
type StayMapLayer = 'stays' | 'deals';

// 이 줌 이하에서는 실거래를 아예 조회하지 않는다. modeForZoom 의 'none' 경계와 일치시킨다.
const DEALS_MIN_ZOOM = 12;
// 줌 14 에서 마커 과밀 방지 — 거래량 상위 N개만. (MarketPageClient 의 MAX_MID_ZOOM_MARKERS 와 동일)
const MAX_DEAL_MARKERS_MID = 90;
// 줌 15 이상(근접)에서도 상한을 둔다. 강남 z15 에서 300개 넘게 쏟아져 지도를 덮은 게 이 작업의 발단.
const MAX_DEAL_MARKERS_NEAR = 100;
// 줌 15 이상 = 근접
const DEALS_NEAR_ZOOM = 15;
// 모바일은 지도 면적이 데스크톱의 1/4 수준이다 — 같은 상한을 쓰면 좁은 화면에서 그대로 아수라장이 된다.
// (390px 스크린샷으로 확인한 값. 상한에 걸린 사실은 안내 pill 이 알려주므로 정보 손실은 없다)
const NARROW_VIEWPORT_QUERY = '(max-width: 767px)';
const NARROW_CAP_RATIO = 0.45;

/** 좁은 화면 여부 — SSR 에서는 false 로 시작하고 마운트 후 실제 값으로 맞춘다(hydration 불일치 회피). */
function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(NARROW_VIEWPORT_QUERY);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return narrow;
}

/** 실거래 마커 모드 — /market 의 modeForZoom 정책 이식 */
type DealMarkerMode = 'complex' | 'dong' | 'none';

/**
 * 줌 → 실거래 마커 모드.
 *
 * /market 은 z<=11 에서 '구(gu)' 집계 마커를 쓰지만 여기서는 쓰지 않는다:
 * 구 집계는 `/api/market/aggregates` 가 내려주는 값이고, 그 API 는 `complex_aggregates` MV
 * (매매 전용) 기반이라 평균가가 "매매 평균"이다. 월세 실거래 레이어에 매매 평균을 얹으면
 * 그냥 거짓 정보다. 그래서 z<=11 은 마커 대신 "확대하세요" 안내 문구를 유지한다.
 */
function modeForZoom(z: number): DealMarkerMode {
  if (z <= 11) return 'none';
  if (z <= 13) return 'dong';
  return 'complex';
}

/** /api/market/transactions 응답 행 중 집계에 필요한 필드만 */
interface DealTx {
  complex_key: string;
  complex_name: string;
  deal_date: string;
  deposit_manwon: number;
  monthly_manwon: number;
  exclusive_area: number | null;
  dong: string | null;
}
type DealCoord = { lat: number | null; lng: number | null };

// 렌더마다 새 배열을 만들면 마커 effect 가 매번 재실행된다 — 빈 배열은 상수로 공유.
const NO_AGGREGATES: MapAggregatePoint[] = [];

// ---------- URL 파싱 ----------

function parseMulti<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  const allowedSet = new Set<string>(allowed);
  return Array.from(new Set(raw.split(',').map((v) => v.trim()).filter((v) => allowedSet.has(v)))) as T[];
}

export default function StayMapPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── URL → 필터 상태 (URL 이 단일 출처) ──
  const dealTypeRaw = searchParams.get(STAY_QUERY_KEYS.deal);
  const dealType: StayDealType = (STAY_DEAL_TYPES as readonly string[]).includes(dealTypeRaw ?? '')
    ? (dealTypeRaw as StayDealType)
    : STAY_DEFAULT_DEAL_TYPE;

  const stayTypesKey = searchParams.get(STAY_QUERY_KEYS.type) ?? '';
  const statusesKey = searchParams.get(STAY_QUERY_KEYS.status) ?? '';
  const stayTypes = useMemo(
    () => parseMulti<StayType>(stayTypesKey || null, STAY_FILTER_TYPES),
    [stayTypesKey]
  );
  const statuses = useMemo(
    () => parseMulti<StayStatus>(statusesKey || null, STAY_STATUSES),
    [statusesKey]
  );

  const sortRaw = searchParams.get(STAY_QUERY_KEYS.sort);
  const sort: StayListSort = SORT_VALUES.includes(sortRaw as StayListSort)
    ? (sortRaw as StayListSort)
    : STAY_DEFAULT_SORT;

  // 지도 레이어도 다른 필터와 마찬가지로 URL 을 단일 출처로 삼는다.
  const layer: StayMapLayer = searchParams.get('layer') === 'deals' ? 'deals' : 'stays';

  // ── 지도 상태 ──
  // 최초 마운트 1회만 URL 에서 복원한다. 이후 지도 이동은 mapViewRef 로만 추적해
  // center state 로 되먹이지 않는다(피드백 루프 회피 — MarketPageClient 와 동일한 이유).
  const [center] = useState<[number, number]>(() => {
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : DEFAULT_CENTER;
  });
  const [zoom] = useState<number>(() => {
    const z = parseFloat(searchParams.get('zoom') || '');
    return Number.isFinite(z) && z >= 8 && z <= 19 ? z : DEFAULT_ZOOM;
  });

  // 지도 viewport 범위. 직렬화 문자열로 보관해 useEffect 트리거가 안정적이도록.
  const [boundsStr, setBoundsStr] = useState<string | null>(null);
  // 현재 줌 — 실거래 레이어의 조회 여부/마커 상한 판단에 쓰려고 state 로도 들고 있는다.
  // (mapViewRef 는 렌더를 트리거하지 않는다)
  const [mapZoom, setMapZoom] = useState<number>(zoom);

  // ── 목록 상태 ──
  const [rows, setRows] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sheetSnap, setSheetSnap] = useState<StaySheetSnap>('peek');

  // 목록 텍스트 검색 — 네모의 "지역·역 검색" 자리. stays 는 검색 API 가 없어
  // 조회된 결과를 제목/주소/시군구로 좁히는 클라이언트 필터로 구현했다.
  const [q, setQ] = useState('');

  // ── 지도 idle → bounds 갱신 ──
  const handleBoundsChanged = useCallback(
    (swLat: number, swLng: number, neLat: number, neLng: number) => {
      const next = `${swLat.toFixed(6)},${swLng.toFixed(6)},${neLat.toFixed(6)},${neLng.toFixed(6)}`;
      setBoundsStr((prev) => (prev === next ? prev : next));
    },
    []
  );

  // ── 지도 위치 → URL 동기화 (디바운스) ──
  const mapViewRef = useRef<{ lat: number; lng: number; zoom: number }>({
    lat: center[0],
    lng: center[1],
    zoom,
  });
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeUrl = useCallback(() => {
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => {
      // 필터 키는 건드리지 않고 지도 좌표만 갈아끼운다 (필터 단일 출처는 그대로 URL).
      const p = new URLSearchParams(window.location.search);
      p.set('lat', mapViewRef.current.lat.toFixed(5));
      p.set('lng', mapViewRef.current.lng.toFixed(5));
      p.set('zoom', mapViewRef.current.zoom.toFixed(2));
      router.replace(`${MAP_PATH}?${p.toString()}`, { scroll: false });
    }, 400);
  }, [router]);

  const handleViewChanged = useCallback(
    (lat: number, lng: number, z: number) => {
      mapViewRef.current = { lat, lng, zoom: z };
      setMapZoom((prev) => (prev === z ? prev : z));
      writeUrl();
    },
    [writeUrl]
  );

  // 레이어 토글 — 사용자 조작이라 디바운스 없이 즉시 반영한다.
  // lat/lng/zoom 등 기존 파라미터를 보존하려고 현재 URL 을 그대로 복사해서 얹는다.
  const handleLayerChange = useCallback(
    (next: StayMapLayer) => {
      const p = new URLSearchParams(window.location.search);
      if (next === 'deals') p.set('layer', 'deals');
      else p.delete('layer'); // 기본값이면 파라미터를 남기지 않는다
      const qs = p.toString();
      router.replace(qs ? `${MAP_PATH}?${qs}` : MAP_PATH, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    return () => {
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    };
  }, []);

  // ── 목록 조회 ──
  // 응답 레이스 가드: 마지막으로 시작된 요청의 결과만 반영한다.
  const loadSeqRef = useRef(0);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 지도 팬/줌이 연속으로 들어올 때 매번 때리지 않도록 디바운스.
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => {
      const seq = ++loadSeqRef.current;
      setLoading(true);

      const sp = new URLSearchParams();
      sp.set('deal_type', dealType);
      sp.set('sort', sort);
      sp.set('limit', String(STAY_LIST_MAX_LIMIT));
      if (boundsStr) sp.set('bounds', boundsStr);
      // 진행상태는 이제 서버가 거른다 (API 에 status 다중 필터 추가됨).
      if (statuses.length > 0) sp.set('status', statuses.join(','));
      // API 는 stay_type 단일값만 받는다. 정확히 1개 선택일 때만 서버로 넘기고,
      // 다중 선택은 아래에서 클라이언트가 후처리한다.
      if (stayTypes.length === 1) sp.set('stay_type', stayTypes[0]);

      fetch(`/api/stays?${sp.toString()}`, { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error('list failed');
          return res.json() as Promise<StayListResponse>;
        })
        .then((json) => {
          if (seq !== loadSeqRef.current) return; // 낡은 응답 폐기
          const items = Array.isArray(json.items) ? json.items : [];
          setRows(items);
          setLoadFailed(false);
          setLoading(false);
        })
        .catch(() => {
          if (seq !== loadSeqRef.current) return;
          setRows([]);
          setLoadFailed(true);
          setLoading(false);
        });
    }, 300);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [boundsStr, dealType, sort, statuses, stayTypes]);

  // ── 실거래 레이어 조회 ──
  // 기존 시세지도 API 를 그대로 쓴다. 월세(deal=rent)만 — 단기임대 판단 배경이므로 매매는 넣지 않는다.
  // 집계 로직은 MarketPageClient.loadData 의 wolse 분기를 옮겨온 것.
  const [dealPointsAll, setDealPointsAll] = useState<MapComplexPoint[]>([]);
  // aggKey(`${pt}:${complex_key}`) → 법정동명. 동 집계 마커용 — MapComplexPoint.complex_key 와 같은 키 공간이어야 한다.
  const [dealDongByKey, setDealDongByKey] = useState<Record<string, string | null>>({});
  const dealSeqRef = useRef(0);
  const dealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (layer !== 'deals' || !boundsStr || mapZoom < DEALS_MIN_ZOOM) {
      // 조회하지 않는 구간. seq 만 올려 비행 중인 응답을 무효화하고, 마커 숨김은
      // 아래 dealPoints 파생값이 담당한다 (effect 안에서 setState 하지 않는다).
      dealSeqRef.current++;
      return;
    }

    if (dealTimerRef.current) clearTimeout(dealTimerRef.current);
    dealTimerRef.current = setTimeout(() => {
      const seq = ++dealSeqRef.current;

      const fetchType = async (pt: 'apt' | 'officetel') => {
        const url = `/api/market/transactions?bounds=${boundsStr}&type=${pt}&deal=rent&months=6`;
        const res = await fetch(url);
        if (!res.ok) return { pt, txs: [] as DealTx[], coords: {} as Record<string, DealCoord> };
        const data = await res.json();
        return {
          pt,
          txs: (data.transactions || []) as DealTx[],
          coords: (data.complex_coords || {}) as Record<string, DealCoord>,
        };
      };

      Promise.all([fetchType('apt'), fetchType('officetel')])
        .then((results) => {
          if (seq !== dealSeqRef.current) return; // 낡은 응답 폐기

          interface Agg {
            name: string;
            propertyType: 'apt' | 'officetel';
            deposits: number[];
            monthlies: number[];
            areas: number[];
            latestDate: string;
            latestDeposit?: number;
            latestMonthly?: number;
          }
          // 주상복합처럼 한 단지에 apt/officetel 이 섞이는 케이스가 있어 유형을 키에 포함한다.
          const map = new Map<string, Agg>();
          const coords: Record<string, DealCoord> = {};
          const dongByKey: Record<string, string | null> = {};

          for (const { pt, txs, coords: c } of results) {
            Object.assign(coords, c);
            for (const t of txs) {
              // 전세(월세 0)는 제외 — 단기임대와 비교 대상이 아니다.
              if (!((t.monthly_manwon || 0) > 0 && (t.deposit_manwon || 0) > 0)) continue;
              const aggKey = `${pt}:${t.complex_key}`;
              if (t.dong) dongByKey[aggKey] = t.dong;
              let a = map.get(aggKey);
              if (!a) {
                a = {
                  name: t.complex_name,
                  propertyType: pt,
                  deposits: [],
                  monthlies: [],
                  areas: [],
                  latestDate: '',
                };
                map.set(aggKey, a);
              }
              a.deposits.push(t.deposit_manwon);
              a.monthlies.push(t.monthly_manwon);
              if (t.exclusive_area) a.areas.push(t.exclusive_area);
              if ((t.deal_date || '') > a.latestDate) {
                a.latestDate = t.deal_date || '';
                a.latestDeposit = t.deposit_manwon;
                a.latestMonthly = t.monthly_manwon;
              }
            }
          }

          const avg = (arr: number[]) => Math.round(arr.reduce((x, y) => x + y, 0) / arr.length);
          const median = (arr: number[]) => {
            if (arr.length === 0) return undefined;
            const s = [...arr].sort((x, y) => x - y);
            return Math.round(s[Math.floor(s.length / 2)]);
          };

          const pts: MapComplexPoint[] = [];
          for (const [aggKey, v] of map) {
            if (v.deposits.length === 0) continue;
            const complexKey = aggKey.slice(aggKey.indexOf(':') + 1);
            const real = coords[complexKey];
            // 좌표 없는 단지는 버린다 (가짜 좌표 생성 금지)
            if (!real || real.lat == null || real.lng == null) continue;
            pts.push({
              complex_key: aggKey,
              complex_name: v.name,
              lat: real.lat,
              lng: real.lng,
              avg_price_manwon: avg(v.deposits),
              avg_monthly_manwon: avg(v.monthlies),
              latest_price_manwon: v.latestDeposit,
              latest_monthly_manwon: v.latestMonthly,
              rep_area: median(v.areas),
              trade_count: v.deposits.length,
              property_type: v.propertyType,
            });
          }
          setDealPointsAll(pts);
          setDealDongByKey(dongByKey);
        })
        .catch(() => {
          if (seq !== dealSeqRef.current) return;
          setDealPointsAll([]);
          setDealDongByKey({});
        });
    }, 300);

    return () => {
      if (dealTimerRef.current) clearTimeout(dealTimerRef.current);
    };
  }, [layer, boundsStr, mapZoom]);

  // 실거래 마커 모드 — 매물 레이어에서는 실거래를 아예 그리지 않는다.
  const dealMarkerMode: DealMarkerMode = layer === 'deals' ? modeForZoom(mapZoom) : 'none';

  // 좁은 화면에서는 개별 마커 상한을 더 조인다 (지도 면적 대비 과밀 방지)
  const narrowViewport = useNarrowViewport();

  // 동 집계 — 기존 /market 의 aggregateByDong 을 그대로 재사용한다 (새 집계 함수 만들지 않음).
  const dealAggregates = useMemo(
    () => (dealMarkerMode === 'dong' ? aggregateByDong(dealPointsAll, dealDongByKey) : NO_AGGREGATES),
    [dealMarkerMode, dealPointsAll, dealDongByKey],
  );

  // 개별(단지) 마커 — 과밀 방지 상한. 줌 14 는 90개, 15+ 는 100개. 좁은 화면은 절반 이하로 더 조인다.
  const dealPoints = useMemo(() => {
    if (dealMarkerMode !== 'complex') return [];
    const base = mapZoom >= DEALS_NEAR_ZOOM ? MAX_DEAL_MARKERS_NEAR : MAX_DEAL_MARKERS_MID;
    const cap = narrowViewport ? Math.round(base * NARROW_CAP_RATIO) : base;
    if (dealPointsAll.length <= cap) return dealPointsAll;
    return [...dealPointsAll].sort((a, b) => b.trade_count - a.trade_count).slice(0, cap);
  }, [dealPointsAll, mapZoom, dealMarkerMode, narrowViewport]);

  // 조용히 잘라내지 않는다 — 잘린 사실을 지도 위에 알린다.
  const dealTruncated = dealMarkerMode === 'complex' && dealPointsAll.length > dealPoints.length;

  // 레이어 토글 배지 — 지금 지도에 실제로 떠 있는 마커 수
  const dealMarkerCount = dealMarkerMode === 'dong' ? dealAggregates.length : dealPoints.length;

  // ── 클라이언트 후처리 ──
  // v1 은 생활숙박시설을 취급하지 않는다 — 유형 미선택 상태에서도 항상 제외.
  // 유형 다중선택과 텍스트 검색도 API 가 지원하지 않으므로 여기서 좁힌다.
  const stays = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((stay) => {
      if (isBlockedStayType(stay.stay_type)) return false;
      if (stayTypes.length > 0 && !stayTypes.includes(stay.stay_type)) return false;
      if (needle) {
        const hay = `${stay.title} ${stay.address ?? ''} ${stay.sigungu ?? ''} ${stay.building_name ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, stayTypes, q]);

  // 좌표가 있는 것만 지도에 찍는다.
  const mapPoints: StayMapPoint[] = useMemo(
    () =>
      stays
        .filter((s): s is Stay & { lat: number; lng: number } => s.lat != null && s.lng != null)
        .map((s) => ({
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          deposit_won: s.deposit_won,
          monthly_fee_won: s.monthly_fee_won,
          floor: s.floor,
        })),
    [stays]
  );

  // 패널 헤더 지역명 — 네모의 "서초동 5025" 자리.
  // 뷰포트 역지오코딩이 없으므로 조회 결과에서 가장 많은 시군구를 대표 지역으로 쓴다.
  const regionLabel = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of stays) {
      if (!s.sigungu) continue;
      counts.set(s.sigungu, (counts.get(s.sigungu) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestN = 0;
    for (const [name, n] of counts) {
      if (n > bestN) {
        best = name;
        bestN = n;
      }
    }
    // 과반을 넘는 지역이 있을 때만 지역명을 쓴다. 넓게 흩어져 있는데 1건짜리 최빈값을
    // "강남구 6" 처럼 내걸면 나머지 5건을 잘못 설명하게 된다.
    if (best && bestN * 2 > stays.length) return best;
    return '지도 범위';
  }, [stays]);

  // 목록 화면 링크 — 필터 쿼리 규약이 동일하므로 현재 쿼리스트링을 그대로 넘긴다.
  // (lat/lng/zoom 등 지도 전용 키는 목록이 무시하고, 되돌아올 때 지도 위치가 살아 있다.)
  const listHref = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/stay/list?${qs}` : '/stay/list';
  }, [searchParams]);

  // 마커 클릭 → 좌측 패널에서 해당 카드로 스크롤
  const listRef = useRef<HTMLDivElement>(null);
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSheetSnap((s) => (s === 'peek' ? 'half' : s));
    // 렌더 이후 스크롤 (모바일은 시트가 열리는 프레임을 기다려야 한다)
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-stay-id="${id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  // ── 목록 패널 내용 (데스크톱 좌측 / 모바일 시트 공용) ──
  const listContent = (
    <div className="flex h-full flex-col">
      {/* 패널 헤더 — 지역명 + 건수 (네모: "서초동 5025") */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3.5 py-2.5">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-gray-900">
          <MapPin className="h-4 w-4 flex-shrink-0 text-blue-600" />
          <span className="truncate">{regionLabel}</span>
          <span className="flex-shrink-0 tabular-nums text-blue-600">
            {loading ? '…' : stays.length.toLocaleString()}
          </span>
        </p>

        {/* 목록 화면(/stay/list) 진입점 — 지도 컨트롤과 겹치지 않게 좌측 패널 헤더에 둔다.
            현재 필터 쿼리스트링을 그대로 넘겨 같은 조건으로 이어보게 한다. */}
        <Link
          href={listHref}
          className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600"
        >
          <List className="h-3.5 w-3.5" />
          목록으로 보기
        </Link>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loadFailed ? (
          <div className="px-4 py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle className="h-7 w-7 text-amber-400" />
            </div>
            <h2 className="mb-1.5 text-sm font-bold text-gray-700">매물을 불러오지 못했습니다</h2>
            <p className="text-xs text-gray-400">일시적인 오류일 수 있습니다. 지도를 다시 움직여보세요.</p>
          </div>
        ) : loading && stays.length === 0 ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[120px] animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : stays.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {stays.map((stay) => (
              <div key={stay.id} data-stay-id={stay.id}>
                <StayCard
                  stay={stay}
                  active={selectedId === stay.id || hoveredId === stay.id}
                  onMouseEnter={() => setHoveredId(stay.id)}
                  onMouseLeave={() => setHoveredId((prev) => (prev === stay.id ? null : prev))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <SearchX className="h-7 w-7 text-blue-300" />
            </div>
            <h2 className="mb-1.5 text-sm font-bold text-gray-700">이 지역에 매물이 없습니다</h2>
            <p className="mb-4 text-xs text-gray-400">지도를 움직이거나 조건을 줄여보세요.</p>
            <Link
              href="/stay/owner"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Home className="h-3.5 w-3.5 flex-shrink-0" />
              소유주 직접 등록
              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  // 네모의 좌측 검색 인풋 — 패널 폭(391px)에 맞춘다.
  const searchSlot = (
    <div className="relative w-full md:w-[391px] md:flex-shrink-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="지역·건물명으로 검색"
        aria-label="매물 검색"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ('')}
          aria-label="검색어 지우기"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white">
      {/* ⚠️ 파라미터는 ncpKeyId — 옛 ncpClientId 는 조용히 실패한다 */}
      {NAVER_CLIENT_ID && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`}
          strategy="afterInteractive"
        />
      )}

      <Header variant="landing" />

      <StayFilterBar
        dealType={dealType}
        stayTypes={stayTypes}
        statuses={statuses}
        sort={sort}
        totalCount={stays.length}
        searchSlot={searchSlot}
      />

      {/* 메인: 데스크톱 좌측 391px 패널 + 우측 전체 지도 / 모바일 지도 + 바텀시트 */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden flex-shrink-0 overflow-hidden border-r border-gray-200 bg-white md:flex md:w-[391px] md:flex-col">
          {listContent}
        </aside>

        <div className="relative min-w-0 flex-1">
          <StayMap
            center={center}
            zoom={zoom}
            /* 우리 매물은 항상 표시한다. 실거래는 가격 판단을 돕는 배경 레이어일 뿐이고,
               전환 대상인 우리 매물을 숨기면 실거래 탭이 쓸모없어진다. z-index 로 항상 위에 뜬다. */
            points={mapPoints}
            dealPoints={dealPoints /* dealMarkerMode !== 'complex' 이면 이미 빈 배열 */}
            dealAggregates={dealAggregates}
            dealMarkerMode={dealMarkerMode}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            onBoundsChanged={handleBoundsChanged}
            onViewChanged={handleViewChanged}
          />

          {/* 레이어 토글 — 네이버 부동산식 우상단 세로 스택. 줌 컨트롤은 우하단으로 비켜 두었다. */}
          <div
            role="radiogroup"
            aria-label="지도 레이어"
            className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md"
          >
            {([
              { value: 'stays' as const, label: '매물' },
              { value: 'deals' as const, label: '실거래' },
            ]).map((opt) => {
              const active = layer === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleLayerChange(opt.value)}
                  className={`px-3 py-2 text-xs font-semibold transition-colors ${
                    active ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                  {/* 배지는 "지금 지도에 떠 있는 마커 수" — 동 모드면 집계 개수, 개별 모드면 표시 중인 단지 수 */}
                  {opt.value === 'deals' && active && dealMarkerCount > 0 && (
                    <span className="ml-1 tabular-nums font-bold opacity-90">{dealMarkerCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {layer === 'stays' && !loading && mapPoints.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
              <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 text-sm text-gray-500 shadow-lg">
                이 지역에는 등록된 매물이 없습니다
              </div>
            </div>
          )}

          {/* 실거래 레이어 안내 — 모드가 셋이라 상호배타적이다 (none / dong / complex 잘림) */}
          {layer === 'deals' && dealMarkerMode === 'none' && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
              <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 text-sm text-gray-500 shadow-lg">
                지도를 확대하면 실거래가 표시됩니다
              </div>
            </div>
          )}

          {layer === 'deals' && dealMarkerMode === 'dong' && dealAggregates.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
              <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 text-sm text-gray-500 shadow-lg">
                동별 평균 · 확대하면 단지별로 보입니다
              </div>
            </div>
          )}

          {layer === 'deals' && dealTruncated && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
              <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 text-sm text-gray-500 shadow-lg">
                실거래 <span className="tabular-nums font-semibold text-gray-700">{dealPointsAll.length}</span>곳 중{' '}
                <span className="tabular-nums font-semibold text-gray-700">{dealPoints.length}</span>곳 표시 · 확대하면 더
                보입니다
              </div>
            </div>
          )}
        </div>

        <StayBottomSheet
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          peekContent={
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <MapPin className="h-4 w-4 text-blue-600" />
              {regionLabel} 매물{' '}
              <span className="tabular-nums text-blue-600">
                {loading ? '…' : stays.length.toLocaleString()}
              </span>
              건
            </div>
          }
        >
          {listContent}
        </StayBottomSheet>
      </div>
    </div>
  );
}
