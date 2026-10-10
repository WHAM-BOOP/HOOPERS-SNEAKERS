import type { MetadataRoute } from "next";
import { getEnvStatus } from "@/lib/env";
import { getProducts, getCategories } from "@/lib/products/queries";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    {
      url: absoluteUrl("/products"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/collections"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: absoluteUrl("/size-guide"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const status = getEnvStatus();
  if (!status.supabaseReady) return staticRoutes;

  const [products, categories] = await Promise.all([
    getProducts({ sort: "newest", page: 1 }),
    getCategories(),
  ]);

  const productUrls: MetadataRoute.Sitemap =
    products.ok
      ? products.data.products.map((product) => ({
          url: absoluteUrl(`/products/${product.slug}`),
          changeFrequency: "weekly",
          priority: 0.7,
        }))
      : [];

  const categoryUrls: MetadataRoute.Sitemap =
    categories.ok
      ? categories.data.map((category) => ({
          url: absoluteUrl(`/collections/${category.slug}`),
          changeFrequency: "weekly",
          priority: 0.7,
        }))
      : [];

  return [...staticRoutes, ...productUrls, ...categoryUrls];
}

export const revalidate = 3600;
