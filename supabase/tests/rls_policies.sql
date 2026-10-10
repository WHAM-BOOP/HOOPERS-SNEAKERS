-- =========================================================================
-- HOOPERS SNEAKERS — RLS policy test script
--
-- HOW TO RUN (on a live Supabase project):
--   1. Apply supabase/migrations/0001..0004 first.
--   2. Paste this whole file into the Supabase SQL editor and run it.
--   3. Every test RAISES an exception on failure. Success = the notice
--      "ALL RLS TESTS PASSED" at the end.
--
-- The script creates its own test users/fixtures and cleans them up.
-- Structure: one outer transaction with savepoint groups per role, so role
-- switches and fixture changes are fully rolled back between groups.
-- =========================================================================

begin;

-- ------------------------------------------------------------ fixtures --
-- Two throwaway auth users: one customer, one admin. The handle_new_user
-- trigger must create their profiles (tested implicitly by 2.3).
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-customer@test.local', crypt('test-pw-12345', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"RLS Customer"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-admin@test.local', crypt('test-pw-12345', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"RLS Admin"}', now(), now());

insert into public.user_roles (user_id, role)
values ('22222222-2222-2222-2222-222222222222', 'admin');

-- Catalog fixtures (as superuser — bypasses RLS by design).
insert into public.products (id, slug, name, brand, price_cents, active, featured)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'rls-test-active', 'RLS Active Shoe', 'TestBrand', 10000, true, false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'rls-test-hidden', 'RLS Hidden Shoe', 'TestBrand', 10000, false, false);

insert into public.product_variants (product_id, size, stock)
values ('aaaaaaaa-0000-0000-0000-000000000001', '10', 5);

-- An order for the test customer (as superuser).
insert into public.orders (
  id, order_number, user_id, status, full_name, email, phone,
  address_line1, city, state, postal_code, country,
  subtotal_cents, shipping_cents, total_cents
)
values (
  'bbbbbbbb-0000-0000-0000-000000000001', 'HS-TEST-1',
  '11111111-1111-1111-1111-111111111111', 'pending',
  'RLS Customer', 'rls-customer@test.local', '5550100',
  '1 Test Street', 'Testville', 'TS', '00000', 'US',
  10000, 1200, 11200
);

insert into public.order_items (order_id, product_id, product_name, size, quantity, unit_price_cents)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'RLS Active Shoe', '10', 1, 10000);

insert into public.contact_messages (name, email, subject, message)
values ('RLS Fixture', 'rls-fixture@test.local', 'RLS', 'fixture for admin read test');

-- ------------------------------------------------------- helper asserts --
create or replace function pg_temp.assert(cond boolean, label text) returns void
language plpgsql as $$
begin
  if cond then
    raise notice 'PASS: %', label;
  else
    raise exception 'FAIL: %', label;
  end if;
end;
$$;

-- =========================================================================
-- GROUP 1 — anonymous (role anon, no jwt sub)
-- =========================================================================
savepoint group_anon;
set local role anon;
set local request.jwt.claims = '{"role":"anon","sub":null}';

select pg_temp.assert(
  (select count(*) from public.products where slug = 'rls-test-active') = 1,
  '1.1 anon reads active products'
);
select pg_temp.assert(
  (select count(*) from public.products where slug = 'rls-test-hidden') = 0,
  '1.2 anon cannot read inactive products'
);
select pg_temp.assert(
  (select count(*) from public.product_variants pv
     join public.products p on p.id = pv.product_id
    where p.slug = 'rls-test-hidden') = 0,
  '1.3 anon cannot read variants of inactive products'
);
select pg_temp.assert(
  (select count(*) from public.orders) = 0,
  '1.4 anon cannot read orders'
);

do $$
begin
  begin
    insert into public.products (slug, name, brand, price_cents)
    values ('rls-anon-insert', 'X', 'Y', 100);
    raise exception 'FAIL: 1.5 anon inserted a product';
  exception
    when insufficient_privilege then
      raise notice 'PASS: 1.5 anon cannot insert products';
  end;
end $$;

