"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AdminAuthError, requireAdmin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

/**
 * Admin server actions. Every action:
 * 1. verifies the caller is an admin (server-side),
 * 2. validates input with zod,
 * 3. writes via the service-role client.
 * RLS provides a second enforcement layer on direct table access.
 */

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const variantSchema = z.object({
  size: z.string().trim().min(1).max(10),
  stock: z.number().int().min(0).max(100_000),
});

const imageSchema = z.object({
  url: z.string().trim().url().max(2048),
  alt: z.string().trim().max(200).optional().default(""),
});

const productInputSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug may contain lowercase letters, numbers, and dashes only.")
    .max(80)
    .optional(),
  brand: z.string().trim().min(1).max(80),
  categoryId: z.string().uuid().nullable().optional(),
  shortDescription: z.string().trim().max(400).optional().default(""),
  description: z.string().trim().max(8000).optional().default(""),
  imageUrl: z.string().trim().url().max(2048).optional().or(z.literal("")),
  priceCents: z.number().int().min(0).max(10_000_000),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  variants: z.array(variantSchema).min(1, "Add at least one size with stock.").max(40),
  images: z.array(imageSchema).max(12).default([]),
});

export type ProductInput = z.infer<typeof productInputSchema>;

function errorResult<T = never>(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionResult<T> {
  return { ok: false, message, fieldErrors };
}

function unknownError(action: string, err: unknown): ActionResult<never> {
  if (err instanceof AdminAuthError) {
    return errorResult(
      err.reason === "unauthenticated"
        ? "You must be signed in as an admin to do that."
        : "You do not have permission to do that.",
    );
  }
  console.error(`Admin action ${action} failed:`, err);
  return errorResult("Something went wrong. Please try again.");
}

/** Merge duplicate size rows (UI can produce them via quick adds). */
function normalizeVariants(variants: z.infer<typeof variantSchema>[]) {
  const map = new Map<string, number>();
  for (const v of variants) {
    map.set(v.size, (map.get(v.size) ?? 0) + v.stock);
  }
  return [...map.entries()].map(([size, stock]) => ({ size, stock }));
}

export async function createProduct(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      return errorResult(
        "Please fix the highlighted fields.",
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]),
        ),
      );
    }

    const admin = createSupabaseAdminClient();
    if (!admin) return errorResult("Supabase is not configured on the server.");

    const data = parsed.data;
    const slug = data.slug && data.slug.length > 0 ? data.slug : slugify(data.name);

    const { data: product, error } = await admin
      .from("products")
      .insert({
        name: data.name,
        slug,
        brand: data.brand,
        category_id: data.categoryId ?? null,
        short_description: data.shortDescription || null,
        description: data.description || null,
        image_url: data.imageUrl || null,
        price_cents: data.priceCents,
        featured: data.featured,
        active: data.active,
      })
      .select("id, slug")
      .single();

    if (error) {
      if (error.code === "23505") {
        return errorResult("That slug is already in use — choose another.", {
          slug: "Already in use.",
        });
      }
      return errorResult(error.message);
    }

    await writeRelations(admin, product.id, data.variants, data.images);

    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, data: product };
  } catch (err) {
    return unknownError("createProduct", err);
  }
}

