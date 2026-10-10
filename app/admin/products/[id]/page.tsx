import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { Notice } from "@/components/ui/notice";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return (
      <Notice tone="danger" title="Supabase is not configured">
        Add your environment variables (see /setup) to manage products.
      </Notice>
    );
  }

  const [{ data: product, error }, { data: categories }] = await Promise.all([
    admin
      .from("products")
      .select(
        `*,
         variants:product_variants ( size, stock ),
         images:product_images ( url, alt, sort_order )`,
      )
      .eq("id", id)
      .maybeSingle(),
    admin.from("categories").select("id, name").order("sort_order", { ascending: true }),
  ]);

  if (error) {
    return (
      <Notice tone="danger" title="Could not load the product">
        {error.message}
      </Notice>
    );
  }
  if (!product) notFound();

  const full = product as unknown as {
    id: string;
    name: string;
    slug: string;
    brand: string;
    category_id: string | null;
    short_description: string | null;
    description: string | null;
    image_url: string | null;
    price_cents: number;
    featured: boolean;
    active: boolean;
    variants: { size: string; stock: number }[];
    images: { url: string; alt: string | null; sort_order: number }[];
  };

  const initialValues: ProductFormValues = {
    name: full.name,
    slug: full.slug,
    brand: full.brand,
    categoryId: full.category_id,
    shortDescription: full.short_description ?? "",
    description: full.description ?? "",
    imageUrl: full.image_url ?? "",
    priceDollars: (full.price_cents / 100).toFixed(2),
    featured: full.featured,
    active: full.active,
    variants:
      full.variants.length > 0
        ? full.variants.map((v) => ({ size: v.size, stock: v.stock }))
        : [{ size: "", stock: 0 }],
    images: [...full.images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({ url: img.url, alt: img.alt ?? "" })),
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Edit: ${full.name}`}
        description={`Public URL: /products/${full.slug}`}
      />
      <ProductForm
        mode="edit"
        productId={full.id}
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        initialValues={initialValues}
      />
    </div>
  );
}
