"use client";

import Link from "next/link";

interface Props {
  message: string;
}

export default function SignupSuccessScreen({ message }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--color-surface-1)",
      }}
    >
      <div
        className="card p-8 animate-scale-in"
        style={{ maxWidth: 420, width: "100%", textAlign: "center" }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "var(--color-success-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
            <path
              d="M5 12l5 5L20 7"
              stroke="var(--color-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2
          style={{
            fontWeight: 700,
            fontSize: "1.375rem",
            color: "var(--color-ink-primary)",
            marginBottom: 10,
          }}
        >
          Account created!
        </h2>
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--color-ink-secondary)",
            lineHeight: 1.65,
            marginBottom: 28,
          }}
        >
          {message}
        </p>
        <Link
          href="/login"
          className="btn btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "12px",
            fontSize: "1rem",
          }}
        >
          Sign in now →
        </Link>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-ink-ghost)",
            marginTop: 16,
          }}
        >
          Check your email for a confirmation link if required.
        </p>
      </div>
    </div>
  );
}
