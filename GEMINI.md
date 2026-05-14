# AutoShop Pro: Multi-Tenant POS SaaS Guidelines

## 1. Core Mandates

- **Single Source of Truth (Auth):** `shop_members` is the ONLY source of truth for authorization and shop membership.
- **Forbidden Auth Pattern:** NEVER use `profiles.role` for authorization. It is for UI display/caching only.
- **Mutation Pattern:** ALL business-critical mutations (Sales, Stock Adjustments, Member Changes) MUST go through idempotent RPCs (PostgreSQL functions).
- **Security Definer Rules:** ALL `SECURITY DEFINER` functions MUST validate `auth.uid()` against the target `shop_id` in `shop_members` at the start of the function body.
- **Offline Integrity:** All local-first writes must be enqueued in the `sync_queue` and replayed in strict order.

## 2. Row Level Security (RLS) Standards

- **Tenant Isolation:** Every table MUST have a `shop_id` column (except global lookup tables).
- **EXISTS-Based Policies:** Use `EXISTS` subqueries against `shop_members` to prevent tenant breakout.
- **Join-Free Predicates:** Prefer direct `shop_id` checks over complex joins in RLS to maintain performance.

### Example Policy Pattern:

```sql
-- View items in a shop
CREATE POLICY "shop_members_select" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.products.shop_id
      AND user_id = auth.uid()
    )
  );

-- Manage items (Owner only)
CREATE POLICY "owner_manage" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.products.shop_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );
```

## 3. RPC & Mutation Standards

- **Transactional Integrity:** Use PostgreSQL functions for multi-table operations (e.g., `record_sale` updating `sales`, `sale_items`, and `products.quantity`).
- **Idempotency:** Every mutation function MUST accept a UUID `id` from the client and check for existence before executing to prevent double-booking during sync replays.
- **Validation:** Use `RAISE EXCEPTION` for business logic failures (e.g., insufficient stock) to ensure atomicity.

## 4. Offline-First & Sync Rules

- **Local-First Writes:** Update IndexedDB (Dexie) immediately and enqueue the operation in `sync_queue`.
- **Idempotent Replay:** Sync replays use the same UUIDs generated on the client. Database functions MUST handle `id` conflicts gracefully (return existing record or skip).
- **Conflict Strategy:**
  - **Stock:** Use delta-based movements (`stock_movements`) rather than setting absolute quantities to handle concurrent offline edits.
  - **Other:** Last-write-wins (LWW) based on `updated_at` or client-side conflict resolution.

## 5. TypeScript & Validation

- **Zod Everywhere:** All API routes, RPC inputs, and local storage writes MUST be validated with Zod.
- **Generated Types:** Always use `Database` types from `@/types/database.ts` (generated via Supabase CLI).
- **Strict Typing:** Avoid `any`. Use `exhaustive-check` for enums and Discriminated Unions for sync operations.

## 6. Performance Constraints

- **Index Requirements:** Every `shop_id` column MUST be indexed. Compound indexes for `(shop_id, created_at)` or `(shop_id, status)` are required for frequently filtered views.
- **Query Optimization:** Avoid `SELECT *`. Request only the columns needed for the current component.
- **Pagination:** All list views (Sales, Products, Customers) MUST implement cursor-based or offset pagination.

## 7. Migration & Safety Rules

- **Non-Breaking Changes:** Never rename columns or drop tables in a production environment. Use "Expand and Contract" pattern.
- **Locking:** Be aware of `ALTER TABLE` locks on large tables. Run migrations during low-traffic windows.
- **Security Audit:** Every migration adding a table MUST include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and appropriate policies.

## 8. Deployment & Security

- **Service Role Key:** NEVER expose `SERVICE_ROLE_KEY` to the client. It should only be used in Edge Functions or Server-Side routes with strict auth checks.
- **JWT Validation:** Middleware MUST validate JWTs before allowing access to `/(shop)` routes.
- **Environment Variables:** Strictly separate `NEXT_PUBLIC_` variables from server-only secrets.
