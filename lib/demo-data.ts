/**
 * Hardcoded demo catalog for the AURÉLLE storefront.
 *
 * This is intentionally a static, in-memory module — there is NO database and
 * NO external service in this increment. Imagery now uses the boutique's own
 * product photography served from `public/products/`. When the transactional
 * backend lands, this module is replaced by the CatalogService backed by
 * PostgreSQL (see design.md → Data Models).
 *
 * The shape mirrors the design's `Product` type closely enough to drive the
 * storefront listing pages and the product detail page, while staying
 * backward-compatible with the first increment (the `image` field remains the
 * primary card image).
 */

export type CategorySlug =
  | "dresses"
  | "blouses"
  | "pants"
  | "skirts"
  | "jackets"
  | "sets"
  | "accessories";

/** Style facets used by the New / Sale collections and future filtering. */
export type StyleTag = "casual" | "elegant" | "new" | "sale";

/** A selectable colorway swatch. */
export interface ProductColor {
  /** Spanish display name. */
  name: string;
  /** CSS hex used to render the swatch. */
  hex: string;
}

export interface DemoProduct {
  /** Stable slug used for keys and PDP routing. */
  slug: string;
  name: string;
  /** Current price in whole currency units (USD) for display in this demo. */
  price: number;
  /**
   * Original price when the item is on sale; always greater than `price`.
   * Present on ~25% of the catalog to drive the Sale collection.
   */
  compareAtPrice?: number;
  category: CategorySlug;
  /** Human-readable category label (Spanish navigation copy). */
  categoryLabel: string;
  /** Primary product image (served from `public/products/`). */
  image: string;
  /** Gallery images — the primary image is included as the first entry. */
  images: string[];
  /** Short editorial description (Spanish). */
  description: string;
  /** Available colorways. */
  colors: ProductColor[];
  /** Available sizes. */
  sizes: string[];
  /** Style facets — drives the New and Sale collections. */
  styleTags: StyleTag[];
}

/** A wide, full-bleed hero image (Unsplash placeholder). */
export const heroImage =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=80";

/** Editorial banner image (Unsplash placeholder). */
export const editorialImage =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80";

// On-brand colorways — every product picks two of these swatches.
const C = {
  noir: { name: "Noir", hex: "#15151A" },
  marfil: { name: "Marfil", hex: "#EFE7D6" },
  champagne: { name: "Champaña", hex: "#C5A47E" },
  arena: { name: "Arena", hex: "#D7C4A3" },
} satisfies Record<string, ProductColor>;

/** Every garment shares the same size run in this demo. */
const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];

/** Flat catalog price for the demo — no items are on sale. */
const DEMO_PRICE = 29.99;

/** Per-item seed data; the full product is derived by {@link buildCategory}. */
interface ProductSeed {
  slug: string;
  name: string;
  /** Filename inside `public/products/` (with extension). */
  file: string;
  description: string;
  colors: ProductColor[];
  styleTags: StyleTag[];
}

/** Expand a category's seeds into full {@link DemoProduct} records. */
function buildCategory(
  seeds: ProductSeed[],
  category: CategorySlug,
  categoryLabel: string,
): DemoProduct[] {
  return seeds.map((seed) => {
    const src = `/products/${seed.file}`;
    return {
      slug: seed.slug,
      name: seed.name,
      price: DEMO_PRICE,
      category,
      categoryLabel,
      image: src,
      images: [src],
      description: seed.description,
      colors: seed.colors,
      sizes: APPAREL_SIZES,
      styleTags: seed.styleTags,
    };
  });
}

// ---------------- Pantalones (8) ----------------
const pantsSeeds: ProductSeed[] = [
  {
    slug: "pantalon-1",
    name: "Pantalón Lumière",
    file: "pantalon-1.png",
    description:
      "Sastrería de pierna recta con una caída fluida que ilumina cada paso.",
    colors: [C.noir, C.champagne],
    styleTags: ["elegant"],
  },
  {
    slug: "pantalon-2",
    name: "Pantalón Sillage",
    file: "pantalon-2.png",
    description:
      "Talle alto y línea depurada para una silueta alargada y serena.",
    colors: [C.marfil, C.arena],
    styleTags: ["new", "casual"],
  },
  {
    slug: "pantalon-3",
    name: "Pantalón Étoile",
    file: "pantalon-3.png",
    description:
      "Un pantalón de vestir con pinzas marcadas y un acabado impecable.",
    colors: [C.noir, C.marfil],
    styleTags: ["elegant"],
  },
  {
    slug: "pantalon-4",
    name: "Pantalón Rivage",
    file: "pantalon-4.png",
    description:
      "Tejido ligero de tacto noble, pensado para los días más luminosos.",
    colors: [C.arena, C.champagne],
    styleTags: ["casual"],
  },
  {
    slug: "pantalon-5",
    name: "Pantalón Mistral",
    file: "pantalon-5.png",
    description:
      "Pierna amplia y movimiento aireado que evoca la brisa del sur.",
    colors: [C.noir, C.arena],
    styleTags: ["elegant"],
  },
  {
    slug: "pantalon-6",
    name: "Pantalón Brise",
    file: "pantalon-6.png",
    description:
      "Corte recto y cintura cómoda para una elegancia sin esfuerzo.",
    colors: [C.marfil, C.champagne],
    styleTags: ["new", "elegant"],
  },
  {
    slug: "pantalon-7",
    name: "Pantalón Velours",
    file: "pantalon-7.png",
    description:
      "Caída estructurada con un aire couture que define el guardarropa.",
    colors: [C.noir, C.champagne],
    styleTags: ["elegant"],
  },
  {
    slug: "pantalon-8",
    name: "Pantalón Noir",
    file: "pantalon-8.png",
    description:
      "El pantalón negro esencial, atemporal y siempre favorecedor.",
    colors: [C.noir, C.marfil],
    styleTags: ["elegant"],
  },
];

