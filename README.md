# HOOPERS SNEAKERS

Production-oriented full-stack store for **basketball shoes and athletic
footwear** — built for basketball players, gymnasts, designers, and everyone
who moves. Pay-on-delivery checkout, real inventory, and an admin dashboard.

**Stack:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
Supabase (PostgreSQL + RLS, Auth, Storage) · Vercel.

> **No fake data.** Until Supabase credentials are configured, the site runs
> in an explicit “connect your database” state (see `/setup`) instead of
> demo products. Every feature connects to a real implementation.

---

## Features

**Storefront**
- Home with hero, featured products, category collections, value props
- Catalog with full-text-ish search, category/brand/size/price filters,
  sorting, and pagination (plain GET forms — works without JavaScript)
- Product pages: image gallery, size picker with live stock, related products
- Shopping cart (persists in `localStorage`, works signed out)
- Checkout with validation → server-validated pay-on-delivery orders
  (prices, stock, and totals are **always** recomputed on the server)
- Order confirmation + guest order lookup (order number + email)
- Size guide, about, contact form (persisted to the database), legal pages

**Accounts & admin**
- Email/password auth (Supabase) with session middleware, sign-up,
  sign-in, password reset, sign-out
- Account page with order history
- `/admin`: dashboard stats, order queue with status management,
  product CRUD with size/stock variants, gallery images, image upload to
  Supabase Storage, feature/visibility toggles

**Platform**
- Normalized Postgres schema with FKs, checks, indexes, timestamps
- Row Level Security on every exposed table (least privilege, tested by a
  shipped SQL suite) + server-side authorization on all mutations
- Transactional `place_order` RPC: atomic stock decrement, DB-priced totals
- Semantic HTML, metadata/OG tags, sitemap, robots.txt, accessible forms and
  focus states, mobile-first responsive UI, loading/empty/error states
- Explicit degraded states when services are missing

## Quick start

```bash
npm install
cp .env.example .env.local   # add your Supabase keys (docs/SETUP.md)
npm run dev
```

Full setup (migrations, auth, admin promotion, Vercel, security tests):
**[docs/SETUP.md](docs/SETUP.md)** · Architecture & schema:
**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (includes lint + type checks) |
| `npm run lint` | ESLint (next/core-web-vitals + typescript) |
| `npm run typecheck` | `tsc --noEmit` (strict mode) |
| `npm test` | Vitest unit tests (validation, money, policies mapping) |
| `npm start` | Serve the production build |

## Project structure

```
app/                    # App Router pages, layouts, route handlers
  api/orders/           # POST order placement (server-priced) + lookup
  api/contact/          # POST contact messages
  auth/                 # sign-in, sign-up, reset, callback, sign-out
  admin/                # admin dashboard + server actions
  products/ collections/ cart/ checkout/ account/ …
components/             # ui/ products/ layout/ admin/ auth/
lib/                    # env, utils, auth, cart, orders, supabase, products
supabase/
  migrations/           # 0001 schema → 0004 order placement (run in order)
  seed.sql              # optional starter categories (no products)
  tests/rls_policies.sql# executable RLS test suite
docs/                   # ARCHITECTURE.md, SETUP.md
tests/                  # Vitest unit tests
```

## Security model (summary)

- `SUPABASE_SERVICE_ROLE_KEY` is server-only; browser uses the anon key with
  RLS enforced. Prices/roles/ownership are never trusted from the client.
- Orders/contact writes go through validated API routes; there are no
  anonymous insert policies on business tables.
- `place_order` is executable only by the service role; totals come from the
  database and stock decrements happen in the same transaction.
- Admin = `user_roles` row checked by `is_admin()` (SECURITY DEFINER) inside
  RLS policies **and** again in every server action.
- Test it: `supabase/tests/rls_policies.sql` (see docs/SETUP.md §3.5).

## Environment variables

See [`.env.example`](.env.example) — `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only),
`NEXT_PUBLIC_SITE_URL`. Never commit real values.

## Remaining work / known gaps

Tracked honestly — none of these pretend to work:

- [ ] **Email notifications** — order confirmation and contact replies are
  stored but not emailed (wire Resend/Postmark + Supabase auth hooks).
- [ ] **Shared rate limiting** — API rate limits are per-instance; move to a
  shared store (Upstash/KV) for multi-region traffic.
- [ ] **Category management UI** — categories are created via `seed.sql` /
  SQL; a `/admin/categories` CRUD page would remove the SQL step.
- [ ] **Currency/market expansion** — USD/English only; prices are integer
  cents so multi-currency is additive.
- [ ] **E2E browser tests** — Playwright suite against a seeded staging
  project (unit tests + SQL RLS suite are in place).
- [ ] **Returns/refunds flow** — policy is documented in terms; no
  self-service returns UI yet.

## License

Private / proprietary — adjust before publishing.
