import { NextRequest, NextResponse } from 'next/server';

const VWORLD_KEY = process.env.VWORLD_API_KEY || process.env.NEXT_PUBLIC_VWORLD_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  if (!VWORLD_KEY) {
    console.error('Geocode: VWorld API key not configured');
    return NextResponse.json({ error: 'VWorld API key not configured' }, { status: 500 });
  }

  // 도로명 주소로 먼저 시도
  try {
    const roadUrl =
      `https://api.vworld.kr/req/address?service=address&request=getcoord` +
      `&address=${encodeURIComponent(address)}&type=road&format=json&key=${VWORLD_KEY}`;

    const roadRes = await fetch(roadUrl, { signal: AbortSignal.timeout(5000) });

    if (!roadRes.ok) {
      console.error('Geocode road API error:', roadRes.status, roadRes.statusText);
    } else {
      const roadData = await roadRes.json();

      if (roadData.response?.result?.point) {
        return NextResponse.json({
          lat: parseFloat(roadData.response.result.point.y),
          lng: parseFloat(roadData.response.result.point.x),
        });
      }

      if (roadData.response?.status === 'ERROR') {
        console.error('Geocode road API returned error:', roadData.response.error);
      }
    }

    // 지번 주소로 재시도
    const parcelUrl =
      `https://api.vworld.kr/req/address?service=address&request=getcoord` +
      `&address=${encodeURIComponent(address)}&type=parcel&format=json&key=${VWORLD_KEY}`;

    const parcelRes = await fetch(parcelUrl, { signal: AbortSignal.timeout(5000) });

    if (!parcelRes.ok) {
      console.error('Geocode parcel API error:', parcelRes.status, parcelRes.statusText);
    } else {
      const parcelData = await parcelRes.json();

      if (parcelData.response?.result?.point) {
        return NextResponse.json({
          lat: parseFloat(parcelData.response.result.point.y),
          lng: parseFloat(parcelData.response.result.point.x),
        });
      }

      if (parcelData.response?.status === 'ERROR') {
        console.error('Geocode parcel API returned error:', parcelData.response.error);
      }
    }

    return NextResponse.json({ error: 'Address not found', address }, { status: 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Geocode error:', message, '| address:', address);
    return NextResponse.json({ error: 'Geocode failed', detail: message }, { status: 500 });
  }
}
