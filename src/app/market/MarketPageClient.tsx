'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, TrendingUp, Building2, Filter, Store, Briefcase, X } from 'lucide-react';
import type { MapComplexPoint, DealTypeFilter } from '@/components/market/MarketMap.client';
import MarketDetailPanel from '@/components/market/MarketDetailPanel';
import MarketGraphPanel from '@/components/market/MarketGraphPanel';
import MarketSearch, { type SearchResult } from '@/components/market/MarketSearch';
import { useComplexDetail, useBrokersNearby, useJobsNearby } from '@/lib/market/queries';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

// SSR 금지 (Leaflet은 window 의존)
const MarketMap = dynamic(() => import('@/components/market/MarketMap.client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-market-bg text-market-text-mute text-sm font-jakarta">
      지도를 불러오는 중…
    </div>
  ),
});

// 기본 지역: 서울 강남구
const DEFAULT_CENTER: [number, number] = [37.5172, 127.0473];
const DEFAULT_LAWD_CD = '11680';

type PropertyTypeFilter = 'apt' | 'officetel';
type AreaBand = 'all' | 'under60' | '60to85' | '85to110' | 'over110';
type AgeBand = 'all' | 'new5' | 'mid10' | 'mid20' | 'old20';
type HouseholdBand = 'all' | 'over50' | 'over300' | 'over1000';

const AREA_OPTIONS: Array<{ value: AreaBand; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'under60', label: '~60㎡ (소형)' },
  { value: '60to85', label: '60~85㎡ (중소형)' },
  { value: '85to110', label: '85~110㎡ (중형)' },
  { value: 'over110', label: '110㎡~ (대형)' },
];
const AGE_OPTIONS: Array<{ value: AgeBand; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'new5', label: '신축 (5년 이내)' },
  { value: 'mid10', label: '준신축 (5~10년)' },
  { value: 'mid20', label: '중고 (10~20년)' },
  { value: 'old20', label: '노후 (20년~)' },
];
const HOUSEHOLD_OPTIONS: Array<{ value: HouseholdBand; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'over50', label: '50세대 이상' },
  { value: 'over300', label: '300세대 이상' },
  { value: 'over1000', label: '1000세대 이상' },
];

const CURRENT_YEAR = new Date().getFullYear();
function matchAgeBand(buildYear: number | null | undefined, band: AgeBand): boolean {
  if (band === 'all') return true;
  if (buildYear == null) return false;
  const age = CURRENT_YEAR - buildYear;
  if (band === 'new5') return age <= 5;
  if (band === 'mid10') return age > 5 && age <= 10;
  if (band === 'mid20') return age > 10 && age <= 20;
  if (band === 'old20') return age > 20;
  return true;
}
function matchAreaBand(area: number | null | undefined, band: AreaBand): boolean {
  if (band === 'all') return true;
  if (area == null) return false;
  if (band === 'under60') return area < 60;
  if (band === '60to85') return area >= 60 && area < 85;
  if (band === '85to110') return area >= 85 && area < 110;
  if (band === 'over110') return area >= 110;
  return true;
}
function matchHouseholdBand(hhld: number | null | undefined, band: HouseholdBand): boolean {
  if (band === 'all') return true;
  if (hhld == null) return false;
  if (band === 'over50') return hhld >= 50;
  if (band === 'over300') return hhld >= 300;
  if (band === 'over1000') return hhld >= 1000;
  return true;
}

// URL 쿼리값을 허용된 옵션으로 검증 (잘못된 값은 fallback)
function validBand<T extends string>(
  v: string | null,
  options: ReadonlyArray<{ value: T }>,
  fallback: T,
): T {
  return options.some((o) => o.value === v) ? (v as T) : fallback;
}

