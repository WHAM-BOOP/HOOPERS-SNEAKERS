import Link from "next/link";
import { Logo, FooterNavLinks } from "@/components/layout/brand";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-line bg-ink text-paper">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="max-w-sm">
          <Logo inverted />
          <p className="mt-4 text-[14px] leading-relaxed text-paper/70">
            Premium basketball footwear for hoopers, gymnasts, designers, and
            everyone who moves. Court-tested picks, honest sizing, pay on
            delivery.
          </p>
        </div>

        <nav aria-label="Footer shop">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-paper/50">
            Shop
          </h2>
          <div className="mt-4">
            <FooterNavLinks inverted />
          </div>
        </nav>

        <nav aria-label="Footer support">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-paper/50">
            Support
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/contact" className="text-[14px] text-paper/70 hover:text-accent">
                Contact us
              </Link>
            </li>
            <li>
              <Link href="/orders/lookup" className="text-[14px] text-paper/70 hover:text-accent">
                Track an order
              </Link>
            </li>
            <li>
              <Link href="/size-guide" className="text-[14px] text-paper/70 hover:text-accent">
                Size guide
              </Link>
            </li>
            <li>
              <Link href="/setup" className="text-[14px] text-paper/70 hover:text-accent">
                Store setup status
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Footer legal">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-paper/50">
            Legal
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/privacy" className="text-[14px] text-paper/70 hover:text-accent">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-[14px] text-paper/70 hover:text-accent">
                Terms of service
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-ink-line">
        <div className="container-page flex flex-col gap-2 py-6 text-[12.5px] text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Hoopers Sneakers. All rights reserved.</p>
          <p>Pay on delivery · USD · Built with Next.js + Supabase</p>
        </div>
      </div>
    </footer>
  );
}
