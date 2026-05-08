import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Category } from "@/types/app";

// ─── Tailwind merge ────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ─────────────────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

// ─── Dates ────────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diff / 86_400_000);
  if (days < 7) return `${days}d ago`;

  return formatDate(iso);
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export function categoryLabel(cat: Category): string {
  const labels: Record<Category, string> = {
    tire: "Tire",
    battery: "Battery",
    rim: "Rim",
  };
  return labels[cat] ?? cat;
}

// ─── Device ID ────────────────────────────────────────────────────────────────

/**
 * Stable per-device ID stored in localStorage.
 * Used in stock_movements.device_id for conflict detection.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "autoshop_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── Debounce ─────────────────────────────────────────────────────────────────

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Sync Badge ───────────────────────────────────────────────────────────────

export function syncBadgeClass(pending: number, failed: number, isOnline: boolean): string {
  if (!isOnline) return "badge-warning";
  if (failed > 0) return "badge-danger";
  if (pending > 0) return "badge-info";
  return "badge-success";
}

// ─── Truncate ─────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

// ─── Stock status ─────────────────────────────────────────────────────────────

export function stockStatus(qty: number, minStock: number): "ok" | "low" | "out" {
  if (qty === 0) return "out";
  if (qty <= minStock) return "low";
  return "ok";
}
