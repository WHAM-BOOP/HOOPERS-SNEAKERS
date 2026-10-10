import { describe, expect, it } from "vitest";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  demoBrands,
  demoSizes,
} from "@/lib/demo/catalog";

describe("demo catalog integrity", () => {
  it("has unique product ids and slugs", () => {
    const ids = DEMO_PRODUCTS.map((p) => p.id);
    const slugs = DEMO_PRODUCTS.map((p) => p.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses well-formed slugs", () => {
    for (const product of DEMO_PRODUCTS) {
      expect(product.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
    for (const category of DEMO_CATEGORIES) {
      expect(category.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("has valid prices, stock, and sizes", () => {
    for (const product of DEMO_PRODUCTS) {
      expect(product.price_cents).toBeGreaterThan(0);
      expect(Number.isInteger(product.price_cents)).toBe(true);
      expect(product.variants.length).toBeGreaterThan(0);
      for (const variant of product.variants) {
        expect(variant.size.length).toBeGreaterThan(0);
        expect(variant.stock).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("links every product to a real category", () => {
    const categoryIds = new Set(DEMO_CATEGORIES.map((c) => c.id));
    for (const product of DEMO_PRODUCTS) {
      expect(product.category_id).toBeTruthy();
      expect(categoryIds.has(product.category_id as string)).toBe(true);
      expect(product.category).not.toBeNull();
    }
  });

  it("exposes brands and in-stock sizes for filters", () => {
    expect(demoBrands().length).toBeGreaterThan(1);
    const sizes = demoSizes();
    expect(sizes.length).toBeGreaterThan(3);
    // numeric ordering
    const numeric = sizes.map(Number);
    expect([...numeric].sort((a, b) => a - b)).toEqual(numeric);
  });
});
