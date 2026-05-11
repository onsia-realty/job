/**
 * 단지 마스터 (complexes 테이블) 헬퍼.
 * - 좌표 lookup (Vworld geocoding)
 * - complex_key 단위 upsert
 * - jibun/road_address 정규화
 */

const VWORLD_KEY = process.env.VWORLD_API_KEY || process.env.NEXT_PUBLIC_VWORLD_KEY || '';

interface VworldPoint {
  lat: number;
  lng: number;
  source: 'road' | 'parcel';
}

export interface GeocodeResult {
  point: VworldPoint | null;
  debug: { hasKey: boolean; address: string; roadStatus: string; parcelStatus: string; lastError?: string };
}

/**
 * Vworld geocode — 도로명 우선, 실패 시 지번으로 재시도.
 * timeout 10s. 디버그 정보 함께 반환.
 */
export async function geocodeWithDebug(address: string): Promise<GeocodeResult> {
  const debug = { hasKey: !!VWORLD_KEY, address, roadStatus: '', parcelStatus: '', lastError: undefined as string | undefined };
  if (!VWORLD_KEY || !address.trim()) {
    debug.lastError = !VWORLD_KEY ? 'NO_KEY' : 'EMPTY_ADDRESS';
    return { point: null, debug };
  }

  const tryFetch = async (type: 'road' | 'parcel'): Promise<VworldPoint | null> => {
    const url =
      `https://api.vworld.kr/req/address?service=address&request=getcoord` +
      `&address=${encodeURIComponent(address)}&type=${type}&format=json&key=${VWORLD_KEY}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        if (type === 'road') debug.roadStatus = `HTTP_${res.status}`; else debug.parcelStatus = `HTTP_${res.status}`;
        return null;
      }
      const data = await res.json();
      const status = data?.response?.status || 'UNKNOWN';
      const errCode = data?.response?.error?.code || '';
      if (type === 'road') debug.roadStatus = `${status}${errCode ? '/' + errCode : ''}`;
      else debug.parcelStatus = `${status}${errCode ? '/' + errCode : ''}`;
      if (data.response?.result?.point) {
        return {
          lat: parseFloat(data.response.result.point.y),
          lng: parseFloat(data.response.result.point.x),
          source: type,
        } as VworldPoint;
      }
      return null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      debug.lastError = `${type}: ${msg}`;
      if (type === 'road') debug.roadStatus = 'EXCEPTION'; else debug.parcelStatus = 'EXCEPTION';
      return null;
    }
  };

  const point = (await tryFetch('road')) || (await tryFetch('parcel'));
  return { point, debug };
}

/** 디버그 정보 없는 간단 호출 — 기존 시그니처 호환 */
export async function geocodeAddress(address: string): Promise<VworldPoint | null> {
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
