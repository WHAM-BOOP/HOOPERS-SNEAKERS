-- =========================================================================
-- HOOPERS SNEAKERS — 0002_rls.sql
-- Row Level Security, least privilege.
--
-- Roles: anon · authenticated · admin (member of user_roles with 'admin')
--
-- Writes to orders / order_items / contact_messages happen exclusively via
-- the server API (service-role key) after validation, so there are NO insert
-- policies for anon/authenticated on those tables.
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_messages enable row level security;

-- ------------------------------------------------------------- profiles --
create policy "profiles: select own or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admin full access"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------- user_roles --
create policy "user_roles: select own or admin"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "user_roles: admin manages"
  on public.user_roles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------ catalog (reads) --
create policy "categories: public read"
  on public.categories for select
  using (true);

create policy "categories: admin manages"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "products: public reads active"
  on public.products for select
  using (active or public.is_admin());

create policy "products: admin manages"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_images: public reads active products"
  on public.product_images for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.active
    )
  );

create policy "product_images: admin manages"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_variants: public reads active products"
  on public.product_variants for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.active
    )
  );

create policy "product_variants: admin manages"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------------- orders --
-- Owners see their own orders (signed-in checkout binds user_id). Guest
-- orders are looked up through the server API (order number + email).
create policy "orders: select own or admin"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "orders: admin updates status"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_items: read via parent order"
  on public.order_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------- contact_messages --
create policy "contact_messages: admin reads"
  on public.contact_messages for select
  using (public.is_admin());

-- No insert policy: the server API writes with the service role.

-- --------------------------------------------------------------- grants --
-- Tighten default grants; RLS is the second layer. anon = read-only catalog.
-- authenticated = DML grants constrained by the policies above (admin or
-- owner only). Order/contact writes still happen via the service role.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.product_variants to anon, authenticated;

grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert, update, delete on public.product_images to authenticated;
grant insert, update, delete on public.product_variants to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.user_roles to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;

grant usage on schema public to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