export default function MarketPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── URL → 초기 상태 (최초 마운트 1회, 딥링크 복원) ──
  const [center, setCenter] = useState<[number, number]>(() => {
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : DEFAULT_CENTER;
  });
  const [zoom] = useState<number>(() => {
    const z = parseFloat(searchParams.get('zoom') || '');
    return Number.isFinite(z) && z >= 8 && z <= 19 ? z : 14;
  });
  const [lawd_cd, setLawdCd] = useState(() => searchParams.get('region') || DEFAULT_LAWD_CD);
  // 지도 viewport 범위 (idle 시 갱신). 셋되면 bounds 모드, null이면 lawd_cd 모드.
  // 직렬화 문자열로 보관해 useEffect 트리거가 안정적이도록.
  const [boundsStr, setBoundsStr] = useState<string | null>(null);
  const [property_type, setPropertyType] = useState<PropertyTypeFilter>(() =>
    searchParams.get('type') === 'officetel' ? 'officetel' : 'apt',
  );
  const [dealType, setDealType] = useState<DealTypeFilter>(() => {
    const d = searchParams.get('deal');
    return d === 'jeonse' || d === 'wolse' || d === 'presale' || d === 'trade' ? d : 'trade';
  });
  const [areaBand, setAreaBand] = useState<AreaBand>(() =>
    validBand(searchParams.get('area'), AREA_OPTIONS, 'all'),
  );
  const [ageBand, setAgeBand] = useState<AgeBand>(() =>
    validBand(searchParams.get('age'), AGE_OPTIONS, 'all'),
  );
  const [householdBand, setHouseholdBand] = useState<HouseholdBand>(() =>
    validBand(searchParams.get('hhld'), HOUSEHOLD_OPTIONS, 'all'),
  );
  const [points, setPoints] = useState<MapComplexPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(() => searchParams.get('sel') || null);

  // ── 차별화 레이어 토글 (중개업소/구인공고) — 네이버에 없는 우리 고유 무기 ──
  const [showBrokers, setShowBrokers] = useState(false);
  const [showJobs, setShowJobs] = useState(false);

  const { data: brokerRows = [] } = useBrokersNearby(lawd_cd, showBrokers);
  const { data: jobs = [] } = useJobsNearby(lawd_cd, showJobs);

  // 중개업소 → 지도 마커 (좌표 보유분만)
  const brokerMarkers = useMemo(
    () =>
      brokerRows
        .filter((b) => b.latitude != null && b.longitude != null)
        .map((b) => ({ lat: b.latitude as number, lng: b.longitude as number, name: b.med_office_nm })),
    [brokerRows],
  );

  // ── 상태 → URL 동기화 (딥링크/공유) ──
  // 지도 위치는 mapViewRef에 보관(맵 idle 콜백이 갱신) — center/zoom state로 되먹이지 않아 피드백 루프 회피.
  const mapViewRef = useRef<{ lat: number; lng: number; zoom: number }>({
    lat: center[0],
    lng: center[1],
    zoom,
  });
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeUrl = useCallback(() => {
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    writeTimerRef.current = setTimeout(() => {
      const p = new URLSearchParams();
      p.set('lat', mapViewRef.current.lat.toFixed(5));
      p.set('lng', mapViewRef.current.lng.toFixed(5));
      p.set('zoom', mapViewRef.current.zoom.toFixed(2));
      p.set('deal', dealType);
      p.set('type', property_type);
      p.set('region', lawd_cd);
      if (areaBand !== 'all') p.set('area', areaBand);
      if (ageBand !== 'all') p.set('age', ageBand);
      if (householdBand !== 'all') p.set('hhld', householdBand);
      if (selectedKey) p.set('sel', selectedKey);
      router.replace(`/market?${p.toString()}`, { scroll: false });
    }, 400);
  }, [dealType, property_type, lawd_cd, areaBand, ageBand, householdBand, selectedKey, router]);

  // 필터/선택 변경 시 URL 갱신 (writeUrl 식별자가 deps 변화에 따라 바뀜)
  useEffect(() => {
    writeUrl();
  }, [writeUrl]);

  // 지도 idle 시 현재 중심/줌을 URL에 반영 (state 미변경 → 맵 되먹임 없음)
  const handleMapViewChanged = useCallback(
    (lat: number, lng: number, z: number) => {
      mapViewRef.current = { lat, lng, zoom: z };
      writeUrl();
    },
    [writeUrl],
  );

  useEffect(() => {
    loadData(lawd_cd, boundsStr, property_type, dealType, areaBand, ageBand, householdBand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lawd_cd, boundsStr, property_type, dealType, areaBand, ageBand, householdBand]);

  // 단지 선택 시 상세 — React Query (캐시/중복제거/리페치)
  const { data: selectedDetail = null, isFetching: detailLoading } = useComplexDetail(selectedKey);

  const loadData = async (
    lc: string,
    bStr: string | null,
    pt: PropertyTypeFilter,
    dt: DealTypeFilter,
    ab: AreaBand,
    ag: AgeBand,
    hh: HouseholdBand,
  ) => {
    setLoading(true);
    try {
      // API deal: trade=매매, jeonse/wolse=rent (서버가 rent로 합쳐 가져옴), presale=분양권
      const apiDeal = dt === 'trade' ? 'trade' : dt === 'presale' ? 'presale_resale' : 'rent';

      type Tx = {
        complex_key: string;
        complex_name: string;
        price_manwon: number;
        deposit_manwon: number;
        monthly_manwon: number;
        exclusive_area: number | null;
        build_year: number | null;
      };
      type CoordEntry = { lat: number | null; lng: number | null; hhld_cnt: number | null; build_year: number | null };
      let txs: Tx[] = [];
      let complex_coords: Record<string, CoordEntry> = {};

      // bounds 모드 우선 시도
      if (bStr) {
        const res = await fetch(`/api/market/transactions?bounds=${bStr}&type=${pt}&deal=${apiDeal}&months=6`);
        if (res.ok) {
          const data = await res.json();
          txs = (data.transactions || []) as Tx[];
          complex_coords = data.complex_coords || {};
        }
      }

      // bounds 모드 결과 비어있거나 bounds 모드 자체를 안 거친 경우(초기/RegionPicker) → lawd_cd 모드 fallback.
      // 좌표 백필 진행 중 임시 안전망. 백필 완료되면 bounds 모드만으로 충분해짐.
      if (txs.length === 0) {
        // viewport 중심으로 가장 가까운 MVP_REGION 매핑 (bStr 있을 때만), 없으면 state lawd_cd 사용
        let fallbackLc = lc;
        if (bStr) {
          const parts = bStr.split(',').map(Number);
          if (parts.length === 4 && parts.every(Number.isFinite)) {
            const cLat = (parts[0] + parts[2]) / 2;
            const cLng = (parts[1] + parts[3]) / 2;
            let minDist = Infinity;
            for (const r of MVP_REGIONS) {
              const d = (r.lat - cLat) ** 2 + (r.lng - cLng) ** 2;
              if (d < minDist) { minDist = d; fallbackLc = r.lawd_cd; }
            }
          }
        }

        // 실거래 1~2개월 지연 고려, 최근 3개월 순차 시도
        const now = new Date();
        const candidateYms = [1, 2, 3].map((lag) => {
          const d = new Date(now.getFullYear(), now.getMonth() - lag, 1);
          return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
        });
        for (const ym of candidateYms) {
          const res = await fetch(`/api/market/transactions?lawd_cd=${fallbackLc}&ym=${ym}&type=${pt}&deal=${apiDeal}`);
          if (!res.ok) continue;
          const data = await res.json();
          const arr = (data.transactions || []) as Tx[];
          if (arr.length > 0) {
            txs = arr;
            complex_coords = data.complex_coords || {};
            break;
          }
        }
      }

      // 1차 필터: 거래 유형(매매/전세/월세/분양권) + 평형 + 연식
      const filtered = txs.filter((t) => {
        // dealType 분리 — presale은 price_manwon에 분양권 거래액
        if (dt === 'trade' && !(t.price_manwon || 0)) return false;
        if (dt === 'presale' && !(t.price_manwon || 0)) return false;
        if (dt === 'jeonse' && !((t.monthly_manwon || 0) === 0 && (t.deposit_manwon || 0) > 0)) return false;
        if (dt === 'wolse' && !(t.monthly_manwon || 0)) return false;
        // 평형 band
        if (!matchAreaBand(t.exclusive_area, ab)) return false;
        // 연식 band — build_year는 거래 raw 또는 complex_coords에서
        const buildYear = t.build_year ?? complex_coords[t.complex_key]?.build_year;
        if (!matchAgeBand(buildYear, ag)) return false;
        return true;
      });

      // 단지별 평균 집계 — dealType에 따라 다른 필드 사용
      const map = new Map<string, { name: string; deposits: number[]; monthlies: number[] }>();
      filtered.forEach((t) => {
        // trade/presale = price_manwon, jeonse/wolse = deposit_manwon
        const mainPrice = (dt === 'trade' || dt === 'presale') ? t.price_manwon : t.deposit_manwon;
        if (!mainPrice) return;
        if (!map.has(t.complex_key)) {
          map.set(t.complex_key, { name: t.complex_name, deposits: [], monthlies: [] });
        }
        const entry = map.get(t.complex_key)!;
        entry.deposits.push(mainPrice);
        if (dt === 'wolse' && t.monthly_manwon) {
          entry.monthlies.push(t.monthly_manwon);
        }
      });

      // 좌표: complex_coords 우선 사용, 없으면 jitter 폴백 (백필 완료 전까지)
      // 세대수 필터는 단지 단위에 적용 — 집계 후 단지별로 필터
      const pts: MapComplexPoint[] = Array.from(map.entries())
        .filter(([key]) => matchHouseholdBand(complex_coords[key]?.hhld_cnt, hh))
        .map(([key, v], i) => {
        const real = complex_coords[key];
        const hasReal = real && real.lat != null && real.lng != null;
        const avgDeposit = Math.round(v.deposits.reduce((a, b) => a + b, 0) / v.deposits.length);
        const avgMonthly = v.monthlies.length > 0
          ? Math.round(v.monthlies.reduce((a, b) => a + b, 0) / v.monthlies.length)
          : undefined;
        return {
          complex_key: key,
          complex_name: v.name,
          lat: hasReal ? real.lat! : center[0] + ((i % 9) - 4) * 0.003,
          lng: hasReal ? real.lng! : center[1] + ((Math.floor(i / 9) % 9) - 4) * 0.003,
          avg_price_manwon: avgDeposit,
          avg_monthly_manwon: avgMonthly,
          trade_count: v.deposits.length,
          property_type: pt,
        };
      });

      setPoints(pts);
    } catch (e) {
      console.error('[market] load error:', e);
      setPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedPoint = selectedKey ? points.find((p) => p.complex_key === selectedKey) : undefined;

  // 검색 결과 클릭 시 — 지도 이동 + 단지 선택. bounds 는 지도 idle에서 자동 갱신.
  const handleSearchSelect = useCallback((r: SearchResult) => {
    if (r.lat == null || r.lng == null) return;
    mapViewRef.current = { ...mapViewRef.current, lat: r.lat, lng: r.lng };
    setCenter([r.lat, r.lng]);
    setSelectedKey(r.complex_key);
  }, []);

  // 지도 idle 시 viewport bounds 갱신 → loadData(bounds 모드)로 자동 전환.
  // 같은 bounds 재발화는 boundsStr 비교로 자체 차단.
  const handleMapBoundsChanged = useCallback(
    (sw_lat: number, sw_lng: number, ne_lat: number, ne_lng: number) => {
      const next = `${sw_lat.toFixed(6)},${sw_lng.toFixed(6)},${ne_lat.toFixed(6)},${ne_lng.toFixed(6)}`;
      setBoundsStr((prev) => (prev === next ? prev : next));
    },
    [],
  );

  return (
    <div className="relative h-screen flex flex-col bg-market-bg font-jakarta">
      {NAVER_CLIENT_ID && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`}
          strategy="afterInteractive"
        />
      )}
      {/* 헤더 — 라이트 톤 */}
      <header className="bg-market-surface/95 backdrop-blur border-b border-market-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-market-surface-2 text-market-text-mute transition-colors"
            aria-label="메인으로"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold flex items-center gap-2 text-market-text flex-shrink-0">
            <MapPin className="w-4 h-4 text-deal-trade" />
            시세·거래량 지도
          </h1>
          <div className="flex-1 flex justify-center px-4 max-w-md mx-auto">
            <MarketSearch onSelect={handleSearchSelect} />
          </div>
          <Link
            href="/market/rankings"
            className="ml-auto text-xs px-3 py-1.5 bg-market-surface-2 hover:bg-market-border rounded-lg text-market-text-mute font-medium flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            랭킹
          </Link>
        </div>
      </header>

      {/* 필터바 — 라이트 톤 칩 */}
      <div className="bg-market-surface border-b border-market-border">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Filter className="w-3.5 h-3.5 text-market-text-faint flex-shrink-0" />
          {/* 거래 유형 */}
          <div className="flex gap-1 flex-shrink-0">
            <FilterChip active={dealType === 'trade'} activeColor="bg-deal-trade" onClick={() => setDealType('trade')}>매매</FilterChip>
            <FilterChip active={dealType === 'jeonse'} activeColor="bg-deal-jeonse" onClick={() => setDealType('jeonse')}>전세</FilterChip>
            <FilterChip active={dealType === 'wolse'} activeColor="bg-deal-wolse" onClick={() => setDealType('wolse')}>월세</FilterChip>
            <FilterChip active={dealType === 'presale'} activeColor="bg-[#7c3aed]" onClick={() => setDealType('presale')}>분양권</FilterChip>
          </div>
          <div className="mx-1 h-4 w-px bg-market-border" />
          {/* 매물 유형 */}
          <div className="flex gap-1 flex-shrink-0">
            <FilterChip active={property_type === 'apt'} activeColor="bg-market-text" onClick={() => setPropertyType('apt')}>아파트</FilterChip>
            <FilterChip active={property_type === 'officetel'} activeColor="bg-market-text" onClick={() => setPropertyType('officetel')}>오피스텔</FilterChip>
          </div>
          <div className="mx-1 h-4 w-px bg-market-border" />
          <RegionPicker current={lawd_cd} onSelect={(cd, lat, lng) => {
            mapViewRef.current = { ...mapViewRef.current, lat, lng };
            setLawdCd(cd);
            setCenter([lat, lng]);
            // bounds 리셋 → 지도가 setCenter 후 새 idle에서 새 bounds 발화
            setBoundsStr(null);
          }} />
          <div className="ml-auto text-[11px] text-market-text-faint flex items-center gap-1 flex-shrink-0 tabular-nums">
            <Building2 className="w-3 h-3" />
            {loading ? '로딩' : `${points.length}개 단지`}
          </div>
        </div>

        {/* 2번째 row — 세부 필터 popover (평형/연식/세대수) */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide border-t border-market-border/60 pt-2">
          <FilterPopover<AreaBand>
            label="평형"
            options={AREA_OPTIONS}
            value={areaBand}
            onChange={setAreaBand}
          />
          <FilterPopover<AgeBand>
            label="연식"
            options={AGE_OPTIONS}
            value={ageBand}
            onChange={setAgeBand}
          />
          <FilterPopover<HouseholdBand>
            label="세대수"
            options={HOUSEHOLD_OPTIONS}
            value={householdBand}
            onChange={setHouseholdBand}
          />
          {(areaBand !== 'all' || ageBand !== 'all' || householdBand !== 'all') && (
            <button
              onClick={() => {
                setAreaBand('all');
                setAgeBand('all');
                setHouseholdBand('all');
              }}
              className="text-[11px] text-market-text-mute hover:text-market-text px-2 py-1 underline underline-offset-2 decoration-dotted"
            >
              필터 초기화
            </button>
          )}

          {/* 차별화 레이어 토글 — 중개업소 / 구인공고 */}
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <LayerToggle
              active={showBrokers}
              onClick={() => setShowBrokers((v) => !v)}
              icon={<Store className="w-3 h-3" />}
              activeClass="bg-teal-600 text-white"
            >
              중개업소{showBrokers && brokerMarkers.length > 0 ? ` ${brokerMarkers.length}` : ''}
            </LayerToggle>
            <LayerToggle
              active={showJobs}
              onClick={() => setShowJobs((v) => !v)}
              icon={<Briefcase className="w-3 h-3" />}
              activeClass="bg-deal-trade text-white"
            >
              구인공고{showJobs && jobs.length > 0 ? ` ${jobs.length}` : ''}
            </LayerToggle>
          </div>
        </div>
      </div>

      {/* 메인 영역: 데스크탑 사이드바×2 + 지도 / 모바일 지도 + bottom sheet */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* 데스크탑 패널 A — 단지 정보 / KPI / 최근 거래 */}
        {selectedKey && (
          <aside className="hidden md:flex md:w-[380px] md:flex-col md:border-r md:border-market-border md:bg-market-surface md:shadow-sm flex-shrink-0 overflow-hidden">
            <MarketDetailPanel
              complexKey={selectedKey}
              point={selectedPoint}
              detail={selectedDetail}
              loading={detailLoading}
              dealType={dealType}
              onClose={() => setSelectedKey(null)}
            />
          </aside>
        )}

        {/* 데스크탑 패널 B — 큰 그래프 전용 */}
        {selectedKey && (
          <aside className="hidden lg:flex lg:w-[440px] lg:flex-col lg:border-r lg:border-market-border lg:bg-market-surface lg:shadow-sm flex-shrink-0 overflow-hidden">
            <MarketGraphPanel
              point={selectedPoint}
              detail={selectedDetail}
              loading={detailLoading}
              dealType={dealType}
              complexKey={selectedKey}
            />
          </aside>
        )}

        {/* 지도 영역 */}
        <div className="flex-1 relative min-w-0">
          <MarketMap
            center={center}
            zoom={zoom}
            points={points}
            onSelect={setSelectedKey}
            selectedKey={selectedKey}
            dealType={dealType}
            onBoundsChanged={handleMapBoundsChanged}
            onViewChanged={handleMapViewChanged}
            brokers={showBrokers ? brokerMarkers : undefined}
          />

          {/* 구인공고 오버레이 — 정밀 핀 대신 이 지역 채용 리스트 (jobs는 좌표 없음) */}
          {showJobs && (
            <div className="absolute top-3 left-3 z-10 w-[230px] max-h-[60%] bg-market-surface/97 backdrop-blur border border-market-border rounded-xl shadow-xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-market-border flex-shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-market-text">
                  <Briefcase className="w-3.5 h-3.5 text-deal-trade" />
                  이 지역 채용 {jobs.length}건
                </div>
                <button
                  onClick={() => setShowJobs(false)}
                  className="text-market-text-faint hover:text-market-text"
                  aria-label="닫기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain">
                {jobs.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[11px] text-market-text-faint">
                    이 지역 활성 공고가 없습니다
                  </div>
                ) : (
                  jobs.map((j) => (
                    <Link
                      key={j.id}
                      href={`/agent/jobs/${j.id}`}
                      className="block px-3 py-2 hover:bg-market-surface-2 transition-colors border-b border-market-border/40 last:border-b-0"
                    >
                      <div className="text-xs font-semibold text-market-text truncate">{j.title}</div>
                      <div className="text-[10px] text-market-text-mute mt-0.5 truncate">
                        {j.company || '회사명 비공개'}
                        {j.category ? ` · ${j.category}` : ''}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 모바일 bottom sheet — 단지 정보만 (그래프는 데스크탑 전용 v1.0) */}
        {selectedKey && (
          <div className="md:hidden absolute bottom-0 left-0 right-0 max-h-[75vh] bg-market-surface rounded-t-2xl shadow-2xl border-t border-market-border z-30 flex flex-col overflow-hidden">
            <MarketDetailPanel
              complexKey={selectedKey}
              point={selectedPoint}
              detail={selectedDetail}
              loading={detailLoading}
              dealType={dealType}
              onClose={() => setSelectedKey(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 라이트 톤 필터 칩
function FilterChip({
  active,
  activeColor,
  onClick,
  children,
}: {
  active: boolean;
  activeColor: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
        active
          ? `${activeColor} text-white font-semibold shadow-sm`
          : 'bg-market-surface-2 text-market-text-mute hover:bg-market-border'
      }`}
    >
      {children}
    </button>
  );
}

// 차별화 레이어 토글 칩 (중개업소/구인공고)
function LayerToggle({
  active,
  onClick,
  icon,
  activeClass,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] rounded-full font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
        active ? `${activeClass} font-semibold shadow-sm` : 'bg-market-surface-2 text-market-text-mute hover:bg-market-border'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// 드롭다운 필터 popover (평형/연식/세대수)
function FilterPopover<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = value !== options[0].value;
  const activeOption = options.find((o) => o.value === value);
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1 text-xs rounded-full font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
          isActive
            ? 'bg-market-text text-white font-semibold shadow-sm'
            : 'bg-market-surface-2 text-market-text-mute hover:bg-market-border'
        }`}
      >
        <span>{label}</span>
        {isActive && activeOption && (
          <span className="opacity-90">· {activeOption.label.split(' ')[0]}</span>
        )}
        <span className="text-[8px] ml-0.5">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 bg-market-surface border border-market-border rounded-xl shadow-xl z-40 py-1.5 min-w-[180px]">
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-xs text-left hover:bg-market-surface-2 transition-colors flex items-center justify-between ${
                    selected ? 'font-bold text-market-text' : 'text-market-text-mute'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected && <span className="text-deal-jeonse">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ========== 지역 선택 (간이) ==========
const MVP_REGIONS: Array<{ lawd_cd: string; name: string; lat: number; lng: number }> = [
  { lawd_cd: '11680', name: '서울 강남', lat: 37.5172, lng: 127.0473 },
  { lawd_cd: '11710', name: '서울 송파', lat: 37.5145, lng: 127.1060 },
  { lawd_cd: '11650', name: '서울 서초', lat: 37.4837, lng: 127.0323 },
  { lawd_cd: '11440', name: '서울 마포', lat: 37.5637, lng: 126.9085 },
  { lawd_cd: '11170', name: '서울 용산', lat: 37.5326, lng: 126.9906 },
  { lawd_cd: '41135', name: '성남 분당', lat: 37.3822, lng: 127.1186 },
  { lawd_cd: '41117', name: '수원 영통', lat: 37.2595, lng: 127.0460 },
  { lawd_cd: '41465', name: '용인 수지', lat: 37.3220, lng: 127.0976 },
];

function RegionPicker({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (lawd_cd: string, lat: number, lng: number) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
      {MVP_REGIONS.map((r) => (
        <button
          key={r.lawd_cd}
          onClick={() => onSelect(r.lawd_cd, r.lat, r.lng)}
          className={`px-3 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 font-medium transition-all ${
            current === r.lawd_cd
              ? 'bg-market-text text-white font-semibold shadow-sm'
              : 'bg-market-surface-2 text-market-text-mute hover:bg-market-border'
          }`}
        >
          {r.name}
        </button>
      ))}
    </div>
  );
}
