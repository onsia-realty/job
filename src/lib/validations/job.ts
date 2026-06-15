import { z } from 'zod';

// 공고 등록 입력 검증 (POST /api/jobs)
// - 필수/선택지(enum) 필드만 검증해 친절한 한글 메시지를 돌려준다.
// - passthrough(): 그 외 정상 컬럼은 그대로 통과 (기존 폼 동작 보존).
// - 서버 강제 필드(tier/is_approved/is_active/user_id/views/deadline)는 라우트에서 별도 처리.
export const jobCreateSchema = z
  .object({
    title: z.string().trim().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이내로 입력해주세요'),
    company: z.string().trim().min(1, '회사명을 입력해주세요').max(200, '회사명은 200자 이내로 입력해주세요'),
    region: z.string().trim().min(1, '지역을 선택해주세요').max(50, '지역명이 너무 깁니다'),
    type: z.enum(['apartment', 'officetel', 'store', 'industrial']),
    position: z.enum(['headTeam', 'teamLead', 'member']),
    salary_type: z.enum(['commission', 'base_incentive', 'daily']),
    // 선택 — 값이 오면 형식만 확인 (없으면 통과)
    category: z.enum(['sales', 'agent']).optional(),
    company_type: z.enum(['developer', 'builder', 'agency', 'trust']).nullish(),
    experience: z.enum(['none', '1month', '3month', '6month', '12month']).optional(),
    description: z.string().max(20000, '상세 내용이 너무 깁니다').nullish(),
    salary_amount: z.string().max(100).nullish(),
  })
  .passthrough();

// 필드별 친절 메시지 (enum 실패 등 기본 메시지를 한글로 치환)
export const JOB_FIELD_MESSAGES: Record<string, string> = {
  title: '제목을 입력해주세요',
  company: '회사명을 입력해주세요',
  region: '지역을 선택해주세요',
  type: '매물 유형(아파트/오피스텔/상가/지식산업센터)을 선택해주세요',
  position: '모집 직급(본부장/팀장/팀원)을 선택해주세요',
  salary_type: '급여 형태(건당/기본급+인센티브/일급)를 선택해주세요',
  category: '구분(분양상담사/공인중개사)을 확인해주세요',
  company_type: '회사 유형을 확인해주세요',
  experience: '경력 조건을 확인해주세요',
};