do $$
begin
  begin
    insert into public.orders (
      order_number, full_name, email, phone, address_line1,
      city, state, postal_code, subtotal_cents, shipping_cents, total_cents
    ) values ('HS-ANON', 'A', 'a@b.co', '555', 'x', 'y', 'z', '1', 0, 0, 0);
    raise exception 'FAIL: 1.6 anon inserted an order';
  exception
    when insufficient_privilege then
      raise notice 'PASS: 1.6 anon cannot insert orders';
  end;
end $$;

do $$
begin
  begin
    insert into public.contact_messages (name, email, subject, message)
    values ('A', 'a@b.co', 'Hi', 'Hello there');
    raise exception 'FAIL: 1.7 anon inserted a contact message';
  exception
    when insufficient_privilege then
      raise notice 'PASS: 1.7 anon cannot insert contact messages';
  end;
end $$;

do $$
begin
  begin
    perform public.place_order('{}'::jsonb, null, '[]'::jsonb);
    raise exception 'FAIL: 1.8 anon executed place_order';
  exception
    when insufficient_privilege then
      raise notice 'PASS: 1.8 anon cannot execute place_order';
  end;
end $$;

do $$
begin
  begin
    insert into public.user_roles (user_id, role)
    values ('11111111-1111-1111-1111-111111111111', 'admin');
    raise exception 'FAIL: 1.9 anon inserted a user_role';
  exception
    when insufficient_privilege then
      raise notice 'PASS: 1.9 anon cannot grant roles';
  end;
end $$;

rollback to savepoint group_anon;

-- =========================================================================
-- GROUP 2 — authenticated customer (own data only)
-- =========================================================================
savepoint group_customer;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}';

select pg_temp.assert(
  (select count(*) from public.orders where order_number = 'HS-TEST-1') = 1,
  '2.1 customer reads own order'
);
select pg_temp.assert(
  (select count(*) from public.order_items) = 1,
  '2.2 customer reads own order items'
);
select pg_temp.assert(
  (select count(*) from public.profiles where id = '11111111-1111-1111-1111-111111111111') = 1,
  '2.3 customer reads own profile'
);
select pg_temp.assert(
  (select count(*) from public.profiles where id = '22222222-2222-2222-2222-222222222222') = 0,
  '2.4 customer cannot read another profile'
);

do $$
declare
  updated_count integer;
begin
  update public.orders set status = 'delivered' where order_number = 'HS-TEST-1';
  get diagnostics updated_count = row_count;
  perform pg_temp.assert(updated_count = 0, '2.5 customer cannot update order status');
end $$;

do $$
begin
  begin
    insert into public.user_roles (user_id, role)
    values ('11111111-1111-1111-1111-111111111111', 'admin');
    raise exception 'FAIL: 2.6 customer self-granted admin';
  exception
    when insufficient_privilege then
      raise notice 'PASS: 2.6 customer cannot self-grant admin';
  end;
end $$;

select pg_temp.assert(
  (select count(*) from public.contact_messages) = 0,
  '2.7 customer cannot read contact messages'
);
select pg_temp.assert(
  public.is_admin() = false,
  '2.8 is_admin() false for customer'
);

do $$
begin
  begin
    perform public.place_order('{}'::jsonb, null, '[]'::jsonb);
    raise exception 'FAIL: 2.9 customer executed place_order';
  exception
    when insufficient_privilege then
      raise notice 'PASS: 2.9 customer cannot execute place_order';
  end;
end $$;

rollback to savepoint group_customer;

-- =========================================================================
-- GROUP 3 — authenticated admin
-- =========================================================================
savepoint group_admin;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"22222222-2222-2222-2222-222222222222"}';

select pg_temp.assert(
  public.is_admin() = true,
  '3.1 is_admin() true for admin'
);
select pg_temp.assert(
  (select count(*) from public.products where slug = 'rls-test-hidden') = 1,
  '3.2 admin reads inactive products'
);
select pg_temp.assert(
  (select count(*) from public.orders where order_number = 'HS-TEST-1') = 1,
  '3.3 admin reads all orders'
);

do $$
declare
  updated_count integer;
