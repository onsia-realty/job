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

/**
 * Vworld geocode — 도로명 우선, 실패 시 지번으로 재시도.
 * timeout 5s. 실패 시 null 반환 (에러 throw하지 않음).
 */
export async function geocodeAddress(address: string): Promise<VworldPoint | null> {
  if (!VWORLD_KEY || !address.trim()) return null;

  const tryFetch = async (type: 'road' | 'parcel') => {
    const url =
      `https://api.vworld.kr/req/address?service=address&request=getcoord` +
      `&address=${encodeURIComponent(address)}&type=${type}&format=json&key=${VWORLD_KEY}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.response?.result?.point) {
        return {
          lat: parseFloat(data.response.result.point.y),
          lng: parseFloat(data.response.result.point.x),
          source: type,
        } as VworldPoint;
      }
      return null;
    } catch {
      return null;
    }
  };

  return (await tryFetch('road')) || (await tryFetch('parcel'));
}

/**
 * MOLIT 거래 데이터에서 단지 주소를 추출.
 * 예: "서울특별시 강남구 도곡동 467" (sigungu + dong + jibun)
 */
export function buildComplexAddress(opts: {
  sigungu: string | null | undefined;
  dong: string | null | undefined;
  jibun: string | null | undefined;
}): string {
  return [opts.sigungu, opts.dong, opts.jibun].filter(Boolean).join(' ').trim();
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
