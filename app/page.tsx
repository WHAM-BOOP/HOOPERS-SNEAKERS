import Image from "next/image";
import Link from "next/link";
import {
  FeaturedProductsSection,
  ValueProps,
} from "@/components/home/home-sections";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getCategories,
  getFeaturedProducts,
} from "@/lib/products/queries";
import { getEnvStatus } from "@/lib/env";

export default async function HomePage() {
  const status = getEnvStatus();
  const [featured, categories] = await Promise.all([
    status.supabaseReady ? getFeaturedProducts(8) : null,
    status.supabaseReady ? getCategories() : null,
  ]);

  const featuredProducts =
    featured && featured.ok ? featured.data : null;
  const categoryList = categories && categories.ok ? categories.data : null;

  return (
    <>
      <Hero />

      <FeaturedProductsSection
        products={featuredProducts}
        configured={status.supabaseReady}
      />

      <CategoriesSection categories={categoryList} configured={status.supabaseReady} />

      <ValueProps />

      <section aria-labelledby="cta-heading" className="bg-ink">
        <div className="container-page flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow text-paper/60">Ready when you are</p>
            <h2 id="cta-heading" className="mt-2 text-2xl font-bold text-paper sm:text-3xl">
              Find your next pair — pay only when it arrives.
            </h2>
            <p className="mt-3 text-[15px] text-paper/70">
              Browse the full catalog with filters for size, brand, and budget.
            </p>
          </div>
          <Link href="/products" className="btn-primary shrink-0">
            Shop the catalog →
          </Link>
        </div>
      </section>
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-ink text-paper">
      <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow text-accent">Basketball shoes & athletic footwear</p>
          <h1
            id="hero-heading"
            className="mt-4 text-[2.6rem] font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.25rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Built for the floor.
            <br />
            Made for everyone.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-paper/75">
            Hoopers Sneakers supplies basketball players, gymnasts, designers,
            and everyday movers with court-tested shoes, honest sizing, and
            pay-on-delivery checkout.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary">
              Shop all shoes
            </Link>
            <Link
              href="/collections"
              className="btn border border-paper/30 text-paper hover:border-paper hover:bg-paper hover:text-ink"
            >
              Browse collections
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-paper/15 pt-6">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.15em] text-paper/50">
                Delivery
              </dt>
              <dd className="mt-1 text-lg font-bold">Pay on arrival</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.15em] text-paper/50">
                Sizing
              </dt>
              <dd className="mt-1 text-lg font-bold">True to size</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.15em] text-paper/50">
                Support
              </dt>
              <dd className="mt-1 text-lg font-bold">Real humans</dd>
            </div>
          </dl>
        </div>

        <div className="relative hidden aspect-[4/5] max-h-[560px] w-full overflow-hidden rounded-md border border-paper/10 lg:block">
          <Image
            src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80"
            alt="Pair of basketball sneakers on a court"
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-6">
            <p className="text-sm font-medium text-paper/90">
              Grip, support, and first-step speed — the trifecta.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection({
  categories,
  configured,
}: {
  categories:
    | { id: string; slug: string; name: string; description: string | null; image_url: string | null }[]
    | null;
  configured: boolean;
}) {
  return (
    <section aria-labelledby="categories-heading" className="container-page pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Shop by sport</p>
          <h2 id="categories-heading" className="mt-2 text-2xl font-bold sm:text-3xl">
            Collections for every kind of mover
          </h2>
        </div>
        <Link href="/collections" className="text-[14px] font-semibold text-accent hover:underline">
          All collections →
        </Link>
      </div>

      <div className="mt-8">
        {!configured ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Basketball", "Training", "Gymnastics", "Lifestyle"].map((name) => (
              <div
                key={name}
                className="rounded-md border border-dashed border-line-strong bg-surface px-5 py-10 text-center"
              >
                <p className="text-[15px] font-semibold text-muted">{name}</p>
                <p className="mt-1 text-[12.5px] text-muted/70">
                  Appears after setup
                </p>
              </div>
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/collections/${category.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-ink"
              >
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
                  />
                ) : null}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/85 via-ink/20 to-transparent p-5">
                  <h3 className="text-lg font-bold text-paper">{category.name}</h3>
                  {category.description ? (
                    <p className="mt-1 line-clamp-2 text-[13px] text-paper/75">
                      {category.description}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No collections yet"
            description="Add categories in the Supabase SQL editor (see supabase/seed.sql) or via the admin dashboard."
            actionHref="/setup"
            actionLabel="Setup guide"
          />
        )}
      </div>
    </section>
  );
}
