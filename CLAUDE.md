# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (Next.js on port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

There are no tests configured in this project.

## Architecture Overview

**AutoShop Pro** is an offline-first PWA for managing automotive parts shops (tires, batteries, rims). Multi-tenant (users can belong to multiple shops) with role-based access (`owner` / `staff`).

### Route Groups

- `(auth)/` — public: `/login`, `/signup`, `/setup`
- `(shop)/` — authenticated shell with sidebar nav: `/dashboard`, `/pos`, `/inventory`, `/finder`, `/reports` (owner-only), `/settings` (owner-only)
- Root `/` redirects to `/dashboard`

### Auth & Session Flow

1. Login calls Supabase auth → fetches profile + `shop_members` + shops → seeds IndexedDB via `seedLocalCache()` → routes `owner → /dashboard`, `staff → /pos`.
2. First-time owners with no shop are sent to `/setup`, which calls the `setup_owner_shop` RPC (creates shop + profile + default categories atomically, `security definer` bypasses RLS).
3. Auth state lives in Zustand (`src/stores/authStore.ts`) with `devtools` + `persist`. **Only** `shop`, `shops`, `role`, `shopId` are persisted — `user` and `profile` are not (re-fetched from session on mount).
4. The `(shop)` layout re-hydrates from Supabase session on mount and listens for cross-tab sign-out via `onAuthStateChange("SIGNED_OUT")`.
5. Middleware (`src/middleware.ts`) uses `getUser()` (not `getSession()`) to validate JWT with the auth server on every request.

### Multi-Shop

- `profile.shop_id` is "last active shop" only. Real membership is in `shop_members` table.
- `shop_members` gives each user a `role` per shop — a user can be `owner` of Shop A and `staff` of Shop B.
- `useAuthStore` exposes `shops: ShopWithRole[]`; `switchShop()` updates `shop`, `shopId`, and `role` together atomically.
- Always read store via stable selectors (`selectShopId`, `selectRole`, `selectIsOwner`, etc.) to avoid re-renders.

### Offline-First Data Layer

Every write follows this pattern:
1. Try Supabase directly.
2. On failure: `enqueue()` to `sync_queue` in IndexedDB + optimistic write to the local table.
3. On reconnect: `flushQueue()` replays pending ops in order (max 5 attempts, then `failed`).

**`flushQueue()`** (`src/lib/sync/queue.ts`) — queries IndexedDB for `[shop_id, "pending"]` entries sorted by `created_at`, replays each against Supabase, marks `synced` or increments `attempts` (→ `failed` at 5).

**`scheduleRetry()`** (`src/lib/sync/retry.ts`) — polls every 30 s while `navigator.onLine`; also fires immediately on the `window.online` event.

**TanStack Query hooks** (`src/hooks/`) — network-first fetch with IndexedDB fallback on error. Successful fetches fire-and-forget `seed*()` to update local cache. Mutations invalidate the full `*Keys.all(shopId)` query key on success.

**Sync badge** — `useSyncQueue` polls IndexedDB every 5 s and displays Offline / Syncing / X failed / Synced in the nav.

### IndexedDB (Dexie) — `src/lib/db/`

Tables: `shops`, `rooms`, `products`, `sales`, `sale_items`, `stock_movements`, `sync_queue`, `purchase_orders`, `po_items`.

**Schema versioning is append-only** — bump `DB_VERSION` and add a new `.version().stores()` block; never mutate existing version blocks. Compound index `[shop_id+status]` on `sync_queue` must match `.where("[shop_id+status]").equals([shopId, "pending"])` — field order matters.

Singleton: `getDb()` in `src/lib/db/instance.ts`. `pruneOldData()` removes data older than 90 days (preserves entity tables).

### POS — `record_sale` Flow

**Online**: calls `supabase.rpc("record_sale", { p_sale, p_items })` — the RPC atomically inserts sale + items + stock movements + deducts `products.quantity`.

**Offline**: Dexie transaction inserts sale, sale_items, and `OUT` stock_movements locally; only the sale operation is enqueued (stock movements are NOT individually enqueued — the server RPC handles them when the sale syncs).

### Supabase

- Client: `src/lib/supabase/client.ts` (browser singleton)
- Server: `src/lib/supabase/server.ts` (per-request, `next/headers`)
- Migrations in `supabase/migrations/` (run via `supabase db push`):
  - `001_schema.sql` — tables
  - `002_rls.sql` — RLS policies + `auth_shop_id()` / `auth_role()` helpers
  - `003_functions.sql` — RPCs: `record_sale`, `apply_stock_deltas`, `get_low_stock_products`, `get_sales_summary`
  - `004_categories_multishop.sql` — `categories` table, `shop_members` table, multi-shop helpers
- `products.category` is now free-text (was an enum) — filter by text string, not enum value.

### Styling

Tailwind v4 with design tokens in `src/app/globals.css` under `@theme inline`. **Never use Tailwind config for colors or spacing.**

- Colors: `var(--color-brand-*)`, `var(--color-surface-0/1/2)`, `var(--color-ink-primary/secondary/tertiary)`, `var(--color-success/warning/danger)`
- Utility classes defined in `globals.css` (not Tailwind utilities): `.card`, `.input`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.btn-icon`
- Inline `style` props with `var(--color-*)` are intentional for one-off token usage
- Fonts: `--font-display` (Instrument Serif), `--font-sans` (DM Sans), `--font-mono` (JetBrains Mono)

### API Routes

- `POST /api/sync` — called by the service worker to trigger flush; returns `server_time` for clock drift detection (flush itself runs client-side).
- `GET /api/auth/callback` — OAuth code exchange, redirects to dashboard.

### PWA

Service worker at `public/sw.js`: navigation = network-first with offline fallback; `/_next/static/` = cache-first; Supabase API calls = never cached. Registers `sync` event tag `sync-queue` and broadcasts `SYNC_REQUESTED` to all clients. Registered in `src/components/providers.tsx`; served with `no-cache` headers (see `next.config.ts`).

### Path Alias

`@/` maps to `src/`.
