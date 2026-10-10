import { describe, expect, it } from "vitest";
import { errorMessageFromDb } from "@/lib/orders/errors";
import { contactSchema } from "@/lib/orders/contact";

describe("errorMessageFromDb", () => {
  it("maps stock failures to 409 with a safe message", () => {
    const result = errorMessageFromDb("P0001: INSUFFICIENT_STOCK");
    expect(result.status).toBe(409);
    expect(result.code).toBe("INSUFFICIENT_STOCK");
    expect(result.message).not.toContain("P0001");
  });

  it("maps size and product failures to 409", () => {
    expect(errorMessageFromDb("SIZE_UNAVAILABLE").status).toBe(409);
    expect(errorMessageFromDb("PRODUCT_UNAVAILABLE").status).toBe(409);
  });

  it("never leaks raw database text in the fallback", () => {
    const result = errorMessageFromDb(
      'duplicate key value violates unique constraint "orders_order_number_key"',
    );
    expect(result.status).toBe(500);
    expect(result.code).toBe("ORDER_FAILED");
    expect(result.message).not.toContain("duplicate key");
  });
});

describe("contactSchema", () => {
  it("accepts a valid message", () => {
    const result = contactSchema.safeParse({
      name: "Jordan Doe",
      email: "jordan@example.com",
      phone: "",
      subject: "Sizing question",
      message: "Do these run true to size for wide feet?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty or too-short content", () => {
    const result = contactSchema.safeParse({
      name: "",
      email: "bad",
      subject: "",
      message: "hi",
    });
    expect(result.success).toBe(false);
  });

  it("rejects oversized messages", () => {
    const result = contactSchema.safeParse({
      name: "Jordan Doe",
      email: "jordan@example.com",
      subject: "Hello",
      message: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
