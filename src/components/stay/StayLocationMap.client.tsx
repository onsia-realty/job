'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

// window.naver 전역 타입은 MarketMap.client.tsx 가 `declare global` 로 이미 선언해 두었다.
// 여기서 재선언하면 중복 선언 충돌이 나므로, 필요한 최소 형태만 로컬로 좁혀 쓴다.
interface NaverMapLike {
  destroy?: () => void;
}
// cleanup 에서 지도 분리(setMap(null))만 하면 되므로 그 시그니처로 좁힌다.
interface NaverMarkerLike {
  setMap: (m: null) => void;
}

// SDK 로드 대기 — MarketMap.client.tsx 의 waitForNaverMaps 와 동일한 폴링 패턴.
// 인증 실패 시 SDK 가 window.naver.maps = null 로 박는 케이스까지 처리한다.
// cancel 신호를 받으면 언마운트 후 setState 가 일어나지 않게 조용히 종료한다.
function waitForNaverMaps(
  isCancelled: () => boolean,
  timeoutMs = 15000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (isCancelled()) return;
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

interface StayLocationMapProps {
  lat: number;
  lng: number;
  title: string;
}

/** 상세 페이지 위치 섹션 — 단일 매물 마커 1개짜리 미니 지도. */
export default function StayLocationMap({ lat, lng, title }: StayLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapLike | null>(null);
  const markerRef = useRef<NaverMarkerLike | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!NAVER_CLIENT_ID) return;

    let cancelled = false;

    waitForNaverMaps(() => cancelled)
      .then(() => {
        if (cancelled) return;
        const naver = window.naver;
        const container = containerRef.current;
        if (!naver || !container) return;

        const center = new naver.maps.LatLng(lat, lng);
        const map = new naver.maps.Map(container, {
          center,
          zoom: 16,
          zoomControl: true,
          zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
          scrollWheel: false,
        });
        mapRef.current = map;

        markerRef.current = new naver.maps.Marker({
          position: center,
          map,
          title,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
  }, [lat, lng, title]);

  // 지도 대신 보여줄 안내 박스 — 기존 플레이스홀더와 같은 톤.
  if (!NAVER_CLIENT_ID || failed) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
        지도를 불러오지 못했습니다. 주소를 참고해 주세요.
      </div>
    );
  }

  return (
    <>
      {/* ⚠️ 파라미터는 ncpKeyId — ncpClientId는 deprecated로 silent fail */}
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`}
        strategy="afterInteractive"
      />
      <div
        ref={containerRef}
        className="h-[260px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
      />
    </>
  );
}
