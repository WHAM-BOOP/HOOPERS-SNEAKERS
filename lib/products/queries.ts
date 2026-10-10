import { getEnvStatus } from "@/lib/env";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  demoBrands,
  demoSizes,
} from "@/lib/demo/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CategoryRow,
  OrderWithItems,
  ProductWithRelations,
} from "@/lib/supabase/types";

/**
 * Server-side catalog queries.
 *
 * Two sources of truth:
 * - Supabase configured  → live database data (demo never mixes in).
 * - Supabase unconfigured → clearly-labeled demo catalog (lib/demo/catalog)
 *   so the storefront stays fully browsable while the store is unprovisioned.
 * Fetch failures while configured return explicit errors — never silent
 * fallback to demo data.
 */

export type CatalogResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not-configured" | "error"; message: string };

export const PAGE_SIZE = 12;

export type ProductFilter = {
  q?: string;
  category?: string;
  brand?: string;
  size?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "name";
  page?: number;
  includeInactive?: boolean;
};

function baseProductQuery() {
  return `
    id, slug, name, brand, short_description, description, image_url,
    price_cents, featured, active, category_id, created_at, updated_at,
    category:categories ( id, slug, name ),
    variants:product_variants ( id, size, stock ),
    images:product_images ( id, url, alt, sort_order )
  `;
}

/* ---------------------------------------------------------- demo layer -- */

