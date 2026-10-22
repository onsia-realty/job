import { describe, expect, it } from 'vitest';
import { isDemoStay } from '@/lib/stay/demo';

describe('exact seed stay identity', () => {
  it.each(Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')))('recognizes decimal seed %s', suffix => {
    expect(isDemoStay(`5eed0000-0000-4000-8000-0000000000${suffix}`)).toBe(true);
  });
  it('recognizes equivalent uppercase UUIDs', () => {
    expect(isDemoStay('5EED0000-0000-4000-8000-000000000012')).toBe(true);
  });
  it.each(['00', '13', '99', '0a', '0b', '0c'])('rejects similar suffix %s', suffix => {
    expect(isDemoStay(`5eed0000-0000-4000-8000-0000000000${suffix}`)).toBe(false);
  });
  it.each(['', '5eed0000-0000-4001-8000-000000000001', '5eed0000-0000-4000-8000-000000000001x', ' 5eed0000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111'])('rejects non-seed %s', id => {
    expect(isDemoStay(id)).toBe(false);
  });
});