export async function updateProduct(
  productId: string,
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
    if (!z.string().uuid().safeParse(productId).success) {
      return errorResult("Invalid product id.");
    }

    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      return errorResult(
        "Please fix the highlighted fields.",
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]),
        ),
      );
    }

    const admin = createSupabaseAdminClient();
    if (!admin) return errorResult("Supabase is not configured on the server.");

    const data = parsed.data;
    const slug = data.slug && data.slug.length > 0 ? data.slug : slugify(data.name);

    const { data: product, error } = await admin
      .from("products")
      .update({
        name: data.name,
        slug,
        brand: data.brand,
        category_id: data.categoryId ?? null,
        short_description: data.shortDescription || null,
        description: data.description || null,
        image_url: data.imageUrl || null,
        price_cents: data.priceCents,
        featured: data.featured,
        active: data.active,
      })
      .eq("id", productId)
      .select("id, slug")
      .single();

    if (error) {
      if (error.code === "23505") {
        return errorResult("That slug is already in use — choose another.", {
          slug: "Already in use.",
        });
      }
      return errorResult(error.message);
    }

    // Replace variants and gallery images wholesale — simple and consistent.
    await admin.from("product_variants").delete().eq("product_id", productId);
    await admin.from("product_images").delete().eq("product_id", productId);
    await writeRelations(admin, productId, data.variants, data.images);

    revalidatePath("/products");
    revalidatePath(`/products/${slug}`);
    revalidatePath("/admin/products");
    return { ok: true, data: product };
  } catch (err) {
    return unknownError("updateProduct", err);
  }
}

async function writeRelations(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  productId: string,
  variants: z.infer<typeof variantSchema>[],
  images: z.infer<typeof imageSchema>[],
) {
  const normalized = normalizeVariants(variants);
  const { error: variantError } = await admin.from("product_variants").insert(
    normalized.map((v) => ({ product_id: productId, size: v.size, stock: v.stock })),
  );
  if (variantError) throw new Error(variantError.message);

  if (images.length > 0) {
    const { error: imageError } = await admin.from("product_images").insert(
      images.map((img, index) => ({
        product_id: productId,
        url: img.url,
        alt: img.alt || null,
        sort_order: index,
      })),
    );
    if (imageError) throw new Error(imageError.message);
  }
}

export async function setProductActive(
  productId: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const admin = createSupabaseAdminClient();
    if (!admin) return errorResult("Supabase is not configured on the server.");

    const { error } = await admin
      .from("products")
      .update({ active })
      .eq("id", productId);
    if (error) return errorResult(error.message);

    revalidatePath("/products");
    revalidatePath("/admin/products");
    return { ok: true, data: null };
  } catch (err) {
    return unknownError("setProductActive", err);
  }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const admin = createSupabaseAdminClient();
    if (!admin) return errorResult("Supabase is not configured on the server.");

    // order_items keep a name/price snapshot and product_id becomes null —
    // order history survives product deletion.
    const { error } = await admin.from("products").delete().eq("id", productId);
    if (error) return errorResult(error.message);

    revalidatePath("/products");
    revalidatePath("/admin/products");
    return { ok: true, data: null };
  } catch (err) {
    return unknownError("deleteProduct", err);
  }
}

const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!z.string().uuid().safeParse(orderId).success) {
      return errorResult("Invalid order id.");
    }
    const parsedStatus = orderStatusSchema.safeParse(status);
    if (!parsedStatus.success) {
      return errorResult("Invalid order status.");
    }

    const admin = createSupabaseAdminClient();
    if (!admin) return errorResult("Supabase is not configured on the server.");

    const { error } = await admin
      .from("orders")
      .update({ status: parsedStatus.data })
      .eq("id", orderId);
    if (error) return errorResult(error.message);

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true, data: null };
  } catch (err) {
    return unknownError("updateOrderStatus", err);
  }
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * Upload a product image to the `product-images` bucket and return its
 * public URL. Service-role write; mime/size validated server-side.
 */
export async function uploadProductImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAdmin();

    const admin = createSupabaseAdminClient();
    if (!admin) return errorResult("Supabase is not configured on the server.");

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return errorResult("Choose an image file to upload.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResult("Image must be 5 MB or smaller.", { file: "Too large." });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return errorResult("Upload a JPEG, PNG, WebP, or AVIF image.", {
        file: "Unsupported file type.",
      });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("product-images")
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) return errorResult(uploadError.message);

    const { data } = admin.storage.from("product-images").getPublicUrl(path);
    return { ok: true, data: { url: data.publicUrl } };
  } catch (err) {
    return unknownError("uploadProductImage", err);
  }
}
