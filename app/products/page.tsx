import type { Metadata } from "next";
import Link from "next/link";
import { CatalogFilters } from "@/components/products/catalog-filters";
import { ProductGrid } from "@/components/products/product-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Pagination } from "@/components/ui/pagination";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getEnvStatus } from "@/lib/env";
import {
  getAvailableSizes,
  getBrands,
  getCategories,
  getProducts,
  type ProductFilter,
} from "@/lib/products/queries";
import { clamp } from "@/lib/utils";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Shop all basketball shoes & sneakers",
  description:
    "Browse basketball shoes, training and gymnastics footwear, and lifestyle sneakers. Filter by size, brand, and price — pay on delivery.",
  alternates: { canonical: "/products" },
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilter(params: SearchParams): {
  filter: ProductFilter;
  form: Record<string, string | undefined>;
} {
  const q = first(params.q)?.slice(0, 100);
  const category = first(params.category)?.slice(0, 80);
  const brand = first(params.brand)?.slice(0, 80);
  const size = first(params.size)?.slice(0, 10);
  const sortRaw = first(params.sort);
  const sort: ProductFilter["sort"] =
    sortRaw === "newest" ||
    sortRaw === "price-asc" ||
    sortRaw === "price-desc" ||
    sortRaw === "name"
      ? sortRaw
      : "featured";

  const minRaw = Number(first(params.minPrice));
  const maxRaw = Number(first(params.maxPrice));
  const minPriceCents =
    Number.isFinite(minRaw) && minRaw >= 0 ? Math.round(minRaw * 100) : undefined;
  const maxPriceCents =
    Number.isFinite(maxRaw) && maxRaw >= 0 ? Math.round(maxRaw * 100) : undefined;

  const pageRaw = Number(first(params.page) ?? "1");
  const page = Number.isFinite(pageRaw) ? clamp(Math.trunc(pageRaw), 1, 10_000) : 1;

  return {
    filter: { q, category, brand, size, sort, minPriceCents, maxPriceCents, page },
    form: {
      q,
      category,
      brand,
      size,
      sort,
      minPrice: minPriceCents !== undefined ? String(minPriceCents / 100) : undefined,
      maxPrice: maxPriceCents !== undefined ? String(maxPriceCents / 100) : undefined,
    },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { filter, form } = parseFilter(params);
  const status = getEnvStatus();

  return (
    <div className="container-page py-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Shop all shoes
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Basketball shoes, training gear, gymnastics footwear, and lifestyle
          sneakers — filter by what matters and order with pay-on-delivery.
        </p>
      </header>

      <div className="mt-8">
        <Suspense fallback={<FilterBarFallback />}>
          <FilterBar form={form} />
        </Suspense>
      </div>

      <section aria-label="Product results" className="mt-10">
        {!status.supabaseReady ? (
          <div className="mb-6">
            <DemoNotice />
          </div>
        ) : null}
        <Suspense key={JSON.stringify(filter)} fallback={<ProductGridSkeleton />}>
          <ProductResults filter={filter} form={form} />
        </Suspense>
      </section>
    </div>
  );
}

async function FilterBarFallback() {
  return (
    <div
      className="grid grid-cols-2 gap-4 rounded-md border border-line bg-surface p-5 lg:grid-cols-6"
      role="status"
      aria-label="Loading filters"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="skeleton h-10" />
      ))}
    </div>
  );
}

async function FilterBar({
  form,
}: {
  form: Record<string, string | undefined>;
}) {
  const [categories, brands, sizes] = await Promise.all([
    getCategories(),
    getBrands(),
    getAvailableSizes(),
  ]);

  return (
    <CatalogFilters
      action="/products"
      categories={(categories.ok ? categories.data : []).map((c) => ({
        value: c.slug,
        label: c.name,
      }))}
      brands={(brands.ok ? brands.data : []).map((b) => ({ value: b, label: b }))}
      sizes={(sizes.ok ? sizes.data : []).map((s) => ({ value: s, label: s }))}
      current={form}
    />
  );
}

async function ProductResults({
  filter,
  form,
}: {
  filter: ProductFilter;
  form: Record<string, string | undefined>;
}) {
  const result = await getProducts(filter);

  if (!result.ok) {
    return (
      <Notice tone="danger" title="Could not load products">
        {result.message} If this persists, check your Supabase configuration on{" "}
        <Link href="/setup" className="font-semibold underline">
          the setup page
        </Link>
        .
      </Notice>
    );
  }

  const { products, total, page, totalPages } = result.data;

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products match your filters"
        description="Try removing a filter or searching for something broader — new drops are added regularly."
        actionHref="/products"
        actionLabel="Clear all filters"
      />
    );
  }

  return (
    <>
      <p className="text-[13.5px] text-muted" role="status">
        Showing {products.length} of {total} product{total === 1 ? "" : "s"}
        {form.q ? ` for “${form.q}”` : ""}
      </p>
      <ProductGrid products={products} className="mt-5" />
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/products"
        query={{
          q: form.q,
          category: form.category,
          brand: form.brand,
          size: form.size,
          minPrice: form.minPrice,
          maxPrice: form.maxPrice,
          sort: form.sort,
        }}
        className="mt-12"
      />
    </>
  );
}
