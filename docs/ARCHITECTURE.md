# HOOPERS SNEAKERS — Architecture & Implementation Plan

Production-oriented full-stack store for basketball shoes and athletic footwear,
serving basketball players, gymnasts, designers, and the general public.

**Stack:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
Supabase (PostgreSQL, Auth, Storage) · Vercel.

**Business decisions (confirmed):**

| Area | Decision |
| --- | --- |
| Checkout | Cart + order request, **pay on delivery**. No payment gateway. |
| Supabase credentials | Not available yet. Full SQL migrations + wiring are shipped; the app runs in an explicit **"Supabase not configured"** degraded mode with a `/setup` guide — **no fake data anywhere**. |
| Market | USD ($), English (US). Money stored as integer **cents**. |
| Catalog ops | In-app **admin dashboard** (`/admin`) with role enforcement via RLS + server-side checks. |

---

## 1. System architecture

```
┌─────────────────────────────  Browser  ─────────────────────────────┐
│  RSC pages (SEO, server-rendered)  +  client islands (cart, forms)  │
│  Cart: React Context persisted to localStorage (works signed-out)   │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │ Server Components / Server Actions│ Route Handlers
               ▼                                   ▼
┌──────────────────────────┐        ┌─────────────────────────────────┐
│  Data layer (lib/)       │        │  /api/orders   /api/contact     │
│  supabase-js             │◄───────┤  Server-side validation,        │
│  · anon client (reads)   │        │  price verification against DB, │
│  · service-role client   │        │  writes via SERVICE ROLE key    │
│    (server only)         │        │  (never shipped to browser)     │
└──────────────┬───────────┘        └─────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Supabase                                                          │
│  PostgreSQL + Row Level Security · Auth (email/password) · Storage  │
└─────────────────────────────────────────────────────────────────────┘
```

**Trust rules (security invariants):**

- Prices, stock, product existence, and order totals are **always** recomputed on the
  server from the database at order time. Client-supplied amounts are never trusted.
- The `service-role` key exists only in server runtime (`SUPABASE_SERVICE_ROLE_KEY`).
  Browser code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` only, which is safe to expose.
- Admin capability = membership in `user_roles` checked by RLS (`is_admin()`),
  and additionally checked server-side before rendering/processing admin UI.
- Order and contact writes go through authenticated server routes; there is no
  anonymous `insert` policy on business tables.

---

## 2. Page map

| Route | Type | Purpose |
| --- | --- | --- |
| `/` | RSC | Hero, featured products, categories, value props |
| `/products` | RSC | Catalog: search (`q`), filters (category, brand, size, price, sort), pagination |
| `/products/[slug]` | RSC | Product detail: gallery, size + stock picker, add to cart, specs, related |
| `/collections` | RSC | Category landing index |
| `/collections/[slug]` | RSC | Per-category landing + filtered grid |
| `/cart` | Client | Cart: quantities, remove, totals, proceed to checkout |
| `/checkout` | Client | Contact + shipping form → `POST /api/orders` |
| `/checkout/success` | RSC | Order confirmation (order number from session storage) |
| `/orders/lookup` | Client | Guest order lookup (order number + email, server-verified) |
| `/account` | RSC | Profile + order history (auth required) |
| `/auth/sign-in` · `/auth/sign-up` | Client | Email/password auth forms |
| `/auth/callback` · `/auth/reset-password` | Route/Client | Magic-link callback + password reset |
| `/admin` | RSC | Dashboard: order stats, recent orders |
| `/admin/products` · `/admin/products/new` · `/admin/products/[id]` | RSC/Client | Catalog CRUD incl. variants (size/stock) and images |
| `/admin/orders` · `/admin/orders/[id]` | RSC/Client | Order queue + status management |
| `/admin/profile` | Client | First-run admin profile display |
| `/about` · `/contact` · `/size-guide` | RSC/Client | Brand story, contact form (persisted), sizing guide |
| `/setup` | RSC | Live connection status + step-by-step Supabase setup guide |
| `/privacy` · `/terms` | RSC | Legal |
| `not-found`, `error` | — | Explicit 404 + recoverable error boundary |

---

## 3. Database schema (normalized, RLS-enabled)

```
auth.users (managed by Supabase)
profiles(id PK → auth.users, email, full_name, phone, timestamps)
user_roles(user_id FK, role ∈ {admin,customer}, PK(user_id, role))
categories(id PK, slug UNIQUE, name, description, image_url, sort_order)
products(id PK, slug UNIQUE, name, brand, short_description, description,
         image_url, price_cents, featured, active, category_id FK → categories)
product_images(id PK, product_id FK, sort_order, url)
product_variants(id PK, product_id FK, size, stock, UNIQUE(product_id, size))
orders(id PK, order_number UNIQUE, user_id FK NULL, status,
       customer/snapshot fields (full_name, email, phone, address…),
       subtotal_cents, shipping_cents, total_cents, note, timestamps)
order_items(id PK, order_id FK, product_id FK NULL,
            product_name, size, quantity, unit_price_cents)   ← price snapshot
contact_messages(id PK, name, email, phone, subject, message, created_at)
```

- `updated_at` maintained by trigger; `order_number` generated server-side.
- Indexes: `products(category_id)`, `products(brand)`, `orders(user_id)`,
  `orders(status)`, `order_items(order_id)`, `product_* (product_id)`.
- CHECK constraints: non-negative prices/stock/quantity, valid order status,
  `total = subtotal + shipping`.
- Storage: bucket `product-images` (public read, admin-only write),
  `avatars` (owner read/write). Admin upload via server route.

### RLS policy summary

| Table | anon | authenticated | admin |
| --- | --- | --- | --- |
| `products`, `categories`, `product_images`, `product_variants` | SELECT `active` | SELECT `active` | SELECT/ALL |
| `profiles` | — | SELECT/UPDATE own | SELECT/ALL |
| `user_roles` | — | SELECT own | ALL |
| `orders`, `order_items` | — | SELECT own (items via parent) | SELECT/ALL (UPDATE status) |
| `contact_messages` | — | — | SELECT/ALL |

Order/contact inserts happen via the **service-role** client inside
`/api/*` route handlers after server-side validation — never via client inserts.

---

## 4. Implementation plan (phases)

| Phase | Scope | Verification |
| --- | --- | --- |
| 1 | Project scaffold: Next.js + TS strict + Tailwind v4, env detection, docs | `tsc --noEmit`, `npm run build` |
| 2 | Design system (tokens, typography, UI primitives), header/footer shell | visual + a11y basics |
| 3 | Supabase layer: clients, migrations, queries, degraded-mode banner | SQL lint, client smoke |
| 4 | Catalog: home, products, filters/search, product detail, collections | manual + type check |
| 5 | Cart + checkout + `/api/orders` (server-validated), order confirmation | unit-ish smoke + build |
| 6 | Auth + account + order history + guest lookup | flows + RLS review |
| 7 | Admin dashboard: products/variants CRUD, order management | authz tests (documented) |
| 8 | Static pages, SEO (metadata, sitemap, robots), a11y, error states, README | lint, build, tests |

**QA gates run in CI-equivalent local commands:** `npm run lint`,
`npm run typecheck`, `npm run test`, `npm run build`. Test results are reported
only for tests actually executed.

---

## 5. Environment (no secrets committed)

`.env.example` documents: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only),
`NEXT_PUBLIC_SITE_URL`. With the first two missing, the app renders the
`/setup` guidance and skips all data fetching instead of fabricating results.
