import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CategoryRow,
  OrderWithItems,
  ProductWithRelations,
} from "@/lib/supabase/types";

/**
 * Server-side catalog queries. Every function returns `null` when Supabase
 * is not configured — pages render the /setup guidance instead of fake data.
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

export async function getProducts(
  filter: ProductFilter = {},
): Promise<CatalogResult<{ products: ProductWithRelations[]; total: number; page: number; totalPages: number }>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not-configured", message: "Supabase is not configured." };

  const page = Math.max(1, filter.page ?? 1);
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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not-configured", message: "Supabase is not configured." };

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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not-configured", message: "Supabase is not configured." };

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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not-configured", message: "Supabase is not configured." };

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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not-configured", message: "Supabase is not configured." };

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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not-configured", message: "Supabase is not configured." };

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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not-configured", message: "Supabase is not configured." };

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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not-configured", message: "Supabase is not configured." };

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
