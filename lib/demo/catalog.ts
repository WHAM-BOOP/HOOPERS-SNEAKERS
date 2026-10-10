import type {
  CategoryRow,
  ProductWithRelations,
} from "@/lib/supabase/types";

/**
 * Demo catalog — sample content used ONLY while Supabase is not connected,
 * so the storefront can be browsed and evaluated end-to-end. It is clearly
 * labeled as demo everywhere it surfaces (global banner, checkout, /setup)
 * and is replaced entirely by live database data the moment credentials are
 * configured. No demo data is ever written to or mixed with real orders.
 */

function variantSet(
  sizes: [string, number][],
): ProductWithRelations["variants"] {
  return sizes.map(([size, stock], index) => ({
    id: `demo-variant-${index}-${size}`,
    size,
    stock,
  }));
}

const NOW = "2026-10-01T09:00:00.000Z";

export const DEMO_CATEGORIES: CategoryRow[] = [
  {
    id: "demo-cat-basketball",
    slug: "basketball",
    name: "Basketball",
    description:
      "High-performance basketball shoes built for grip, ankle support, and quick first steps on the court.",
    image_url: "/images/court-hero.jpg",
    sort_order: 1,
    created_at: NOW,
  },
  {
    id: "demo-cat-training",
    slug: "training",
    name: "Training",
    description:
      "Cross-training and gym shoes for strength work, agility drills, and general fitness.",
    image_url: "/images/court-detail.jpg",
    sort_order: 2,
    created_at: NOW,
  },
  {
    id: "demo-cat-gymnastics",
    slug: "gymnastics",
    name: "Gymnastics",
    description:
      "Lightweight, flexible footwear for gymnasts, dancers, and studio athletes.",
    image_url: "/images/court-team.jpg",
    sort_order: 3,
    created_at: NOW,
  },
  {
    id: "demo-cat-lifestyle",
    slug: "lifestyle",
    name: "Lifestyle",
    description:
      "Off-court sneakers with hoop DNA — everyday comfort for designers and everyone in general.",
    image_url: "/images/court-detail.jpg",
    sort_order: 4,
    created_at: NOW,
  },
];

type DemoProductSpec = Omit<
  ProductWithRelations,
  "category" | "variants" | "images"
> & {
  categorySlug: string;
  sizes: [string, number][];
};

