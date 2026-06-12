/**
 * 단지 주변 정보 (학교/지하철/버스) — onsia-mapiapp에서 포팅.
 * ⚠️ 서버 전용 — schools.json(5.5MB)/subway-stations.json을 import하므로
 *    클라이언트 컴포넌트에서는 `import type`만 사용할 것.
 *
 * 데이터 출처:
 * - 학교: 전국초중등학교위치표준데이터 (data.go.kr, 정적 JSON)
 * - 지하철: 전국도시철도역사정보 표준데이터 (정적 JSON)
 * - 버스: 전국버스정류장위치정보 API (odcloud, DATA_GO_KR_API_KEY)
 */

import schoolsData from '@/data/schools.json';
import subwayStationsData from '@/data/subway-stations.json';
import seoulBusStopsData from '@/data/seoul-bus-stops.json';

// ── 공통 ──

/** Haversine 거리 (km) */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 도보 시간 (분) — 보행 속도 4km/h */
export function walkingMinutes(distanceKm: number): number {
  return Math.round((distanceKm / 4) * 60);
}

// ── 학교 ──

interface SchoolData {
  schoolId: string;
  schoolName: string;
  schoolType: string;      // 초등학교 | 중학교 | 고등학교
  foundationType: string;  // 공립 | 사립
  roadAddress: string;
  jibunAddress: string;
  latitude: number;
  longitude: number;
  sidoOffice: string;
  localOffice: string;
}

export interface NearbySchool {
  schoolName: string;
  schoolType: string;
  foundationType: string;
  lat: number;
  lng: number;
  distance: number;     // km
  walkingTime: number;  // 분
}

const schools: SchoolData[] = schoolsData as SchoolData[];

