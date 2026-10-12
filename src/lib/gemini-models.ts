import { ThinkingLevel, type ThinkingConfig } from '@google/genai';

// 텍스트용 Gemini 모델 단일 출처 (이미지 모델 ai-toon/ai-photo 는 별도 관리)
//
// gemini-3.8-flash 는 thinking 이 기본 ON 이고, thinking 토큰이 maxOutputTokens 에 포함된다.
// → thinkingLevel LOW + 넉넉한 maxOutputTokens 로 답변이 잘리지 않게 한다.
// (MINIMAL 은 이 모델에서 400 INVALID_ARGUMENT — 2026-09 실측)
export const GEMINI_TEXT_MODEL = 'gemini-3.8-flash';

export const GEMINI_LOW_THINKING: ThinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
