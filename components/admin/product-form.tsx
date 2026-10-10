"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
} from "@/app/admin/actions";
import { Notice } from "@/components/ui/notice";
import { slugify } from "@/lib/utils";

type CategoryOption = { id: string; name: string };

export type ProductFormValues = {
  name: string;
  slug: string;
  brand: string;
  categoryId: string | null;
  shortDescription: string;
  description: string;
  imageUrl: string;
  priceDollars: string;
  featured: boolean;
  active: boolean;
  variants: { size: string; stock: number }[];
  images: { url: string; alt: string }[];
};

type ServerProductInput = {
  name: string;
  slug: string;
  brand: string;
  categoryId: string | null;
  shortDescription: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  featured: boolean;
  active: boolean;
  variants: { size: string; stock: number }[];
  images: { url: string; alt: string }[];
};

function toServerInput(values: ProductFormValues): ServerProductInput {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    brand: values.brand.trim(),
    categoryId: values.categoryId,
    shortDescription: values.shortDescription.trim(),
    description: values.description.trim(),
    imageUrl: values.imageUrl.trim(),
    // Dollars in the form → integer cents for the API. The server re-validates.
    priceCents: Math.round(Number(values.priceDollars) * 100),
    featured: values.featured,
    active: values.active,
    variants: values.variants.map((v) => ({
      size: v.size.trim(),
      stock: Math.max(0, Math.trunc(v.stock)),
    })),
    images: values.images
      .filter((img) => img.url.trim().length > 0)
      .map((img) => ({ url: img.url.trim(), alt: img.alt.trim() })),
  };
}

