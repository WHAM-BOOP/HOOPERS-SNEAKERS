-- =========================================================================
-- HOOPERS SNEAKERS — optional taxonomy seed (categories ONLY).
--
-- These are the store's real merchandising categories — not sample products.
-- Product data is created by admins at /admin/products. Run this once in the
-- Supabase SQL editor if you want the starter category set.
-- =========================================================================

insert into public.categories (slug, name, description, sort_order)
values
  (
    'basketball',
    'Basketball',
    'High-performance basketball shoes built for grip, ankle support, and quick first steps on the court.',
    1
  ),
  (
    'training',
    'Training',
    'Cross-training and gym shoes for strength work, agility drills, and general fitness.',
    2
  ),
  (
    'gymnastics',
    'Gymnastics',
    'Lightweight, flexible footwear for gymnasts, dancers, and studio athletes.',
    3
  ),
  (
    'lifestyle',
    'Lifestyle',
    'Off-court sneakers with hoop DNA — everyday comfort for designers and everyone in general.',
    4
  )
on conflict (slug) do nothing;
