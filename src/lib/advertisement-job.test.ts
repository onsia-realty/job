import { describe, expect, it } from 'vitest';
import { isAdvertisementJobEligible } from './advertisement-job';

describe('advertisement job deadline', () => {
  it.each([false, null, undefined])('rejects active jobs without explicit approval: %s', is_approved => {
    expect(isAdvertisementJobEligible({ is_active: true, is_approved, deadline: null })).toBe(false);
  });
  it('includes the deadline day and closes at Korean midnight', () => {
    const job = { is_active: true, is_approved: true, deadline: '2026-10-23' };
    expect(isAdvertisementJobEligible(job, new Date('2026-10-23T14:59:59Z'))).toBe(true);
    expect(isAdvertisementJobEligible(job, new Date('2026-10-23T15:00:00Z'))).toBe(false);
  });
  it('allows an active job with no deadline, but not an inactive job', () => {
    expect(isAdvertisementJobEligible({ is_active: true, is_approved: true, deadline: null })).toBe(true);
    expect(isAdvertisementJobEligible({ is_active: false, is_approved: true, deadline: null })).toBe(false);
  });
});