// ---------------- Vestidos (9) ----------------
const dressSeeds: ProductSeed[] = [
  {
    slug: "vestido-1",
    name: "Vestido Aurore",
    file: "vestido-1.png",
    description:
      "Un vestido fluido que cae con la naturalidad de la luz al amanecer.",
    colors: [C.champagne, C.marfil],
    styleTags: ["new", "elegant"],
  },
  {
    slug: "vestido-2",
    name: "Vestido Soirée",
    file: "vestido-2.jpeg",
    description:
      "Pieza de gala con una silueta arquitectónica para las noches memorables.",
    colors: [C.noir, C.champagne],
    styleTags: ["elegant"],
  },
  {
    slug: "vestido-3",
    name: "Vestido Céleste",
    file: "vestido-3.jpeg",
    description:
      "Líneas limpias y un vuelo discreto que realzan la figura con serenidad.",
    colors: [C.marfil, C.arena],
    styleTags: ["elegant"],
  },
  {
    slug: "vestido-4",
    name: "Vestido Reverie",
    file: "vestido-4.jpeg",
    description:
      "Tejido vaporoso y envolvente para un romanticismo contenido y actual.",
    colors: [C.champagne, C.noir],
    styleTags: ["new", "elegant"],
  },
  {
    slug: "vestido-5",
    name: "Vestido Lumière",
    file: "vestido-5.jpeg",
    description:
      "Un acabado satinado que captura cada destello con elegancia natural.",
    colors: [C.marfil, C.champagne],
    styleTags: ["elegant"],
  },
  {
    slug: "vestido-6",
    name: "Vestido Ondine",
    file: "vestido-6.jpeg",
    description:
      "Corte midi relajado en una paleta luminosa para el día a día refinado.",
    colors: [C.arena, C.marfil],
    styleTags: ["casual"],
  },
  {
    slug: "vestido-7",
    name: "Vestido Mirabelle",
    file: "vestido-7.jpeg",
    description:
      "Cintura marcada y falda con vuelo para una feminidad atemporal.",
    colors: [C.champagne, C.arena],
    styleTags: ["elegant"],
  },
  {
    slug: "vestido-8",
    name: "Vestido Bohème",
    file: "vestido-8.jpeg",
    description:
      "Silueta suelta y desenfadada con alma de lujo discreto.",
    colors: [C.marfil, C.noir],
    styleTags: ["new", "casual"],
  },
  {
    slug: "vestido-9",
    name: "Vestido Étoile",
    file: "vestido-9.jpeg",
    description:
      "Una declaración serena de elegancia para tus citas más especiales.",
    colors: [C.noir, C.champagne],
    styleTags: ["elegant"],
  },
];

