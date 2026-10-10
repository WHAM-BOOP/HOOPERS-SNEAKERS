import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Numeric pagination with real page links (works without JS, SEO-friendly).
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  query,
  className,
}: {
  page: number;
  totalPages: number;
  /** Path that accepts `?page=` such as `/products` or `/admin/orders`. */
  basePath: string;
  /** Existing query params to preserve (excluding `page`). */
  query?: Record<string, string | undefined>;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(target: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value) params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const from = Math.max(1, page - 2);
  const to = Math.min(totalPages, page + 2);
  const pages: number[] = [];
  for (let p = from; p <= to; p += 1) pages.push(p);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5", className)}>
      {page > 1 ? (
        <Link
          rel="prev"
          href={hrefFor(page - 1)}
          className="rounded-sm border border-line-strong px-3 py-2 text-sm font-medium hover:border-ink"
        >
          ← Prev
        </Link>
      ) : null}

      {from > 1 ? (
        <>
          <PageLink n={1} href={hrefFor(1)} current={page === 1} />
          {from > 2 ? <span className="px-1 text-muted">…</span> : null}
        </>
      ) : null}

      {pages.map((n) => (
        <PageLink key={n} n={n} href={hrefFor(n)} current={n === page} />
      ))}

      {to < totalPages ? (
        <>
          {to < totalPages - 1 ? <span className="px-1 text-muted">…</span> : null}
          <PageLink n={totalPages} href={hrefFor(totalPages)} current={page === totalPages} />
        </>
      ) : null}

      {page < totalPages ? (
        <Link
          rel="next"
          href={hrefFor(page + 1)}
          className="rounded-sm border border-line-strong px-3 py-2 text-sm font-medium hover:border-ink"
        >
          Next →
        </Link>
      ) : null}
    </nav>
  );
}

function PageLink({ n, href, current }: { n: number; href: string; current: boolean }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "min-w-10 rounded-sm border px-3 py-2 text-center text-sm font-medium",
        current
          ? "border-ink bg-ink text-paper"
          : "border-line-strong hover:border-ink",
      )}
    >
      {n}
    </Link>
  );
}
