"use client";

import { useState } from "react";
import Container from "./Container";

function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 600);
  }

  return (
    <section
      id="waitlist"
      style={{
        padding: "96px 0",
        background: "var(--color-brand-50)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "var(--color-brand-100)",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "var(--color-brand-100)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <span
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: 999,
                background: "var(--color-brand-500)",
                color: "white",
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                marginBottom: 20,
              }}
            >
              Early access
            </span>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 3.5vw, 2.875rem)",
                lineHeight: 1.15,
                color: "var(--color-ink-primary)",
                marginBottom: 16,
              }}
            >
              Be first in line when we launch
            </h2>

            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--color-ink-secondary)",
                lineHeight: 1.75,
                marginBottom: 32,
                maxWidth: 440,
              }}
            >
              We&apos;re onboarding shops in batches. Join now to lock in
              founder pricing and get priority support.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                marginBottom: 36,
              }}
            >
              {[
                "Founder pricing — locked in forever",
                "Priority onboarding with our team",
                "Shape the product roadmap directly",
              ].map((benefit) => (
                <div
                  key={benefit}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--color-brand-500)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--color-ink-primary)",
                    }}
                  >
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            {/* Avatar row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex" }}>
                {[
                  "var(--color-brand-500)",
                  "var(--color-success)",
                  "var(--color-warning)",
                ].map((bg, i) => (
                  <div
                    key={i}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: bg,
                      border: "2px solid var(--color-brand-50)",
                      marginLeft: i === 0 ? 0 : -10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                        fill="white"
                        fillOpacity="0.85"
                      />
                      <path
                        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                        fill="white"
                        fillOpacity="0.85"
                      />
                    </svg>
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-ink-secondary)",
                }}
              >
                <strong style={{ color: "var(--color-ink-primary)" }}>
                  50+
                </strong>{" "}
                shop owners already on the list
              </p>
            </div>
          </div>

          {/* Right — form card */}
          <div
            style={{
              background: "var(--color-surface-0)",
              borderRadius: "var(--radius-lg)",
              padding: "40px",
              boxShadow: "var(--shadow-raised)",
              border: "1px solid var(--color-border)",
            }}
          >
            {submitted ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "var(--color-success-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="var(--color-success)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: "var(--color-ink-primary)",
                    marginBottom: 10,
                  }}
                >
                  You&apos;re on the list!
                </h3>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-ink-secondary)",
                    lineHeight: 1.65,
                  }}
                >
                  We&apos;ll email{" "}
                  <strong style={{ color: "var(--color-ink-primary)" }}>
                    {email}
                  </strong>{" "}
                  as soon as your spot is ready.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      color: "var(--color-ink-primary)",
                      marginBottom: 6,
                    }}
                  >
                    Request early access
                  </h3>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--color-ink-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    Reserve your spot before we open to the public.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--color-ink-primary)",
                        marginBottom: 6,
                      }}
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      className="input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    {loading ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          className="animate-spin"
                          width="15"
                          height="15"
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
                        Joining…
                      </span>
                    ) : (
                      "Request early access →"
                    )}
                  </button>

                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-ink-ghost)",
                      textAlign: "center",
                    }}
                  >
                    No credit card required · Unsubscribe anytime
                  </p>
                </form>

                {/* Trust badges */}
                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 24,
                    borderTop: "1px solid var(--color-border-subtle)",
                    display: "flex",
                    gap: 16,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { icon: "🔒", text: "Secure & private" },
                    { icon: "⚡", text: "Instant access" },
                    { icon: "🌍", text: "East Africa first" },
                  ].map((badge) => (
                    <div
                      key={badge.text}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span style={{ fontSize: "0.875rem" }}>{badge.icon}</span>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-ink-tertiary)",
                        }}
                      >
                        {badge.text}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default WaitlistSection;
