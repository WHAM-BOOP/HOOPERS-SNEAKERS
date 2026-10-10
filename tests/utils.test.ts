import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  clamp,
  formatDate,
  formatMoney,
  slugify,
} from "@/lib/utils";

describe("formatMoney", () => {
  it("formats integer cents as USD", () => {
    expect(formatMoney(12900)).toBe("$129.00");
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(5)).toBe("$0.05");
    expect(formatMoney(123456789)).toBe("$1,234,567.89");
  });

  it("throws on non-finite input instead of rendering NaN to users", () => {
    expect(() => formatMoney(Number.NaN)).toThrow(TypeError);
    expect(() => formatMoney(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});

describe("slugify", () => {
  it("produces url-safe slugs", () => {
    expect(slugify("Air Zoom Pegasus 41")).toBe("air-zoom-pegasus-41");
    expect(slugify("  Uppercase & Specials!  ")).toBe("uppercase-specials");
    expect(slugify("Café Runner")).toBe("cafe-runner");
  });

  it("never returns leading/trailing dashes", () => {
    expect(slugify("---hello---")).toBe("hello");
    expect(slugify("!!!")).toBe("");
  });
});

describe("clamp", () => {
  it("bounds values", () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-3, 1, 10)).toBe(1);
    expect(clamp(99, 1, 10)).toBe(10);
  });
});

describe("formatDate", () => {
  it("formats ISO dates in UTC", () => {
    expect(formatDate("2026-10-10T12:00:00Z")).toBe("Oct 10, 2026");
  });
});

describe("absoluteUrl", () => {
  it("joins base and path", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://hoopers.example";
    try {
      expect(absoluteUrl("/products")).toBe("https://hoopers.example/products");
      expect(absoluteUrl("products")).toBe("https://hoopers.example/products");
      expect(absoluteUrl()).toBe("https://hoopers.example/");
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = prev;
    }
  });
});