const SPECS: DemoProductSpec[] = [
  {
    id: "demo-prod-01",
    slug: "apex-flight-1",
    name: "Apex Flight 1",
    brand: "CourtLab",
    short_description:
      "Our flagship high-top: locked-in heel, responsive cushioning, and a herringbone grip that bites on hard cuts.",
    description:
      "The Apex Flight 1 is built for players who live above the rim. A molded heel counter keeps you stable on landings, while the full-length air unit returns energy on every sprint back on defense.\n\nFit: true to size with a slightly roomy toe box for toe splay on takeoff.",
    image_url: "/images/products/p01.jpg",
    price_cents: 13900,
    featured: true,
    active: true,
    category_id: "demo-cat-basketball",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "basketball",
    sizes: [
      ["8", 6],
      ["8.5", 4],
      ["9", 8],
      ["9.5", 5],
      ["10", 7],
      ["10.5", 3],
      ["11", 6],
      ["12", 2],
    ],
  },
  {
    id: "demo-prod-02",
    slug: "pivot-master-pro",
    name: "Pivot Master Pro",
    brand: "CourtLab",
    short_description:
      "Low-cut control shoe for guards — lateral cage, court-feel cushioning, and a sticky outsole.",
    description:
      "Designed with quick-change artists in mind. The Pivot Master Pro keeps your foot low to the floor for feel, with a lateral cage that holds you through crossovers and step-backs.",
    image_url: "/images/products/p02.jpg",
    price_cents: 15900,
    featured: true,
    active: true,
    category_id: "demo-cat-basketball",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "basketball",
    sizes: [
      ["7.5", 3],
      ["8", 5],
      ["9", 6],
      ["10", 4],
      ["11", 5],
      ["12", 2],
      ["13", 1],
    ],
  },
  {
    id: "demo-prod-03",
    slug: "glass-breaker-2",
    name: "Glass Breaker 2",
    brand: "Baseline",
    short_description:
      "Big-impact cushioning under a reinforced upper — made for boards, blocks, and second jumps.",
    description:
      "A workhorse for bigs and hustlers. Double-layer foam under the heel soaks up contact, and the reinforced toe wrap survives drag-stops all season.",
    image_url: "/images/products/p03.jpg",
    price_cents: 12900,
    featured: false,
    active: true,
    category_id: "demo-cat-basketball",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "basketball",
    sizes: [
      ["9", 4],
      ["10", 6],
      ["11", 6],
      ["12", 3],
      ["13", 2],
      ["14", 1],
    ],
  },
  {
    id: "demo-prod-04",
    slug: "first-step-elite",
    name: "First Step Elite",
    brand: "Velocity",
    short_description:
      "Explosive speed shoe with a carbon plate and featherlight knit upper.",
    description:
      "Everything is engineered for the first step: a full-length carbon plate, a knit upper that weighs almost nothing, and an outsole pattern tuned for acceleration angles.",
    image_url: "/images/products/p04.jpg",
    price_cents: 17500,
    featured: true,
    active: true,
    category_id: "demo-cat-basketball",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "basketball",
    sizes: [
      ["8", 3],
      ["8.5", 3],
      ["9", 5],
      ["9.5", 4],
      ["10", 5],
      ["11", 3],
    ],
  },
  {
    id: "demo-prod-05",
    slug: "crossover-low",
    name: "Crossover Low",
    brand: "Hoopers",
    short_description:
      "Our house low-top: everyday hoop shoe at a friendly price.",
    description:
      "The Crossover Low is the shoe we recommend for rec leagues and park runs. Nothing fancy — just durable materials, reliable grip, and all-day comfort.",
    image_url: "/images/products/p05.jpg",
    price_cents: 9900,
    featured: false,
    active: true,
    category_id: "demo-cat-basketball",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "basketball",
    sizes: [
      ["7", 4],
      ["8", 6],
      ["9", 8],
      ["10", 8],
      ["11", 5],
      ["12", 3],
    ],
  },
  {
    id: "demo-prod-06",
    slug: "gym-studio-flow",
    name: "Gym Studio Flow",
    brand: "AeroFlex",
    short_description:
      "Barely-there studio shoe with a flexible sole and grippy contact zones.",
    description:
      "Made for tumbling, barre, and floor work. The split-flex sole moves with your foot, and the seamless upper prevents hot spots during long sessions.",
    image_url: "/images/products/p06.jpg",
    price_cents: 8900,
    featured: true,
    active: true,
    category_id: "demo-cat-gymnastics",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "gymnastics",
    sizes: [
      ["5", 3],
      ["6", 5],
      ["7", 5],
      ["8", 6],
      ["9", 4],
      ["10", 2],
    ],
  },
  {
    id: "demo-prod-07",
    slug: "balance-beam-lite",
    name: "Balance Beam Lite",
    brand: "AeroFlex",
    short_description:
      "Minimal training slipper for beam, floor, and precision work.",
    description:
      "As light as it gets. A thin, grippy sole gives you the floor feel coaches want, with just enough protection for chalky feet and hard landings in training.",
    image_url: "/images/products/p07.jpg",
    price_cents: 7900,
    featured: false,
    active: true,
    category_id: "demo-cat-gymnastics",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "gymnastics",
    sizes: [
      ["4", 2],
      ["5", 4],
      ["6", 4],
      ["7", 3],
      ["8", 2],
    ],
  },
  {
    id: "demo-prod-08",
    slug: "agility-trainer-3",
    name: "Agility Trainer 3",
    brand: "Pivot",
    short_description:
      "Do-everything trainer for lifting, plyos, and conditioning days.",
    description:
      "Flat and stable under the bar, flexible at the toe for sprints. The Agility Trainer 3 is one shoe for the whole session — no changing between sets.",
    image_url: "/images/products/p08.jpg",
    price_cents: 11900,
    featured: true,
    active: true,
    category_id: "demo-cat-training",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "training",
    sizes: [
      ["7", 3],
      ["8", 5],
      ["9", 7],
      ["10", 6],
      ["11", 4],
      ["12", 2],
    ],
  },
  {
    id: "demo-prod-09",
    slug: "iron-session",
    name: "Iron Session",
    brand: "Pivot",
    short_description:
      "Heavy-day trainer with a wide, planted base and locked heel.",
    description:
      "Squat, hinge, and carry with confidence. A wide outsole and zero-drop feel keep you grounded when the load gets serious.",
    image_url: "/images/products/p09.jpg",
    price_cents: 10900,
    featured: false,
    active: true,
    category_id: "demo-cat-training",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "training",
    sizes: [
      ["8", 2],
      ["9", 4],
      ["10", 4],
      ["11", 3],
      ["12", 1],
    ],
  },
  {
    id: "demo-prod-10",
    slug: "court-classic-82",
    name: "Court Classic 82",
    brand: "Hoopers",
    short_description:
      "Retro hoops silhouette with modern comfort — the off-court staple.",
    description:
      "A love letter to '80s hardwood style, rebuilt with a cushioned insole you can wear all day. Premium leather-look upper that breaks in beautifully.",
    image_url: "/images/products/p10.jpg",
    price_cents: 11500,
    featured: true,
    active: true,
    category_id: "demo-cat-lifestyle",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "lifestyle",
    sizes: [
      ["7", 5],
      ["8", 7],
      ["9", 8],
      ["10", 7],
      ["11", 5],
      ["12", 3],
    ],
  },
  {
    id: "demo-prod-11",
    slug: "sideline-slip-on",
    name: "Sideline Slip-On",
    brand: "Baseline",
    short_description:
      "Easy knit slip-on for travel days, warmups, and everything between.",
    description:
      "No laces, no problem. Stretch knit, cushioned footbed, and a sole that grips wet pavement. The shoe you'll actually wear every day.",
    image_url: "/images/products/p11.jpg",
    price_cents: 8500,
    featured: false,
    active: true,
    category_id: "demo-cat-lifestyle",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "lifestyle",
    sizes: [
      ["6", 3],
      ["7", 5],
      ["8", 5],
      ["9", 4],
      ["10", 3],
    ],
  },
  {
    id: "demo-prod-12",
    slug: "downtown-knit",
    name: "Downtown Knit",
    brand: "Velocity",
    short_description:
      "Sleek city sneaker with a sock-fit collar and street-ready outsole.",
    description:
      "Designed with our friends in the creative scene: clean lines, breathable knit, and a silhouette that works with everything from joggers to wide-leg denim.",
    image_url: "/images/products/p12.jpg",
    price_cents: 12500,
    featured: false,
    active: true,
    category_id: "demo-cat-lifestyle",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "lifestyle",
    sizes: [
      ["7", 2],
      ["8", 4],
      ["9", 4],
      ["10", 2],
      ["11", 1],
    ],
  },
  {
    id: "demo-prod-13",
    slug: "halftime-high",
    name: "Halftime High",
    brand: "Hoopers",
    short_description:
      "Bold high-top for the tunnel walk — limited sample colorway.",
    description:
      "Part of our demo drop: a statement high-top with padded collar and a sculpted midsole. (Sample product — shown while the store runs in demo mode.)",
    image_url: "/images/products/p13.jpg",
    price_cents: 14500,
    featured: false,
    active: true,
    category_id: "demo-cat-lifestyle",
    created_at: NOW,
    updated_at: NOW,
    categorySlug: "lifestyle",
    sizes: [
      ["8", 1],
      ["9", 2],
      ["10", 2],
      ["11", 1],
    ],
  },
];

export const DEMO_PRODUCTS: ProductWithRelations[] = SPECS.map((spec) => {
  const { categorySlug, sizes, ...product } = spec;
  const category =
    DEMO_CATEGORIES.find((c) => c.slug === categorySlug) ?? null;
  return {
    ...product,
    category: category
      ? { id: category.id, slug: category.slug, name: category.name }
      : null,
    variants: variantSet(sizes),
    images: [
      {
        id: `${product.id}-img-1`,
        url: product.image_url as string,
        alt: product.name,
        sort_order: 0,
      },
      {
        id: `${product.id}-img-2`,
        url: "/images/court-detail.jpg",
        alt: `${product.name} — on-court lifestyle`,
        sort_order: 1,
      },
    ],
  };
});

export function demoBrands(): string[] {
  return [...new Set(DEMO_PRODUCTS.map((p) => p.brand))].sort();
}

export function demoSizes(): string[] {
  const sizes = new Set<string>();
  for (const product of DEMO_PRODUCTS) {
    for (const variant of product.variants) {
      if (variant.stock > 0) sizes.add(variant.size);
    }
  }
  return [...sizes].sort((a, b) => Number(a) - Number(b));
}
