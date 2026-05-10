# AutoShop Pro

> Modern inventory management and point of sale for automotive parts shops — built for the African market.

---

## The Problem

Across Kenya and East Africa, thousands of automotive parts shops — selling tires, batteries, rims, and accessories — still manage their inventory with paper books and record sales manually. There is no real-time stock visibility, no sales history, no low stock alerts, and no way to know what's selling and what's sitting on the shelf.

AutoShop Pro solves this.

---

## What is AutoShop Pro?

AutoShop Pro is an offline-first Progressive Web App (PWA) built for automotive parts shop owners and their staff. It works without a stable internet connection, syncs automatically when back online, and runs on any device — phone, tablet, or desktop — with no installation required.

Built by **Eng Dimcad** (Abdirizak Mohamud Hassan).

---

## Features

- **Point of Sale (POS)** — Fast, clean sales screen. Add products to cart, charge customers, and record sales in seconds. Works fully offline.
- **Inventory Management** — Track every product with SKU, category, room location, size, price, and stock levels. Get alerted when stock runs low.
- **Offline First** — All data is stored locally in IndexedDB. Sells and stock changes made offline sync automatically when internet returns.
- **Multi-Shop Support** — One account can manage multiple shops. Switch between them instantly.
- **Role-Based Access** — Owners get full access. Staff get POS and inventory only. Reports and settings are owner-only.
- **Product Finder** — Search products instantly across your entire inventory.
- **Reports** — Daily revenue, order count, average order value, and active days. Filter by 7, 30, or 90 days or custom range.
- **Team Management** — Add and remove staff members by email directly from settings.
- **Custom Categories** — Create your own product categories with custom colors.
- **Storage Rooms** — Organise products by physical room or section in your shop.
- **Sync Status** — Always know if your data is synced, pending, or failed — visible in the nav bar.
- **PWA Install** — Install on any device like a native app. Works on Android, iOS, and desktop.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| Auth & Database | Supabase (PostgreSQL + RLS) |
| Local Storage | Dexie (IndexedDB) |
| State | Zustand + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Rate Limiting | Upstash Redis (REST) |
| PWA | Custom Service Worker |

---

## Architecture

AutoShop Pro is **offline-first**. Every write follows this pattern:

1. Try Supabase directly.
2. On failure (offline): write to IndexedDB immediately and enqueue for sync.
3. On reconnect: flush the queue and replay all pending operations in order.

**Multi-tenant** — users belong to multiple shops with different roles per shop, managed via `shop_members` with full Row Level Security.

**Idempotent sync** — `record_sale` short-circuits if the sale UUID already exists, so retried offline replays never double-book.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/autoshop-pro.git
cd autoshop-pro
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the values. **Never commit `.env.local`.**

### 4. Run database migrations

```bash
supabase db push
```

Or run each file in `supabase/migrations/` in order from your Supabase SQL editor.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Security

- **Row Level Security** on every table, scoped via `shop_members`.
- **Column-level lockdown** on `profiles.role` — only mutable via `setup_owner_shop` and `set_member_role` SECURITY DEFINER RPCs. A trigger blocks any direct UPDATE from the `authenticated` role.
- **Edge middleware** validates JWTs via `getUser()` on every protected request.
- **Rate limiting** on every auth and admin endpoint (Upstash Redis in production, in-memory fallback in dev).
- **Sanitized errors** — raw Supabase / Postgres messages are never returned to clients.
- **Strict CSP**, HSTS, X-Frame-Options DENY, no `X-Powered-By` leak.

If you find a vulnerability, please email security@your-domain.example.
