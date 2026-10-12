import { z } from 'zod';

export const inquirySchema = z.object({
  stay_id: z.string().uuid(),
  message: z.string().trim().min(10, '문의 내용을 10자 이상 입력해주세요.').max(1000),
  consent: z.literal(true),
});
export const inquiryReplySchema = z.object({
  id: z.string().uuid(),
  reply: z.string().trim().min(1).max(1000),
});
export type StayInquiry = {
  id: string; stay_id: string; message: string; reply: string | null;
  created_at: string; replied_at: string | null; is_host: boolean;
  stay_title: string;
};
