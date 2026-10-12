'use client';

// 단기임대(/stay) 목록 지도 — 네모(nemoapp.kr/store)식 "가격 라벨이 지도 위에 직접 뜨는" 마커.
//
// 이 파일은 src/components/market/MarketMap.client.tsx 의 구조를 그대로 이식한 것이다.
// (SDK 폴링 로드 / idle → bounds·view 콜백 / 마커 diff 렌더 / destroy() 대신 GC 위임)
// 시세지도 코드는 수정 금지라 공통화 대신 복사해서 쓴다. 추후 공통 훅으로 뽑을 여지 있음.
//
// ⚠️ 네이버 SDK 스크립트 파라미터는 ncpKeyId 다. 옛 ncpClientId 는 조용히 실패한다.
//    (스크립트 태그 자체는 부모 페이지가 <Script strategy="afterInteractive"> 로 넣는다)

import { useEffect, useRef, useState } from 'react';
import { formatStayPrice, formatWon } from '@/lib/stay/format';
import type { Stay } from '@/types/stay';
import {
  buildAggMarkerHTML,
  buildMarkerHTML as buildDealMarkerHTML,
  type MapAggregatePoint,
  type MapComplexPoint,
} from '@/lib/market/marker-html';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

// window.naver 전역 타입은 MarketMap.client.tsx 가 `declare global` 로 이미 선언해 두었다.
// 여기서 재선언하면 중복 선언 충돌이 나므로, 필요한 최소 형태만 로컬로 좁혀 쓴다.
// (StayLocationMap.client.tsx 가 쓰는 것과 같은 회피법)
interface NaverMapLike {
  setCenter: (latlng: unknown) => void;
  setZoom: (z: number) => void;
  getCenter: () => { lat: () => number; lng: () => number };
  getZoom: () => number;
  getBounds: () => {
    getMin: () => { lat: () => number; lng: () => number }; // SW
    getMax: () => { lat: () => number; lng: () => number }; // NE
  };
}

interface NaverMarkerLike {
  setMap: (m: NaverMapLike | null) => void;
  setPosition: (latlng: unknown) => void;
  setIcon: (icon: { content: string; size: object; anchor: object }) => void;
  setZIndex: (z: number) => void;
}

// 렌더마다 새 배열이 생기면 마커 effect 가 매번 재실행된다 — 기본값은 모듈 상수로 공유.
const NO_AGGREGATES: MapAggregatePoint[] = [];

// ── 마커 z-index 정책 ──
// 우리 매물 > 실거래가 항상 보장돼야 한다. 실거래는 가격 판단을 돕는 배경이고,
// 전환 대상(클릭해서 문의로 이어질 대상)은 우리 매물이기 때문이다.
const Z_STAY_ACTIVE = 1000; // 선택/hover 매물
const Z_STAY = 100;         // 일반 매물
const Z_DEAL_AGG = 45;      // 실거래 동 집계 (개별보다 위 — 둘이 동시에 뜨는 일은 없지만 순서를 명시)
const Z_DEAL = 40;          // 실거래 개별 단지

/** 지도에 찍을 최소 정보 — Stay 행에서 필요한 것만 추린다. */
export interface StayMapPoint {
  id: string;
  lat: number;
  lng: number;
  deposit_won: number | null;
  monthly_fee_won: number | null;
  weekly_fee_won: number | null;
  owner_type: Stay['owner_type'];
  deal_type: Stay['deal_type'];
  floor: number | null;
}

interface StayMapProps {
  center: [number, number];
  zoom?: number;
  points: StayMapPoint[];
  /**
   * 실거래 레이어 마커(시세지도 `/market` 과 동일한 집 모양). 만원 단위 도메인이라
   * `points`(원 단위)와 절대 섞지 않는다. 별도 캐시로 관리하며 클릭 핸들러는 없다.
   */
  dealPoints?: MapComplexPoint[];
  /** 실거래 동(洞) 집계 마커 — `dealMarkerMode === 'dong'` 일 때만 그린다. */
  dealAggregates?: MapAggregatePoint[];
  /** 줌 구간별 실거래 마커 모드. 'none' 이면 실거래를 아무것도 그리지 않는다. */
  dealMarkerMode?: 'complex' | 'dong' | 'none';
  /** 클릭·호버로 강조된 매물 id */
  selectedId?: string | null;
  /** 목록 카드 hover 시 지도 마커를 같이 강조 */
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  /** idle 시 SW/NE 모서리 좌표 — bounds 기반 목록 조회용 */
  onBoundsChanged?: (sw_lat: number, sw_lng: number, ne_lat: number, ne_lng: number) => void;
  /** idle 시 중심+줌 — URL 동기화(딥링크)용 */
  onViewChanged?: (lat: number, lng: number, zoom: number) => void;
}