begin
  update public.orders set status = 'confirmed' where order_number = 'HS-TEST-1';
  get diagnostics updated_count = row_count;
  perform pg_temp.assert(updated_count = 1, '3.4 admin updates order status');
end $$;

do $$
begin
  insert into public.products (slug, name, brand, price_cents)
  values ('rls-admin-insert', 'Admin Made', 'TestBrand', 5000);
  raise notice 'PASS: 3.5 admin inserts products';
end $$;

select pg_temp.assert(
  (select count(*) from public.contact_messages where subject = 'RLS') = 1,
  '3.6 admin reads contact messages'
);

do $$
begin
  insert into public.user_roles (user_id, role)
  values ('11111111-1111-1111-1111-111111111111', 'customer');
  raise notice 'PASS: 3.7 admin manages roles';
end $$;

rollback to savepoint group_admin;

-- =========================================================================
-- GROUP 4 — order placement transaction (service-role path; run as owner)
-- =========================================================================
savepoint group_place_order;

do $$
declare
  result jsonb;
begin
  result := public.place_order(
    '{"full_name":"RLS Buyer","email":"buyer@test.local","phone":"5550101",
      "address_line1":"9 Test Ave","city":"Testville","state":"TS",
      "postal_code":"00000","country":"US"}'::jsonb,
    '11111111-1111-1111-1111-111111111111',
    '[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","size":"10","quantity":2}]'::jsonb
  );
  -- 2 × $100.00 = $200.00 subtotal → free shipping → total $200.00.
  perform pg_temp.assert(
    (result ->> 'subtotal_cents')::int = 20000
    and (result ->> 'shipping_cents')::int = 0
    and (result ->> 'total_cents')::int = 20000,
    '4.1 place_order computes totals from DB prices (free shipping ≥ $150)'
  );
end $$;

select pg_temp.assert(
  (select stock from public.product_variants
    where product_id = 'aaaaaaaa-0000-0000-0000-000000000001' and size = '10') = 3,
  '4.2 place_order decrements stock'
);

do $$
begin
  begin
    perform public.place_order(
      '{"full_name":"RLS Buyer","email":"buyer@test.local","phone":"5550101",
        "address_line1":"9 Test Ave","city":"Testville","state":"TS",
        "postal_code":"00000","country":"US"}'::jsonb,
      null,
      '[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","size":"10","quantity":99}]'::jsonb
    );
    raise exception 'FAIL: 4.3 overselling was allowed';
  exception
    when raise_exception then
      if sqlerrm like '%INSUFFICIENT_STOCK%' then
        raise notice 'PASS: 4.3 overselling rejected';
      else
        raise exception 'FAIL: 4.3 unexpected error: %', sqlerrm;
      end if;
  end;
end $$;

do $$
begin
  begin
    perform public.place_order(
      '{"full_name":"X","email":"x@test.local","phone":"555",
        "address_line1":"1 St","city":"C","state":"S",
        "postal_code":"1","country":"US"}'::jsonb,
      null,
      '[{"product_id":"cccccccc-0000-0000-0000-000000000009","size":"10","quantity":1}]'::jsonb
    );
    raise exception 'FAIL: 4.4 unknown product was accepted';
  exception
    when raise_exception then
      if sqlerrm like '%PRODUCT_UNAVAILABLE%' then
        raise notice 'PASS: 4.4 unknown product rejected';
      else
        raise exception 'FAIL: 4.4 unexpected error: %', sqlerrm;
      end if;
  end;
end $$;

rollback to savepoint group_place_order;

-- ------------------------------------------------------------ cleanup ---
delete from public.user_roles where user_id in (
  '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'
);
delete from public.order_items where order_id = 'bbbbbbbb-0000-0000-0000-000000000001';
delete from public.orders where order_number like 'HS-TEST%';
delete from public.product_variants where product_id in (
  'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002'
);
delete from public.products where slug like 'rls-%';
delete from public.contact_messages where email in ('rls-fixture@test.local', 'a@b.co');
delete from public.profiles where id in (
  '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'
);
delete from auth.users where id in (
  '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'
);

commit;

select 'ALL RLS TESTS PASSED' as result;
