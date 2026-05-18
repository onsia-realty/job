'use client';

import { useEffect, useRef, useState } from 'react';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

export type DealTypeFilter = 'trade' | 'jeonse' | 'wolse' | 'presale';

export interface MapComplexPoint {
  complex_key: string;
  complex_name: string;
  lat: number;
  lng: number;
  avg_price_manwon: number;          // trade=매매가, jeonse=보증금, wolse=보증금
  avg_monthly_manwon?: number;       // wolse일 때만 사용 (월세)
  trade_count: number;
  growth_pct?: number | null;
  property_type: 'apt' | 'officetel' | 'villa' | 'store' | 'presale';
}

interface MarketMapProps {
  center: [number, number];
  zoom?: number;
  points: MapComplexPoint[];
  onSelect?: (key: string) => void;
  selectedKey?: string | null;
  height?: string;
  dealType?: DealTypeFilter;
  onCenterChanged?: (lat: number, lng: number) => void;  // 지도 idle 시 콜백
}

// naver.maps 타입 선언 (공식 @types 없음)
declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => NaverMap;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (opts: object) => NaverMarker;
        Size: new (w: number, h: number) => object;
        Point: new (x: number, y: number) => object;
        Event: {
          addListener: (tgt: object, evt: string, fn: (...a: unknown[]) => void) => object;
          removeListener: (listener: object) => void;
        };
        Position: { BOTTOM_RIGHT: number; TOP_RIGHT: number };
        ZoomControlStyle: { SMALL: number };
      };
    };
  }
}

interface NaverMap {
  setCenter: (latlng: NaverLatLng) => void;
  setZoom: (z: number) => void;
  getCenter: () => NaverLatLng;
  destroy?: () => void;
}

interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

interface NaverMarker {
  setMap: (m: NaverMap | null) => void;
  getPosition: () => NaverLatLng;
}

// SDK는 페이지 레벨 <Script strategy="afterInteractive">로 로드.
// 여기서는 window.naver.maps 가 채워질 때까지 폴링.
// 단, 인증 실패 시 SDK가 window.naver.maps = null 로 박는 케이스도 처리.
function waitForNaverMaps(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const m = typeof window !== 'undefined' ? window.naver?.maps : null;
      if (m && typeof m.Map === 'function') {
        resolve();
        return;
      }
      // null 명시 박힘 = 인증 실패 신호
      if (typeof window !== 'undefined' && window.naver && window.naver.maps === null) {
        reject(new Error('네이버 지도 SDK 인증 실패 (NCP 화이트리스트 확인 필요)'));
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('네이버 지도 SDK 로드 타임아웃'));
        return;
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}

// 5분위 색상 (낮음→높음). 라이트 톤 — globals.css의 --color-quintile-N과 동일.
const QUINTILE_COLORS = [
  '#94a3b8',  // Q1 Slate-400  — 저가
  '#0ea5e9',  // Q2 Sky-500
  '#f59e0b',  // Q3 Amber-500
  '#ea580c',  // Q4 Orange-600
  '#be123c',  // Q5 Rose-700   — 고가
];

function quintileOf(price: number, sortedPrices: number[]): number {
  if (sortedPrices.length === 0) return 2;
  // index of price in sortedPrices (or where it would be)
  let lo = 0, hi = sortedPrices.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedPrices[mid] < price) lo = mid + 1;
    else hi = mid;
  }
  const ratio = lo / sortedPrices.length; // 0..1
  return Math.min(4, Math.floor(ratio * 5));
}

function formatPriceLabel(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rest = manwon % 10000;
    return rest > 0 ? `${eok}억${Math.round(rest / 100)}` : `${eok}억`;
  }
  return manwon.toLocaleString();
}

function buildMarkerHTML(p: MapComplexPoint, quintile: number, isSelected: boolean, dealType: DealTypeFilter = 'trade'): string {
  const priceLabel = formatPriceLabel(p.avg_price_manwon);
  // 거래 유형에 따라 라벨 형식 변경
  const label = dealType === 'wolse' && p.avg_monthly_manwon
    ? `${priceLabel}/${p.avg_monthly_manwon}`     // 1억/100 (보증금/월세)
    : dealType === 'jeonse'
    ? `전 ${priceLabel}`                          // 전 9억
    : dealType === 'presale'
    ? `분 ${priceLabel}`                          // 분 12억 (분양권)
    : priceLabel;                                 // 18.5억 (매매)
  const growth = p.growth_pct;
  const bg = QUINTILE_COLORS[quintile];

  // 변동률 뱃지 (매매 탭만)
  const growthBadge = (dealType === 'trade' && growth != null)
    ? `<span style="margin-left:3px;font-size:9px;font-weight:700;opacity:0.92;">${growth > 0 ? '↑' : '↓'}${Math.abs(growth).toFixed(1)}%</span>`
    : '';

  // 단지명 9자 컷
  const nameRaw = p.complex_name || '';
  const nameLabel = nameRaw.length > 9 ? `${nameRaw.slice(0, 8)}…` : nameRaw;

  // 오피스텔 식별 점
  const typeDot = p.property_type === 'officetel'
    ? `<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#fff;opacity:0.9;margin-right:4px;vertical-align:middle;box-shadow:0 0 0 1.5px ${bg};"></span>`
    : '';

  // 선택 상태에 따른 wrapper / 그림자
  const wrapperTransform = isSelected
    ? `transform: translate(-50%, -100%) scale(1.18);`
    : `transform: translate(-50%, -100%);`;
  const wrapperZ = isSelected ? 1000 : (p.property_type === 'officetel' ? 50 : 100);
  const innerShadow = isSelected
    ? `box-shadow: 0 0 0 3px #ffffff, 0 0 0 5px ${bg}, 0 14px 28px -6px rgba(0,0,0,0.32), 0 4px 8px rgba(0,0,0,0.15);`
    : `box-shadow: 0 6px 16px -4px rgba(0,0,0,0.22), 0 2px 4px rgba(0,0,0,0.08);`;

  return `
    <div style="
      ${wrapperTransform}
      z-index: ${wrapperZ};
      cursor: pointer;
      transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    ">
      <div style="
        background: ${bg};
        color: #ffffff;
        padding: 6px 11px 5px;
        border-radius: 12px 12px 12px 3px;
        ${innerShadow}
        border: 1.5px solid rgba(255,255,255,0.92);
        font-family: 'Plus Jakarta Sans', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        text-align: center;
        font-variant-numeric: tabular-nums;
        min-width: 56px;
        max-width: 120px;
      ">
        <div style="
          font-size: 13px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          white-space: nowrap;
        ">
          ${typeDot}${label}${growthBadge}
        </div>
        <div style="
          font-size: 9.5px;
          font-weight: 500;
          line-height: 1.25;
          opacity: 0.94;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          ${nameLabel}
        </div>
      </div>
    </div>
  `;
}