// SDK는 페이지 레벨 <Script strategy="afterInteractive">로 로드.
// 여기서는 window.naver.maps 가 채워질 때까지 폴링. 인증 실패 시 SDK 가
// window.naver.maps = null 로 박는 케이스도 처리한다. (MarketMap 과 동일)
function waitForNaverMaps(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const m = typeof window !== 'undefined' ? window.naver?.maps : null;
      if (m && typeof m.Map === 'function') {
        resolve();
        return;
      }
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

const MARKER_ACCENT = '#2563EB';
const MARKER_TEXT = '#1E1E23';
const MARKER_BORDER = '#E2E4E8';
const MARKER_FONT = `'Plus Jakarta Sans', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

/**
 * 가격 라벨 마커 — 네모처럼 흰 박스 + 굵은 가격(1줄) + 작은 보조정보(층/보증금).
 * 시세지도의 "집 모양(지붕+본문)" 대신 네모식 단순 pill 을 쓴다: 단기임대는 대표면적 개념이
 * 없어 지붕에 넣을 값이 없기 때문이다.
 */
function buildMarkerHTML(p: StayMapPoint, isActive: boolean): string {
  const isWeeklyHost = p.owner_type === 'owner' && p.deal_type === 'short_term' &&
    p.weekly_fee_won != null && Number.isFinite(p.weekly_fee_won) && p.weekly_fee_won > 0;
  const primary = isWeeklyHost
    ? formatStayPrice({ ...p, deposit_won: null })
    : p.monthly_fee_won != null ? `월 ${formatWon(p.monthly_fee_won)}` : formatWon(p.deposit_won);

  // 2줄: 보증금 + 층. 월세가 주인공일 때만 보증금을 보조로 내린다.
  const subParts: string[] = [];
  if ((isWeeklyHost || p.monthly_fee_won != null) && p.deposit_won != null) {
    subParts.push(isWeeklyHost ? `보증 ${p.deposit_won.toLocaleString('ko-KR')}원` : `보증 ${formatWon(p.deposit_won)}`);
  }
  if (p.floor != null) subParts.push(`${p.floor}층`);
  const secondaryHtml = subParts.length
    ? `<div style="font-size:10px;font-weight:600;line-height:1.25;opacity:0.72;white-space:nowrap;">${subParts.join(' · ')}</div>`
    : '';

  const bg = isActive ? MARKER_ACCENT : '#ffffff';
  const color = isActive ? '#ffffff' : MARKER_TEXT;
  const border = isActive ? MARKER_ACCENT : MARKER_BORDER;
  const shadow = isActive
    ? 'filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35));'
    : 'filter: drop-shadow(0 3px 8px rgba(0,0,0,0.22));';
  const scale = isActive ? ' scale(1.08)' : '';

  return `
    <div style="
      transform: translate(-50%, -100%)${scale};
      transform-origin: 50% 100%;
      z-index: ${isActive ? 1000 : 100};
      cursor: pointer;
      transition: transform 0.15s ease-out;
      position: relative;
    ">
      <div style="${shadow}">
        <div style="
          background: ${bg};
          color: ${color};
          border: 1px solid ${border};
          border-radius: 6px;
          padding: 3px 9px 4px;
          font-family: ${MARKER_FONT};
          font-variant-numeric: tabular-nums;
          text-align: center;
          white-space: nowrap;
        ">
          <div style="font-size:13px;font-weight:800;line-height:1.25;letter-spacing:-0.02em;">${primary}</div>
          ${secondaryHtml}
        </div>
        <div style="
          width:0;height:0;margin:-1px auto 0;
          border-left:5px solid transparent;border-right:5px solid transparent;
          border-top:6px solid ${bg};
        "></div>
      </div>
    </div>
  `;
}

export default function StayMap({
  center,
  zoom = 13,
  points,
  dealPoints = [],
  dealAggregates = NO_AGGREGATES,
  dealMarkerMode = 'complex',
  selectedId = null,
  hoveredId = null,
  onSelect,
  onBoundsChanged,
  onViewChanged,
}: StayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapLike | null>(null);
  // id별 마커 + 마지막 렌더 HTML/좌표 캐시 (변경분만 setIcon/setPosition — MarketMap 의 diff 패턴)
  const markersRef = useRef<Map<string, { marker: NaverMarkerLike; html: string; lat: number; lng: number }>>(
    new Map()
  );
  // 실거래 마커는 매물 마커와 완전히 분리된 캐시로 둔다 (id 공간 충돌 방지 + 레이어 전환 시 독립 정리)
  const dealMarkersRef = useRef<Map<string, { marker: NaverMarkerLike; html: string; lat: number; lng: number }>>(
    new Map()
  );
  // 집계 마커는 수가 적어 diff 없이 전량 재생성한다 (MarketMap 과 동일).
  const aggMarkersRef = useRef<NaverMarkerLike[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onBoundsChangedRef = useRef(onBoundsChanged);
  onBoundsChangedRef.current = onBoundsChanged;
  const onViewChangedRef = useRef(onViewChanged);
  onViewChangedRef.current = onViewChanged;

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
            // 우상단은 레이어 토글(매물/실거래)이 쓴다 → 줌 컨트롤은 우하단으로 비킨다.
            position: naver.maps.Position.BOTTOM_RIGHT,
            style: naver.maps.ZoomControlStyle.SMALL,
          },
        }) as unknown as NaverMapLike;
        mapRef.current = map;

        const emit = () => {
          const c = map.getCenter();
          try {
            onViewChangedRef.current?.(c.lat(), c.lng(), map.getZoom());
          } catch {
            /* ignore */
          }
          if (onBoundsChangedRef.current) {
            try {
              const b = map.getBounds();
              const sw = b.getMin();
              const ne = b.getMax();
              onBoundsChangedRef.current(sw.lat(), sw.lng(), ne.lat(), ne.lng());
            } catch {
              /* SDK 인스턴스 상태 이슈 — 무시 */
            }
          }
        };

        // idle = panning/zoom 종료 시 발생
        naver.maps.Event.addListener(map as unknown as object, 'idle', emit);
        // 초기 마운트 직후에도 한 번 발화 (첫 idle 전에 목록을 채우려고)
        setTimeout(() => {
          if (!cancelled) emit();
        }, 0);
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach(({ marker }) => {
        try {
          marker.setMap(null);
        } catch {
          /* SDK internal state, ignore */
        }
      });
      markersRef.current = new Map();
      dealMarkersRef.current.forEach(({ marker }) => {
        try {
          marker.setMap(null);
        } catch {
          /* SDK internal state, ignore */
        }
      });
      dealMarkersRef.current = new Map();
      aggMarkersRef.current.forEach((marker) => {
        try {
          marker.setMap(null);
        } catch {
          /* SDK internal state, ignore */
        }
      });
      aggMarkersRef.current = [];
      // map.destroy() 를 부르면 Naver SDK 내부 상태가 깨져 재마운트 시 Marker 생성이 실패한다.
      // 컨테이너 DOM 제거로 GC 에 맡기는 게 안전. (MarketMap 과 동일한 결론)
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 부모가 center/zoom 을 바꿀 때만 지도 이동 (지도 자체의 idle 로는 되먹이지 않는다)
  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return;
    mapRef.current.setCenter(new window.naver.maps.LatLng(center[0], center[1]));
    mapRef.current.setZoom(zoom);
  }, [center, zoom]);

  // 마커 diff 렌더 — 사라진 것 제거 / 신규 생성 / 변경분만 setIcon
  useEffect(() => {
    if (!mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.Marker || !naver.maps.LatLng) return;

    const existing = markersRef.current;
    const nextIds = new Set(points.map((p) => p.id));

    for (const [id, entry] of existing) {
      if (!nextIds.has(id)) {
        try {
          entry.marker.setMap(null);
        } catch {
          /* ignore stale marker */
        }
        existing.delete(id);
      }
    }

    for (const p of points) {
      const isActive = selectedId === p.id || hoveredId === p.id;
      const html = buildMarkerHTML(p, isActive);
      const zIndex = isActive ? Z_STAY_ACTIVE : Z_STAY;
      const entry = existing.get(p.id);

      if (entry) {
        try {
          if (entry.html !== html) {
            entry.marker.setIcon({
              content: html,
              size: new naver.maps.Size(0, 0),
              anchor: new naver.maps.Point(0, 0),
            });
            entry.marker.setZIndex(zIndex);
            entry.html = html;
          }
          if (entry.lat !== p.lat || entry.lng !== p.lng) {
            entry.marker.setPosition(new naver.maps.LatLng(p.lat, p.lng));
            entry.lat = p.lat;
            entry.lng = p.lng;
          }
        } catch {
          /* ignore */
        }
        continue;
      }

      try {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(p.lat, p.lng),
          map: mapRef.current,
          icon: {
            content: html,
            size: new naver.maps.Size(0, 0),
            anchor: new naver.maps.Point(0, 0),
          },
          zIndex,
        }) as unknown as NaverMarkerLike;
        const id = p.id;
        naver.maps.Event.addListener(marker as unknown as object, 'click', () => {
          onSelectRef.current?.(id);
        });
        existing.set(id, { marker, html, lat: p.lat, lng: p.lng });
      } catch {
        /* ignore */
      }
    }
  }, [points, selectedId, hoveredId]);

  // 실거래 개별(단지) 마커 diff 렌더 — 매물 마커와 같은 패턴, 별도 캐시.
  // zIndex 는 매물(100/1000)보다 낮은 40: 우리 매물이 주인공이다.
  // 선택 상태 없음(isSelected=false), 클릭 핸들러 없음 — 매물 선택 상태를 건드리지 않는다.
  useEffect(() => {
    if (!mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.Marker || !naver.maps.LatLng) return;

    const existing = dealMarkersRef.current;

    // 집계/미표시 모드에서는 개별 마커를 전부 걷어낸다 (MarketMap 의 집계 모드 동작과 동일).
    if (dealMarkerMode !== 'complex') {
      for (const [, entry] of existing) {
        try {
          entry.marker.setMap(null);
        } catch {
          /* ignore stale marker */
        }
      }
      existing.clear();
      return;
    }

    const nextKeys = new Set(dealPoints.map((p) => p.complex_key));

    for (const [key, entry] of existing) {
      if (!nextKeys.has(key)) {
        try {
          entry.marker.setMap(null);
        } catch {
          /* ignore stale marker */
        }
        existing.delete(key);
      }
    }

    for (const p of dealPoints) {
      // 만원 단위 값을 그대로 넘긴다 (formatKoreanPrice 가 만원 입력 전제)
      const html = buildDealMarkerHTML(p, false, 'wolse');
      const entry = existing.get(p.complex_key);

      if (entry) {
        try {
          if (entry.html !== html) {
            entry.marker.setIcon({
              content: html,
              size: new naver.maps.Size(0, 0),
              anchor: new naver.maps.Point(0, 0),
            });
            entry.html = html;
          }
          if (entry.lat !== p.lat || entry.lng !== p.lng) {
            entry.marker.setPosition(new naver.maps.LatLng(p.lat, p.lng));
            entry.lat = p.lat;
            entry.lng = p.lng;
          }
        } catch {
          /* ignore */
        }
        continue;
      }

      try {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(p.lat, p.lng),
          map: mapRef.current,
          icon: {
            content: html,
            size: new naver.maps.Size(0, 0),
            anchor: new naver.maps.Point(0, 0),
          },
          zIndex: Z_DEAL,
        }) as unknown as NaverMarkerLike;
        existing.set(p.complex_key, { marker, html, lat: p.lat, lng: p.lng });
      } catch {
        /* ignore */
      }
    }
  }, [dealPoints, dealMarkerMode]);

  // 실거래 동(洞) 집계 마커 — 줌아웃 구간에서 개별 마커 대신 뿌린다.
  // 수가 적어 diff 없이 전량 재생성. 클릭하면 해당 동으로 드릴다운(z14 = 단지 개별 구간).
  useEffect(() => {
    if (!mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.Marker || !naver.maps.LatLng) return;

    aggMarkersRef.current.forEach((m) => {
      try {
        m.setMap(null);
      } catch {
        /* ignore */
      }
    });
    aggMarkersRef.current = [];

    if (dealMarkerMode !== 'dong' || dealAggregates.length === 0) return;

    aggMarkersRef.current = dealAggregates
      .map((a) => {
        try {
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(a.lat, a.lng),
            map: mapRef.current,
            icon: {
              // 월세 레이어이므로 "보증금/월세" 병기
              content: buildAggMarkerHTML(a, 'dong', 'wolse'),
              size: new naver.maps.Size(0, 0),
              anchor: new naver.maps.Point(0, 0),
            },
            zIndex: Z_DEAL_AGG,
          }) as unknown as NaverMarkerLike;
          naver.maps.Event.addListener(marker as unknown as object, 'click', () => {
            const map = mapRef.current;
            if (!map || !window.naver?.maps) return;
            map.setCenter(new window.naver.maps.LatLng(a.lat, a.lng));
            map.setZoom(14);
          });
          return marker;
        } catch {
          return null;
        }
      })
      .filter((m): m is NaverMarkerLike => m !== null);
  }, [dealAggregates, dealMarkerMode]);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 px-4 text-center text-sm text-slate-500">
        <div>
          <p className="mb-2">{loadError}</p>
          <p className="text-xs text-slate-400">환경변수 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 확인 필요</p>
        </div>
      </div>
    );
  }

  // 부모(`flex-1 relative`)의 빈 공간을 absolute 로 채운다.
  // CSS flex item 안에서 height:100% 가 0 으로 계산되는 케이스 회피. (메모리: flex_height_100pct_trap)
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
