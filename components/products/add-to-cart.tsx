"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { CART_MAX_QUANTITY, useCart } from "@/lib/cart/cart-context";
import { formatMoney } from "@/lib/utils";

type Variant = { id: string; size: string; stock: number };

export type AddToCartProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  priceCents: number;
};

/**
 * Size picker (radio group) + quantity + add-to-cart. Fully keyboard
 * operable; requires an in-stock size before the button enables.
 */
export function AddToCart({
  product,
  variants,
}: {
  product: AddToCartProduct;
  variants: Variant[];
}) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<"added" | null>(null);

  const inStock = variants.filter((v) => v.stock > 0);
  const soldOut = inStock.length === 0;
  const selected = variants.find((v) => v.size === selectedSize) ?? null;
  const maxQty = selected ? Math.min(selected.stock, CART_MAX_QUANTITY) : CART_MAX_QUANTITY;

  function handleAdd() {
    if (!selected || selected.stock <= 0) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.imageUrl,
        size: selected.size,
        unitPriceCents: product.priceCents,
      },
      quantity,
    );
    setFeedback("added");
  }

  return (
    <div className="mt-8">
      {soldOut ? (
        <Notice tone="warning" title="Sold out">
          This product is currently out of stock in every size. Check back
          soon — or{" "}
          <Link href="/contact" className="font-semibold underline">
            contact us
          </Link>{" "}
          to ask about restocks.
        </Notice>
      ) : (
        <div>
          <fieldset>
            <legend className="label">Select size (US)</legend>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const inStockNow = variant.stock > 0;
                const checked = selectedSize === variant.size;
                return (
                  <label
                    key={variant.id}
                    className={[
                      "relative flex min-w-14 cursor-pointer items-center justify-center rounded-sm border px-3.5 py-2.5 text-[14px] font-semibold transition-colors",
                      inStockNow
                        ? checked
                          ? "border-ink bg-ink text-paper"
                          : "border-line-strong hover:border-ink"
                        : "cursor-not-allowed border-line text-muted/50 line-through",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="size"
                      value={variant.size}
                      checked={checked}
                      disabled={!inStockNow}
                      onChange={() => {
                        setSelectedSize(variant.size);
                        setFeedback(null);
                        setQuantity(1);
                      }}
                      className="sr-only"
                    />
                    {variant.size}
                    {inStockNow && variant.stock <= 2 ? (
                      <span className="sr-only">
                        (only {variant.stock} left)
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
            {selected && selected.stock <= 2 ? (
              <p className="field-hint text-warning">
                Only {selected.stock} left in size {selected.size}.
              </p>
            ) : (
              <p className="field-hint">
                Sizes run true to size — see the{" "}
                <Link href="/size-guide" className="underline">
                  size guide
                </Link>
                .
              </p>
            )}
          </fieldset>

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="quantity" className="label">
                Quantity
              </label>
              <select
                id="quantity"
                className="input w-24"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              >
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="flex-1 sm:flex-none"
              disabled={!selected}
              onClick={handleAdd}
            >
              {selected
                ? `Add to cart — ${formatMoney(product.priceCents * quantity)}`
                : "Select a size"}
            </Button>
          </div>

          {feedback === "added" && selected ? (
            <div className="mt-4">
              <Notice tone="success" title="Added to cart">
                {product.name} · size {selected.size} · qty {quantity}.{" "}
                <Link href="/cart" className="font-semibold underline">
                  View cart
                </Link>{" "}
                or{" "}
                <Link href="/checkout" className="font-semibold underline">
                  check out
                </Link>
                .
              </Notice>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
