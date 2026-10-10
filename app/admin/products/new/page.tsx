import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  ProductForm,
  emptyProductFormValues,
} from "@/components/admin/product-form";
import { Notice } from "@/components/ui/notice";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return (
      <Notice tone="danger" title="Supabase is not configured">
        Add your environment variables (see /setup) to manage products.
      </Notice>
    );
  }

  const { data: categories } = await admin
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New product"
        description="Add a shoe to the catalog. Sizes and stock are required."
      />
      <ProductForm
        mode="create"
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        initialValues={emptyProductFormValues()}
      />
    </div>
  );
}
