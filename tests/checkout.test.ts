import { describe, expect, it } from "vitest";
import {
  checkoutSchema,
  fieldErrorsFromZod,
  FREE_SHIPPING_THRESHOLD_CENTS,
  MAX_ITEM_QUANTITY,
  SHIPPING_FLAT_CENTS,
  shippingCentsFor,
} from "@/lib/orders/checkout";

const validCustomer = {
  fullName: "Amina Wanjiru",
  email: "amina@example.com",
  phone: "+1 555 010 2233",
  addressLine1: "123 Court Side Ave",
  addressLine2: "",
  city: "Brooklyn",
  state: "NY",
  postalCode: "11201",
  country: "us",
  note: "",
};

const validItems = [
  { productId: "2b6a4c8e-1f3d-4a5b-9c7d-8e9f0a1b2c3d", size: "10.5", quantity: 1 },
];

describe("shipping policy", () => {
  it("charges flat rate below the free-shipping threshold", () => {
    expect(shippingCentsFor(0)).toBe(SHIPPING_FLAT_CENTS);
    expect(shippingCentsFor(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(
      SHIPPING_FLAT_CENTS,
    );
  });

  it("is free at or above the threshold", () => {
    expect(shippingCentsFor(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0);
    expect(shippingCentsFor(FREE_SHIPPING_THRESHOLD_CENTS + 1)).toBe(0);
  });
});

describe("checkoutSchema", () => {
  it("accepts a valid order and uppercases the country", () => {
    const result = checkoutSchema.safeParse({
      customer: validCustomer,
      items: validItems,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customer.country).toBe("US");
    }
  });

  it("rejects an empty cart", () => {
    const result = checkoutSchema.safeParse({
      customer: validCustomer,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects bad email, short name, and invalid phone", () => {
    const result = checkoutSchema.safeParse({
      customer: {
        ...validCustomer,
        fullName: "A",
        email: "not-an-email",
        phone: "call me maybe",
      },
      items: validItems,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrorsFromZod(result.error);
      expect(errors["customer.fullName"]).toBeTruthy();
      expect(errors["customer.email"]).toBeTruthy();
      expect(errors["customer.phone"]).toBeTruthy();
    }
  });

  it("enforces quantity bounds", () => {
    const tooMany = checkoutSchema.safeParse({
      customer: validCustomer,
      items: [{ ...validItems[0], quantity: MAX_ITEM_QUANTITY + 1 }],
    });
    const zero = checkoutSchema.safeParse({
      customer: validCustomer,
      items: [{ ...validItems[0], quantity: 0 }],
    });
    expect(tooMany.success).toBe(false);
    expect(zero.success).toBe(false);
  });

  it("rejects malformed product ids and missing sizes", () => {
    const result = checkoutSchema.safeParse({
      customer: validCustomer,
      items: [{ productId: "hello", size: "", quantity: 2 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrorsFromZod(result.error);
      expect(errors["items.0.productId"]).toBeTruthy();
      expect(errors["items.0.size"]).toBeTruthy();
    }
  });

  it("does not accept price fields (they are not part of the schema shape)", () => {
    // Stray client-side price keys must not map to anything the server trusts.
    const result = checkoutSchema.safeParse({
      customer: { ...validCustomer, totalCents: 1 },
      items: [{ ...validItems[0], unitPriceCents: 1 }],
    });
    // zod strips unknown keys by default — nothing price-related survives.
    if (result.success) {
      expect(
        (result.data.customer as Record<string, unknown>).totalCents,
      ).toBeUndefined();
      expect(
        (result.data.items[0] as Record<string, unknown>).unitPriceCents,
      ).toBeUndefined();
    } else {
      // Either stripping or rejecting is acceptable; trusting it is not.
      expect(result.success).toBe(false);
    }
  });
});

describe("fieldErrorsFromZod", () => {
  it("flattens issues to field -> first message", () => {
    const result = checkoutSchema.safeParse({ customer: {}, items: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrorsFromZod(result.error);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
      for (const key of Object.keys(errors)) {
        expect(typeof errors[key]).toBe("string");
      }
    }
  });
});
