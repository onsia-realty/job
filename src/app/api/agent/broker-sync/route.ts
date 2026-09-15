import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyUser } from '@/lib/auth-server';
import { normalizeRegNo } from '@/lib/stay/agent-snapshot';

// POST /api/agent/broker-sync - 중개사 인증 결과를 public.users 에 반영
//
// 서버에서 소속을 승인한 계정의 사무소 정보만 프로필에 반영한다.
// 승인 근거는 app_metadata이며 사용자 메타데이터/등록번호 조회만으로 승인하지 않는다.
//
// ⚠️ 보안 원칙 — 클라이언트가 보낸 상호명/소재지/대표자명은 절대 저장하지 않는다.
//    공인중개사법 제18조의2 법정표기 항목이라 사용자 조작이 있으면 안 된다.
//    이 라우트는 개설등록번호 "하나만" 입력으로 받고, 나머지 값은 전부
//    서버가 broker_offices(004 LOCALDATA 캐시) 에서 읽은 레지스트리 행에서 가져온다.
//    (등록폼이 agent_* 를 StayServerControlledField 로 승격한 것과 동일한 설계)

/** users.broker_reg_no 는 varchar(50) — 정규화 후 길이 상한 */
const MAX_REG_NO_LENGTH = 50;

export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 });
  }

  const raw = (body as Record<string, unknown> | null)?.brokerRegNo;
  if (typeof raw !== 'string') {
    return NextResponse.json({ error: '개설등록번호를 입력해주세요' }, { status: 400 });
  }

  // ⚠️ agent-snapshot.ts 의 normalizeRegNo 를 그대로 재사용한다.
  //    조회 키 정규화 규칙이 두 곳에서 갈리면 "인증은 됐는데 스냅샷은 빈" 상태가 다시 생긴다.
  const regNo = normalizeRegNo(raw);
  if (!regNo || regNo.length > MAX_REG_NO_LENGTH) {
    return NextResponse.json({ error: '개설등록번호 형식이 올바르지 않습니다' }, { status: 400 });
  }

  // 레지스트리의 존재는 계정 소속 증명이 아니다. 서버에서 승인한 사무소만 동기화한다.
  const approvedRegNo = user.app_metadata?.brokerRegNo;
  if (user.app_metadata?.brokerVerified !== true || typeof approvedRegNo !== 'string'
      || normalizeRegNo(approvedRegNo) !== regNo) {
    return NextResponse.json({ error: '중개사무소 소속 확인 및 관리자 승인이 필요합니다' }, { status: 403 });
  }

  // ① 레지스트리 조회 — 여기서 찾지 못하면 아무것도 쓰지 않는다
  const { data: office, error: officeError } = await supabaseAdmin
    .from('broker_offices')
    .select('id, estbl_reg_no, med_office_nm, rprsv_nm, lctn_road_nm_addr')
    .eq('estbl_reg_no', regNo)
    .limit(1)
    .maybeSingle();

  if (officeError) {
    console.error('[broker-sync] broker_offices query error:', officeError);
    return NextResponse.json({ error: '중개사무소 조회에 실패했습니다' }, { status: 500 });
  }

  if (!office) {
    return NextResponse.json(
      { error: '등록번호를 찾을 수 없습니다' },
      { status: 404 }
    );
  }

  // ② users 갱신 — 값은 전부 레지스트리 행에서. name/phone 은 건드리지 않는다(기존 값 보존).
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      broker_reg_no: office.estbl_reg_no ?? regNo,
      company_name: office.med_office_nm ?? null,
      broker_address: office.lctn_road_nm_addr ?? null,
    })
    // ⚠️ service_role 이라 RLS 가 없다. 반드시 본인 행으로 한정할 것.
    .eq('id', user.id)
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('[broker-sync] users update error:', updateError);
    return NextResponse.json({ error: '중개사 정보 저장에 실패했습니다' }, { status: 500 });
  }

  if (!updatedUser) {
    return NextResponse.json({ error: '회원 프로필이 없습니다. 회원가입을 완료해주세요' }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    broker: {
      officeName: office.med_office_nm ?? null,
      address: office.lctn_road_nm_addr ?? null,
      regNo: office.estbl_reg_no ?? regNo,
      representative: office.rprsv_nm ?? null,
    },
  });
}
