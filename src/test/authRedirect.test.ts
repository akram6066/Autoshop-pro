import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

// Mock @supabase/ssr
const mockGetUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe("Proxy Route Protection and Root Redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-123";
  });

  it("passes unauthenticated visitors hitting root (/) straight through without Supabase calls", async () => {
    const req = new NextRequest("https://autoshop.app/");
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("allows auth callbacks on root (?code=xyz) to pass through to AuthCallbackHandler", async () => {
    const req = new NextRequest("https://autoshop.app/?code=pkce_secret_code");
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("immediately redirects unauthenticated requests on protected shop routes to /login", async () => {
    const req = new NextRequest("https://autoshop.app/dashboard");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://autoshop.app/login");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("redirects authenticated users on root (/) directly to /dashboard", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user_123", email: "user@example.com" } },
      error: null,
    });

    const req = new NextRequest("https://autoshop.app/", {
      headers: {
        cookie: "sb-mockproject-auth-token=valid-jwt-token",
      },
    });

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://autoshop.app/dashboard");
  });

  it("redirects authenticated users on /login directly to /dashboard", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user_123", email: "user@example.com" } },
      error: null,
    });

    const req = new NextRequest("https://autoshop.app/login", {
      headers: {
        cookie: "sb-mockproject-auth-token=valid-jwt-token",
      },
    });

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://autoshop.app/dashboard");
  });

  it("allows authenticated users access to protected shop routes (/dashboard)", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user_123", email: "user@example.com" } },
      error: null,
    });

    const req = new NextRequest("https://autoshop.app/dashboard", {
      headers: {
        cookie: "sb-mockproject-auth-token=valid-jwt-token",
      },
    });

    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it("redirects root (/) to /dashboard if auth check fails due to network outage but auth cookie is present", async () => {
    mockGetUser.mockRejectedValueOnce(new Error("Failed to fetch"));

    const req = new NextRequest("https://autoshop.app/", {
      headers: {
        cookie: "sb-mockproject-auth-token=cached-token",
      },
    });

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://autoshop.app/dashboard");
  });
});
