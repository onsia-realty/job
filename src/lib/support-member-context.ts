// 고객센터 챗봇용 로그인 회원 컨텍스트 (서버 전용)
//
// 검증된 user.id 로만 조회하고(service-role, user_id 필터), 결제·공고의 최소 필드만 넘긴다.
// CI/DI/휴대폰번호/이메일 등 개인식별정보는 조회하지도, 프롬프트에 넣지도 않는다.

import { supabaseAdmin } from '@/lib/supabase-server';
import { PRICING_TIERS } from '@/lib/toss';

export interface MemberPaymentRow {
  product_key: string | null;
  product_name: string | null;
  tier: string | null;
  category: string | null;
  amount: number | null;
  payment_status: string | null;
  expires_at: string | null;
  created_at: string | null;
}

export interface MemberJobRow {
  title: string | null;
  category: string | null;
  tier: string | null;
  deadline: string | null;
  is_active: boolean | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '결제 대기',
  completed: '결제 완료',
  failed: '결제 실패',
  refunded: '환불 완료',
  cancelled: '취소',
  canceled: '취소',
};

const CATEGORY_LABEL: Record<string, string> = { agent: '공인중개사', sales: '분양상담사' };

function tierLabel(category: string | null, tier: string | null, fallback?: string | null): string {
  if (!tier || tier === 'normal') return '일반(무료)';
  const t = category ? PRICING_TIERS[`${category}-${tier}`] : undefined;
  return t?.name ?? fallback ?? tier;
}

function day(v: string | null): string {
  return v ? v.slice(0, 10) : '없음';
}

// 프롬프트 주입 완화: 사용자 입력(공고 제목)은 한 줄·짧게
function clean(v: string | null, max = 60): string {
  return (v ?? '').replace(/[\r\n[\]]+/g, ' ').trim().slice(0, max) || '(제목 없음)';
}

export function formatMemberContext(payments: MemberPaymentRow[], jobs: MemberJobRow[]): string {
  const lines: string[] = [];
  lines.push(`- 최근 결제 내역 (최대 5건): ${payments.length === 0 ? '없음' : ''}`);
  for (const p of payments) {
    const cat = p.category ? CATEGORY_LABEL[p.category] ?? p.category : '';
    lines.push(
      `  · ${day(p.created_at)} ${cat} ${tierLabel(p.category, p.tier, p.product_name)} — ${
        p.amount != null ? `${p.amount.toLocaleString('ko-KR')}원` : '금액 미상'
      }, ${STATUS_LABEL[p.payment_status ?? ''] ?? p.payment_status ?? '상태 미상'}, 노출 만료 ${day(p.expires_at)}`,
    );
  }
  lines.push(`- 게시 중인 내 공고: ${jobs.length === 0 ? '없음' : ''}`);
  for (const j of jobs) {
    const cat = j.category ? CATEGORY_LABEL[j.category] ?? j.category : '';
    lines.push(`  · "${clean(j.title)}" (${cat} ${tierLabel(j.category, j.tier)}, 마감 ${day(j.deadline)})`);
  }
  return lines.join('\n');
}

/** 로그인 회원 본인의 결제 5건 + 활성 공고(최대 10건). 실패 시 null (챗은 계속) */
export async function fetchMemberContext(userId: string): Promise<string | null> {
  try {
    const [payRes, jobRes] = await Promise.all([
      supabaseAdmin
        .from('payments')
        .select('product_key, product_name, tier, category, amount, payment_status, expires_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('jobs')
        .select('title, category, tier, deadline, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
    if (payRes.error) console.error('[support-chat] member payments error:', payRes.error.message);
    if (jobRes.error) console.error('[support-chat] member jobs error:', jobRes.error.message);
    if (payRes.error && jobRes.error) return null;
    return formatMemberContext(
      (payRes.data ?? []) as MemberPaymentRow[],
      (jobRes.data ?? []) as MemberJobRow[],
    );
  } catch (e) {
    console.error('[support-chat] member context error:', e instanceof Error ? e.message : e);
    return null;
  }
}
