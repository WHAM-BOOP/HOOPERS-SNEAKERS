import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProductWithRelations } from "@/lib/supabase/types";
import { cn, formatMoney } from "@/lib/utils";

function totalStock(product: ProductWithRelations): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export function ProductCard({
  product,
  className,
}: {
  product: ProductWithRelations;
  className?: string;
}) {
  const stock = totalStock(product);
  const lowestPrice = product.price_cents;

  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="block focus-visible:outline-accent"
        aria-label={`${product.name} — ${formatMoney(lowestPrice)}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-line bg-surface">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center bg-paper"
            >
              <span className="text-4xl font-black text-ink/10" style={{ fontFamily: "var(--font-display)" }}>
                HS
              </span>
            </div>
          )}

          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {product.featured ? <Badge tone="accent">Featured</Badge> : null}
            {stock === 0 ? <Badge tone="neutral">Sold out</Badge> : null}
            {stock > 0 && stock <= 3 ? (
              <Badge tone="warning">Only {stock} left</Badge>
            ) : null}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {product.brand}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold leading-snug text-ink group-hover:text-accent">
            {product.name}
          </h3>
          <p className="mt-1.5 text-[14.5px] font-semibold">{formatMoney(lowestPrice)}</p>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({
  products,
  className,
}: {
  products: ProductWithRelations[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
