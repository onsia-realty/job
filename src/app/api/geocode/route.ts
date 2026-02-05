import { NextRequest, NextResponse } from 'next/server';

const VWORLD_KEY = process.env.VWORLD_API_KEY || process.env.NEXT_PUBLIC_VWORLD_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  if (!VWORLD_KEY) {
    return NextResponse.json({ error: 'VWorld API key not configured' }, { status: 500 });
  }

  // 도로명 주소로 먼저 시도
  try {
    const roadRes = await fetch(
      `https://api.vworld.kr/req/address?service=address&request=getcoord` +
      `&address=${encodeURIComponent(address)}&type=road&format=json&key=${VWORLD_KEY}`
    );
    const roadData = await roadRes.json();

    if (roadData.response?.result?.point) {
      return NextResponse.json({
        lat: parseFloat(roadData.response.result.point.y),
        lng: parseFloat(roadData.response.result.point.x),
      });
    }

    // 지번 주소로 재시도
    const parcelRes = await fetch(
      `https://api.vworld.kr/req/address?service=address&request=getcoord` +
      `&address=${encodeURIComponent(address)}&type=parcel&format=json&key=${VWORLD_KEY}`
    );
    const parcelData = await parcelRes.json();

    if (parcelData.response?.result?.point) {
      return NextResponse.json({
        lat: parseFloat(parcelData.response.result.point.y),
        lng: parseFloat(parcelData.response.result.point.x),
      });
    }

    return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  } catch (err) {
    console.error('Geocode error:', err);
    return NextResponse.json({ error: 'Geocode failed' }, { status: 500 });
  }
}
