'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 기본 마커 아이콘 설정 (CDN)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const VWORLD_KEY = process.env.NEXT_PUBLIC_VWORLD_KEY || '';
const VWORLD_TILE = `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Base/{z}/{y}/{x}.png`;

// 지도 중심 이동 컴포넌트
function MapMover({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [map, lat, lng]);
  return null;
}

interface VWorldMapProps {
  lat: number;
  lng: number;
  label?: string;
  height?: string;
}

export default function VWorldMap({ lat, lng, label, height = '200px' }: VWorldMapProps) {
  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url={VWORLD_TILE}
          attribution='&copy; <a href="https://www.vworld.kr">VWorld</a>'
        />
        <Marker position={[lat, lng]}>
          {label && <Popup>{label}</Popup>}
        </Marker>
        <MapMover lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
