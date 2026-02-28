import { describe, it, expect } from 'vitest';
import {
  AI_PHOTO_STYLES,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  ACCOUNT_LIMIT,
  aiPhotoStyleSchema,
  aiPhotoGenerateSchema,
  aiPhotoSaveSchema,
  validateImageFile,
} from './ai-photo';

// ============================================================
// 상수값 검증
// ============================================================
describe('상수값', () => {
  it('AI_PHOTO_STYLES 3가지', () => {
    expect(AI_PHOTO_STYLES).toEqual(['BUSINESS_SUIT', 'ANNOUNCER', 'CASUAL']);
  });

  it('ALLOWED_MIME_TYPES', () => {
    expect(ALLOWED_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('MAX_FILE_SIZE = 5MB', () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });

  it('ACCOUNT_LIMIT = 3', () => {
    expect(ACCOUNT_LIMIT).toBe(3);
  });
});

// ============================================================
// Zod 스키마 — aiPhotoStyleSchema
// ============================================================
describe('aiPhotoStyleSchema', () => {
  it.each(['BUSINESS_SUIT', 'ANNOUNCER', 'CASUAL'] as const)('%s 통과', (style) => {
    expect(aiPhotoStyleSchema.parse(style)).toBe(style);
  });

  it('잘못된 스타일 거부', () => {
    expect(() => aiPhotoStyleSchema.parse('INVALID')).toThrow();
  });
});

// ============================================================
// Zod 스키마 — aiPhotoGenerateSchema
// ============================================================
describe('aiPhotoGenerateSchema', () => {
  it('유효한 입력 통과', () => {
    const result = aiPhotoGenerateSchema.parse({ style: 'BUSINESS_SUIT' });
    expect(result.style).toBe('BUSINESS_SUIT');
  });

  it('style 없으면 거부', () => {
    expect(() => aiPhotoGenerateSchema.parse({})).toThrow();
  });

  it('잘못된 style 거부', () => {
    expect(() => aiPhotoGenerateSchema.parse({ style: 'WRONG' })).toThrow();
  });
});

// ============================================================
// Zod 스키마 — aiPhotoSaveSchema
// ============================================================
describe('aiPhotoSaveSchema', () => {
  it('유효한 generationId 통과', () => {
    const result = aiPhotoSaveSchema.parse({ generationId: 'abc-123' });
    expect(result.generationId).toBe('abc-123');
  });

  it('빈 문자열 거부', () => {
    expect(() => aiPhotoSaveSchema.parse({ generationId: '' })).toThrow();
  });

  it('generationId 없으면 거부', () => {
    expect(() => aiPhotoSaveSchema.parse({})).toThrow();
  });
});

// ============================================================
// validateImageFile
// ============================================================
describe('validateImageFile', () => {
  function createMockFile(type: string, size: number): File {
    const buffer = new ArrayBuffer(size);
    return new File([buffer], 'test-image', { type });
  }

  it('JPEG 통과', () => {
    const file = createMockFile('image/jpeg', 1024);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it('PNG 통과', () => {
    const file = createMockFile('image/png', 1024);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it('WebP 통과', () => {
    const file = createMockFile('image/webp', 1024);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it('GIF 거부', () => {
    const file = createMockFile('image/gif', 1024);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('JPG, PNG, WebP');
  });

  it('정확히 5MB 통과', () => {
    const file = createMockFile('image/jpeg', MAX_FILE_SIZE);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it('5MB + 1바이트 거부', () => {
    const file = createMockFile('image/jpeg', MAX_FILE_SIZE + 1);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5MB');
  });
});
