import Link from "next/link";

const NAV_ITEMS = [
  { href: "/products", label: "Shop All" },
  { href: "/collections", label: "Collections" },
  { href: "/size-guide", label: "Size Guide" },
  { href: "/about", label: "About" },
] as const;

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="HOOPERS SNEAKERS — home"
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-xs bg-accent text-[13px] font-black text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        HS
      </span>
      <span
        className={`text-[15px] font-black uppercase tracking-[0.14em] ${
          inverted ? "text-paper" : "text-ink"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Hoopers
        <span className={inverted ? "text-paper/60" : "text-muted"}> Sneakers</span>
      </span>
    </Link>
  );
}

export function FooterNavLinks({ inverted = false }: { inverted?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {NAV_ITEMS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`text-[14px] transition-colors ${
              inverted ? "text-paper/70 hover:text-accent" : "text-muted hover:text-accent"
            }`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export { NAV_ITEMS };
