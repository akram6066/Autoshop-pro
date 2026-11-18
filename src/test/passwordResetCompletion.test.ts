/**
 * Password reset completion:
 *   * only a browser that arrived through a verified recovery link (marker
 *     cookie) with a live session for the SAME user can set a password -
 *     an ordinary signed-in session cannot use /update-password to skip the
 *     "current password" step;
 *   * success signs every OTHER session out and consumes the marker;
 *   * the form page itself is gated by the same check.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const USER = "00000000-0000-4000-8000-0000000000aa";
const OTHER = "00000000-0000-4000-8000-0000000000bb";

const cookieJar = new Map<string, string>();
const cookieDelete = vi.fn((name: string) => void cookieJar.delete(name));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined,
    delete: cookieDelete,
  }),
}));

const getUser = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser, updateUser, signOut },
  }),
}));

const enforceRateLimit = vi.fn();
vi.mock("@/lib/api/rate-limit", () => ({
  enforceRateLimit: (...a: unknown[]) => enforceRateLimit(...a),
}));

const redirect = vi.fn((to: string) => {
  throw new Error(`REDIRECT:${to}`);
});
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));

import { POST } from "@/app/api/auth/complete-password-reset/route";
import UpdatePasswordLayout from "@/app/(auth)/update-password/layout";
import { RECOVERY_COOKIE } from "@/lib/auth/callback";
import { updatePasswordSchema } from "@/lib/auth/passwordReset";

const post = (body: unknown) =>
  POST(
    new NextRequest(
      "https://app.example.com/api/auth/complete-password-reset",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    ),
  );
const GOOD = { password: "a-new-password", confirmPassword: "a-new-password" };

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.clear();
  getUser.mockResolvedValue({ data: { user: { id: USER } }, error: null });
  updateUser.mockResolvedValue({ data: {}, error: null });
  signOut.mockResolvedValue({ error: null });
  enforceRateLimit.mockResolvedValue(null);
});

describe("POST /api/auth/complete-password-reset", () => {
  it("refuses an ordinary signed-in session (no recovery marker): the password is NOT changed", async () => {
    const res = await post(GOOD);
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("no_recovery_session");
    expect(updateUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("refuses when there is a marker but no valid session", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "x" },
    });
    const res = await post(GOOD);
    expect(res.status).toBe(401);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("refuses a marker that belongs to a different user than the session", async () => {
    cookieJar.set(RECOVERY_COOKIE, OTHER);
    const res = await post(GOOD);
    expect(res.status).toBe(401);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("validates the session with the auth server, not just the cookie", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    await post(GOOD);
    expect(getUser).toHaveBeenCalled();
  });

  it("rejects weak or mismatched passwords before touching the account", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    for (const body of [
      { password: "short", confirmPassword: "short" },
      { password: "a-new-password", confirmPassword: "different-one" },
      { password: "x".repeat(73), confirmPassword: "x".repeat(73) },
      { password: 123, confirmPassword: 123 },
      {},
    ]) {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect((await res.json()).code).toBe("invalid");
    }
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("success: updates the password, signs OTHER sessions out, and consumes the marker", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    const res = await post(GOOD);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(updateUser).toHaveBeenCalledWith({ password: "a-new-password" });
    expect(signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(cookieDelete).toHaveBeenCalledWith(RECOVERY_COOKIE);
    // the link cannot be reused for a second change
    const again = await post(GOOD);
    expect(again.status).toBe(401);
    expect(updateUser).toHaveBeenCalledTimes(1);
  });

  it("the other sessions are revoked only AFTER the password was changed", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    await post(GOOD);
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      signOut.mock.invocationCallOrder[0],
    );
  });

  it("a failed password update keeps the marker so the user can retry, and revokes nothing", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    updateUser.mockResolvedValue({
      data: {},
      error: { message: "New password should be different" },
    });
    const res = await post(GOOD);
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("update_failed");
    expect(cookieDelete).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("if other sessions cannot be revoked the user is told, and the password change still stands", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    signOut.mockResolvedValue({ error: { message: "boom" } });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const res = await post(GOOD);
    consoleError.mockRestore();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.warning).toMatch(/sign out/i);
    expect(updateUser).toHaveBeenCalledTimes(1);
  });

  it("is rate limited per user, and a limited request changes nothing", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    enforceRateLimit.mockResolvedValue(
      new Response(JSON.stringify({ error: "slow down" }), { status: 429 }),
    );
    const res = await post(GOOD);
    expect(res.status).toBe(429);
    expect(updateUser).not.toHaveBeenCalled();
    expect(enforceRateLimit.mock.calls[0][2]).toBe(USER);
  });

  it("tolerates a malformed body", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    const res = await POST(
      new NextRequest(
        "https://app.example.com/api/auth/complete-password-reset",
        {
          method: "POST",
          body: "not json",
        },
      ),
    );
    expect(res.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });
});

describe("the /update-password page gate", () => {
  it("sends a visitor with no recovery marker to sign-in", async () => {
    await expect(UpdatePasswordLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/login?reason=reset_link_invalid",
    );
  });

  it("sends an ordinary signed-in user (valid session, no marker) away from the form", async () => {
    await expect(UpdatePasswordLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/login?reason=reset_link_invalid",
    );
    expect(getUser).not.toHaveBeenCalled(); // no marker -> no need to ask
  });

  it("sends a visitor whose session has expired to sign-in", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "x" },
    });
    await expect(UpdatePasswordLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/login?reason=reset_link_invalid",
    );
  });

  it("renders the form for a verified recovery session", async () => {
    cookieJar.set(RECOVERY_COOKIE, USER);
    const out = await UpdatePasswordLayout({ children: "FORM" });
    expect(out).toBe("FORM");
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("shared password rule", () => {
  it("is the same schema for form and server", () => {
    expect(updatePasswordSchema.safeParse(GOOD).success).toBe(true);
    expect(
      updatePasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
  });
});
