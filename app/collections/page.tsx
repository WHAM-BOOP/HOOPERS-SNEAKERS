import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SetupHelpCard } from "@/components/ui/setup-help-card";
import { getEnvStatus } from "@/lib/env";
import { getCategories } from "@/lib/products/queries";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Shop Hoopers Sneakers collections: basketball, training, gymnastics, and lifestyle footwear for every kind of mover.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const status = getEnvStatus();

  return (
    <div className="container-page py-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Collections</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Shop by what you do
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          From hardwood courts to studio floors — find footwear organized for
          your sport and your style.
        </p>
      </header>

      <div className="mt-10">
        {!status.supabaseReady ? (
          <SetupHelpCard />
        ) : (
          <CollectionsGrid />
        )}
      </div>
    </div>
  );
}

async function CollectionsGrid() {
  const result = await getCategories();

  if (!result.ok) {
    return (
      <Notice tone="danger" title="Could not load collections">
        {result.message}
      </Notice>
    );
  }

  if (result.data.length === 0) {
    return (
      <EmptyState
        title="No collections yet"
        description="Create categories in the Supabase SQL editor (see supabase/seed.sql) and they will appear here."
        actionHref="/setup"
        actionLabel="Setup guide"
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {result.data.map((category) => (
        <Link
          key={category.id}
          href={`/collections/${category.slug}`}
          className="group relative aspect-[16/10] overflow-hidden rounded-md border border-line bg-ink"
        >
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover opacity-85 transition-opacity group-hover:opacity-100"
            />
          ) : null}
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/90 via-ink/25 to-transparent p-6">
            <h2 className="text-xl font-bold text-paper">{category.name}</h2>
            {category.description ? (
              <p className="mt-1.5 line-clamp-2 text-[13.5px] text-paper/75">
                {category.description}
              </p>
            ) : null}
            <span className="mt-3 text-[12.5px] font-semibold uppercase tracking-wider text-accent">
              Shop collection →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