export function getNearbySchools(
  lat: number,
  lng: number,
  radiusKm = 1.5,
  limitPerType = 4,
): { elementary: NearbySchool[]; middle: NearbySchool[]; high: NearbySchool[] } {
  const within = schools
    .map((s) => {
      const distance = haversineKm(lat, lng, s.latitude, s.longitude);
      return { s, distance };
    })
    .filter((x) => x.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  const pick = (type: string) =>
    within
      .filter((x) => x.s.schoolType.includes(type))
      .slice(0, limitPerType)
      .map((x) => ({
        schoolName: x.s.schoolName,
        schoolType: x.s.schoolType,
        foundationType: x.s.foundationType,
        lat: x.s.latitude,
        lng: x.s.longitude,
        distance: Math.round(x.distance * 100) / 100,
        walkingTime: walkingMinutes(x.distance),
      }));

  return { elementary: pick('초등'), middle: pick('중학'), high: pick('고등') };
}

// ── 지하철 ──

interface SubwayStationData {
  stationId: string;
  stationName: string;
  lineName: string;
  isTransfer: boolean;
  transferLines: string | null;
  latitude: number;
  longitude: number;
}

export interface NearbySubway {
  stationName: string;
  lineName: string;
  lineNumber: string;   // 원형 뱃지용 — "3", "K", "S" 등
  lineColor: string;
  isTransfer: boolean;
  transferLines: string | null;
  lat: number;
  lng: number;
  distance: number;
  walkingTime: number;
}

const subwayStations: SubwayStationData[] = subwayStationsData as SubwayStationData[];

const LINE_COLORS: Record<string, string> = {
  '1호선': '#0052A4', '2호선': '#00A84D', '3호선': '#EF7C1C', '4호선': '#00A5DE',
  '5호선': '#996CAC', '6호선': '#CD7C2F', '7호선': '#747F00', '8호선': '#E6186C',
  '9호선': '#BDB092',
  경의중앙선: '#77C4A3', 분당선: '#F5A200', 경춘선: '#0C8E72', 신분당선: '#D4003B',
  공항철도: '#0090D2', 경강선: '#003DA5', 서해선: '#8FC31F', 수인분당선: '#F5A200',
  우이신설선: '#B7C452', 신림선: '#6789CA', 김포골드라인: '#AD8605',
  용인경전철: '#509F22', 의정부경전철: '#FDA600',
};

function lineColorOf(lineName: string): string {
  for (const [key, color] of Object.entries(LINE_COLORS)) {
    if (lineName.includes(key) || key.includes(lineName)) return color;
  }
  return '#666666';
}

/** 노선 번호/약칭 추출 — "3호선" → "3", "신분당선" → "S" (원형 뱃지용) */
function lineNumberOf(lineName: string): string {
  const m = lineName.match(/(\d+)호선/);
  if (m) return m[1];
  const special: Record<string, string> = {
    경의중앙: 'K', 수인분당: 'SB', 분당: 'B', 경춘: 'C', 신분당: 'S',
    공항철도: 'A', 경강: 'G', 서해: 'W', 우이신설: 'U', 신림: 'SL',
    김포골드라인: 'GF', 용인경전철: 'Y', 의정부경전철: 'UI',
  };
  for (const [key, value] of Object.entries(special)) {
    if (lineName.includes(key)) return value;
  }
  return lineName.slice(0, 1);
}

export function getNearbySubway(lat: number, lng: number, radiusKm = 2, limit = 4): NearbySubway[] {
  return subwayStations
    .map((st) => {
      const distance = haversineKm(lat, lng, st.latitude, st.longitude);
      return { st, distance };
    })
    .filter((x) => x.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((x) => ({
      stationName: x.st.stationName,
      lineName: x.st.lineName,
      lineNumber: lineNumberOf(x.st.lineName),
      lineColor: lineColorOf(x.st.lineName),
      isTransfer: x.st.isTransfer,
      transferLines: x.st.transferLines,
      lat: x.st.latitude,
      lng: x.st.longitude,
      distance: Math.round(x.distance * 100) / 100,
      walkingTime: walkingMinutes(x.distance),
    }));
}

// ── 버스 ──

export interface NearbyBus {
  stationName: string;
  cityName: string;
  lat: number;
  lng: number;
  distance: number;
  walkingTime: number;
}

interface SeoulBusStop {
  name: string;
  lat: number;
  lng: number;
  type: string;
}

// 서울 정류소 11,253개 — 서울 열린데이터광장 busStopLocationXyInfo 정적 변환
// (전국버스정류장위치정보(odcloud)는 서울 커버리지가 부실해 정적 데이터로 대체)
const seoulBusStops: SeoulBusStop[] = seoulBusStopsData as SeoulBusStop[];

function nearbySeoulBusStops(lat: number, lng: number, radiusKm: number, limit: number): NearbyBus[] {
  return seoulBusStops
    .map((s) => {
      const distance = haversineKm(lat, lng, s.lat, s.lng);
      return { s, distance };
    })
    .filter((x) => x.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((x) => ({
      stationName: x.s.name,
      cityName: '서울특별시',
      lat: x.s.lat,
      lng: x.s.lng,
      distance: Math.round(x.distance * 100) / 100,
      walkingTime: walkingMinutes(x.distance),
    }));
}

interface BusStopRow {
  정류장번호: string;
  정류장명: string;
  위도: string;
  경도: string;
  도시명: string;
}

const BUS_API =
  'https://api.odcloud.kr/api/15067528/v1/uddi:f74b9799-9db1-4754-a5d0-b66e2ae705f3';

/** 주소에서 버스 데이터 도시명 추출 — "서울특별시 강남구" → "서울", "경기도 용인시 수지구" → "용인" */
export function extractCityFromAddress(address: string): string {
  for (const part of address.split(' ')) {
    if (part.endsWith('특별시') || part.endsWith('광역시')) {
      return part.replace(/특별시$|광역시$/, '');
    }
    if (part.endsWith('시') || part.endsWith('군')) {
      return part.replace(/시$|군$/, '');
    }
  }
  return '';
}

export async function getNearbyBusStops(
  lat: number,
  lng: number,
  address: string,
  radiusKm = 0.6,
  limit = 5,
): Promise<NearbyBus[]> {
  const city = extractCityFromAddress(address);

  // 서울은 정적 데이터 (커버리지 완전 + 즉시 응답)
  if (city === '서울' || !city) {
    const seoul = nearbySeoulBusStops(lat, lng, radiusKm, limit);
    if (seoul.length > 0 || city === '서울') return seoul;
  }

  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey || !city) return [];

  try {
    // 도시 단위 결과는 일 단위로 캐시 (Next fetch cache)
    const url = `${BUS_API}?page=1&perPage=3000&cond[도시명::LIKE]=${encodeURIComponent(city)}&serviceKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: BusStopRow[] };

    return (data.data || [])
      .map((stop) => {
        const sLat = parseFloat(stop.위도);
        const sLng = parseFloat(stop.경도);
        if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) return null;
        const distance = haversineKm(lat, lng, sLat, sLng);
        return {
          stationName: stop.정류장명,
          cityName: stop.도시명,
          lat: sLat,
          lng: sLng,
          distance: Math.round(distance * 100) / 100,
          walkingTime: walkingMinutes(distance),
        };
      })
      .filter((s): s is NearbyBus => s !== null && s.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export interface Surroundings {
  schools: { elementary: NearbySchool[]; middle: NearbySchool[]; high: NearbySchool[] };
  subway: NearbySubway[];
  bus: NearbyBus[];
}
