"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore, useState, useEffect, useRef } from "react";

// useSyncExternalStore gives server=false, client=true without useEffect+setState
function subscribe() { return () => {}; }

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-icon btn-ghost"
        aria-label="Toggle theme"
        title="Theme settings"
      >
        {isDark ? (
          // Sun icon
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
            <path
              d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Moon icon
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-36 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] z-50 overflow-hidden"
          style={{ animation: "fade-in 0.15s ease-out" }}
        >
          <div className="p-1">
            <button
              onClick={() => { setTheme("system"); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                theme === "system" 
                  ? "bg-[var(--color-brand-50)] text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-medium" 
                  : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-primary)]"
              }`}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM8 22h8M12 18v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
              System
            </button>
            <button
              onClick={() => { setTheme("light"); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                theme === "light" 
                  ? "bg-[var(--color-brand-50)] text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-medium" 
                  : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-primary)]"
              }`}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
              Light
            </button>
            <button
              onClick={() => { setTheme("dark"); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                theme === "dark" 
                  ? "bg-[var(--color-brand-50)] text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-medium" 
                  : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-primary)]"
              }`}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Dark
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
