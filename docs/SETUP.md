# Setup & Deployment Guide

Complete checklist to take this project from clone to production. Without
Supabase credentials the app runs in a clearly-labeled **demo mode** (sample
catalog, working cart/checkout simulation, explicit “nothing saved” messaging)
so the storefront is fully browsable; add the keys below and it switches to
live data with no demo content mixed in.

---

## 1. Prerequisites

- Node.js 20+ (Node 22 recommended)
- A [Supabase](https://supabase.com) project (free tier is fine to start)
- A [Vercel](https://vercel.com) account for hosting
- Git

## 2. Local development

```bash
git clone <your-fork-url> HOOPERS-SNEAKERS
cd HOOPERS-SNEAKERS
npm install

# Configure environment (copy the template — it contains no secrets)
cp .env.example .env.local
# Fill in the values from Supabase → Project Settings → API

npm run dev
```

Open http://localhost:3000 — the `/setup` page shows live connection status.

## 3. Supabase configuration

### 3.1 Run migrations (SQL editor, in order)

| File | Purpose |
| --- | --- |
| `supabase/migrations/0001_schema.sql` | Tables, constraints, indexes, triggers, `is_admin()`, `place_order` sequence |
| `supabase/migrations/0002_rls.sql` | Row Level Security policies + least-privilege grants |
| `supabase/migrations/0003_storage.sql` | Storage buckets (`product-images`, `avatars`) + storage policies |
| `supabase/migrations/0004_order_placing.sql` | Transactional `place_order` RPC (server-only execution) |

Optional taxonomy seed (categories only — no fake products):
`supabase/seed.sql`.

### 3.2 Environment variables

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Project URL — safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Anon key — safe to expose, RLS is the boundary |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Bypasses RLS. Never `NEXT_PUBLIC_*`, never committed |
| `NEXT_PUBLIC_SITE_URL` | Server | Canonical URL for SEO (e.g. `https://yourdomain.com`) |

### 3.3 Auth settings (Supabase → Authentication)

- **Site URL** → your production URL (e.g. `https://yourdomain.com`)
- **Redirect URLs** → add `https://yourdomain.com/auth/callback` and
  `http://localhost:3000/auth/callback`
- Email confirmation is supported both ways (with/without confirmation
  emails). SMTP defaults work for development.

### 3.4 Create your admin account

1. Sign up through `/auth/sign-up` (or `/auth/sign-in` first).
2. In Supabase → Authentication → Users, copy your user id.
3. In the SQL editor:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR-USER-ID', 'admin');
```

4. Sign out and back in. The **Admin** badge and `/admin` unlock.

### 3.5 Verify security (run the RLS test suite)

Paste `supabase/tests/rls_policies.sql` into the SQL editor and run it.
Every assertion prints `PASS: …` and the run ends with
`ALL RLS TESTS PASSED`. Any `FAIL: …` raises an exception — fix policies
before going live.

Covered: anon read-only catalog, invisible inactive products, no anon/auth
writes to orders/messages, no self-granting roles, owner-scoped order reads,
admin-only order status updates, `place_order` execution privileges, and
server-side total/stock computation inside the RPC.

## 4. Vercel deployment

1. Push the repo to GitHub (this project is GitHub-compatible as-is).
2. Vercel → **Add New Project** → import the repo. Next.js is auto-detected.
3. Settings → Environment Variables — add all four from §3.2
   (use the **production** values; `SUPABASE_SERVICE_ROLE_KEY` must be marked
   as sensitive/encrypted).
4. Deploy. Then:
   - Confirm `https://yourdomain.com/setup` shows both rows “Connected”.
   - Place a test order end-to-end (use a real address you control).
   - Run the RLS suite against the production database (it is fixture-based
     and self-cleaning).

`vercel.json` is not required; the middleware and App Router work with
Vercel defaults.

## 5. Production checklist

- [ ] Migrations 0001–0004 applied
- [ ] Seed categories applied (or your own categories created)
- [ ] All env vars set in Vercel (no `NEXT_PUBLIC_` prefix on the service key)
- [ ] Auth Site URL + Redirect URLs configured
- [ ] At least one admin account in `user_roles`
- [ ] `supabase/tests/rls_policies.sql` → `ALL RLS TESTS PASSED`
- [ ] Test order placed; status updated from `/admin/orders`
- [ ] Contact form delivers to `contact_messages` (visible in Studio or admin)
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` green
- [ ] Custom domain attached (optional)

## 6. Operational notes

- **Rate limiting** on `/api/orders`, `/api/orders/lookup`, and `/api/contact`
  is in-memory per server instance. On Vercel serverless this is a best-effort
  guard; move to a shared store (Upstash Redis / KV) if abuse becomes a real
  vector.
- **Email notifications** (order confirmations, contact replies) are not
  wired to an email provider yet — see the remaining-work list in README.md.
  Orders are confirmed manually by phone/email from `/admin/orders`.
- **Money** is integer cents everywhere. Shipping policy lives in one place:
  `lib/orders/checkout.ts` (`SHIPPING_FLAT_CENTS`,
  `FREE_SHIPPING_THRESHOLD_CENTS`) and the `place_order` function (keep both
  in sync if you change it).
- **Service-role key rotation:** if leaked, rotate in Supabase → Settings →
  API and update Vercel env vars. The app never exposes it to browsers.
