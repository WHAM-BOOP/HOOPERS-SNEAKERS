import { z } from "zod";

/**
 * Shared checkout validation (client UX + server API). The server remains the
 * authority: these schemas validate *shape*; prices/stock/totals are always
 * recomputed from the database.
 */

export const SHIPPING_FLAT_CENTS = 1200;
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000;
export const MAX_ITEM_QUANTITY = 10;

export function shippingCentsFor(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
}

export const checkoutItemSchema = z.object({
  productId: z.string().uuid("Invalid product."),
  size: z.string().trim().min(1, "Select a size.").max(10),
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(MAX_ITEM_QUANTITY, `Quantity cannot exceed ${MAX_ITEM_QUANTITY}.`),
});

export const checkoutCustomerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters).")
    .max(120, "Full name is too long."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Email is too long."),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number.")
    .max(30, "Phone number is too long.")
    .regex(/^[0-9+()\-\s.]+$/, "Phone number contains invalid characters."),
  addressLine1: z
    .string()
    .trim()
    .min(3, "Enter your street address.")
    .max(200, "Address is too long."),
  addressLine2: z
    .string()
    .trim()
    .max(200, "Address is too long.")
    .optional()
    .or(z.literal("")),
  city: z.string().trim().min(1, "Enter your city.").max(100, "City is too long."),
  state: z.string().trim().min(1, "Enter your state.").max(100, "State is too long."),
  postalCode: z
    .string()
    .trim()
    .min(1, "Enter your ZIP / postal code.")
    .max(20, "Postal code is too long."),
  country: z
    .string()
    .trim()
    .length(2, "Use a 2-letter country code.")
    .toUpperCase()
    .default("US"),
  note: z.string().trim().max(1000, "Note is too long.").optional().or(z.literal("")),
});

export const checkoutSchema = z.object({
  customer: checkoutCustomerSchema,
  items: z
    .array(checkoutItemSchema)
    .min(1, "Your cart is empty.")
    .max(50, "Too many items in one order."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutCustomer = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutItem = z.infer<typeof checkoutItemSchema>;

/** Zod errors flattened to `fieldName -> message` for form display. */
export function fieldErrorsFromZod(
  error: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