export default function MarketMap({
  center,
  zoom = 13,
  points,
  onSelect,
  selectedKey = null,
  height = '100%',
  dealType = 'trade',
  onCenterChanged,
}: MarketMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const onCenterChangedRef = useRef(onCenterChanged);
  onCenterChangedRef.current = onCenterChanged;

  useEffect(() => {
    if (!NAVER_CLIENT_ID) {
      setLoadError('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다');
      return;
    }
    if (!containerRef.current) return;

    let cancelled = false;

    waitForNaverMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.naver?.maps) return;
        const { naver } = window;
        const map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(center[0], center[1]),
          zoom,
          minZoom: 8,
          maxZoom: 19,
          scaleControl: false,
          logoControl: true,
          mapDataControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT,
            style: naver.maps.ZoomControlStyle.SMALL,
          },
        });
        mapRef.current = map;

        // idle = panning/zoom 종료 시 발생. 중심 좌표 콜백 전달.
        naver.maps.Event.addListener(map, 'idle', () => {
          const c = map.getCenter();
          onCenterChangedRef.current?.(c.lat(), c.lng());
        });
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => {
        try { m.setMap(null); } catch { /* SDK internal state, ignore */ }
      });
      markersRef.current = [];
      // map.destroy() 호출 시 Naver SDK 내부 상태가 깨져
      // 재마운트(Strict Mode / dynamic import) 때 Marker 생성 실패 발생.
      // 컨테이너 DOM 제거로 GC에 맡기는 게 안전.
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return;
    mapRef.current.setCenter(new window.naver.maps.LatLng(center[0], center[1]));
    mapRef.current.setZoom(zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.Marker || !naver.maps.LatLng) return;

    markersRef.current.forEach((m) => {
      try { m.setMap(null); } catch { /* ignore stale marker */ }
    });
    markersRef.current = [];

    // 5분위 계산용 정렬된 가격 배열 (binary search lookup)
    const sortedPrices = points.map((p) => p.avg_price_manwon).sort((a, b) => a - b);

    const makeMarker = (p: MapComplexPoint, idx: number) => {
      try {
        const jitterLat = p.lat + (idx % 7) * 0.0001;
        const jitterLng = p.lng + (idx % 11) * 0.0001;
        const q = quintileOf(p.avg_price_manwon, sortedPrices);
        const isSelected = selectedKey === p.complex_key;
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(jitterLat, jitterLng),
          map: mapRef.current,
          icon: {
            content: buildMarkerHTML(p, q, isSelected, dealType),
            size: new naver.maps.Size(0, 0),
            anchor: new naver.maps.Point(0, 0),
          },
          zIndex: isSelected ? 1000 : (p.property_type === 'officetel' ? 50 : 100),
        });
        naver.maps.Event.addListener(marker, 'click', () => {
          onSelect?.(p.complex_key);
        });
        return marker;
      } catch {
        return null;
      }
    };

    markersRef.current = points
      .map(makeMarker)
      .filter((m): m is NaverMarker => m !== null);
  }, [points, onSelect, selectedKey, dealType]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F14] text-slate-400 text-sm px-4 text-center">
        <div>
          <p className="mb-2">{loadError}</p>
          <p className="text-xs text-slate-500">Vercel 환경변수 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 확인 필요</p>
        </div>
      </div>
    );
  }

  // outer는 부모(`flex-1 relative`)의 빈 공간을 absolute로 채움
  // CSS flex item 안에서 height:100% 가 0으로 계산되는 케이스 회피
  return (
    <div
      style={height === '100%' ? { position: 'absolute', inset: 0 } : { height, width: '100%' }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 text-market-text-mute text-sm px-4 py-2.5 rounded-xl border border-market-border shadow-lg font-jakarta">
            이 지역의 최근 거래 데이터가 아직 수집되지 않았습니다
          </div>
        </div>
      )}
    </div>
  );
}
