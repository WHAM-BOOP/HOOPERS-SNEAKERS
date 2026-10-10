-- =========================================================================
-- HOOPERS SNEAKERS — 0004_order_placing.sql
-- Transactional order placement executed ONLY by the server API
-- (service-role). Client-supplied prices are never accepted: totals are
-- recomputed from the products table inside the same transaction that
-- decrements stock.
-- =========================================================================

create or replace function public.place_order(
  p_customer jsonb,
  p_user_id uuid,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_qty integer;
  v_product record;
  v_variant record;
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_shipping integer;
  v_total integer;
  v_snapshot jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  -- Validate every line against the database, lock variants for update,
  -- decrement stock, and build immutable price snapshots.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select p.id, p.name, p.price_cents, p.active
      into v_product
      from public.products p
     where p.id = (v_item ->> 'product_id')::uuid
       for update;

    if not found or not v_product.active then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;

    select v.id, v.stock
      into v_variant
      from public.product_variants v
     where v.product_id = v_product.id
       and v.size = (v_item ->> 'size')
       for update;

    if not found then
      raise exception 'SIZE_UNAVAILABLE';
    end if;
    if v_variant.stock < v_qty then
      raise exception 'INSUFFICIENT_STOCK';
    end if;

    update public.product_variants
       set stock = stock - v_qty
     where id = v_variant.id;

    v_subtotal := v_subtotal + v_product.price_cents * v_qty;

    v_snapshot := v_snapshot || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product.id,
        'product_name', v_product.name,
        'size', v_item ->> 'size',
        'quantity', v_qty,
        'unit_price_cents', v_product.price_cents
      )
    );
  end loop;

  -- Shipping policy (single source of truth): $12.00 flat, free ≥ $150.00.
  v_shipping := case when v_subtotal >= 15000 then 0 else 1200 end;
  v_total := v_subtotal + v_shipping;
  v_order_number := public.next_order_number();

  insert into public.orders (
    order_number, user_id, status,
    full_name, email, phone,
    address_line1, address_line2, city, state, postal_code, country, note,
    subtotal_cents, shipping_cents, total_cents
  )
  values (
    v_order_number,
    p_user_id,
    'pending',
    p_customer ->> 'full_name',
    p_customer ->> 'email',
    p_customer ->> 'phone',
    p_customer ->> 'address_line1',
    nullif(p_customer ->> 'address_line2', ''),
    p_customer ->> 'city',
    p_customer ->> 'state',
    p_customer ->> 'postal_code',
    coalesce(p_customer ->> 'country', 'US'),
    nullif(p_customer ->> 'note', ''),
    v_subtotal,
    v_shipping,
    v_total
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, product_name, size, quantity, unit_price_cents
  )
  select
    v_order_id,
    (line ->> 'product_id')::uuid,
    line ->> 'product_name',
    line ->> 'size',
    (line ->> 'quantity')::integer,
    (line ->> 'unit_price_cents')::integer
  from jsonb_array_elements(v_snapshot) as line;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal_cents', v_subtotal,
    'shipping_cents', v_shipping,
    'total_cents', v_total,
    'status', 'pending'
  );
end;
$$;

-- Least privilege: only the server API (service role) may place orders.
revoke execute on function public.place_order(jsonb, uuid, jsonb) from public;
revoke execute on function public.place_order(jsonb, uuid, jsonb) from anon;
revoke execute on function public.place_order(jsonb, uuid, jsonb) from authenticated;
grant execute on function public.place_order(jsonb, uuid, jsonb) to service_role;
