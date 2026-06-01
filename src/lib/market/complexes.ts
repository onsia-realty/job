/**
 * 단지 마스터 (complexes 테이블) 헬퍼.
 * - 좌표 lookup: NCP Naver Geocoding 우선 → VWorld fallback
 *   (Vercel 미국 리전 → VWorld 한국 정부 서버 502 만성 실패 우회. NCP는 한국 서버라 정상.)
 * - complex_key 단위 upsert
 * - jibun/road_address 정규화
 */

const NAVER_GEOCODE_CLIENT_ID = process.env.NAVER_GEOCODE_CLIENT_ID || '';
const NAVER_GEOCODE_CLIENT_SECRET = process.env.NAVER_GEOCODE_CLIENT_SECRET || '';
const VWORLD_KEY = process.env.VWORLD_API_KEY || process.env.NEXT_PUBLIC_VWORLD_KEY || '';

export type GeocodeSource = 'naver' | 'vworld_road' | 'vworld_parcel';

interface GeocodePoint {
  lat: number;
  lng: number;
  source: GeocodeSource;
}

export interface GeocodeResult {
  point: GeocodePoint | null;
  debug: {
    hasNaverKey: boolean;
    hasVworldKey: boolean;
    address: string;
    naverStatus: string;
    vworldRoadStatus: string;
    vworldParcelStatus: string;
    lastError?: string;
  };
}

async function geocodeNaver(address: string): Promise<{ point: GeocodePoint | null; status: string; error?: string }> {
  if (!NAVER_GEOCODE_CLIENT_ID || !NAVER_GEOCODE_CLIENT_SECRET) {
    return { point: null, status: 'NO_KEY' };
  }
  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'x-ncp-apigw-api-key-id': NAVER_GEOCODE_CLIENT_ID,
        'x-ncp-apigw-api-key': NAVER_GEOCODE_CLIENT_SECRET,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      return { point: null, status: `HTTP_${res.status}` };
    }
    const data = await res.json();
    const status = data?.status || 'UNKNOWN';
    const total = data?.meta?.totalCount ?? 0;
    if (total > 0 && data.addresses?.[0]) {
      const a = data.addresses[0];
      return {
        point: { lat: parseFloat(a.y), lng: parseFloat(a.x), source: 'naver' },
        status: `${status}/total=${total}`,
      };
    }
    return { point: null, status: `${status}/total=0` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { point: null, status: 'EXCEPTION', error: msg.slice(0, 80) };
  }
}

async function geocodeVworldType(
  address: string,
  type: 'road' | 'parcel',
): Promise<{ point: GeocodePoint | null; status: string; error?: string }> {
  const url =
    `https://api.vworld.kr/req/address?service=address&request=getcoord` +
    `&address=${encodeURIComponent(address)}&type=${type}&format=json&key=${VWORLD_KEY}`;
  let lastStatus = '';
  let lastError: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });
      if (!res.ok) {
        lastStatus = `HTTP_${res.status}`;
        if (res.status >= 500) continue;
        break;
      }
      const data = await res.json();
      const status = data?.response?.status || 'UNKNOWN';
      const errCode = data?.response?.error?.code || '';
      lastStatus = `${status}${errCode ? '/' + errCode : ''}`;
      if (data.response?.result?.point) {
        return {
          point: {
            lat: parseFloat(data.response.result.point.y),
            lng: parseFloat(data.response.result.point.x),
            source: type === 'road' ? 'vworld_road' : 'vworld_parcel',
          },
          status: lastStatus,
        };
      }
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastStatus = `EXCEPTION:${msg.slice(0, 30)}`;
      lastError = `${type} attempt ${attempt}: ${msg}`;
    }
  }
  return { point: null, status: lastStatus, error: lastError };
}

/**
 * Geocode 주소 — NCP Naver 우선, 실패 시 VWorld(도로명 → 지번) fallback.
 * NCP는 Vercel 미국 리전에서도 정상 동작. VWorld는 로컬/지역 IP에서만 신뢰 가능.
 */
export async function geocodeWithDebug(address: string): Promise<GeocodeResult> {
  const debug = {
    hasNaverKey: !!(NAVER_GEOCODE_CLIENT_ID && NAVER_GEOCODE_CLIENT_SECRET),
    hasVworldKey: !!VWORLD_KEY,
    address,
    naverStatus: '',
    vworldRoadStatus: '',
    vworldParcelStatus: '',
    lastError: undefined as string | undefined,
  };

  if (!address.trim()) {
    debug.lastError = 'EMPTY_ADDRESS';
    return { point: null, debug };
  }

  // 1) Naver geocode (한국 서버 → Vercel US에서도 정상)
  const naver = await geocodeNaver(address);
  debug.naverStatus = naver.status;
  if (naver.error) debug.lastError = `naver: ${naver.error}`;
  if (naver.point) {
    return { point: naver.point, debug };
  }

  // 2) VWorld fallback — 도로명 → 지번 순. Vercel에서는 대개 502이지만 niche 주소 위해 시도.
  if (VWORLD_KEY) {
    const road = await geocodeVworldType(address, 'road');
    debug.vworldRoadStatus = road.status;
    if (road.error) debug.lastError = `vworld: ${road.error}`;
    if (road.point) return { point: road.point, debug };

    const parcel = await geocodeVworldType(address, 'parcel');
    debug.vworldParcelStatus = parcel.status;
    if (parcel.error) debug.lastError = `vworld: ${parcel.error}`;
    if (parcel.point) return { point: parcel.point, debug };
  } else {
    debug.vworldRoadStatus = 'NO_KEY';
    debug.vworldParcelStatus = 'NO_KEY';
  }

  return { point: null, debug };
}

/** 디버그 정보 없는 간단 호출 — 기존 시그니처 호환 */
export async function geocodeAddress(address: string): Promise<GeocodePoint | null> {
  const { point } = await geocodeWithDebug(address);
  return point;
}

/**
 * MOLIT 거래 데이터에서 단지 주소를 추출.
 * 예: "서울특별시 강남구 도곡동 467" (sido + sigungu + dong + jibun)
 * Vworld는 sido prefix가 빠지면 jibun이 짧은 단지(예: '4')를 매칭 못 함.
 */
export function buildComplexAddress(opts: {
  sido?: string | null | undefined;
  sigungu: string | null | undefined;
  dong: string | null | undefined;
  jibun: string | null | undefined;
}): string {
  return [opts.sido, opts.sigungu, opts.dong, opts.jibun].filter(Boolean).join(' ').trim();
}

export interface ComplexRecord {
  complex_key: string;
  complex_name: string;
  lat: number | null;
  lng: number | null;
  road_address: string | null;
  jibun_address: string | null;
  sigungu_cd: string | null;
  bjdong_cd: string | null;
  property_type: string | null;
  geocode_source: string | null;
  geocoded_at: string | null;
}
