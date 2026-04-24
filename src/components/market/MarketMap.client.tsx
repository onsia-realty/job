'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const VWORLD_KEY = process.env.NEXT_PUBLIC_VWORLD_KEY || '';
const VWORLD_TILE = `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Base/{z}/{y}/{x}.png`;

export interface MapComplexPoint {
  complex_key: string;
  complex_name: string;
  lat: number;
  lng: number;
  avg_price_manwon: number;          // 평균 매매가
  trade_count: number;
  growth_pct?: number | null;
  property_type: 'apt' | 'officetel' | 'villa' | 'store' | 'presale';
}

interface MarketMapProps {
  center: [number, number];          // [lat, lng]
  zoom?: number;
  points: MapComplexPoint[];
  onSelect?: (key: string) => void;
  height?: string;
}

function ViewUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom());
  }, [map, center, zoom]);
  return null;
}

// 마커 DivIcon — 시세 라벨
function makeDivIcon(point: MapComplexPoint): L.DivIcon {
  const price = point.avg_price_manwon;
  const label = price >= 10000
    ? `${Math.floor(price / 10000)}억${price % 10000 > 0 ? `${Math.round((price % 10000) / 100)}` : ''}`
    : `${price.toLocaleString()}`;
  const growth = point.growth_pct;
  const bg = point.property_type === 'officetel'
    ? 'rgba(244,114,182,0.92)'        // pink-400
    : 'rgba(34,211,238,0.92)';        // cyan-400
  const growthBadge = growth != null
    ? `<span class="ml-1 text-[9px] font-bold ${growth > 0 ? 'text-red-300' : 'text-blue-300'}">${growth > 0 ? '↑' : '↓'}${Math.abs(growth).toFixed(1)}%</span>`
    : '';

  return L.divIcon({
    className: 'market-price-marker',
    html: `
      <div style="
        background: ${bg};
        color: #0B0F14;
        padding: 3px 8px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 11px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        border: 1.5px solid rgba(255,255,255,0.5);
      ">
        ${label}${growthBadge}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function MarketMap({
  center,
  zoom = 13,
  points,
  onSelect,
  height = '100%',
}: MarketMapProps) {
  // 동일 좌표 중복 방지 (약간 흩뿌림)
  const jittered = useMemo(() => {
    return points.map((p, i) => ({
      ...p,
      _lat: p.lat + (i % 7) * 0.0001,
      _lng: p.lng + (i % 11) * 0.0001,
    }));
  }, [points]);

  return (
    <div style={{ height, width: '100%' }} className="relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          url={VWORLD_TILE}
          attribution='&copy; <a href="https://www.vworld.kr">VWorld</a>'
        />
        <ViewUpdater center={center} zoom={zoom} />
        {jittered.map((p) => (
          <Marker
            key={p.complex_key}
            position={[p._lat, p._lng]}
            icon={makeDivIcon(p)}
            eventHandlers={{
              click: () => onSelect?.(p.complex_key),
            }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-bold text-sm mb-1">{p.complex_name}</div>
                <div>평균 {Math.round(p.avg_price_manwon).toLocaleString()}만 · {p.trade_count}건</div>
                {p.growth_pct != null && (
                  <div className={p.growth_pct > 0 ? 'text-red-600' : 'text-blue-600'}>
                    월간 {p.growth_pct > 0 ? '+' : ''}{p.growth_pct.toFixed(1)}%
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/80 text-slate-300 text-sm px-4 py-2 rounded-lg border border-slate-700">
            이 지역의 최근 거래 데이터가 수집되지 않았습니다
          </div>
        </div>
      )}
    </div>
  );
}
