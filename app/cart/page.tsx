"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CART_MAX_QUANTITY, useCart, type CartItem } from "@/lib/cart/cart-context";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS } from "@/lib/orders/checkout";
import { formatMoney } from "@/lib/utils";

/**
 * Cart page (client). Prices shown here are display snapshots; the server
 * recomputes authoritative totals at checkout.
 */
export default function CartPage() {
  const router = useRouter();
  const { items, subtotalCents, updateQuantity, removeItem, hydrated } = useCart();

  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents,
  );

  return (
    <div className="container-page py-10">
      <header>
        <p className="eyebrow">Your cart</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Shopping cart</h1>
      </header>

      {!hydrated ? (
        <div
          className="mt-8 space-y-4"
          role="status"
          aria-label="Loading your cart"
        >
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-28 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed border-line-strong px-6 py-16 text-center">
          <h2 className="text-xl font-bold">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-muted">
            Nothing here yet. Find a pair that fits your game — pay only when it
            arrives.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/products" variant="primary">
              Shop all shoes
            </Button>
            <Button href="/collections" variant="outline">
              Browse collections
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <section aria-label="Cart items">
            <ul className="divide-y divide-line rounded-md border border-line bg-surface">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}`}>
                  <CartLine
                    item={item}
                    onQuantity={(qty) =>
                      updateQuantity(item.productId, item.size, qty)
                    }
                    onRemove={() => removeItem(item.productId, item.size)}
                  />
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-sm border border-line bg-accent-soft px-4 py-3 text-[13.5px] text-ink">
              {remainingForFreeShipping > 0 ? (
                <p>
                  Add <strong>{formatMoney(remainingForFreeShipping)}</strong>{" "}
                  more to unlock <strong>free shipping</strong> (otherwise{" "}
                  {formatMoney(SHIPPING_FLAT_CENTS)} flat).
                </p>
              ) : (
                <p>
                  <strong>Free shipping unlocked.</strong> Nice.
                </p>
              )}
            </div>
          </section>

          <aside
            aria-label="Order summary"
            className="h-fit rounded-md border border-line bg-surface p-6"
          >
            <h2 className="text-lg font-bold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-[14.5px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold">{formatMoney(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-semibold">
                  {subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
                    ? "Free"
                    : formatMoney(SHIPPING_FLAT_CENTS)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-[16px]">
                <dt className="font-bold">Estimated total</dt>
                <dd className="font-bold">
                  {formatMoney(
                    subtotalCents +
                      (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
                        ? 0
                        : SHIPPING_FLAT_CENTS),
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[12px] text-muted">
              Final totals are confirmed on the server at checkout. You pay on
              delivery.
            </p>

            <Button
              variant="primary"
              size="lg"
              className="mt-5 w-full"
              onClick={() => router.push("/checkout")}
            >
              Proceed to checkout
            </Button>
            <Link
              href="/products"
              className="mt-3 block text-center text-[13.5px] font-medium text-muted hover:text-accent"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: CartItem;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-4 p-4">
      <Link
        href={`/products/${item.slug}`}
        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm border border-line bg-paper"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center text-lg font-black text-ink/15"
            style={{ fontFamily: "var(--font-display)" }}
          >
            HS
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link
              href={`/products/${item.slug}`}
              className="text-[15px] font-semibold hover:text-accent"
            >
              {item.name}
            </Link>
            <p className="mt-0.5 text-[13px] text-muted">Size {item.size}</p>
          </div>
          <p className="text-[15px] font-semibold">
            {formatMoney(item.unitPriceCents * item.quantity)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-[13px]">
            <span className="text-muted">Qty</span>
            <select
              aria-label={`Quantity for ${item.name}, size ${item.size}`}
              className="rounded-sm border border-line-strong bg-surface px-2 py-1.5"
              value={item.quantity}
              onChange={(e) => onQuantity(Number(e.target.value))}
            >
              {Array.from({ length: CART_MAX_QUANTITY }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>

          <button
            type="button"
            onClick={onRemove}
            className="text-[13px] font-medium text-danger hover:underline"
            aria-label={`Remove ${item.name}, size ${item.size} from cart`}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
