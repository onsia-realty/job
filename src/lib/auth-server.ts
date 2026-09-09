import { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-server';

// 공통 인증 헬퍼 (서버 전용)
//
// src/app/api/jobs/route.ts:6-13 의 verifyUser 와
// src/app/api/admin/jobs/route.ts:4-19 의 verifyAdmin 을 그대로 추출한 것.
// 시그니처/반환 형태를 원본과 동일하게 유지해, 기존 라우트가 나중에 그대로 갈아탈 수 있게 한다.
// (이번 커밋에서는 신규 stays 라우트만 사용한다 — 기존 라우트는 건드리지 않음)

/** Bearer 토큰에서 사용자 확인. 실패 시 null */
export async function verifyUser(req: NextRequest): Promise<User | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/** Bearer 토큰 + users.user_type === 'admin' 확인. 실패 시 null */
export async function verifyAdmin(req: NextRequest): Promise<User | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  if (!dbUser || dbUser.user_type !== 'admin') return null;
  return user;
}

/**
 * 기업회원 인증 여부(중개사무소 또는 사업자)를 서버에서 재확인한다.
 *
 * ⚠️ 실제 스키마 확인 결과: users 테이블에는 broker_verified / business_verified 같은
 *    boolean 컬럼이 존재하지 않는다(001 + 031 전수 확인). 프로젝트의 인증 플래그는
 *    auth.users 의 user_metadata 에 brokerVerified / businessVerified 로만 저장된다
 *    (src/app/agent/mypage/verification/page.tsx:165, 사업자.md:505/518).
 *    → 여기서 쓰는 user 객체는 supabaseAdmin.auth.getUser(token) 이 auth DB 에서
 *      직접 읽어온 값이므로, 클라이언트 요청 본문이 아니라 서버 측 조회 결과다.
 *    → 추가로 users.user_type === 'admin' 이면 인증된 것으로 본다.
 */
export async function isVerifiedBusinessUser(user: User): Promise<boolean> {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (meta?.brokerVerified === true || meta?.businessVerified === true) return true;

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  return dbUser?.user_type === 'admin';
}

/** users.user_type === 'admin' 인지 (id 기준) */
export async function isAdminUserId(userId: string): Promise<boolean> {
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', userId)
    .maybeSingle();

  return dbUser?.user_type === 'admin';
}