export function ProductForm({
  mode,
  productId,
  categories,
  initialValues,
}: {
  mode: "create" | "edit";
  productId?: string;
  categories: CategoryOption[];
  initialValues: ProductFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFormSuccess(null);
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setFormError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadProductImage(formData);
    setUploading(false);

    if (result.ok) {
      set("imageUrl", result.data.url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setFormError(result.message);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const priceNumber = Number(values.priceDollars);
    if (!values.name.trim() || !values.brand.trim()) {
      setFormError("Name and brand are required.");
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setFieldErrors({ priceDollars: "Enter a valid price." });
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    const payload = toServerInput(values);
    const result =
      mode === "create" && productId === undefined
        ? await createProduct(payload)
        : await updateProduct(productId as string, payload);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.message);
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      return;
    }

    setFormSuccess(
      mode === "create"
        ? "Product created."
        : "Product updated.",
    );
    if (mode === "create") {
      router.push(`/admin/products/${result.data.id}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {formError ? (
        <Notice tone="danger" title="Could not save product">
          {formError}
        </Notice>
      ) : null}
      {formSuccess ? (
        <Notice tone="success" title="Saved">
          {formSuccess}
        </Notice>
      ) : null}

      <section aria-labelledby="basics-heading" className="rounded-md border border-line bg-surface p-6">
        <h2 id="basics-heading" className="text-[15px] font-bold">
          Basics
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-name" className="label">Product name *</label>
            <input
              id="pf-name"
              className="input"
              value={values.name}
              onChange={(e) => {
                const name = e.target.value;
                set("name", name);
                if (!slugTouched) set("slug", slugify(name));
              }}
              required
            />
            {fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
          </div>
          <div>
            <label htmlFor="pf-slug" className="label">URL slug *</label>
            <input
              id="pf-slug"
              className="input"
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              placeholder="auto-from-name"
            />
            {fieldErrors.slug ? <p className="field-error">{fieldErrors.slug}</p> : (
              <p className="field-hint">Lowercase letters, numbers, dashes.</p>
            )}
          </div>
          <div>
            <label htmlFor="pf-brand" className="label">Brand *</label>
            <input
              id="pf-brand"
              className="input"
              value={values.brand}
              onChange={(e) => set("brand", e.target.value)}
              required
            />
            {fieldErrors.brand ? <p className="field-error">{fieldErrors.brand}</p> : null}
          </div>
          <div>
            <label htmlFor="pf-category" className="label">Category</label>
            <select
              id="pf-category"
              className="input"
              value={values.categoryId ?? ""}
              onChange={(e) => set("categoryId", e.target.value || null)}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pf-price" className="label">Price (USD) *</label>
            <input
              id="pf-price"
              type="number"
              min={0}
              step={0.01}
              className="input"
              value={values.priceDollars}
              onChange={(e) => set("priceDollars", e.target.value)}
              required
            />
            {fieldErrors.priceCents ? (
              <p className="field-error">{fieldErrors.priceCents}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="pf-image-upload" className="label">
              Or upload an image
            </label>
            <div className="flex items-center gap-3">
              <input
                id="pf-image-upload"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="input"
              />
              <button
                type="button"
                className="btn-outline shrink-0"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
            <p className="field-hint">JPEG/PNG/WebP/AVIF, max 5 MB.</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-image-url" className="label">Main image URL</label>
            <input
              id="pf-image-url"
              type="url"
              className="input"
              value={values.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://…"
            />
            {fieldErrors.imageUrl ? (
              <p className="field-error">{fieldErrors.imageUrl}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 text-[14px] font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--color-accent)]"
              checked={values.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            Featured on the home page
          </label>
          <label className="flex items-center gap-2.5 text-[14px] font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--color-accent)]"
              checked={values.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            Active (visible in the store)
          </label>
        </div>
      </section>

      <section aria-labelledby="desc-heading" className="rounded-md border border-line bg-surface p-6">
        <h2 id="desc-heading" className="text-[15px] font-bold">
          Descriptions
        </h2>
        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="pf-short" className="label">
              Short description (shown on product card)
            </label>
            <textarea
              id="pf-short"
              rows={2}
              maxLength={400}
              className="input"
              value={values.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="pf-desc" className="label">Full description</label>
            <textarea
              id="pf-desc"
              rows={6}
              maxLength={8000}
              className="input"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="variants-heading" className="rounded-md border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 id="variants-heading" className="text-[15px] font-bold">
            Sizes & stock *
          </h2>
          <button
            type="button"
            className="btn-outline px-3 py-1.5 text-[12.5px]"
            onClick={() =>
              set("variants", [...values.variants, { size: "", stock: 0 }])
            }
          >
            + Add size
          </button>
        </div>

        {fieldErrors.variants ? (
          <p className="field-error">{fieldErrors.variants}</p>
        ) : null}

        <div className="mt-4 space-y-3">
          {values.variants.length === 0 ? (
            <p className="text-[13px] text-muted">
              No sizes yet — add at least one size with its stock level.
            </p>
          ) : null}
          {values.variants.map((variant, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor={`pf-size-${index}`} className="label">
                  Size (US)
                </label>
                <input
                  id={`pf-size-${index}`}
                  className="input"
                  value={variant.size}
                  placeholder="10.5"
                  onChange={(e) =>
                    set(
                      "variants",
                      values.variants.map((v, i) =>
                        i === index ? { ...v, size: e.target.value } : v,
                      ),
                    )
                  }
                />
              </div>
              <div className="flex-1">
                <label htmlFor={`pf-stock-${index}`} className="label">
                  Stock
                </label>
                <input
                  id={`pf-stock-${index}`}
                  type="number"
                  min={0}
                  className="input"
                  value={variant.stock}
                  onChange={(e) =>
                    set(
                      "variants",
                      values.variants.map((v, i) =>
                        i === index
                          ? { ...v, stock: Number(e.target.value) || 0 }
                          : v,
                      ),
                    )
                  }
                />
              </div>
              <button
                type="button"
                className="btn-danger px-3 py-2.5"
                aria-label={`Remove size ${variant.size || index + 1}`}
                onClick={() =>
                  set(
                    "variants",
                    values.variants.filter((_, i) => i !== index),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="gallery-heading" className="rounded-md border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 id="gallery-heading" className="text-[15px] font-bold">
            Gallery images
          </h2>
          <button
            type="button"
            className="btn-outline px-3 py-1.5 text-[12.5px]"
            onClick={() => set("images", [...values.images, { url: "", alt: "" }])}
          >
            + Add image
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {values.images.length === 0 ? (
            <p className="text-[13px] text-muted">
              Optional — extra images shown on the product page.
            </p>
          ) : null}
          {values.images.map((image, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-[2]">
                <label htmlFor={`pf-img-url-${index}`} className="label">
                  Image URL
                </label>
                <input
                  id={`pf-img-url-${index}`}
                  type="url"
                  className="input"
                  value={image.url}
                  placeholder="https://…"
                  onChange={(e) =>
                    set(
                      "images",
                      values.images.map((img, i) =>
                        i === index ? { ...img, url: e.target.value } : img,
                      ),
                    )
                  }
                />
              </div>
              <div className="flex-1">
                <label htmlFor={`pf-img-alt-${index}`} className="label">
                  Alt text
                </label>
                <input
                  id={`pf-img-alt-${index}`}
                  className="input"
                  value={image.alt}
                  onChange={(e) =>
                    set(
                      "images",
                      values.images.map((img, i) =>
                        i === index ? { ...img, alt: e.target.value } : img,
                      ),
                    )
                  }
                />
              </div>
              <button
                type="button"
                className="btn-danger px-3 py-2.5"
                aria-label={`Remove gallery image ${index + 1}`}
                onClick={() =>
                  set(
                    "images",
                    values.images.filter((_, i) => i !== index),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary px-8 py-3" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        <button
          type="button"
          className="btn-outline px-8 py-3"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function emptyProductFormValues(): ProductFormValues {
  return {
    name: "",
    slug: "",
    brand: "",
    categoryId: null,
    shortDescription: "",
    description: "",
    imageUrl: "",
    priceDollars: "",
    featured: false,
    active: true,
    variants: [{ size: "", stock: 0 }],
    images: [],
  };
}
