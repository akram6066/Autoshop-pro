"use client";

import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Enter a valid email address").max(254),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000),
});

type Fields = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof Fields, string>>;

export function ContactForm() {
  const [fields, setFields] = useState<Fields>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  function set(key: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(fields);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Fields;
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Request failed");
      }
      setStatus("sent");
      setFields({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        style={{
          padding: "48px 32px",
          textAlign: "center",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "16px",
          background: "var(--color-surface-0)",
          boxShadow: "var(--shadow-raised)",
        }}
        className="animate-fade-in-up"
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(16,185,129,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              d="M20 6L9 17l-5-5"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--color-ink-primary)",
            marginBottom: 8,
          }}
        >
          Message received!
        </h3>
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--color-ink-secondary)",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Thank you for reaching out. We&apos;ll get back to you within one
          business day. For urgent issues, reach us on WhatsApp for a faster
          response.
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setStatus("idle")}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--color-surface-0)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "16px",
        padding: "36px",
        boxShadow: "var(--shadow-card)",
      }}
      className="animate-fade-in-up"
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              Full name <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              className="input"
              type="text"
              value={fields.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="James Kamau"
              style={{
                height: "44px",
                borderRadius: "8px",
                borderColor: errors.name ? "var(--color-danger)" : undefined,
              }}
            />
            {errors.name && (
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--color-danger)" }}
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              Email address{" "}
              <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              className="input"
              type="email"
              value={fields.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              style={{
                height: "44px",
                borderRadius: "8px",
                borderColor: errors.email ? "var(--color-danger)" : undefined,
              }}
            />
            {errors.email && (
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--color-danger)" }}
              >
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            Message <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <textarea
            className="input"
            rows={6}
            value={fields.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Tell us how we can help you..."
            style={{
              height: "auto",
              padding: "12px",
              resize: "vertical",
              borderRadius: "8px",
              borderColor: errors.message ? "var(--color-danger)" : undefined,
            }}
          />
          <div className="flex items-start justify-between mt-1.5">
            {errors.message ? (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                {errors.message}
              </p>
            ) : (
              <span />
            )}
            <p
              className="text-xs flex-shrink-0"
              style={{
                color:
                  fields.message.length > 4500
                    ? "var(--color-warning)"
                    : "var(--color-ink-ghost)",
              }}
            >
              {fields.message.length} / 5000
            </p>
          </div>
        </div>

        {status === "error" && (
          <p
            className="text-sm rounded-lg px-4 py-3"
            style={{
              background: "var(--color-danger-light, #fef2f2)",
              color: "var(--color-danger)",
              border: "1px solid var(--color-danger)",
            }}
          >
            Something went wrong sending your message. Please try again or reach
            us directly on WhatsApp.
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={status === "sending"}
          style={{
            height: "46px",
            borderRadius: "8px",
            fontSize: "0.9375rem",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(99,102,241,0.15)",
          }}
        >
          {status === "sending" ? "Sending inquiry..." : "Send inquiry"}
        </button>
      </form>
    </div>
  );
}
