"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Cart state lives in the browser (localStorage) so it works for signed-out
 * shoppers and never round-trips secrets to the server. Every price shown
 * from the cart is a *display snapshot only* — order totals are recomputed
 * server-side from the database at checkout (`POST /api/orders`).
 */

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  size: string;
  quantity: number;
  /** Display snapshot in cents; authoritative value comes from the server. */
  unitPriceCents: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  clearCart: () => void;
  hydrated: boolean;
};

const STORAGE_KEY = "hoopers.cart.v1";
const MAX_QUANTITY = 10;

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.size === "string" &&
    typeof item.quantity === "number" &&
    typeof item.unitPriceCents === "number"
  );
}

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem).map((item) => ({
      ...item,
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
      quantity: Math.min(Math.max(1, Math.trunc(item.quantity)), MAX_QUANTITY),
    }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked (private mode) — cart still works in-memory.
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const qty = Math.min(Math.max(1, Math.trunc(quantity)), MAX_QUANTITY);
        const existing = prev.find(
          (i) => i.productId === item.productId && i.size === item.size,
        );
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId && i.size === item.size
              ? { ...i, quantity: Math.min(i.quantity + qty, MAX_QUANTITY) }
              : i,
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (productId: string, size: string, quantity: number) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => !(i.productId === productId && i.size === size))
          : prev.map((i) =>
              i.productId === productId && i.size === size
                ? { ...i, quantity: Math.min(Math.max(1, Math.trunc(quantity)), MAX_QUANTITY) }
                : i,
            ),
      );
    },
    [],
  );

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.size === size)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalCents = items.reduce(
      (sum, i) => sum + i.quantity * i.unitPriceCents,
      0,
    );
    return {
      items,
      itemCount,
      subtotalCents,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      hydrated,
    };
  }, [items, addItem, updateQuantity, removeItem, clearCart, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}

export { MAX_QUANTITY as CART_MAX_QUANTITY };
