"use client";

import { useState, useTransition } from "react";
import { createAdminUser } from "../_actions";

export function CreateAdminUserButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function resetAndClose() {
    setOpen(false);
    setFullName("");
    setEmail("");
    setPassword("");
    setError("");
    setDone(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      setError(
        "All fields are required and password must be at least 8 characters.",
      );
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createAdminUser(
        fullName.trim(),
        email.trim(),
        password,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: "#0f172a",
          color: "white",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        New admin user
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) resetAndClose();
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: "28px 28px 24px",
              width: 420,
              boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            }}
          >
            {done ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 8,
                  }}
                >
                  Admin user created
                </h2>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                    marginBottom: 24,
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>{email}</strong> can now
                  log in and access the admin dashboard — no shop setup needed.
                </p>
                <button
                  type="button"
                  onClick={resetAndClose}
                  style={{
                    padding: "8px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: "#0f172a",
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 4,
                  }}
                >
                  Create admin user
                </h2>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "#64748b",
                    marginBottom: 22,
                    lineHeight: 1.55,
                  }}
                >
                  The account is confirmed immediately — no email required. They
                  can log in straight to the admin dashboard.
                </p>

                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Full name */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#0f172a",
                        marginBottom: 5,
                      }}
                    >
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abdi Risaq"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={pending}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: "0.9375rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#0f172a",
                        marginBottom: 5,
                      }}
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={pending}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: "0.9375rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#0f172a",
                        marginBottom: 5,
                      }}
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={pending}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: "0.9375rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {error && (
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#dc2626",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        padding: "9px 12px",
                        margin: 0,
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      justifyContent: "flex-end",
                      marginTop: 4,
                    }}
                  >
                    <button
                      type="button"
                      onClick={resetAndClose}
                      disabled={pending}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "white",
                        color: "#475569",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 8,
                        border: "none",
                        background: "#0f172a",
                        color: "white",
                        fontWeight: 700,
                        cursor: pending ? "not-allowed" : "pointer",
                        fontSize: "0.875rem",
                        opacity: pending ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {pending && (
                        <svg
                          style={{ animation: "spin 1s linear infinite" }}
                          width="13"
                          height="13"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeOpacity="0.25"
                          />
                          <path
                            d="M12 2a10 10 0 0110 10"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      {pending ? "Creating…" : "Create admin user"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
