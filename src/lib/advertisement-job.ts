/** New purchases only. Historical payment recovery must not use this guard. */
export function isAdvertisementJobEligible(
  job: { is_active?: boolean | null; is_approved?: boolean | null; deadline?: string | null },
  now = new Date(),
): boolean {
  // Match the expiry cron's Korean calendar date, including the deadline day.
  const todayKST = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return job.is_active === true && job.is_approved === true && (!job.deadline || job.deadline >= todayKST);
}

export function isAdvertisementJobId(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
