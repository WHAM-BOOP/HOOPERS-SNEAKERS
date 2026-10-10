/**
 * Maps database / RPC failures to safe client-facing messages. Never leak
 * raw database error text to end users.
 */
export type OrderError = {
  status: number;
  message: string;
  code: string;
};

export function errorMessageFromDb(message: string): OrderError {
  if (message.includes("INSUFFICIENT_STOCK")) {
    return {
      status: 409,
      code: "INSUFFICIENT_STOCK",
      message:
        "An item in your cart no longer has enough stock. Please review your cart and try again.",
    };
  }
  if (message.includes("SIZE_UNAVAILABLE")) {
    return {
      status: 409,
      code: "SIZE_UNAVAILABLE",
      message: "A selected size is no longer available. Please review your cart.",
    };
  }
  if (message.includes("PRODUCT_UNAVAILABLE")) {
    return {
      status: 409,
      code: "PRODUCT_UNAVAILABLE",
      message:
        "A product in your cart is no longer available. Please review your cart.",
    };
  }
  return {
    status: 500,
    code: "ORDER_FAILED",
    message: "We could not place your order. Please try again.",
  };
}
