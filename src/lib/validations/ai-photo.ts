import { z } from 'zod';

export const AI_PHOTO_STYLES = ['BUSINESS_SUIT', 'ANNOUNCER', 'CASUAL'] as const;

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCOUNT_LIMIT = 3; // 계정당 총 생성 횟수

export const aiPhotoStyleSchema = z.enum(AI_PHOTO_STYLES);

export const aiPhotoGenerateSchema = z.object({
  style: aiPhotoStyleSchema,
});

export const aiPhotoSaveSchema = z.object({
  generationId: z.string().min(1),
});

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'JPG, PNG, WebP만 가능합니다' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '사진 크기는 5MB 이하로 올려주세요' };
  }
  return { valid: true };
}
