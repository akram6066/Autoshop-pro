const BASE = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
} as const;

function apiBase() {
  return BASE[
    (process.env.MPESA_ENVIRONMENT as keyof typeof BASE) ?? "sandbox"
  ];
}

export async function getDarajaToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret)
    throw new Error("Missing MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET");

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(
    `${apiBase()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    },
  );

  if (!res.ok) throw new Error(`Daraja token error: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
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
  if (!shortCode || !passkey || !callbackBase) {
    throw new Error(
      "Missing MPESA_SHORTCODE / MPESA_PASSKEY / MPESA_CALLBACK_BASE_URL",
    );
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
      CallBackURL: `${callbackBase}/api/mpesa/callback`,
      AccountReference: params.accountRef,
      TransactionDesc: params.description,
    }),
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
