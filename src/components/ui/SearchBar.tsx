"use client";

import { useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  size?: "default" | "lg";
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search products...",
  className = "",
  autoFocus = false,
  size = "default",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isLg = size === "lg";

  return (
    <div
      className={`relative flex items-center w-full ${className}`}
    >
      {/* Search icon */}
      <span
        className="absolute left-0 flex items-center justify-center pointer-events-none"
        style={{
          width: isLg ? "2.75rem" : "2.375rem",
          height: "100%",
          color: "#9ca3af",
        }}
        aria-hidden="true"
      >
        <svg
          width={isLg ? 17 : 15}
          height={isLg ? 17 : 15}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="11"
            cy="11"
            r="7.25"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M20 20l-3.15-3.15"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {/* Input */}
      <input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        style={{
          width: "100%",
          height: isLg ? "2.625rem" : "2.25rem",
          paddingLeft: isLg ? "2.75rem" : "2.375rem",
          paddingRight: value ? "2.25rem" : isLg ? "1rem" : "0.75rem",
          paddingTop: 0,
          paddingBottom: 0,
          fontSize: isLg ? "0.9375rem" : "0.875rem",
          lineHeight: 1.5,
          color: "#111827",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          outline: "none",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
          appearance: "none",
          WebkitAppearance: "none",
          fontFamily: "inherit",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#6366f1";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.boxShadow = "none";
        }}
        onMouseEnter={(e) => {
          if (document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = "#d1d5db";
          }
        }}
        onMouseLeave={(e) => {
          if (document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = "#e5e7eb";
          }
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: isLg ? "0.625rem" : "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "1.375rem",
            height: "1.375rem",
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            color: "#9ca3af",
            cursor: "pointer",
            padding: 0,
            transition: "color 120ms ease, background 120ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#374151";
            e.currentTarget.style.background = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#9ca3af";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg
            width="10"
            height="10"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}