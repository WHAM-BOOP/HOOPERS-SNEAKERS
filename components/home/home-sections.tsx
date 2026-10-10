import Link from "next/link";
import type { ReactNode } from "react";
import { ProductGrid } from "@/components/products/product-card";
import { EmptyState, SectionHeading } from "@/components/ui/empty-state";
import { DemoNotice } from "@/components/ui/demo-notice";
import type { ProductWithRelations } from "@/lib/supabase/types";

export function FeaturedProductsSection({
  products,
  configured,
}: {
  products: ProductWithRelations[] | null;
  configured: boolean;
}) {
  return (
    <section aria-labelledby="featured-heading" className="container-page py-16">
      <SectionHeading
        eyebrow="Fresh drops"
        title="Featured on the rack"
        description="Hand-picked basketball shoes and athletic footwear, tested for grip, support, and everyday comfort."
        action={
          <Link href="/products" className="btn-outline">
            Shop all →
          </Link>
        }
      />

      <div className="mt-10 space-y-6">
        {!configured ? <DemoNotice /> : null}
        {products && products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            title="No featured products yet"
            description="Mark products as featured in the admin dashboard to show them here."
            actionHref="/admin/products"
            actionLabel="Manage products"
          />
        )}
      </div>
    </section>
  );
}

export function ValueProps() {
  const props: { title: string; description: string; icon: ReactNode }[] = [
    {
      title: "Court-tested picks",
      description:
        "Every shoe is selected for real hoopers, gymnasts, and athletes — not just hype.",
      icon: <CourtIcon />,
    },
    {
      title: "Pay on delivery",
      description:
        "Order online, pay when your pair arrives. No cards required at checkout.",
      icon: <DeliveryIcon />,
    },
    {
      title: "Honest sizing",
      description:
        "True-to-size guidance and a detailed size guide so your first fit is the right one.",
      icon: <RulerIcon />,
    },
    {
      title: "For everyone",
      description:
        "Basketball players, gymnasts, designers, weekend warriors — if you move, we stock you.",
      icon: <PeopleIcon />,
    },
  ];

  return (
    <section aria-labelledby="values-heading" className="border-y border-line bg-surface">
      <div className="container-page py-16">
        <h2 id="values-heading" className="sr-only">
          Why shop Hoopers Sneakers
        </h2>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {props.map((item) => (
            <div key={item.title}>
              <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-accent-soft text-accent">
                {item.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CourtIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18M5.5 5.5c3 3 3 10 0 13M18.5 5.5c-3 3-3 10 0 13" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="19" r="1.6" />
      <circle cx="17.5" cy="19" r="1.6" />
    </svg>
  );
}

function RulerIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="2" y="8" width="20" height="8" rx="1" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5M15 14c2.5 0 4.5 1.8 4.5 4.5" />
    </svg>
  );
}
