import { NextRequest, NextResponse } from 'next/server';
import {
  getNearbySchools,
  getNearbySubway,
  getNearbyBusStops,
  type Surroundings,
} from '@/lib/market/surroundings';

/**
 * GET /api/market/surroundings?lat=&lng=&address=
 * 단지 주변 학교(1.5km)/지하철(2km)/버스 정류장(0.6km) — 상세 패널 "인근" 탭용.
 * 학교/지하철은 정적 데이터(즉시), 버스는 odcloud API(도시 단위 일 캐시).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const address = searchParams.get('address') || '';

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat/lng required' }, { status: 400 });
  }

  try {
    const [schools, subway, bus] = await Promise.all([
      Promise.resolve(getNearbySchools(lat, lng)),
      Promise.resolve(getNearbySubway(lat, lng)),
      getNearbyBusStops(lat, lng, address),
    ]);

    const body: Surroundings = { schools, subway, bus };
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[market/surroundings] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
