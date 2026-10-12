import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth-server';
import { buildAgentSnapshot } from '@/lib/stay/agent-snapshot';

// GET /api/stays/agent-snapshot - 등록폼 미리보기용 중개사 법정표기 스냅샷
// POST/PATCH /api/stays 가 실제로 저장할 값과 동일한 조립 결과를 돌려준다(읽기 전용).
export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const snapshot = await buildAgentSnapshot(user.id);

  return NextResponse.json(snapshot, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
