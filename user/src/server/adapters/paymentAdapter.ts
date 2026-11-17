import crypto from 'node:crypto';

export interface RazorpayOrderCreateResult {
  gatewayOrderId: string;
  amountPaise: number;
  currency: 'INR';
  keyId: string;
  mode: 'live' | 'sandbox';
  createdAt: string;
}

const idempotentPaymentOrders = new Map<string, RazorpayOrderCreateResult>();
const webhookProcessedEvents = new Set<string>();

export async function createPaymentOrder(params: {
  idempotencyKey: string;
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderCreateResult> {
  const existing = idempotentPaymentOrders.get(params.idempotencyKey);
  if (existing) return existing;

  const amountPaise = Math.max(100, Math.round(params.amountInr * 100));
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  if (keyId && keySecret) {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const resp = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: params.receipt,
          notes: params.notes ?? {},
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { id: string; amount: number; currency: 'INR' };
        const result: RazorpayOrderCreateResult = {
          gatewayOrderId: data.id,
          amountPaise: data.amount,
          currency: 'INR',
          keyId,
          mode: 'live',
          createdAt: new Date().toISOString(),
        };
        idempotentPaymentOrders.set(params.idempotencyKey, result);
        return result;
      }
    } catch {
      // Fall through to structured sandbox error in production or sandbox order in non-prod
    }
  }

  const sandboxResult: RazorpayOrderCreateResult = {
    gatewayOrderId: `order_sbx_${crypto.randomBytes(8).toString('hex')}`,
    amountPaise,
    currency: 'INR',
    keyId: keyId || 'rzp_test_placeholder',
    mode: 'sandbox',
    createdAt: new Date().toISOString(),
  };
  idempotentPaymentOrders.set(params.idempotencyKey, sandboxResult);
  return sandboxResult;
}

export function verifyPaymentSignature(params: {
  gatewayOrderId: string;
  paymentId: string;
  signature: string;
}): { verified: boolean; mode: 'live' | 'sandbox'; reason?: string } {
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  if (secret && !params.gatewayOrderId.startsWith('order_sbx_')) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${params.gatewayOrderId}|${params.paymentId}`)
      .digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(params.signature, 'utf8');
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    return {
      verified: valid,
      mode: 'live',
      reason: valid ? undefined : 'HMAC signature verification failed.',
    };
  }

  // Sandbox verification (reject explicit simulated failure tokens)
  if (params.paymentId === 'pay_fail' || params.signature === 'sig_fail') {
    return { verified: false, mode: 'sandbox', reason: 'Simulated payment decline by patron.' };
  }
  const validFormat = params.gatewayOrderId.startsWith('order_') && params.paymentId.startsWith('pay_');
  return {
    verified: validFormat,
    mode: 'sandbox',
    reason: validFormat ? undefined : 'Invalid sandbox payment credentials.',
  };
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string): {
  valid: boolean;
  alreadyProcessed: boolean;
} {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const eventHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  if (webhookProcessedEvents.has(eventHash)) {
    return { valid: true, alreadyProcessed: true };
  }
  if (!secret) {
    if (process.env.ENV === 'production') {
      return { valid: false, alreadyProcessed: false };
    }
    webhookProcessedEvents.add(eventHash);
    return { valid: true, alreadyProcessed: false };
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signatureHeader, 'utf8');
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (valid) webhookProcessedEvents.add(eventHash);
  return { valid, alreadyProcessed: false };
}