// ---------------- Blusas (13) ----------------
const blouseSeeds: ProductSeed[] = [
  {
    slug: "blusa-1",
    name: "Blusa Marfil",
    file: "blusa-1.jpeg",
    description:
      "Una blusa de caída impecable: el básico atemporal que eleva cualquier conjunto.",
    colors: [C.marfil, C.champagne],
    styleTags: ["elegant"],
  },
  {
    slug: "blusa-2",
    name: "Blusa Fleur",
    file: "blusa-2.jpeg",
    description:
      "Detalles delicados que enmarcan el escote con un aire romántico.",
    colors: [C.marfil, C.arena],
    styleTags: ["casual"],
  },
  {
    slug: "blusa-3",
    name: "Blusa Brise",
    file: "blusa-3.png",
    description:
      "Mangas amplias y un tacto fresco que aportan dramatismo contenido.",
    colors: [C.marfil, C.noir],
    styleTags: ["new", "elegant"],
  },
  {
    slug: "blusa-4",
    name: "Blusa Soie",
    file: "blusa-4.png",
    description:
      "Confeccionada con un tejido noble de brillo sutil y caída fluida.",
    colors: [C.champagne, C.noir],
    styleTags: ["elegant"],
  },
  {
    slug: "blusa-5",
    name: "Blusa Camélia",
    file: "blusa-5.png",
    description:
      "Cuello suave y líneas femeninas para un refinamiento cotidiano.",
    colors: [C.marfil, C.champagne],
    styleTags: ["elegant"],
  },
  {
    slug: "blusa-6",
    name: "Blusa Aurore",
    file: "blusa-6.png",
    description:
      "Un corte holgado y luminoso que acompaña con naturalidad cada jornada.",
    colors: [C.arena, C.champagne],
    styleTags: ["casual"],
  },
  {
    slug: "blusa-7",
    name: "Blusa Lumière",
    file: "blusa-7.png",
    description:
      "El acabado champaña que define la firma, ahora en una pieza esencial.",
    colors: [C.marfil, C.noir],
    styleTags: ["new", "elegant"],
  },
  {
    slug: "blusa-8",
    name: "Blusa Perle",
    file: "blusa-8.png",
    description:
      "Sobriedad y elegancia en una blusa de inspiración atemporal.",
    colors: [C.marfil, C.arena],
    styleTags: ["elegant"],
  },
  {
    slug: "blusa-9",
    name: "Blusa Reverie",
    file: "blusa-9.png",
    description:
      "Tejido ligero y favorecedor para un estilo relajado y pulido.",
    colors: [C.champagne, C.marfil],
    styleTags: ["casual"],
  },
  {
    slug: "blusa-10",
    name: "Blusa Mistral",
    file: "blusa-10.jpeg",
    description:
      "Una silueta fluida que se mueve con la gracia de la brisa.",
    colors: [C.noir, C.champagne],
    styleTags: ["elegant"],
  },
  {
    slug: "blusa-11",
    name: "Blusa Ondée",
    file: "blusa-11.jpeg",
    description:
      "Frescura y comodidad sin renunciar a la línea depurada.",
    colors: [C.marfil, C.arena],
    styleTags: ["casual"],
  },
  {
    slug: "blusa-12",
    name: "Blusa Étoile",
    file: "blusa-12.jpeg",
    description:
      "Un brillo discreto que transforma cualquier conjunto en un gesto de estilo.",
    colors: [C.champagne, C.noir],
    styleTags: ["new", "elegant"],
  },
  {
    slug: "blusa-13",
    name: "Blusa Céleste",
    file: "blusa-13.jpeg",
    description:
      "Caída serena y acabado noble para una elegancia sin esfuerzo.",
    colors: [C.marfil, C.champagne],
    styleTags: ["elegant"],
  },
];

/** The demo catalog — 30 real product photos across pants, dresses, blouses. */
export const demoProducts: DemoProduct[] = [
  ...buildCategory(pantsSeeds, "pants", "Pantalones"),
  ...buildCategory(dressSeeds, "dresses", "Vestidos"),
  ...buildCategory(blouseSeeds, "blouses", "Blusas"),
];

/* -------------------------------------------------------------------------- */
/*  Catalog helpers (pure, in-memory)                                         */
/* -------------------------------------------------------------------------- */

const KNOWN_CATEGORIES: readonly CategorySlug[] = [
  "dresses",
  "blouses",
  "pants",
  "skirts",
  "jackets",
  "sets",
  "accessories",
];

/** Spanish navigation labels for each known category slug. */
export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  dresses: "Vestidos",
  blouses: "Blusas",
  pants: "Pantalones",
  skirts: "Faldas",
  jackets: "Chamarras",
  sets: "Conjuntos",
  accessories: "Accesorios",
};

/** Type guard: is the given string a known category slug? */
export function isCategorySlug(value: string): value is CategorySlug {
  return (KNOWN_CATEGORIES as readonly string[]).includes(value);
}

/** All known category slugs (used by generateStaticParams). */
export function getCategorySlugs(): CategorySlug[] {
  return [...KNOWN_CATEGORIES];
}

/** Whether a product is currently discounted. */
export function isOnSale(product: DemoProduct): boolean {
  return (
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price
  );
}

/** Find a product by its slug, or `undefined` when none matches. */
export function getProductBySlug(slug: string): DemoProduct | undefined {
  return demoProducts.find((product) => product.slug === slug);
}

/** All products in a given category (empty array for unknown categories). */
export function getProductsByCategory(category: CategorySlug): DemoProduct[] {
  return demoProducts.filter((product) => product.category === category);
}

/** Products flagged as part of the latest drop. */
export function getNewProducts(): DemoProduct[] {
  return demoProducts.filter((product) => product.styleTags.includes("new"));
}

/** Products that are currently discounted (drives the Sale collection). */
export function getSaleProducts(): DemoProduct[] {
  return demoProducts.filter(isOnSale);
}

/**
 * Products related to the given slug. Prefers items in the same category,
 * then back-fills with other catalog pieces so the grid is always full.
 */
export function getRelatedProducts(slug: string, limit = 4): DemoProduct[] {
  const current = getProductBySlug(slug);
  if (!current) return [];

  const sameCategory = demoProducts.filter(
    (product) => product.slug !== slug && product.category === current.category,
  );
  const others = demoProducts.filter(
    (product) =>
      product.slug !== slug && product.category !== current.category,
  );

  return [...sameCategory, ...others].slice(0, limit);
}
