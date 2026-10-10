"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo, NAV_ITEMS } from "@/components/layout/brand";
import { useCart } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

export type HeaderUser = {
  email: string;
  displayName: string;
  isAdmin: boolean;
};

export function Header({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const { itemCount, hydrated } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever navigation happens.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "nav-link",
                        active && "text-accent",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {user?.isAdmin ? (
            <Link
              href="/admin"
              className="hidden rounded-sm bg-ink px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-paper hover:bg-ink-soft sm:inline-block"
            >
              Admin
            </Link>
          ) : null}

          {user ? (
            <Link
              href="/account"
              className="hidden items-center gap-2 rounded-sm px-3 py-1.5 text-[13.5px] font-medium hover:bg-ink/5 sm:inline-flex"
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper uppercase"
              >
                {user.displayName.slice(0, 2)}
              </span>
              <span className="max-w-32 truncate">{user.displayName}</span>
            </Link>
          ) : (
            <Link
              href="/auth/sign-in"
              className="hidden text-[13.5px] font-medium text-ink/80 hover:text-accent sm:inline-block"
            >
              Sign in
            </Link>
          )}

          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 rounded-sm px-3 py-2 text-[13.5px] font-semibold hover:bg-ink/5"
            aria-label={
              hydrated && itemCount > 0
                ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`
                : "Cart"
            }
          >
            <CartIcon />
            <span aria-hidden="true" className="hidden sm:inline">
              Cart
            </span>
            {hydrated && itemCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white"
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            className="rounded-sm p-2 hover:bg-ink/5 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="sr-only">
              {mobileOpen ? "Close menu" : "Open menu"}
            </span>
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!mobileOpen}
        className="border-t border-line bg-paper lg:hidden"
      >
        <nav aria-label="Mobile" className="container-page py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-sm px-2 py-2.5 text-[15px] font-medium hover:bg-ink/5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              {user ? (
                <div className="space-y-1 border-t border-line pt-3">
                  <Link
                    href="/account"
                    className="block rounded-sm px-2 py-2.5 text-[15px] font-medium hover:bg-ink/5"
                  >
                    My account
                  </Link>
                  {user.isAdmin ? (
                    <Link
                      href="/admin"
                      className="block rounded-sm px-2 py-2.5 text-[15px] font-medium hover:bg-ink/5"
                    >
                      Admin dashboard
                    </Link>
                  ) : null}
                </div>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="btn-primary w-full"
                >
                  Sign in
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
      <path d="M3 3.5h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6.2" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M5 5l14 14" />
          <path d="M19 5L5 19" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}
