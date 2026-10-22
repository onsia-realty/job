// Exact reserved IDs from scripts/seed-stays.mjs (decimal 01–12).
// Never infer demo status from owner, title, price or a prefix alone.
const SEED_IDS = new Set(Array.from({ length: 12 }, (_, i) =>
  `5eed0000-0000-4000-8000-0000000000${String(i + 1).padStart(2, '0')}`));

export function isDemoStay(id: string): boolean {
  return SEED_IDS.has(id.toLowerCase());
}

export const DEMO_STAY_INQUIRY_MESSAGE = '화면 시연용 샘플 매물에는 문의를 보낼 수 없습니다.';
