export interface ProviderPayment {
  paymentKey: string;
  orderId: string;
  totalAmount: number;
  currency: string;
  status: string;
  balanceAmount?: number;
  cancels?: unknown[];
  approvedAt?: string;
  method?: string;
}

export function providerHeaders() {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error('Missing payment provider configuration');
  return { Authorization: `Basic ${Buffer.from(`${secret}:`).toString('base64')}` };
}

export async function lookupPayment(paymentKey: string): Promise<ProviderPayment | null> {
  const response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`, {
    headers: providerHeaders(), signal: AbortSignal.timeout(10000), cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Payment provider lookup failed');
  return response.json();
}

export function matchesPayment(payment: ProviderPayment, order: { order_id: string; amount: number; currency: string }, paymentKey: string) {
  return payment.paymentKey === paymentKey && payment.orderId === order.order_id
    && payment.totalAmount === order.amount && payment.currency === order.currency;
}

export const providerStatuses: Record<string, string> = {
  DONE: 'completed', PARTIAL_CANCELED: 'completed', CANCELED: 'refunded',
  ABORTED: 'failed', EXPIRED: 'failed', READY: 'pending', IN_PROGRESS: 'pending', WAITING_FOR_DEPOSIT: 'pending',
};
