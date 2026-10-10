import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Hoopers Sneakers is a basketball shoes store for players, gymnasts, designers, and everyone who moves — court-tested picks, honest sizing, pay on delivery.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-page py-12">
      <header className="max-w-2xl">
        <p className="eyebrow">About Hoopers Sneakers</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">
          Footwear for people who actually move.
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-muted">
          Hoopers Sneakers started with a simple frustration: buying basketball
          shoes online meant guessing on fit, overpaying for hype, and paying
          upfront for a pair you had not touched. We built the store we wanted
          to shop at.
        </p>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-3">
        <section aria-labelledby="who-heading">
          <h2 id="who-heading" className="text-lg font-bold">
            Who we serve
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
            Basketball players who need grip and ankle support. Gymnasts and
            studio athletes who need light, flexible shoes. Designers who care
            how a silhouette looks on the street. And everyone in general —
            because good footwear is not niche.
          </p>
        </section>

        <section aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-lg font-bold">
            How we pick
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
            Every model on this site is selected for real performance: traction
            patterns, cushioning, support, and durability. If a shoe is here, it
            survived our checklist — on court, in the gym, and on the street.
          </p>
        </section>

        <section aria-labelledby="pay-heading">
          <h2 id="pay-heading" className="text-lg font-bold">
            How you pay
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
            Pay on delivery. Order online, we confirm and ship, and you pay when
            the pair is in your hands. No cards required at checkout, no
            surprises.
          </p>
        </section>
      </div>

      <div className="mt-16">
        <SectionHeading
          eyebrow="Ready?"
          title="Find your next pair"
          description="Browse the full catalog with filters for size, brand, and budget."
          action={
            <Link href="/products" className="btn-primary">
              Shop all shoes
            </Link>
          }
        />
      </div>
    </div>
  );
}
