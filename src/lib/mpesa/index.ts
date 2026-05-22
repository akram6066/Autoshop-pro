const BASE = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
} as const;

function apiBase() {
  return BASE[
    (process.env.MPESA_ENVIRONMENT as keyof typeof BASE) ?? "sandbox"
  ];
}

// Cache the token and its expiry — Daraja tokens expire in 60 min, refresh at 55 min
let _tokenCache: { token: string; expiresAt: number } | null = null;

export async function getDarajaToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) {
    const missing = [
      !key && "MPESA_CONSUMER_KEY",
      !secret && "MPESA_CONSUMER_SECRET",
    ].filter(Boolean);
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(
    `${apiBase()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    },
  );

  if (!res.ok) throw new Error(`Daraja token error: ${res.status}`);
  const data = await res.json();

  _tokenCache = {
    token: data.access_token as string,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  return _tokenCache.token;
}

export interface StkPushResult {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  customerMessage: string;
}

export async function initiateStkPush(params: {
  phone: string; // 254XXXXXXXXX
  amountKes: number;
  accountRef: string;
  description: string;
}): Promise<StkPushResult> {
  const shortCode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackBase = process.env.MPESA_CALLBACK_BASE_URL;
  const callbackSecret = process.env.MPESA_CALLBACK_SECRET;
  const missing = [
    !shortCode && "MPESA_SHORTCODE",
    !passkey && "MPESA_PASSKEY",
    !callbackBase && "MPESA_CALLBACK_BASE_URL",
    !callbackSecret && "MPESA_CALLBACK_SECRET",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString(
    "base64",
  );
  const token = await getDarajaToken();

  const res = await fetch(`${apiBase()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: params.amountKes,
      PartyA: params.phone,
      PartyB: shortCode,
      PhoneNumber: params.phone,
      CallBackURL: `${callbackBase}/api/mpesa/callback/${callbackSecret}`,
      AccountReference: params.accountRef,
      TransactionDesc: params.description,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`STK push error: ${res.status}`);
  const data = await res.json();

  return {
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID,
    responseCode: data.ResponseCode,
    customerMessage: data.CustomerMessage,
  };
}

/** Normalize a Kenyan phone number to 254XXXXXXXXX format */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10)
    return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return null;
}
