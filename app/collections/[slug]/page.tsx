import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/products/product-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Pagination } from "@/components/ui/pagination";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getEnvStatus } from "@/lib/env";
import {
  getCategoryBySlug,
  getProducts,
} from "@/lib/products/queries";
import { clamp } from "@/lib/utils";
import { Suspense } from "react";

type Params = { slug: string };
type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryBySlug(slug);
  if (!result.ok || !result.data) {
    // Throwing here (before streaming) ensures a real 404 status code.
    notFound();
  }

  return {
    title: result.data.name,
    description:
      result.data.description ??
      `Shop the ${result.data.name} collection at Hoopers Sneakers.`,
    alternates: { canonical: `/collections/${result.data.slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const pageRaw = Number(Array.isArray(sp.page) ? sp.page[0] : (sp.page ?? "1"));
  const page = Number.isFinite(pageRaw) ? clamp(Math.trunc(pageRaw), 1, 10_000) : 1;

  const status = getEnvStatus();

  const categoryResult = await getCategoryBySlug(slug);
  if (!categoryResult.ok) {
    return (
      <div className="container-page py-10">
        <Notice tone="danger" title="Could not load this collection">
          {categoryResult.message}
        </Notice>
      </div>
    );
  }
  if (!categoryResult.data) notFound();

  const category = categoryResult.data;

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <li>
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/collections" className="hover:text-accent">
              Collections
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">
            {category.name}
          </li>
        </ol>
      </nav>

      <header className="mt-5 max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            {category.description}
          </p>
        ) : null}
      </header>

      <section aria-label={`Products in ${category.name}`} className="mt-10 space-y-6">
        {!status.supabaseReady ? <DemoNotice /> : null}
        <Suspense key={page} fallback={<ProductGridSkeleton />}>
          <CollectionProducts slug={slug} page={page} />
        </Suspense>
      </section>
    </div>
  );
}

async function CollectionProducts({
  slug,
  page,
}: {
  slug: string;
  page: number;
}) {
  const result = await getProducts({ category: slug, page, sort: "newest" });

  if (!result.ok) {
    return (
      <Notice tone="danger" title="Could not load products">
        {result.message}
      </Notice>
    );
  }

  const { products, total, totalPages } = result.data;
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products in this collection yet"
        description="New drops land here as soon as they are added in the admin dashboard."
        actionHref="/products"
        actionLabel="Browse all products"
      />
    );
  }

  return (
    <>
      <p className="text-[13.5px] text-muted" role="status">
        {total} product{total === 1 ? "" : "s"} in this collection
      </p>
      <ProductGrid products={products} className="mt-5" />
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath={`/collections/${slug}`}
        className="mt-12"
      />
    </>
  );
}