function demoFilterProducts(filter: ProductFilter): ProductWithRelations[] {
  let items = DEMO_PRODUCTS.filter((p) => filter.includeInactive || p.active);

  if (filter.category) {
    items = items.filter((p) => p.category?.slug === filter.category);
  }
  if (filter.brand) {
    items = items.filter((p) => p.brand === filter.brand);
  }
  if (typeof filter.minPriceCents === "number") {
    items = items.filter((p) => p.price_cents >= (filter.minPriceCents ?? 0));
  }
  if (typeof filter.maxPriceCents === "number") {
    items = items.filter((p) => p.price_cents <= (filter.maxPriceCents ?? Infinity));
  }
  if (filter.size) {
    items = items.filter((p) =>
      p.variants.some((v) => v.size === filter.size && v.stock > 0),
    );
  }
  if (filter.q) {
    const term = filter.q.toLowerCase();
    items = items.filter((p) =>
      [p.name, p.brand, p.short_description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }

  switch (filter.sort ?? "featured") {
    case "newest":
      items = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
    case "price-asc":
      items = [...items].sort((a, b) => a.price_cents - b.price_cents);
      break;
    case "price-desc":
      items = [...items].sort((a, b) => b.price_cents - a.price_cents);
      break;
    case "name":
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      items = [...items].sort(
        (a, b) => Number(b.featured) - Number(a.featured) ||
          b.created_at.localeCompare(a.created_at),
      );
  }
  return items;
}

function demoPaginate(
  items: ProductWithRelations[],
  page: number,
): {
  products: ProductWithRelations[];
  total: number;
  page: number;
  totalPages: number;
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  return {
    products: items.slice(start, start + PAGE_SIZE),
    total,
    page,
    totalPages,
  };
}

/* -------------------------------------------------------- live queries -- */

export async function getProducts(
  filter: ProductFilter = {},
): Promise<
  CatalogResult<{
    products: ProductWithRelations[];
    total: number;
    page: number;
    totalPages: number;
  }>
> {
  const status = getEnvStatus();
  const page = Math.max(1, filter.page ?? 1);

  if (!status.supabaseReady) {
    return {
      ok: true,
      data: demoPaginate(demoFilterProducts(filter), page),
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase is not configured." };
  }

  const from = (page - 1) * PAGE_SIZE;

  try {
    let query = supabase
      .from("products")
      .select(baseProductQuery(), { count: "exact" });

    if (!filter.includeInactive) query = query.eq("active", true);
    if (filter.category) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", filter.category)
        .maybeSingle();
      if (category) {
        query = query.eq("category_id", category.id);
      } else {
        return { ok: true, data: { products: [], total: 0, page: 1, totalPages: 0 } };
      }
    }
    if (filter.brand) query = query.eq("brand", filter.brand);
    if (typeof filter.minPriceCents === "number") {
      query = query.gte("price_cents", filter.minPriceCents);
    }
    if (typeof filter.maxPriceCents === "number") {
      query = query.lte("price_cents", filter.maxPriceCents);
    }
    if (filter.q) {
      const term = filter.q.replace(/[%_()]/g, " ").trim();
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,brand.ilike.%${term}%,short_description.ilike.%${term}%`,
        );
      }
    }

    switch (filter.sort ?? "featured") {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "price-asc":
        query = query.order("price_cents", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price_cents", { ascending: false });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      default:
        query = query
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });
    }

    // Size filter must run against variants — use a second pass on ids when set.
    if (filter.size) {
      const { data: variantRows } = await supabase
        .from("product_variants")
        .select("product_id")
        .eq("size", filter.size);
      const ids = (variantRows ?? []).map((v) => v.product_id);
      if (ids.length === 0) {
        return { ok: true, data: { products: [], total: 0, page: 1, totalPages: 0 } };
      }
      query = query.in("id", ids);
    }

    const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) return { ok: false, reason: "error", message: error.message };

    const total = count ?? 0;
    return {
      ok: true,
      data: {
        products: (data ?? []) as unknown as ProductWithRelations[],
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getProductBySlug(
  slug: string,
  options: { includeInactive?: boolean } = {},
): Promise<CatalogResult<ProductWithRelations | null>> {
  const status = getEnvStatus();
  if (!status.supabaseReady) {
    const found =
      DEMO_PRODUCTS.find(
        (p) => p.slug === slug && (options.includeInactive || p.active),
      ) ?? null;
    return { ok: true, data: found };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase is not configured." };
  }

  try {
    let query = supabase
      .from("products")
      .select(baseProductQuery())
      .eq("slug", slug);
    if (!options.includeInactive) query = query.eq("active", true);
    const { data, error } = await query.maybeSingle();
    if (error) return { ok: false, reason: "error", message: error.message };
    return { ok: true, data: data as unknown as ProductWithRelations | null };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getFeaturedProducts(
  limit = 8,
): Promise<CatalogResult<ProductWithRelations[]>> {
  const status = getEnvStatus();
  if (!status.supabaseReady) {
    return {
      ok: true,
      data: demoFilterProducts({ sort: "featured" })
        .filter((p) => p.featured)
        .slice(0, limit),
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select(baseProductQuery())
      .eq("active", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { ok: false, reason: "error", message: error.message };
    return { ok: true, data: (data ?? []) as unknown as ProductWithRelations[] };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getRelatedProducts(
  product: ProductWithRelations,
  limit = 4,
): Promise<CatalogResult<ProductWithRelations[]>> {
  const status = getEnvStatus();
  if (!status.supabaseReady) {
    const sameCategory = DEMO_PRODUCTS.filter(
      (p) => p.id !== product.id && p.category_id === product.category_id,
    );
    const others = DEMO_PRODUCTS.filter(
      (p) => p.id !== product.id && p.category_id !== product.category_id,
    );
    return {
      ok: true,
      data: [...sameCategory, ...others]
        .slice(0, limit),
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select(baseProductQuery())
      .eq("active", true)
      .neq("id", product.id)
      .eq("category_id", product.category_id ?? "")
      .limit(limit);
    if (error) return { ok: false, reason: "error", message: error.message };

    const related = (data ?? []) as unknown as ProductWithRelations[];
    if (related.length >= limit) return { ok: true, data: related.slice(0, limit) };

    const { data: fillers, error: fillError } = await supabase
      .from("products")
      .select(baseProductQuery())
      .eq("active", true)
      .neq("id", product.id)
      .order("featured", { ascending: false })
      .limit(limit - related.length);
    if (fillError) return { ok: false, reason: "error", message: fillError.message };

    return {
      ok: true,
      data: [...related, ...((fillers ?? []) as unknown as ProductWithRelations[])].slice(0, limit),
    };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getCategories(): Promise<CatalogResult<CategoryRow[]>> {
  const status = getEnvStatus();
  if (!status.supabaseReady) {
    return { ok: true, data: DEMO_CATEGORIES };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) return { ok: false, reason: "error", message: error.message };
    return { ok: true, data: (data ?? []) as CategoryRow[] };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CatalogResult<CategoryRow | null>> {
  const status = getEnvStatus();
  if (!status.supabaseReady) {
    return {
      ok: true,
      data: DEMO_CATEGORIES.find((c) => c.slug === slug) ?? null,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) return { ok: false, reason: "error", message: error.message };
    return { ok: true, data: data as CategoryRow | null };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Distinct brands for catalog filter UI. */
export async function getBrands(): Promise<CatalogResult<string[]>> {
  const status = getEnvStatus();
  if (!status.supabaseReady) {
    return { ok: true, data: demoBrands() };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("brand")
      .eq("active", true)
      .order("brand", { ascending: true });
    if (error) return { ok: false, reason: "error", message: error.message };
    const brands = [...new Set((data ?? []).map((r) => r.brand))].filter(Boolean);
    return { ok: true, data: brands };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Distinct sizes (for filter chips), ordered numerically where possible. */
export async function getAvailableSizes(): Promise<CatalogResult<string[]>> {
  const status = getEnvStatus();
  if (!status.supabaseReady) {
    return { ok: true, data: demoSizes() };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from("product_variants")
      .select("size, stock");
    if (error) return { ok: false, reason: "error", message: error.message };

    const sizes = [
      ...new Set(
        (data ?? [])
          .filter((v) => v.stock > 0)
          .map((v) => v.size),
      ),
    ];
    sizes.sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });
    return { ok: true, data: sizes };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export type { OrderWithItems };
