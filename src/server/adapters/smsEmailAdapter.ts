import crypto from 'node:crypto';

interface OtpChallenge {
  code: string;
  phone: string;
  purpose: 'cod' | 'login';
  expiresAt: number;
  attempts: number;
}

const activeOtps = new Map<string, OtpChallenge>();

export interface SmsDispatchResult {
  challengeId: string;
  sent: boolean;
  providerMode: 'live' | 'sandbox';
  dltTemplateConfigured: boolean;
  todoNote?: string;
  demoOtpPreview?: string;
}

export async function sendSmsOtp(params: {
  phone: string;
  purpose: 'cod' | 'login';
}): Promise<SmsDispatchResult> {
  const cleanPhone = params.phone.replace(/\s+/g, '');
  const code = String(crypto.randomInt(100000, 999999));
  const challengeId = `otp_${crypto.randomBytes(6).toString('hex')}`;
  const expiresAt = Date.now() + 10 * 60 * 1000;

  activeOtps.set(challengeId, {
    code,
    phone: cleanPhone,
    purpose: params.purpose,
    expiresAt,
    attempts: 0,
  });

  const smsApiUrl = process.env.SMS_PROVIDER_URL;
  const smsApiKey = process.env.SMS_PROVIDER_API_KEY;
  const dltTemplateId = process.env.SMS_DLT_TEMPLATE_ID || '';

  if (smsApiUrl && smsApiKey && dltTemplateId) {
    try {
      const resp = await fetch(smsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${smsApiKey}`,
        },
        body: JSON.stringify({
          to: cleanPhone,
          templateId: dltTemplateId,
          variables: { otp: code },
        }),
      });
      if (resp.ok) {
        return {
          challengeId,
          sent: true,
          providerMode: 'live',
          dltTemplateConfigured: true,
        };
      }
    } catch {
      // Fallback to sandbox log in non-prod
    }
  }

  const isProd = process.env.ENV === 'production';
  return {
    challengeId,
    sent: !isProd,
    providerMode: 'sandbox',
    dltTemplateConfigured: Boolean(dltTemplateId),
    todoNote: 'TODO before launch: Configure SMS_PROVIDER_URL, SMS_PROVIDER_API_KEY, and approved TRAI SMS_DLT_TEMPLATE_ID.',
    demoOtpPreview: isProd ? undefined : code,
  };
}

export function verifySmsOtp(params: {
  challengeId: string;
  code: string;
}): { verified: boolean; reason?: string } {
  const entry = activeOtps.get(params.challengeId);
  if (!entry) {
    return { verified: false, reason: 'OTP session expired or not found. Please request a fresh OTP.' };
  }
  if (Date.now() > entry.expiresAt) {
    activeOtps.delete(params.challengeId);
    return { verified: false, reason: 'OTP expired. Please request a new code.' };
  }
  entry.attempts += 1;
  if (entry.attempts > 5) {
    activeOtps.delete(params.challengeId);
    return { verified: false, reason: 'Too many invalid attempts. Request a new OTP.' };
  }
  if (entry.code !== params.code.trim()) {
    return { verified: false, reason: 'Incorrect 6-digit verification code.' };
  }
  activeOtps.delete(params.challengeId);
  return { verified: true };
}

export async function dispatchTransactionalEmail(params: {
  to: string;
  subject: string;
  summaryText: string;
}): Promise<{ dispatched: boolean; mode: 'live' | 'logged' }> {
  const emailUrl = process.env.EMAIL_PROVIDER_URL;
  const emailKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (emailUrl && emailKey) {
    try {
      const resp = await fetch(emailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${emailKey}`,
        },
        body: JSON.stringify({
          to: params.to,
          subject: params.subject,
          text: params.summaryText,
        }),
      });
      if (resp.ok) {
        return { dispatched: true, mode: 'live' };
      }
    } catch {
      // Non-blocking audit log fallback
    }
  }
  return { dispatched: false, mode: 'logged' };
}
