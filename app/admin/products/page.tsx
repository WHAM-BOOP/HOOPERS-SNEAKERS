import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductActions } from "@/components/admin/product-actions";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return (
      <Notice tone="danger" title="Supabase is not configured">
        Add your environment variables (see /setup) to manage products.
      </Notice>
    );
  }

  const { data: products, error } = await admin
    .from("products")
    .select(
      `id, slug, name, brand, price_cents, active, featured, image_url,
       category:categories ( name ),
       variants:product_variants ( stock )`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <Notice tone="danger" title="Could not load products">
        {error.message}
      </Notice>
    );
  }

  const rows = (products ?? []) as unknown as {
    id: string;
    slug: string;
    name: string;
    brand: string;
    price_cents: number;
    active: boolean;
    featured: boolean;
    image_url: string | null;
    category: { name: string } | null;
    variants: { stock: number }[];
  }[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description="Manage the catalog: pricing, sizes, stock, and visibility."
        action={
          <Link href="/admin/products/new" className="btn-primary">
            + New product
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong px-6 py-12 text-center text-[14px] text-muted">
          No products yet.{" "}
          <Link href="/admin/products/new" className="font-semibold text-accent hover:underline">
            Create your first product
          </Link>{" "}
          to start selling.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="w-full min-w-[760px] text-left text-[13.5px]">
            <caption className="sr-only">
              All products with price, stock, and visibility
            </caption>
            <thead>
              <tr className="border-b border-line bg-paper text-[12px] uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                <th scope="col" className="px-4 py-3 font-semibold">Stock</th>
                <th scope="col" className="px-4 py-3 font-semibold">Visibility</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((product) => {
                const totalStock = product.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
                return (
                  <tr key={product.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-sm border border-line bg-paper">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-semibold hover:text-accent hover:underline"
                          >
                            {product.name}
                          </Link>
                          <span className="block text-[12px] text-muted">
                            {product.brand} · /products/{product.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatMoney(product.price_cents)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={totalStock === 0 ? "text-danger" : ""}>
                        {totalStock} units
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={product.active ? "success" : "neutral"}>
                          {product.active ? "Active" : "Hidden"}
                        </Badge>
                        {product.featured ? <Badge tone="accent">Featured</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProductActions
                        productId={product.id}
                        active={product.active}
                        productName={product.name}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
