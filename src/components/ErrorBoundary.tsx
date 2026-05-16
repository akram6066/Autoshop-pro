"use client";

import { captureException } from "@/lib/monitoring/sentry";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Custom fallback UI. Receives reset function. */
  fallback?: (reset: () => void, error: Error) => ReactNode;
  /** Called when an error is caught — use for Sentry/logging. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    // Log to console in development; in production Sentry picks this up
    // via the onError prop wired in providers.tsx
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(this.reset, error);
    }

    return <DefaultFallback reset={this.reset} error={error} />;
  }
}

// ─── Default fallback UI ──────────────────────────────────────────────────────

function DefaultFallback({
  reset,
  error,
}: {
  reset: () => void;
  error: Error;
}) {
  return (
    <div
      className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center"
      role="alert"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--color-danger-light)" }}
      >
        <svg
          width="22"
          height="22"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="var(--color-danger)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--color-ink-primary)" }}
      >
        Something went wrong
      </h2>
      <p
        className="text-sm mb-1 max-w-sm"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        An unexpected error occurred. Your data is safe — try reloading the
        page.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre
          className="text-xs text-left p-3 rounded-lg mt-3 max-w-md overflow-auto"
          style={{
            background: "var(--color-surface-2)",
            color: "var(--color-danger)",
            maxHeight: 200,
          }}
        >
          {error.message}
        </pre>
      )}
      <div className="flex gap-2 mt-5">
        <button
          type="button"
          onClick={reset}
          className="btn btn-primary btn-sm"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-secondary btn-sm"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

// ─── Route-level error boundary ───────────────────────────────────────────────
// Wrap each route group to contain crashes without killing the whole shell.

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, info) => {
        captureException(error, { componentStack: info.componentStack });
        console.error("[RouteError]", error, info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
