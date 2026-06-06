# AutoShop Pro — Architecture Guide

> Complete architecture documentation with Mermaid diagrams.
> Suitable for onboarding engineers and presenting to technical stakeholders.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Database ERD](#6-database-erd)
7. [Authentication Architecture](#7-authentication-architecture)
8. [Authentication Flow Diagram](#8-authentication-flow-diagram)
9. [Authorization Architecture](#9-authorization-architecture)
10. [Offline Sync Architecture](#10-offline-sync-architecture)
11. [API Flow Diagram](#11-api-flow-diagram)
12. [Subscription Architecture](#12-subscription-architecture)
13. [Payment Journey Diagram](#13-payment-journey-diagram)
14. [User Journey Diagram](#14-user-journey-diagram)
15. [Admin Journey Diagram](#15-admin-journey-diagram)
16. [Deployment Architecture](#16-deployment-architecture)

---

## 1. High-Level Architecture

AutoShop Pro follows a **client-heavy, offline-first architecture**. The frontend handles most business logic locally with IndexedDB, while Supabase acts as the authoritative remote database. The system is designed so the app remains fully functional without internet connectivity.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                                                                 │
│  Next.js 16 App Router                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  React   │  │ TanStack │  │  Zustand  │  │    Dexie    │  │
│  │  19 UI   │  │  Query   │  │   Store   │  │  IndexedDB  │  │
│  └──────────┘  └──────────┘  └───────────┘  └─────────────┘  │
│        │             │              │               │          │
│        └─────────────┴──────────────┴───────────────┘         │
│                              │                                  │
│                    ┌─────────▼──────────┐                      │
│                    │   Service Worker   │                      │
│                    │ (Offline fallback) │                      │
│                    └─────────┬──────────┘                      │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTPS
                ┌──────────────▼───────────────┐
                │         Vercel Edge          │
                │   Next.js Proxy (proxy.ts)   │
                │   API Routes (/api/*)        │
                └──────────────┬───────────────┘
                               │
                ┌──────────────▼───────────────┐
                │           Supabase           │
                │  ┌──────────┐  ┌──────────┐  │
                │  │ Auth API │  │   REST   │  │
                │  │  (JWT)   │  │   API    │  │
                │  └──────────┘  └──────────┘  │
                │  ┌────────────────────────┐  │
                │  │  PostgreSQL + RLS      │  │
                │  │  RPCs (business logic) │  │
                │  │  pg_cron (background)  │  │
                │  └────────────────────────┘  │
                └──────────────────────────────┘
```

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client (Browser / PWA)"]
        UI[Next.js React UI]
        SW[Service Worker]
        IDB[(IndexedDB - Dexie)]
        ZS[Zustand Auth Store]
        TQ[TanStack Query Cache]
        SS[sessionStorage Cart]
    end

    subgraph Edge["Vercel Edge"]
        PRX[proxy.ts - JWT Guard]
        API[API Routes]
    end

    subgraph Supabase["Supabase Platform"]
        AUTH[Auth Service JWT]
        DB[(PostgreSQL + RLS)]
        RPC[Stored Procedures]
        CRON[pg_cron Jobs]
    end

    subgraph Monitoring["Monitoring"]
        SENTRY[Sentry Error Tracking]
    end

    UI --> SW
    UI --> IDB
    UI --> ZS
    UI --> TQ
    UI --> SS
    UI --> PRX
    PRX --> AUTH
    PRX --> API
    API --> DB
    API --> RPC
    TQ --> DB
    TQ --> RPC
    SW --> IDB
    CRON --> DB
    UI --> SENTRY
    API --> SENTRY
    PRX --> SENTRY

    style Client fill:#f0f4ff,stroke:#4f46e5
    style Edge fill:#f0fdf4,stroke:#16a34a
    style Supabase fill:#fff7ed,stroke:#ea580c
    style Monitoring fill:#fef2f2,stroke:#dc2626
```

---

## 3. Frontend Architecture

### Component Architecture

```mermaid
graph TD
    RootLayout["Root layout.tsx\n(ThemeProvider + QueryClientProvider)"]
    ShopLayout["(shop)/layout.tsx\n(Auth init, ShopHeader, Banners)"]
    AuthLayout["(auth)/layout.tsx\n(Public shell)"]

    RootLayout --> ShopLayout
    RootLayout --> AuthLayout

    ShopLayout --> Dashboard["dashboard/page.tsx\nKPIs, Analytics"]
    ShopLayout --> POS["pos/page.tsx\nCheckout, Cart"]
    ShopLayout --> Inventory["inventory/page.tsx\nProduct CRUD"]
    ShopLayout --> Reports["reports/page.tsx\n(Owner only)"]
    ShopLayout --> Settings["settings/\n(Account, Shop)"]
    ShopLayout --> Customers["customers/\nLedger"]
    ShopLayout --> Sales["sales/\nHistory, Void"]

    AuthLayout --> Login["login/page.tsx"]
    AuthLayout --> Signup["signup/page.tsx"]
    AuthLayout --> Setup["setup/page.tsx\nWizard"]
    AuthLayout --> ChoosePlan["choose-plan/page.tsx"]

    style RootLayout fill:#e0e7ff
    style ShopLayout fill:#d1fae5
    style AuthLayout fill:#fef3c7
```

### State Architecture

```mermaid
graph LR
    subgraph Zustand["Zustand (authStore)"]
        US[user]
        PR[profile]
        SH[shop]
        SHS[shops array]
        RL[role]
        PL[planName]
    end

    subgraph TanStack["TanStack Query"]
        PROD[products]
        SALE[sales]
        CUST[customers]
        CATS[categories]
        TEAM[team members]
    end

    subgraph Dexie["Dexie IndexedDB"]
        IDB_PROD[products table]
        IDB_SALE[sales table]
        IDB_SQ[sync_queue table]
        IDB_CUST[customers table]
    end

    Zustand -->|provides shopId| TanStack
    TanStack -->|fallback on error| Dexie
    TanStack -->|seed on success| Dexie
    Dexie -->|replay on reconnect| Supabase[(Supabase)]
```

---

## 4. Backend Architecture

### Request Processing Pipeline

```mermaid
sequenceDiagram
    participant Browser
    participant Proxy as proxy.ts (Edge)
    participant Supabase_Auth as Supabase Auth
    participant Next_Page as Next.js Page/API
    participant Supabase_DB as Supabase DB (RLS)

    Browser->>Proxy: Request /dashboard
    Proxy->>Supabase_Auth: getUser() (validate JWT)
    alt No user / expired token
        Supabase_Auth-->>Proxy: null user
        Proxy-->>Browser: Redirect /login
    else Valid user
        Supabase_Auth-->>Proxy: user object
        Proxy->>Next_Page: Pass through (cookie refreshed)
        Next_Page->>Supabase_DB: Query with RLS
        Supabase_DB-->>Next_Page: Filtered by shop_id
        Next_Page-->>Browser: Rendered page
    end
```

### RPC Architecture

All critical mutations go through Supabase RPCs that run as `SECURITY DEFINER`:

```mermaid
graph LR
    Client[Client Mutation] --> RPC_RECORD[record_sale RPC]
    RPC_RECORD --> T1[Insert into sales]
    RPC_RECORD --> T2[Insert into sale_items]
    RPC_RECORD --> T3[Insert into stock_movements]
    RPC_RECORD --> T4[Deduct products.quantity]
    T1 & T2 & T3 & T4 --> COMMIT[COMMIT - all or nothing]

    style RPC_RECORD fill:#fef3c7
    style COMMIT fill:#d1fae5
```

---

## 5. Database Architecture

### Migration Strategy

67 migrations tell the story of the product's evolution:

| Phase      | Migrations       | Key Changes                                                             |
| ---------- | ---------------- | ----------------------------------------------------------------------- |
| Foundation | 001–004          | Core schema, RLS, RPCs, multi-shop                                      |
| Security   | 005–012, 018–019 | Staff fixes, lockdowns, revoked writes                                  |
| Features   | 013–017          | Materialized views, usage limits, payment methods, delivery, customers  |
| Scale      | 020–029          | Invites, monitoring, audit, performance indexes                         |
| Product    | 030–043          | Staff CRUD, variants, audit trail, contact                              |
| Business   | 044–052          | Admin, soft deletes, subscriptions, plans, M-Pesa                       |
| Billing    | 053–064          | Ultra Pro, trials, cron sync, setup limits, shop deletion, auto-billing |
| Analytics  | 20260604…        | Product analytics RPC                                                   |

### RLS Architecture

```mermaid
graph TD
    User[Authenticated User JWT] -->|calls| AID[auth_shop_id]
    User -->|calls| AROLE[auth_role]
    AID -->|reads| SM[shop_members table]
    AROLE -->|reads| SM
    SM -->|enforces| RLS[Row Level Security Policies]
    RLS -->|filters| ALL_TABLES[All 10+ Tables]

    style RLS fill:#fef2f2,stroke:#dc2626
```

---

## 6. Database ERD

```mermaid
erDiagram
    SHOPS {
        uuid id PK
        text name
        text address
        text plan
        timestamp deleted_at
        timestamp created_at
    }

    PROFILES {
        uuid id PK
        uuid shop_id FK
        text full_name
        text role
        boolean is_admin
        text phone
        timestamp created_at
    }

    SHOP_MEMBERS {
        uuid id PK
        uuid shop_id FK
        uuid user_id FK
        text role
        timestamp created_at
    }

    ROOMS {
        uuid id PK
        uuid shop_id FK
        text name
    }

    PRODUCTS {
        uuid id PK
        uuid shop_id FK
        uuid room_id FK
        text name
        text sku
        text category
        int quantity
        int min_stock
        decimal price
        decimal cost_price
        text size
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        text name
        decimal price
        int quantity
        text sku
    }

    STOCK_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        uuid shop_id FK
        text type
        text reason
        int delta
        boolean synced
        timestamp created_at
    }

    SALES {
        uuid id PK
        uuid shop_id FK
        uuid customer_id FK
        uuid staff_id FK
        decimal total
        text payment_method
        boolean delivery
        boolean voided
        timestamp created_at
    }

    SALE_ITEMS {
        uuid id PK
        uuid sale_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    CUSTOMERS {
        uuid id PK
        uuid shop_id FK
        text name
        text phone
        decimal balance
        timestamp created_at
    }

    PURCHASE_ORDERS {
        uuid id PK
        uuid shop_id FK
        text supplier
        text status
        decimal total
        timestamp created_at
    }

    PO_ITEMS {
        uuid id PK
        uuid po_id FK
        uuid product_id FK
        int quantity
        decimal unit_cost
    }

    CATEGORIES {
        uuid id PK
        uuid shop_id FK
        text name
        text color
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid shop_id FK
        text plan
        text status
        timestamp trial_end
        timestamp current_period_end
        text payment_provider
    }

    SYNC_QUEUE {
        uuid id PK
        uuid shop_id FK
        text table_name
        text operation
        jsonb payload
        text status
        int attempts
        timestamp created_at
    }

    INVITES {
        uuid id PK
        uuid shop_id FK
        text email
        text role
        text token
        timestamp expires_at
    }

    SHOPS ||--o{ SHOP_MEMBERS : "has members"
    SHOPS ||--o{ ROOMS : "has rooms"
    SHOPS ||--o{ PRODUCTS : "has products"
    SHOPS ||--o{ SALES : "has sales"
    SHOPS ||--o{ CUSTOMERS : "has customers"
    SHOPS ||--o{ PURCHASE_ORDERS : "has POs"
    SHOPS ||--o| SUBSCRIPTIONS : "has subscription"
    SHOPS ||--o{ CATEGORIES : "has categories"
    SHOPS ||--o{ SYNC_QUEUE : "has queue"
    SHOPS ||--o{ INVITES : "has invites"
    PROFILES ||--o{ SHOP_MEMBERS : "belongs to shops"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has variants"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "has movements"
    PRODUCTS ||--o{ SALE_ITEMS : "appears in sales"
    SALES ||--o{ SALE_ITEMS : "contains items"
    PURCHASE_ORDERS ||--o{ PO_ITEMS : "contains items"
    CUSTOMERS ||--o{ SALES : "has sales"
    ROOMS ||--o{ PRODUCTS : "stores products"
```

---

## 7. Authentication Architecture

### Token Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Authenticating : signInWithPassword()
    Authenticating --> TokenValid : JWT issued (httpOnly cookie)
    TokenValid --> TokenExpired : JWT expiry
    TokenExpired --> TokenRefreshed : supabase.auth.getUser() auto-refreshes
    TokenRefreshed --> TokenValid
    TokenValid --> SignedOut : signOut()
    TokenValid --> StaleToken : refresh_token_not_found
    StaleToken --> Unauthenticated : signOut(scope local) + redirect
    SignedOut --> Unauthenticated : clearLocalDb() + reset()
    Unauthenticated --> [*]
```

---

## 8. Authentication Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant LoginForm
    participant Supabase_Auth as Supabase Auth
    participant AuthStore as Zustand authStore
    participant IndexedDB

    User->>LoginForm: Enter email + password
    LoginForm->>LoginForm: Zod validation
    alt Invalid form
        LoginForm-->>User: Field errors shown
    end
    LoginForm->>Supabase_Auth: signInWithPassword()
    alt Email not confirmed
        Supabase_Auth-->>LoginForm: error: email_not_confirmed
        LoginForm-->>User: Show ConfirmEmailPanel
    else Auth failure
        Supabase_Auth-->>LoginForm: error message
        LoginForm-->>User: Friendly error shown
    else Success
        Supabase_Auth-->>LoginForm: { user, session }
        LoginForm->>Supabase_Auth: getUser() (validate JWT)
        LoginForm->>Supabase_Auth: fetch profiles + shop_members (parallel)
        Supabase_Auth-->>LoginForm: { profile, shops }
        LoginForm->>AuthStore: setAll(user, profile, shop, shops)
        LoginForm->>IndexedDB: seedLocalCache(shop, rooms, products)
        alt Owner
            LoginForm-->>User: router.push('/dashboard')
        else Staff
            LoginForm-->>User: router.push('/pos')
        end
    end
```

---

## 9. Authorization Architecture

### Permission Check Flow

```mermaid
flowchart TD
    Request[Incoming Request to /reports]
    Proxy[proxy.ts: getUser validates JWT]
    Layout[shop layout.tsx: init fetches profile + role]
    OwnerGuard[OwnerGuard component]
    RLS[Supabase RLS: auth_role check]

    Request --> Proxy
    Proxy -->|no user| Login[/login redirect]
    Proxy -->|valid user| Layout
    Layout -->|staff role| OwnerGuard
    OwnerGuard -->|not owner| Denied[Access Denied screen]
    OwnerGuard -->|is owner| RLS
    RLS -->|wrong shop_id| Empty[Empty result set]
    RLS -->|correct shop| Data[Data returned]
```

---

## 10. Offline Sync Architecture

```mermaid
sequenceDiagram
    participant App
    participant Supabase
    participant IndexedDB
    participant RetryTimer

    Note over App: User records a sale (offline)
    App->>Supabase: RPC record_sale()
    Supabase-->>App: Network error / timeout
    App->>IndexedDB: enqueue({ table:'sales', op:'INSERT', payload, id:uuid })
    App->>IndexedDB: Optimistic write to local sales table
    App-->>App: UI shows sale as recorded (optimistic)

    Note over RetryTimer: scheduleRetry() runs every 5-60s
    RetryTimer->>App: tick(shopId)
    alt navigator.onLine = false
        App-->>RetryTimer: skip, reschedule
    else Online
        App->>IndexedDB: query sync_queue WHERE [shopId, 'pending']
        IndexedDB-->>App: pending operations list
        loop For each operation
            App->>Supabase: Replay operation
            alt Success
                App->>IndexedDB: mark status='synced'
            else Failure (attempts < 5)
                App->>IndexedDB: attempts++
            else Failure (attempts = 5)
                App->>IndexedDB: status='failed'
            end
        end
    end

    Note over App: SyncBadge polls every 5s
    App->>IndexedDB: count pending + failed
    IndexedDB-->>App: { pending: 0, failed: 0 }
    App-->>App: Show "Synced" badge
```

---

## 11. API Flow Diagram

```mermaid
flowchart LR
    subgraph Client
        HOOK[TanStack Query Hook]
        CACHE[Query Cache]
        IDB_LOCAL[IndexedDB local]
    end

    subgraph Network
        RPC_CALL[Supabase RPC / REST]
        SYNC_API[POST /api/sync]
    end

    subgraph DB["Supabase PostgreSQL"]
        RLS_CHECK[RLS Policy Check]
        PROC[Stored Procedure]
        TABLE[(Table)]
    end

    HOOK -->|queryFn| RPC_CALL
    RPC_CALL --> RLS_CHECK
    RLS_CHECK --> PROC
    PROC --> TABLE
    TABLE -->|result| HOOK
    HOOK -->|success| CACHE
    HOOK -->|success, fire-and-forget| IDB_LOCAL
    HOOK -->|network error| IDB_LOCAL
    SYNC_API -->|returns server_time| HOOK

    style RLS_CHECK fill:#fef2f2
    style PROC fill:#fef3c7
```

---

## 12. Subscription Architecture

```mermaid
stateDiagram-v2
    [*] --> Trial : New user signup
    Trial --> Pro : Payment (M-Pesa / Stripe)
    Trial --> UltraPro : Payment
    Pro --> Active : Payment confirmed
    UltraPro --> Active : Payment confirmed
    Active --> Cancelled : User cancels
    Cancelled --> Expired : period_end passed (pg_cron)
    Expired --> Trial : Auto-downgrade (pg_cron daily)
    Trial --> Trial : Free forever, no expiry
    Active --> Active : Renewal payment
```

### Plan Limits Enforcement

```mermaid
flowchart TD
    Action[User tries to create product]
    UI_CHECK[UI: LimitWarningBanner shows near-limit]
    RPC_CHECK[DB: RPC checks subscriptions.plan]
    LIMIT_CHECK{Under limit?}
    ALLOWED[Proceed]
    BLOCKED[Raise 'limit_reached' error]

    Action --> UI_CHECK
    Action --> RPC_CHECK
    RPC_CHECK --> LIMIT_CHECK
    LIMIT_CHECK -->|Yes| ALLOWED
    LIMIT_CHECK -->|No| BLOCKED
    BLOCKED --> UI_MSG[Show upgrade prompt]
```

---

## 13. Payment Journey Diagram

```mermaid
journey
    title M-Pesa Payment Journey
    section Initiation
      User clicks Upgrade: 5: User
      Billing page loads plan options: 4: System
      User selects plan and enters phone: 5: User
    section STK Push
      System calls M-Pesa STK Push API: 3: System
      User receives payment prompt on phone: 5: User
      User enters M-Pesa PIN: 5: User
    section Confirmation
      M-Pesa sends callback to /api/mpesa/callback: 3: System
      System updates subscriptions table: 3: System
      pg_cron syncs shops.plan: 3: System
    section Post-Payment
      User sees Pro badge on dashboard: 5: User
      Usage limits increase: 5: System
      New features unlocked: 5: System
```

---

## 14. User Journey Diagram

```mermaid
journey
    title New Owner Journey
    section Signup
      Visit landing page: 5: Visitor
      Click Sign Up: 5: Visitor
      Fill signup form: 4: User
      Confirm email: 3: User
    section Setup
      Enter shop name and address: 5: User
      Add storage rooms: 4: User
      Create product categories: 4: User
      Choose subscription plan: 4: User
    section Daily Use
      Open dashboard - see KPIs: 5: Owner
      Check low stock alerts: 5: Owner
      Add products to inventory: 4: Owner
      View sales reports: 5: Owner
      Invite staff member: 4: Owner
    section POS
      Staff opens POS: 5: Staff
      Search and add products to cart: 5: Staff
      Select customer: 4: Staff
      Process payment: 5: Staff
      Print receipt: 4: Staff
    section Offline Scenario
      Internet goes out: 2: Staff
      Continue recording sales: 4: Staff
      Sync badge shows Pending: 3: Staff
      Internet returns: 3: System
      Queue flushes automatically: 5: System
      Synced badge shown: 5: Staff
```

---

## 15. Admin Journey Diagram

```mermaid
journey
    title Platform Admin Journey
    section Access
      Login with admin account: 5: Admin
      Redirect to /admin: 5: System
      View platform dashboard: 5: Admin
    section Management
      View all registered shops: 5: Admin
      Check subscription statuses: 4: Admin
      Override a shop plan manually: 3: Admin
      View contact inquiries: 4: Admin
    section Monitoring
      Check error logs via Sentry: 3: Admin
      Review audit log for suspicious activity: 3: Admin
      Check pg_cron job history: 3: Admin
```

---

## 16. Deployment Architecture

```mermaid
graph TB
    subgraph Dev["Development"]
        GIT[GitHub Repository]
        LOCAL[Local Dev: next dev port 3000]
        SUPA_LOCAL[Supabase CLI: local DB]
    end

    subgraph CI["CI/CD - GitHub Actions / Vercel"]
        PUSH[git push to main]
        BUILD[Vercel Build: next build]
        DEPLOY[Deploy to Vercel Edge Network]
    end

    subgraph Production["Production"]
        VERCEL[Vercel: Next.js SSR + Edge Functions]
        SUPA_PROD[Supabase: Hosted PostgreSQL]
        SENTRY_PROD[Sentry: Error Monitoring]
        CDN[Vercel CDN: Static Assets]
    end

    GIT --> PUSH
    PUSH --> BUILD
    BUILD --> DEPLOY
    DEPLOY --> VERCEL
    VERCEL --> SUPA_PROD
    VERCEL --> SENTRY_PROD
    VERCEL --> CDN

    LOCAL --> SUPA_LOCAL
    SUPA_LOCAL -->|supabase db push| SUPA_PROD

    style Dev fill:#eff6ff
    style CI fill:#f0fdf4
    style Production fill:#fff7ed
```

### Vercel Configuration (`vercel.json`)

- Function timeout: 30s for API routes
- Region: closest to Supabase instance
- SW file served with `Cache-Control: no-cache, no-store, must-revalidate`

### Database Migration Pipeline

```mermaid
flowchart LR
    DEV[Write migration SQL] -->|supabase db reset| LOCAL_DB[Local Test]
    LOCAL_DB -->|review + commit| GIT_PUSH[git push]
    GIT_PUSH -->|manual| PROD_PUSH[supabase db push --linked]
    PROD_PUSH --> PROD_DB[(Supabase Production DB)]
```

---

_End of Architecture Guide_
