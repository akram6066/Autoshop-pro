/**
 * /api/auth/callback hardening:
 *   * the post-login destination can never leave this origin (backslash,
 *     control-character, protocol-relative and encoded variants);
 *   * verifyOtp only ever sees the OTP types the app issues;
 *   * a verified recovery link always lands on /update-password and marks THIS
 *     browser with an httpOnly recovery marker for the right user.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();
const setSession = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { exchangeCodeForSession, verifyOtp, setSession },
  })),
}));

import { GET } from "@/app/api/auth/callback/route";
import {
  RECOVERY_COOKIE,
  hasRecoveryCodeVerifierCookie,
  isRecoveryCallback,
  parseOtpType,
  safeNextPath,
} from "@/lib/auth/callback";

const ORIGIN = "https://app.example.com";
const USER = "00000000-0000-4000-8000-0000000000aa";
const call = (qs: string, cookie?: string) =>
  GET(
    new NextRequest(`${ORIGIN}/api/auth/callback?${qs}`, {
      headers: cookie ? { cookie } : undefined,
    }),
  );
const location = (res: Response) => new URL(res.headers.get("location")!);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  exchangeCodeForSession.mockResolvedValue({
    data: { user: { id: USER }, session: {} },
    error: null,
  });
  verifyOtp.mockResolvedValue({
    data: { user: { id: USER }, session: {} },
    error: null,
  });
  setSession.mockResolvedValue({ data: { user: { id: USER } }, error: null });
});

// Built with String.fromCharCode so the test source holds no literal backslash
// or control characters to be mis-read.
const BS = String.fromCharCode(92);
const TAB = String.fromCharCode(9);
const NL = String.fromCharCode(10);
const NUL = String.fromCharCode(0);

describe("safeNextPath", () => {
  const unsafe: Array<[string, string]> = [
    ["backslash after slash", `/${BS}evil.com`],
    ["slash backslash slash", `/${BS}/evil.com`],
    ["protocol-relative", "//evil.com"],
    ["absolute https", "https://evil.com"],
    ["javascript scheme", "javascript:alert(1)"],
    ["tab between slashes", `/${TAB}/evil.com`],
    ["newline between slashes", `/${NL}/evil.com`],
    ["NUL byte", `/dashboard${NUL}`],
    ["encoded backslash", "/%5Cevil.com"],
    ["encoded backslash lowercase", "/%5cevil.com"],
    ["encoded double slash", "/%2F/evil.com"],
    ["encoded tab", "/%09/evil.com"],
    ["encoded newline", "/%0a/evil.com"],
    ["malformed percent escape", "/%E0%A4%A"],
    ["no leading slash", "dashboard"],
    ["empty", ""],
    ["leading whitespace", " /dashboard"],
  ];
  it.each(unsafe)("rejects %s", (_n, value) => {
    expect(safeNextPath(value, ORIGIN)).toBe("/dashboard");
  });

  it("uses the supplied fallback", () => {
    expect(safeNextPath(`/${BS}evil.com`, ORIGIN, "/setup")).toBe("/setup");
    expect(safeNextPath(null, ORIGIN, "/setup")).toBe("/setup");
  });

  it.each([
    ["/dashboard", "/dashboard"],
    ["/setup?plan=pro", "/setup?plan=pro"],
    ["/billing?plan=pro&interval=annual", "/billing?plan=pro&interval=annual"],
    ["/update-password", "/update-password"],
    ["/a/b#frag", "/a/b#frag"],
  ])("keeps the same-origin path %s", (value, expected) => {
    expect(safeNextPath(value, ORIGIN)).toBe(expected);
  });

  it("the resolved destination is always on the request origin", () => {
    for (const [, v] of unsafe) {
      const out = safeNextPath(v, ORIGIN);
      expect(new URL(out, ORIGIN).origin).toBe(ORIGIN);
    }
  });

  it("documents the bug being fixed: the old check accepted the backslash payload and it resolves off-origin", () => {
    const payload = `/${BS}evil.com`;
    const oldCheck = payload.startsWith("/") && !payload.startsWith("//");
    expect(oldCheck).toBe(true);
    expect(new URL(payload, ORIGIN).origin).not.toBe(ORIGIN);
  });
});

describe("parseOtpType", () => {
  it.each([
    "signup",
    "invite",
    "recovery",
    "email",
    "magiclink",
    "email_change",
  ])("accepts %s", (t) => expect(parseOtpType(t)).toBe(t));
  it.each([
    "sms",
    "phone_change",
    "reauthentication",
    "SIGNUP",
    "recovery ",
    "__proto__",
    "constructor",
    "",
    null,
    undefined,
  ])("rejects %s", (t) => expect(parseOtpType(t as string | null)).toBeNull());
});

describe("isRecoveryCallback", () => {
  it("is true for the recovery type, PKCE recovery redirectType, or update-password destination", () => {
    expect(isRecoveryCallback("recovery", "/dashboard")).toBe(true);
    expect(isRecoveryCallback(null, "/update-password")).toBe(true);
    expect(isRecoveryCallback(null, "/setup", "recovery")).toBe(true);
    expect(isRecoveryCallback("signup", "/setup")).toBe(false);
    expect(isRecoveryCallback(null, "/update-password-evil")).toBe(false);
  });

  it("never mistakes non-recovery OTP types for recovery even when next=/update-password", () => {
    expect(isRecoveryCallback("signup", "/update-password")).toBe(false);
    expect(isRecoveryCallback("invite", "/update-password")).toBe(false);
    expect(isRecoveryCallback("magiclink", "/update-password")).toBe(false);
    expect(isRecoveryCallback("signup", "/update-password", "recovery")).toBe(
      false,
    );
  });
});

describe("hasRecoveryCodeVerifierCookie", () => {
  const encodeBase64Cookie = (val: string) =>
    "base64-" +
    Buffer.from(JSON.stringify(val), "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  it("detects base64-encoded and raw verifier cookies tagged with /recovery", () => {
    expect(
      hasRecoveryCodeVerifierCookie([
        {
          name: "sb-proj-auth-token-code-verifier",
          value: encodeBase64Cookie("verifier123/recovery"),
        },
      ]),
    ).toBe(true);
    expect(
      hasRecoveryCodeVerifierCookie([
        {
          name: "sb-proj-auth-token-code-verifier.0",
          value: "verifier123/recovery",
        },
      ]),
    ).toBe(true);
  });

  it("returns false for non-recovery verifiers and unrelated cookies", () => {
    expect(
      hasRecoveryCodeVerifierCookie([
        {
          name: "sb-proj-auth-token-code-verifier",
          value: encodeBase64Cookie("verifier123"),
        },
      ]),
    ).toBe(false);
    expect(
      hasRecoveryCodeVerifierCookie([
        {
          name: "sb-proj-auth-token",
          value: encodeBase64Cookie("something/recovery"),
        },
      ]),
    ).toBe(false);
  });
});

describe("GET /api/auth/callback", () => {
  it("never redirects off-origin through a backslash `next` (code flow)", async () => {
    const res = await call(
      `code=abc&next=${encodeURIComponent(`/${BS}evil.com`)}`,
    );
    expect(res.status).toBe(307);
    expect(location(res).origin).toBe(ORIGIN);
    expect(location(res).pathname).toBe("/dashboard");
  });

  it.each([
    `/${BS}evil.com`,
    "//evil.com",
    "https://evil.com",
    `/${TAB}/evil.com`,
  ])(
    "ignores hostile next %j on a successful token-hash login",
    async (next) => {
      const res = await call(
        `token_hash=t&type=signup&next=${encodeURIComponent(next)}`,
      );
      expect(location(res).origin).toBe(ORIGIN);
      expect(location(res).pathname).toBe("/dashboard");
    },
  );

  it("still honours a safe same-origin next", async () => {
    const res = await call(
      `code=abc&next=${encodeURIComponent("/setup?plan=pro")}`,
    );
    expect(location(res).pathname + location(res).search).toBe(
      "/setup?plan=pro",
    );
    // an ordinary sign-in sets no recovery marker
    expect(res.headers.get("set-cookie") ?? "").not.toContain(RECOVERY_COOKIE);
  });

  it("refuses an unsupported OTP type without calling verifyOtp", async () => {
    for (const type of ["sms", "phone_change", "reauthentication", "bogus"]) {
      const res = await call(`token_hash=t&type=${type}&next=/dashboard`);
      expect(verifyOtp).not.toHaveBeenCalled();
      expect(location(res).pathname).toBe("/login");
      expect(location(res).searchParams.get("reason")).toBe(
        "confirmation_failed",
      );
    }
  });

  it.each([
    "signup",
    "invite",
    "recovery",
    "email",
    "magiclink",
    "email_change",
  ])("passes the supported type %s to verifyOtp", async (type) => {
    await call(`token_hash=t&type=${type}&next=/dashboard`);
    expect(verifyOtp).toHaveBeenCalledWith({ type, token_hash: "t" });
  });

  it("a recovery link lands on /update-password whatever `next` says, with an httpOnly marker for that user", async () => {
    const res = await call(`token_hash=t&type=recovery&next=/dashboard`);
    expect(location(res).pathname).toBe("/update-password");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${RECOVERY_COOKIE}=${USER}`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Max-Age=900/i);
  });

  it("the PKCE reset link (code + next=/update-password) also sets the marker", async () => {
    const res = await call(`code=abc&next=/update-password`);
    expect(location(res).pathname).toBe("/update-password");
    expect(res.headers.get("set-cookie") ?? "").toContain(
      `${RECOVERY_COOKIE}=${USER}`,
    );
  });

  it("a hostile next on a recovery link is replaced by /update-password", async () => {
    const res = await call(
      `token_hash=t&type=recovery&next=${encodeURIComponent(`/${BS}evil.com`)}`,
    );
    expect(location(res).origin).toBe(ORIGIN);
    expect(location(res).pathname).toBe("/update-password");
  });

  it("no marker when the user id is unknown", async () => {
    verifyOtp.mockResolvedValue({ data: { user: null }, error: null });
    const res = await call(`token_hash=t&type=recovery`);
    expect(res.headers.get("set-cookie") ?? "").not.toContain(RECOVERY_COOKIE);
  });

  it("an expired or used recovery link goes to sign-in with the reset message and no marker", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: { message: "expired" } });
    const res = await call(`token_hash=t&type=recovery`);
    expect(location(res).pathname).toBe("/login");
    expect(location(res).searchParams.get("reason")).toBe("reset_link_invalid");
    expect(res.headers.get("set-cookie") ?? "").not.toContain(RECOVERY_COOKIE);
  });

  it("a failed ordinary confirmation keeps the confirmation message", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: { message: "expired" } });
    const res = await call(`token_hash=t&type=signup`);
    expect(location(res).searchParams.get("reason")).toBe(
      "confirmation_failed",
    );
  });

  it("PKCE recovery identified via exchangeCodeForSession redirectType lands on /update-password with recovery marker even if next=/setup", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: USER }, session: {}, redirectType: "recovery" },
      error: null,
    });
    const res = await call(`code=abc&next=/setup`);
    expect(location(res).pathname).toBe("/update-password");
    expect(res.headers.get("set-cookie") ?? "").toContain(
      `${RECOVERY_COOKIE}=${USER}`,
    );
  });

  it("signup token_hash with next=/update-password does NOT set recovery marker and redirects to /dashboard", async () => {
    const res = await call(`token_hash=t&type=signup&next=/update-password`);
    expect(location(res).pathname).toBe("/dashboard");
    expect(res.headers.get("set-cookie") ?? "").not.toContain(RECOVERY_COOKIE);
  });

  it("failed PKCE exchange with a /recovery verifier cookie redirects to reset_link_invalid", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "expired" },
    });
    const res = await call(
      `code=abc&next=/setup`,
      "sb-test-auth-token-code-verifier=verifier123%2Frecovery",
    );
    expect(location(res).pathname).toBe("/login");
    expect(location(res).searchParams.get("reason")).toBe("reset_link_invalid");
    expect(res.headers.get("set-cookie") ?? "").not.toContain(RECOVERY_COOKIE);
  });

  it("error query param with a /recovery verifier cookie redirects to reset_link_invalid", async () => {
    const res = await call(
      `error=access_denied&next=/setup`,
      "sb-test-auth-token-code-verifier=verifier123%2Frecovery",
    );
    expect(location(res).pathname).toBe("/login");
    expect(location(res).searchParams.get("reason")).toBe("reset_link_invalid");
  });
});
