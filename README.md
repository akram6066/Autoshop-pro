<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
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
- **Reports** — Daily revenue, order count, average order value, and active days. Export to CSV. Filter by 7, 30, or 90 days or custom range.
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
| State Management | Zustand |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Notifications | Sonner |
| PWA | Custom Service Worker |

---

## Architecture

AutoShop Pro is **offline-first**. Every write follows this pattern:

1. Try Supabase directly.
2. On failure (offline): write to IndexedDB immediately and enqueue for sync.
3. On reconnect: flush the queue and replay all pending operations in order.

**Multi-tenant** — users can belong to multiple shops with different roles per shop, managed via `shop_members` table with full Row Level Security.

**Database** — 8 migrations covering schema, RLS policies, RPCs, multi-shop support, security hardening, staff management, categories, and product size.

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

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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

## Project Structure
>>>>>>> 7fb28367daf1641bacc7685a10f1e7188d1df288
