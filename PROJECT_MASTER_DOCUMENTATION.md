# AutoShop Pro — Project Master Documentation

> **Audience:** New engineers, technical stakeholders, DevOps, and security reviewers.
> **Last updated:** 2026-06-06 | **Next.js:** 16.2.6 | **React:** 19.2.4

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Purpose](#2-business-purpose)
3. [Technology Stack](#3-technology-stack)
4. [Repository Layout](#4-repository-layout)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Database Design](#7-database-design)
8. [Authentication & Session Management](#8-authentication--session-management)
9. [Authorization & RLS](#9-authorization--rls)
10. [Offline-First Sync System](#10-offline-first-sync-system)
11. [Subscription & Billing](#11-subscription--billing)
12. [Admin System](#12-admin-system)
13. [PWA & Service Worker](#13-pwa--service-worker)
14. [Security Model](#14-security-model)
15. [Deployment & Infrastructure](#15-deployment--infrastructure)
16. [Environment Variables](#16-environment-variables)
17. [Development Workflow](#17-development-workflow)

---

## 1. Project Overview

**AutoShop Pro** is a production-grade, offline-first Progressive Web Application (PWA) built for managing automotive parts shops — specifically focused on tyres, batteries, and rims. The product is a multi-tenant SaaS platform where each user can belong to multiple shops, each with a distinct role (`owner` or `staff`).

### Core Capabilities

| Capability           | Description                                                                           |
| -------------------- | ------------------------------------------------------------------------------------- |
| Point of Sale (POS)  | Full checkout flow with payment methods, delivery, customer linking, receipt printing |
| Inventory Management | Products with variants, SKU tracking, stock movements, low-stock alerts               |
| Sales Reporting      | Daily/weekly/monthly revenue, product analytics, staff sales breakdown                |
| Offline Mode         | All writes work without internet; replayed automatically on reconnect                 |
| Multi-Shop           | One account can own or be staff at multiple shops                                     |
| Team Management      | Owners invite staff via email, revoke access, assign roles                            |
| Subscriptions        | Trial (free forever), Pro, Ultra Pro tiers with usage limits                          |
| Admin Panel          | Super-admin dashboard for platform management, user oversight                         |
| Customer Ledger      | Credit/debt tracking per customer, payment history                                    |
| Purchase Orders      | Supplier order management with line items                                             |

---

## 2. Business Purpose

AutoShop Pro targets **small-to-medium automotive parts retailers** in markets with unreliable internet connectivity. The core business insights driving design decisions:

- **Shops cannot afford downtime** — a POS that requires internet fails in poor-connectivity markets.
- **Multi-location owners** need one account to manage all shops.
- **Staff vs. Owner separation** is critical — staff should never access financial reports or delete products.
- **SaaS monetisation** is achieved via tiered subscriptions with feature/usage limits enforced at DB and UI level.

---

## 3. Technology Stack

### Frontend

| Technology     | Version | Purpose                                                         |
| -------------- | ------- | --------------------------------------------------------------- |
| Next.js        | 16.2.6  | App framework (App Router, Server Components, Proxy middleware) |
| React          | 19.2.4  | UI rendering (with concurrent features)                         |
| TypeScript     | 5.9.3   | Type safety across the entire codebase                          |
| Tailwind CSS   | v4      | Utility-first styling with design tokens                        |
| Zustand        | 5.0.13  | Global auth state (with localStorage persistence)               |
| TanStack Query | 5.100.9 | Server state management, caching, invalidation                  |
| Dexie          | 4.4.2   | IndexedDB ORM for offline-first local DB                        |
| Zod            | 4.4.3   | Runtime schema validation for forms and API inputs              |
| Radix UI       | 1.4.3   | Accessible headless UI primitives                               |
| Sonner         | 2.0.7   | Toast notifications                                             |
| Lucide React   | 1.14.0  | Icon library                                                    |
| next-themes    | 0.4.6   | Dark/light mode management                                      |

### Backend / Infrastructure

| Technology              | Version              | Purpose                                                 |
| ----------------------- | -------------------- | ------------------------------------------------------- |
| Supabase                | (hosted)             | PostgreSQL database + Auth + Realtime + Storage         |
| `@supabase/ssr`         | 0.10.2               | Server-side Supabase client with cookie handling        |
| `@supabase/supabase-js` | 2.105.4              | Client-side Supabase SDK                                |
| Vercel                  | (hosted)             | Next.js hosting, edge middleware, environment variables |
| Sentry                  | 10.52.0              | Error monitoring (browser + server + edge)              |
| M-Pesa                  | (custom integration) | Mobile money payment processing (East Africa)           |

### Testing & Quality

| Tool                          | Purpose                                        |
| ----------------------------- | ---------------------------------------------- |
| Vitest 4.1.8                  | Unit/integration tests                         |
| Playwright 1.52.0             | E2E browser tests                              |
| ESLint 9 + eslint-config-next | Code linting                                   |
| Prettier 3.8.3                | Code formatting                                |
| Husky 9 + lint-staged         | Pre-commit hooks (ESLint fix + TSC + Prettier) |

---

## 4. Repository Layout

```
autoshop-pro/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Public auth routes
│   │   │   ├── login/              # Login page + sub-panels
│   │   │   ├── signup/             # Signup + success screen
│   │   │   ├── setup/              # First-time shop setup wizard
│   │   │   ├── choose-plan/        # Post-signup plan selection
│   │   │   └── update-password/    # Password reset flow
│   │   ├── (shop)/                 # Authenticated shop shell
│   │   │   ├── layout.tsx          # Auth init, sync listeners, global banners
│   │   │   ├── dashboard/          # KPI overview, low stock, analytics
│   │   │   ├── pos/                # Point of Sale checkout
│   │   │   ├── inventory/          # Product CRUD, stock management
│   │   │   ├── finder/             # Product/tyre finder/catalogue
│   │   │   ├── reports/            # Sales reports, product analytics
│   │   │   ├── sales/              # Sales history, void sales
│   │   │   ├── customers/          # Customer ledger
│   │   │   ├── activity/           # Audit log / stock movements
│   │   │   ├── billing/            # Subscription management
│   │   │   ├── overview/           # Multi-shop overview
│   │   │   ├── invites/            # Pending team invites
│   │   │   ├── profile/            # User profile
│   │   │   └── settings/           # Shop + account settings
│   │   ├── (marketing)/            # Public marketing pages
│   │   │   ├── contact/            # Contact form
│   │   │   ├── privacy/            # Privacy policy
│   │   │   └── terms/              # Terms of service
│   │   ├── admin/                  # Super-admin panel
│   │   ├── api/                    # Next.js API routes
│   │   │   ├── sync/               # POST /api/sync — flush trigger
│   │   │   ├── auth/callback/      # GET /api/auth/callback — OAuth
│   │   │   └── contact/            # POST /api/contact — contact form
│   │   ├── offline/                # PWA offline fallback page
│   │   ├── globals.css             # Tailwind + design tokens + global styles
│   │   ├── layout.tsx              # Root layout (ThemeProvider, Providers)
│   │   └── page.tsx                # Root redirect → /dashboard
│   ├── components/
│   │   ├── providers.tsx           # QueryClient + SW registration + sync
│   │   ├── ErrorBoundary.tsx       # Route-level error handling
│   │   ├── ThemeProvider.tsx       # next-themes wrapper
│   │   ├── ThemeToggle.tsx         # Dark/light toggle button
│   │   ├── EmailConfirmBanner.tsx  # "Please confirm your email" banner
│   │   ├── TrialBanner.tsx         # Trial expiry reminder
│   │   ├── PendingInviteBanner.tsx # Invite notification
│   │   ├── UsageMeter.tsx          # Plan usage visualization
│   │   ├── shop/                   # Shop-specific layout components
│   │   ├── pos/                    # POS UI components
│   │   ├── landing/                # Marketing page components
│   │   └── ui/                     # Generic design system components
│   ├── hooks/
│   │   ├── useProducts.ts          # Product queries + CRUD mutations
│   │   ├── useSales.ts             # Sales queries + record_sale + void_sale
│   │   ├── useCart.ts              # In-memory cart backed by sessionStorage
│   │   ├── useCustomers.ts         # Customer CRUD + payments
│   │   ├── useCategories.ts        # Category queries
│   │   ├── useVariants.ts          # Product variants
│   │   ├── useRooms.ts             # Storage room queries
│   │   ├── useTeam.ts              # Staff management
│   │   ├── useSubscription.ts      # Subscription plan status
│   │   ├── useSyncQueue.ts         # Sync badge polling
│   │   ├── useOnlineStatus.ts      # Online/offline detector
│   │   ├── useMounted.ts           # Hydration-safe mounted flag
│   │   └── useDebounce.ts          # Input debounce utility
│   ├── stores/
│   │   └── authStore.ts            # Zustand: user, profile, shop, role, shops
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser singleton Supabase client
│   │   │   ├── server.ts           # Per-request server Supabase client
│   │   │   └── fetchAllProducts.ts # Paginated product fetch helper
│   │   ├── db/
│   │   │   ├── schema.ts           # Dexie class + 5 schema versions
│   │   │   └── instance.ts         # Singleton getDb(), seedLocalCache(), clearLocalDb(), pruneOldData()
│   │   ├── sync/
│   │   │   ├── queue.ts            # enqueue(), flushQueue(), listenForCrossTabSync(), closeChannel()
│   │   │   └── retry.ts            # scheduleRetry(), attachSyncListeners(), per-shop backoff
│   │   ├── auth/
│   │   │   └── session.ts          # loadAuthSessionState(), withAuthTimeout()
│   │   ├── monitoring/
│   │   │   └── sentry.ts           # captureException() wrapper
│   │   ├── mpesa/                  # M-Pesa STK push integration
│   │   ├── subscription/           # Plan limit enforcement helpers
│   │   ├── validations/
│   │   │   ├── auth.ts             # Login/signup Zod schemas
│   │   │   ├── domain.ts           # Domain entity schemas
│   │   │   ├── api.ts              # API request schemas
│   │   │   └── login.ts            # Login-specific helpers
│   │   ├── api/
│   │   │   ├── limit-check.ts      # Usage limit enforcement
│   │   │   ├── errors.ts           # Friendly error message mapping
│   │   │   ├── logger.ts           # Server-side logging
│   │   │   └── rate-limit.ts       # Request rate limiting
│   │   ├── plans.ts                # Plan definitions (trial, pro, ultra_pro)
│   │   ├── pricing.ts              # Plan prices and features
│   │   ├── limits.ts               # Per-plan usage limits
│   │   ├── utils.ts                # Device ID, date helpers, sanitization
│   │   └── nav.tsx                 # Navigation link definitions
│   ├── types/
│   │   ├── app.ts                  # 260+ domain types (Product, Sale, Cart, etc.)
│   │   ├── database.ts             # Auto-generated Supabase DB types
│   │   └── mutations.ts            # Mutation result types
│   └── proxy.ts                    # Next.js 16 Proxy (was middleware) — JWT auth guard
├── supabase/
│   ├── migrations/                 # 67 SQL migration files (001 → 064 + 3 timestamped)
│   └── config.toml                 # Supabase CLI project config
├── public/
│   ├── sw.js                       # Service worker (cache strategies + sync event)
│   ├── manifest.json               # PWA manifest
│   ├── logo.svg                    # Light mode logo
│   ├── logo-dark.svg               # Dark mode logo
│   ├── logo-wordmark-black.svg     # Wordmark logo
│   └── dashboard.png               # Marketing screenshot
├── .env.example                    # Environment variable template
├── .env.local                      # Local secrets (gitignored)
├── next.config.ts                  # Next.js config (CSP, Sentry, images)
├── package.json                    # Dependencies + scripts
├── tsconfig.json                   # TypeScript config (@/ alias → src/)
├── vercel.json                     # Vercel deployment config
├── eslint.config.mjs               # ESLint flat config
├── playwright.config.ts            # Playwright E2E config
├── vitest.config.ts                # Vitest unit test config
└── sentry.*.config.ts              # Sentry server/edge configs
```

---

## 5. Frontend Architecture

### Route Groups

Next.js App Router uses **route groups** (folders in parentheses) to share layouts without affecting URLs:

```
(auth)/   → Shares public layout (no sidebar). Routes: /login, /signup, /setup, /choose-plan
(shop)/   → Shares authenticated shell. Routes: /dashboard, /pos, /inventory, etc.
(marketing)/ → Public marketing pages: /contact, /privacy, /terms
```

### Component Hierarchy

```
Root layout.tsx (ThemeProvider + Providers)
  └── (shop)/layout.tsx (auth init, ShopHeader, banners)
        └── Page component
              └── Feature components
                    └── hooks (useProducts, useSales, useCart...)
                          └── Supabase SDK / Dexie
```

### State Management Strategy

| State Type                               | Tool              | Persistence                           |
| ---------------------------------------- | ----------------- | ------------------------------------- |
| Auth (user, profile, shop, role)         | Zustand + persist | localStorage                          |
| Server data (products, sales, customers) | TanStack Query    | In-memory cache                       |
| Local offline data                       | Dexie (IndexedDB) | IndexedDB (survives reload)           |
| Cart                                     | `useCart` hook    | sessionStorage (survives tab refresh) |
| UI state (modals, forms)                 | React useState    | Memory only                           |

### Data Flow Pattern

```
User action
  → Mutation hook (e.g., useRecordSale)
    → Try Supabase RPC (online)
      → Success: TanStack Query cache invalidated → UI refreshes
      → Failure: Enqueue to IndexedDB sync_queue + optimistic local write
        → scheduleRetry watches for reconnect
          → flushQueue() replays operations
```

### Design System

The project uses **Tailwind v4** with custom design tokens in `globals.css`:

```css
/* Color tokens */
--color-brand-50 through --color-brand-950  /* Primary brand color */
--color-surface-0, -1, -2                   /* Background layers */
--color-ink-primary, -secondary, -tertiary  /* Text colors */
--color-success, --color-warning, --color-danger

/* Typography */
--font-display: Instrument Serif (headings)
--font-sans: DM Sans (body text)
--font-mono: JetBrains Mono (code, SKUs)

/* Utility classes (defined in globals.css, NOT Tailwind config) */
.card      → surface-1 background, border, rounded, padding
.input     → styled form input
.btn       → base button
.btn-primary, .btn-secondary, .btn-ghost, .btn-sm, .btn-icon
```

---

## 6. Backend Architecture

AutoShop Pro uses a **"fat database"** pattern — most business logic lives in Supabase PostgreSQL RPCs rather than in Next.js API routes. This ensures:

- Atomic operations that cannot be partially applied
- Logic runs close to data (no round-trip overhead)
- RLS policies enforce security at DB level

### API Routes (Next.js)

| Route                | Method | Purpose                                                       |
| -------------------- | ------ | ------------------------------------------------------------- |
| `/api/sync`          | POST   | Called by SW sync event; returns server_time for clock drift  |
| `/api/auth/callback` | GET    | OAuth code exchange; redirects to /dashboard                  |
| `/api/contact`       | POST   | Contact form submission to Supabase `contact_inquiries` table |

### Supabase RPCs (PostgreSQL Functions)

| RPC                                               | Purpose                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| `record_sale(p_sale, p_items)`                    | Atomically: insert sale + items + stock movements + deduct quantities |
| `void_sale(p_sale_id, p_shop_id)`                 | Mark sale voided, restore stock quantities                            |
| `apply_stock_deltas(product_id)`                  | Sum unsynced movements, apply net delta, mark synced                  |
| `get_low_stock_products(shop_id)`                 | Products where quantity ≤ min_stock                                   |
| `get_sales_summary(shop_id, from, to)`            | Daily revenue + order count                                           |
| `get_product_analytics(shop_id, from, to, limit)` | Top products by revenue                                               |
| `setup_owner_shop(user_id, shop_name, ...)`       | First-time setup: shop + profile + default room (atomic)              |
| `create_additional_shop(name, address)`           | Add second/third shop (plan-limit checked)                            |
| `switch_shop(shop_id)`                            | Update profile.shop_id atomically                                     |
| `check_is_owner(shop_id)`                         | Returns true if calling user is owner                                 |
| `owner_delete_shop(shop_id)`                      | Soft-delete shop, cascade to members/products                         |
| `delete_own_account()`                            | Hard-delete user profile and all owned shops                          |

---

## 7. Database Design

### Schema Overview

The database has **16 primary tables** across two schemas (`public` and `auth`):

```
auth.users (managed by Supabase)
  ↓ trigger: handle_new_user creates profile
public.profiles
  ↓ profile.shop_id (last active shop — not membership)
  ↓ joined via shop_members

public.shops
  ├── public.shop_members (user_id, shop_id, role)
  ├── public.rooms (storage locations)
  └── public.products
        ├── public.product_variants (size/type variants)
        └── public.stock_movements (IN/OUT audit trail)

public.sales
  ├── public.sale_items (line items per sale)
  └── linked to products, customers, staff

public.customers (per shop, credit/debt tracking)
public.purchase_orders → public.po_items
public.categories (shop-scoped tags for products)
public.sync_queue (offline operation log)
public.subscriptions (billing, plan, status, dates)
public.audit_log (change tracking for products/sales)
public.contact_inquiries (marketing contact form)
public.invites (team invitation tokens)
public.app_settings (platform-wide config e.g. trial settings)
```

### Key Relationships

```
shops (1) ──── (N) shop_members ──── (N) profiles
shops (1) ──── (N) rooms
shops (1) ──── (N) products (1) ──── (N) product_variants
shops (1) ──── (N) sales (1) ──── (N) sale_items
shops (1) ──── (N) customers
shops (1) ──── (N) purchase_orders (1) ──── (N) po_items
shops (1) ──── (1) subscriptions
products (1) ──── (N) stock_movements
```

### Schema Versioning (IndexedDB / Dexie)

The local IndexedDB mirrors key tables. Dexie uses **append-only** version blocks:

| Version | Tables Added/Modified                                                  |
| ------- | ---------------------------------------------------------------------- |
| 1       | shops, rooms, products, sales, sale_items, stock_movements, sync_queue |
| 2       | purchase_orders, po_items                                              |
| 3       | sync_queue compound index `[shop_id+status]`                           |
| 4       | product_variants table                                                 |
| 5       | customers table                                                        |

**Rule:** Never edit past version blocks. Always add a new `.version(N).stores({...})` block.

---

## 8. Authentication & Session Management

### Login Flow (Step by Step)

```
1. User submits email + password on /login
2. LoginForm calls supabase.auth.signInWithPassword()
3. On success: loadAuthSessionState() is called
   a. supabase.auth.getUser() — validates JWT with auth server
   b. Parallel: fetch profiles + shop_members + shops (with deleted_at IS NULL filter)
   c. seedLocalCache(shop, rooms, products) — populates IndexedDB
   d. useAuthStore.setAll() — updates Zustand state
4. Route: owners → /dashboard, staff → /pos
5. If email not confirmed: ConfirmEmailPanel shown
6. If network error: offline-specific error message
```

### Session Persistence

- Supabase stores JWT in a httpOnly cookie via `@supabase/ssr`
- Zustand persists `{ shop, shops, role, shopId }` to `localStorage` under key `autoshop-auth`
- `user` and `profile` are NOT persisted — always re-fetched from session on mount
- On app load: `useAuthStore.persist.rehydrate()` runs first (synchronous, from localStorage), then async Supabase fetch corrects stale data

### Proxy (middleware equivalent)

`src/proxy.ts` runs on every request to shop routes (`/dashboard`, `/pos`, etc.):

1. Fast-path: non-shop routes return `NextResponse.next()` immediately
2. Creates a server Supabase client with cookie access
3. Calls `supabase.auth.getUser()` — this validates JWT against the **auth server**, not locally
4. If no user: redirect to `/login`
5. If user: pass through, cookie refreshed in response

### Cross-Tab Sign-Out

`ShopLayout` subscribes to `supabase.auth.onAuthStateChange("SIGNED_OUT")`:

- Clears sessionStorage cart
- Calls `closeChannel()` to release BroadcastChannel
- Calls `clearLocalDb()` — wipes all IndexedDB tables
- Calls `useAuthStore.reset()` — clears Zustand
- `router.replace("/login")` — redirects

### Stale Token Handling

If `getUser()` returns a `refresh_token_not_found` or `Invalid Refresh Token` error:

- `supabase.auth.signOut({ scope: "local" })` — wipes local tokens WITHOUT an HTTP call
- `router.replace("/login?reason=session_expired")` — shows expiry message

---

## 9. Authorization & RLS

### Role Model

```
owner  → Full CRUD on all shop entities + team management + financial reports
staff  → Can view + create sales, manage products (no delete), no reports access
admin  → Platform super-admin, bypasses shop RLS entirely
```

### RLS Helper Functions

```sql
-- Returns calling user's active shop_id from shop_members
auth_shop_id() → uuid

-- Returns calling user's role in the active shop
auth_role() → text  ('owner' | 'staff')
```

### Policy Matrix

| Table           | Select                 | Insert         | Update     | Delete       |
| --------------- | ---------------------- | -------------- | ---------- | ------------ |
| shops           | member                 | owner RPC only | owner      | owner (soft) |
| rooms           | member                 | owner          | owner      | owner        |
| profiles        | own + owner-sees-staff | own            | own        | own          |
| products        | member                 | member         | member     | owner        |
| sales           | member                 | member         | void=owner | —            |
| sale_items      | member                 | member         | —          | —            |
| stock_movements | member                 | member         | system     | —            |
| sync_queue      | member                 | member         | member     | member       |
| purchase_orders | member                 | owner          | owner      | owner        |
| customers       | member                 | member         | member     | owner        |

### OwnerGuard Component

Wraps owner-only pages (`/reports`, `/settings`). Reads `selectIsOwner` from Zustand. Non-owners see "Access Denied" without a redirect.

---

## 10. Offline-First Sync System

### Architecture

```
┌──────────────────────────────────────────────────────┐
│  Write Operation (e.g., record_sale)                 │
│                                                      │
│  1. Try Supabase RPC                                │
│     ├─ Success → invalidate TanStack Query cache    │
│     └─ Failure → enqueue() to IndexedDB             │
│         └─ sync_queue row: { id, shop_id, table,   │
│              operation, payload, status='pending' } │
└──────────────────────────────────────────────────────┘
           ↓ on reconnect / every 5-60s
┌──────────────────────────────────────────────────────┐
│  flushQueue(shopId)                                  │
│                                                      │
│  1. Query sync_queue WHERE [shop_id, 'pending']     │
│     ordered by created_at                           │
│  2. For each op: replay Supabase call                │
│     ├─ Success → mark status='synced'              │
│     └─ Failure → attempts++ (→ 'failed' at 5)     │
└──────────────────────────────────────────────────────┘
```

### Idempotency

Each enqueued operation has a stable UUID (`id`). The server-side RPC uses `ON CONFLICT (id) DO NOTHING` for insert operations, ensuring replaying the same op multiple times is safe.

### Cross-Tab Coordination

`BroadcastChannel('autoshop-sync')` is used so that:

- When one tab flushes the queue, other open tabs don't flush simultaneously
- Sign-out in one tab propagates to all tabs

### Retry Schedule

`retry.ts` maintains **per-shop** retry state (a `Map<shopId, { timer, delay }>`):

- Starts at 5 seconds
- Doubles on failure: 5s → 10s → 20s → 40s → 60s (cap)
- Resets to 5s on success or reconnect
- Cleans up state when detached (no memory leaks)

### Sync Badge

`useSyncQueue` polls IndexedDB every 5 seconds and counts `pending` + `failed` ops:

- 0 pending, 0 failed → "Synced" (green)
- Pending > 0 → "Syncing…" (amber)
- Failed > 0 → "X failed" (red)
- No network → "Offline" (grey)

---

## 11. Subscription & Billing

### Plans

| Plan      | Price          | Key Limits                                        |
| --------- | -------------- | ------------------------------------------------- |
| Trial     | Free forever   | Limited products, 1 shop, basic features          |
| Pro       | Monthly/Annual | More products, up to 2 shops, advanced reports    |
| Ultra Pro | Monthly/Annual | Unlimited products, unlimited shops, all features |

### Plan Enforcement

**Database level:** RPCs like `setup_owner_shop` and `create_additional_shop` check `subscriptions.plan` before proceeding and raise `shop_limit_reached` errors.

**UI level:** `useSubscription()` hook fetches current plan. `LimitWarningBanner` shows when approaching limits. `OwnerGuard` blocks non-owner access to billing.

**Cron job** (migration 058): `pg_cron` job runs daily to:

- Sync `shops.plan` with `subscriptions.plan` for accurate RLS checks
- Downgrade expired subscriptions to `trial`

### Billing Providers

- **M-Pesa** (`src/lib/mpesa/`) — STK Push for East African mobile money payments
- **Stripe** — International card payments (referenced in migrations)

### Subscription State Machine

```
trial → pro (payment) → active
      → pro_annual (payment) → active
active → cancelled (user request) → expires at period_end
cancelled → expired → downgraded to trial by cron
trial → pro via auto_billing (migration 062 — phone collection)
```

---

## 12. Admin System

The `/admin` route group is protected by `require-admin.ts` middleware:

1. `createServerSupabaseClient()` fetches user
2. `profiles.is_admin = true` check
3. Non-admins get 403 or redirect

Admin capabilities:

- View all shops, users, subscriptions
- Manually override plans
- View platform-wide analytics
- Manage contact inquiries
- Impersonate users (audit logged)

---

## 13. PWA & Service Worker

**File:** `public/sw.js` | **Cache Version:** 4

### Cache Strategies

| Request Type      | Strategy                          | Rationale                   |
| ----------------- | --------------------------------- | --------------------------- |
| Navigation (HTML) | Network-first → /offline fallback | Always fresh, offline works |
| `/_next/static/*` | Cache-first                       | Immutable build hashes      |
| `*.supabase.co/*` | Network-only (never cache)        | Auth tokens, real-time data |
| Other GET         | Network-first                     | Fresh when possible         |

### Sync Event

When the browser fires a background sync event with tag `sync-queue`:

1. SW sends `{ type: 'SYNC_REQUESTED' }` to all clients via `postMessage`
2. `providers.tsx` listens and calls `flushQueue(shopId)`

### Registration

`src/components/providers.tsx` registers the service worker **only in production** (`process.env.NODE_ENV === 'production'`). Reason: dev hot-reload conflicts with SW caching.

The SW is served with `Cache-Control: no-cache` headers (see `next.config.ts`) so browsers always check for updates.

---

## 14. Security Model

### Network Security

- **HTTPS only** — Vercel enforces TLS, HSTS header set
- **CSP (Content Security Policy)** — nonce-based, configured in `next.config.ts`
- **X-Frame-Options: DENY** — prevents clickjacking
- **X-Content-Type-Options: nosniff** — prevents MIME sniffing
- **Referrer-Policy: strict-origin-when-cross-origin**

### Authentication Security

- JWT validated on **every request** via `supabase.auth.getUser()` in proxy.ts (not trusting client-side session)
- Stale/revoked tokens handled gracefully with local-scope signOut
- No secrets in client-side code

### Database Security

- **Row Level Security (RLS)** on all 10+ tables
- `auth_shop_id()` and `auth_role()` are `SECURITY DEFINER` functions — they run as the DB owner, reading `shop_members`, so users cannot fake their own shop membership
- All RPCs use `SECURITY DEFINER` to enforce business logic atomically
- Direct writes to sensitive tables are revoked from `authenticated` role (migration 019)

### Input Validation

- Zod schemas validate all form inputs before they reach Supabase
- SQL injection impossible — Supabase SDK uses parameterized queries
- `sanitize.ts` strips HTML from user text inputs

### Monitoring

- Sentry captures exceptions from browser, server, and edge runtimes
- `captureException()` wrapper adds context (shopId, user action)
- `log-client-error.ts` sends client errors to `/api/sync` for server logging

---

## 15. Deployment & Infrastructure

### Vercel Deployment

- Connected to GitHub `main` branch — every push triggers a production deployment
- Environment variables set in Vercel dashboard (see section 16)
- `vercel.json` configures function timeouts and region

### Database Migrations

```bash
# Apply all migrations to remote Supabase
supabase db push

# Or apply to local dev DB
supabase db reset
```

All migrations in `supabase/migrations/` are run in order. The naming convention:

- `NNN_description.sql` — sequential (001–064)
- `YYYYMMDDHHMMSS_description.sql` — timestamped (recent additions)

**Rule from CLAUDE.md:** All multi-statement migrations must be wrapped in `BEGIN; ... COMMIT;`. Single-statement migrations are already atomic. Never use `CREATE INDEX CONCURRENTLY` inside a transaction.

### Sentry

Three Sentry config files:

- `sentry.client.config.ts` — browser SDK
- `sentry.server.config.ts` — Node.js server
- `sentry.edge.config.ts` — Edge runtime (proxy.ts)

---

## 16. Environment Variables

From `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_...

# M-Pesa
MPESA_CONSUMER_KEY=xxx
MPESA_CONSUMER_SECRET=xxx
MPESA_SHORTCODE=xxx
MPESA_PASSKEY=xxx
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 17. Development Workflow

```bash
# Start dev server (port 3000)
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Unit tests
npm run test

# E2E tests
npm run playwright

# Apply DB migrations
supabase db push

# Local DB reset + seed
supabase db reset
```

### Pre-commit Hooks

`husky` + `lint-staged` runs on every commit:

1. `eslint --fix` on `.ts/.tsx`
2. `tsc --noEmit --skipLibCheck` (type check)
3. `prettier --write` on all changed files

This means **commits will fail** if there are type errors or unfixable lint errors.

---

_End of Project Master Documentation_
