import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/products/add-to-cart";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductGrid } from "@/components/products/product-card";
import { Badge } from "@/components/ui/badge";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { getEnvStatus } from "@/lib/env";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/products/queries";
import type { ProductWithRelations } from "@/lib/supabase/types";
import { formatMoney } from "@/lib/utils";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result.ok || !result.data) {
    // Throwing here (before streaming) ensures a real 404 status code.
    notFound();
  }

  const product = result.data;
  return {
    title: product.name,
    description:
      product.short_description ??
      `${product.name} by ${product.brand} — basketball shoes and athletic footwear at Hoopers Sneakers. Pay on delivery.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.short_description ?? undefined,
      images: product.image_url ? [{ url: product.image_url }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const status = getEnvStatus();

  const result = await getProductBySlug(slug);
  if (!result.ok) {
    return (
      <div className="container-page py-10">
        <Notice tone="danger" title="Could not load this product">
          {result.message}
        </Notice>
      </div>
    );
  }
  if (!result.data) notFound();

  const product = result.data;

  return (
    <div className="container-page py-8">
      <Breadcrumb product={product} />
      {!status.supabaseReady ? (
        <div className="mt-4">
          <DemoNotice />
        </div>
      ) : null}

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery
          productName={product.name}
          fallbackUrl={product.image_url}
          images={[...product.images].sort((a, b) => a.sort_order - b.sort_order)}
        />

        <div className="lg:pt-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
            {product.brand}
            {product.category ? (
              <>
                {" · "}
                <Link
                  href={`/collections/${product.category.slug}`}
                  className="hover:text-accent"
                >
                  {product.category.name}
                </Link>
              </>
            ) : null}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <p className="text-2xl font-bold">{formatMoney(product.price_cents)}</p>
            <Badge tone="accent">Pay on delivery</Badge>
          </div>

          {product.short_description ? (
            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted">
              {product.short_description}
            </p>
          ) : null}

          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              imageUrl: product.image_url,
              priceCents: product.price_cents,
            }}
            variants={[...product.variants].sort((a, b) => Number(a.size) - Number(b.size))}
          />

          {product.description ? (
            <section aria-labelledby="description-heading" className="mt-10">
              <h2 id="description-heading" className="text-lg font-bold">
                About this shoe
              </h2>
              <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">
                {product.description}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="specs-heading" className="mt-10">
            <h2 id="specs-heading" className="text-lg font-bold">
              Details
            </h2>
            <dl className="mt-3 divide-y divide-line rounded-sm border border-line">
              <SpecRow label="Brand" value={product.brand} />
              {product.category ? (
                <SpecRow label="Category" value={product.category.name} />
              ) : null}
              <SpecRow
                label="Available sizes (US)"
                value={
                  product.variants.filter((v) => v.stock > 0).map((v) => v.size).join(", ") ||
                  "Currently sold out"
                }
              />
              <SpecRow
                label="Payment"
                value="Pay on delivery (cash or transfer when your order arrives)"
              />
            </dl>
          </section>
        </div>
      </div>

      <Suspense fallback={<RelatedFallback />}>
        <RelatedProducts product={product} />
      </Suspense>
    </div>
  );
}

function Breadcrumb({ product }: { product: ProductWithRelations }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <li>
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/products" className="hover:text-accent">
            Shop
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-medium text-ink">
          {product.name}
        </li>
      </ol>
    </nav>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-6">
      <dt className="w-44 shrink-0 text-[13px] font-semibold text-ink">{label}</dt>
      <dd className="text-[13.5px] text-muted">{value}</dd>
    </div>
  );
}

function RelatedFallback() {
  return (
    <section className="mt-16">
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full" />
        ))}
      </div>
    </section>
  );
}

async function RelatedProducts({ product }: { product: ProductWithRelations }) {
  const result = await getRelatedProducts(product, 4);
  if (!result.ok || result.data.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-16">
      <h2 id="related-heading" className="text-xl font-bold">
        You may also like
      </h2>
      <ProductGrid products={result.data} className="mt-6" />
    </section>
  );
}
