// Client-safe constants - no server dependencies
export type AiPhotoStyle = 'BUSINESS_SUIT' | 'ANNOUNCER' | 'CASUAL';

export const STYLE_INFO: Record<AiPhotoStyle, { label: string; description: string }> = {
  BUSINESS_SUIT: {
    label: '정장',
    description: '기업 면접·이력서에 적합한 정장 프로필',
  },
  ANNOUNCER: {
    label: '아나운서',
    description: '방송인 스타일의 세련된 프로필',
  },
  CASUAL: {
    label: '캐주얼',
    description: '스타트업·IT 기업에 어울리는 비즈캐주얼',
  },
};
