/**
 * Hardcoded demo catalog for the AURÉLLE storefront.
 *
 * This is intentionally a static, in-memory module — there is NO database and
 * NO external service in this increment. Imagery uses Unsplash placeholder URLs.
 * When the transactional backend lands, this module is replaced by the
 * CatalogService backed by PostgreSQL (see design.md → Data Models).
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
  /** Primary Unsplash placeholder image (kept for backward compatibility). */
  image: string;
  /** Gallery images (3–4) — the primary image is included as the first entry. */
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

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Build a gallery image array from a list of Unsplash photo ids. */
const gallery = (...ids: string[]): string[] => ids.map((id) => img(id));

// Reusable colorways to keep the catalog consistent and on-brand.
const C = {
  marfil: { name: "Marfil", hex: "#EFE7D6" },
  noir: { name: "Noir", hex: "#15151A" },
  champagne: { name: "Champaña", hex: "#C5A47E" },
  camel: { name: "Camel", hex: "#B08D57" },
  arena: { name: "Arena", hex: "#D7C4A3" },
  blush: { name: "Rosa empolvado", hex: "#E3C7C2" },
  oliva: { name: "Verde oliva", hex: "#6B6B47" },
  medianoche: { name: "Azul medianoche", hex: "#2A3550" },
  borgona: { name: "Borgoña", hex: "#6E2436" },
  perla: { name: "Gris perla", hex: "#C9C6C0" },
  terracota: { name: "Terracota", hex: "#B5651D" },
  cacao: { name: "Cacao", hex: "#4A3526" },
} satisfies Record<string, ProductColor>;

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];
const ONE_SIZE = ["Única"];

/** The demo catalog — ~24 pieces across all seven categories. */
export const demoProducts: DemoProduct[] = [
  // ---------------- Dresses ----------------
  {
    slug: "vestido-seda-aurore",
    name: "Vestido Aurore en seda",
    price: 420,
    category: "dresses",
    categoryLabel: "Vestidos",
    image: img("1539008835657-9e8e9680c956"),
    images: gallery(
      "1539008835657-9e8e9680c956",
      "1502716119720-b23a93e5fe1b",
      "1515372039744-b8f02a3ae446",
      "1469334031218-e382a71b716b",
    ),
    description:
      "Un vestido fluido en seda lavada que cae con la naturalidad de la luz al atardecer. La silueta envolvente realza la figura sin esfuerzo.",
    colors: [C.champagne, C.noir, C.marfil],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "new"],
  },
  {
    slug: "vestido-soiree-noche",
    name: "Vestido Soirée de noche",
    price: 620,
    category: "dresses",
    categoryLabel: "Vestidos",
    image: img("1502716119720-b23a93e5fe1b"),
    images: gallery(
      "1502716119720-b23a93e5fe1b",
      "1539008835657-9e8e9680c956",
      "1469334031218-e382a71b716b",
    ),
    description:
      "Pieza de gala con caída arquitectónica y un acabado satinado que captura cada destello. Pensado para las noches que merecen ser recordadas.",
    colors: [C.noir, C.borgona],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant"],
  },
  {
    slug: "vestido-midi-camelia",
    name: "Vestido midi Camelia",
    price: 360,
    category: "dresses",
    categoryLabel: "Vestidos",
    image: img("1515372039744-b8f02a3ae446"),
    images: gallery(
      "1515372039744-b8f02a3ae446",
      "1524504388940-b1c1722653e1",
      "1539008835657-9e8e9680c956",
    ),
    description:
      "Un midi de líneas limpias con cintura marcada y vuelo discreto. Versátil del día a la noche con un solo cambio de accesorios.",
    colors: [C.blush, C.marfil, C.oliva],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "new"],
  },
  {
    slug: "vestido-lino-riviera",
    name: "Vestido de lino Riviera",
    price: 290,
    category: "dresses",
    categoryLabel: "Vestidos",
    image: img("1524504388940-b1c1722653e1"),
    images: gallery(
      "1524504388940-b1c1722653e1",
      "1515372039744-b8f02a3ae446",
      "1483118714900-540cf339fd46",
    ),
    description:
      "Lino europeo que respira, ideal para los días luminosos del litoral. Una pieza relajada con alma de lujo discreto.",
    colors: [C.arena, C.marfil, C.champagne],
    sizes: APPAREL_SIZES,
    styleTags: ["casual", "new"],
  },
  {
    slug: "vestido-satinado-celeste",
    name: "Vestido satinado Celeste",
    price: 540,
    compareAtPrice: 720,
    category: "dresses",
    categoryLabel: "Vestidos",
    image: img("1469334031218-e382a71b716b"),
    images: gallery(
      "1469334031218-e382a71b716b",
      "1502716119720-b23a93e5fe1b",
      "1515372039744-b8f02a3ae446",
    ),
    description:
      "Satén de seda con un brillo líquido y una espalda descubierta de inspiración couture. Una declaración serena de elegancia.",
    colors: [C.medianoche, C.champagne],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "sale"],
  },

  // ---------------- Blouses ----------------
  {
    slug: "blusa-lumiere-marfil",
    name: "Blusa Lumière marfil",
    price: 180,
    category: "blouses",
    categoryLabel: "Blusas",
    image: img("1485462537746-965f33f7f6a7"),
    images: gallery(
      "1485462537746-965f33f7f6a7",
      "1487222477894-8943e31ef7b2",
      "1525507119028-ed4c629a60a3",
    ),
    description:
      "Una blusa de seda con cuello suave y caída impecable. El básico atemporal que eleva cualquier conjunto.",
    colors: [C.marfil, C.champagne, C.noir],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant"],
  },
  {
    slug: "blusa-seda-aurora-noche",
    name: "Blusa de seda Aurora",
    price: 220,
    category: "blouses",
    categoryLabel: "Blusas",
    image: img("1487222477894-8943e31ef7b2"),
    images: gallery(
      "1487222477894-8943e31ef7b2",
      "1485462537746-965f33f7f6a7",
      "1572804013309-59a88b7e92f1",
    ),
    description:
      "Mangas amplias y un lazo al cuello que aporta dramatismo contenido. Confeccionada en seda con un tacto fresco y noble.",
    colors: [C.borgona, C.noir, C.marfil],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "new"],
  },
  {
    slug: "blusa-algodon-margaux",
    name: "Blusa de algodón Margaux",
    price: 150,
    category: "blouses",
    categoryLabel: "Blusas",
    image: img("1525507119028-ed4c629a60a3"),
    images: gallery(
      "1525507119028-ed4c629a60a3",
      "1485462537746-965f33f7f6a7",
      "1487222477894-8943e31ef7b2",
    ),
    description:
      "Popelín de algodón con un corte holgado y puños abotonados. La pieza cómoda que nunca pierde la compostura.",
    colors: [C.marfil, C.perla, C.arena],
    sizes: APPAREL_SIZES,
    styleTags: ["casual", "new"],
  },
  {
    slug: "blusa-volantes-fleur",
    name: "Blusa de volantes Fleur",
    price: 195,
    compareAtPrice: 260,
    category: "blouses",
    categoryLabel: "Blusas",
    image: img("1572804013309-59a88b7e92f1"),
    images: gallery(
      "1572804013309-59a88b7e92f1",
      "1487222477894-8943e31ef7b2",
      "1525507119028-ed4c629a60a3",
    ),
    description:
      "Volantes delicados que enmarcan el escote con un aire romántico. Un detalle femenino tratado con sobriedad.",
    colors: [C.blush, C.marfil],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "sale"],
  },

  // ---------------- Pants ----------------
  {
    slug: "pantalon-sillage-sastre",
    name: "Pantalón Sillage de sastre",
    price: 260,
    category: "pants",
    categoryLabel: "Pantalones",
    image: img("1495385794356-15371f348c31"),
    images: gallery(
      "1495385794356-15371f348c31",
      "1487412720507-e7ab37603c6f",
      "1490114538077-0a7f8cb49891",
    ),
    description:
      "Sastrería de pierna recta con una raya marcada y caída fluida. La precisión del traje aplicada a la elegancia diaria.",
    colors: [C.noir, C.camel, C.medianoche],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant"],
  },
  {
    slug: "pantalon-palazzo-lumen",
    name: "Pantalón palazzo Lumen",
    price: 240,
    category: "pants",
    categoryLabel: "Pantalones",
    image: img("1487412720507-e7ab37603c6f"),
    images: gallery(
      "1487412720507-e7ab37603c6f",
      "1495385794356-15371f348c31",
      "1490114538077-0a7f8cb49891",
    ),
    description:
      "Pierna amplia y talle alto para una silueta alargada y aireada. El movimiento es protagonista en cada paso.",
    colors: [C.marfil, C.arena, C.noir],
    sizes: APPAREL_SIZES,
    styleTags: ["casual", "new"],
  },
  {
    slug: "pantalon-cuero-onyx",
    name: "Pantalón de cuero Onyx",
    price: 380,
    compareAtPrice: 480,
    category: "pants",
    categoryLabel: "Pantalones",
    image: img("1490114538077-0a7f8cb49891"),
    images: gallery(
      "1490114538077-0a7f8cb49891",
      "1495385794356-15371f348c31",
      "1487412720507-e7ab37603c6f",
    ),
    description:
      "Cuero napa de tacto sedoso con un corte ajustado y atemporal. Una pieza audaz que define el guardarropa nocturno.",
    colors: [C.noir, C.cacao],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "sale"],
  },

  // ---------------- Skirts ----------------
  {
    slug: "falda-plisada-doree",
    name: "Falda plisada Dorée",
    price: 210,
    category: "skirts",
    categoryLabel: "Faldas",
    image: img("1551163943-3f6a855d1153"),
    images: gallery(
      "1551163943-3f6a855d1153",
      "1483118714900-540cf339fd46",
      "1521335629791-ce4aec67dd15",
    ),
    description:
      "Pliegues finos que se mueven como ondas de luz dorada. Una falda midi que combina ligereza y sofisticación.",
    colors: [C.champagne, C.marfil, C.oliva],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant"],
  },
  {
    slug: "falda-midi-satinada-rose",
    name: "Falda midi satinada Rose",
    price: 230,
    category: "skirts",
    categoryLabel: "Faldas",
    image: img("1483118714900-540cf339fd46"),
    images: gallery(
      "1483118714900-540cf339fd46",
      "1551163943-3f6a855d1153",
      "1521335629791-ce4aec67dd15",
    ),
    description:
      "Satén con un cierre al bies que dibuja la cadera con delicadeza. El brillo justo para iluminar el día.",
    colors: [C.blush, C.perla, C.champagne],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "new"],
  },
  {
    slug: "falda-cuero-noir",
    name: "Falda de cuero Noir",
    price: 320,
    category: "skirts",
    categoryLabel: "Faldas",
    image: img("1521335629791-ce4aec67dd15"),
    images: gallery(
      "1521335629791-ce4aec67dd15",
      "1551163943-3f6a855d1153",
      "1483118714900-540cf339fd46",
    ),
    description:
      "Cuero estructurado con un largo lápiz que estiliza la figura. Una pieza ancla con carácter y aplomo.",
    colors: [C.noir, C.cacao],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant"],
  },

  // ---------------- Jackets ----------------
  {
    slug: "chamarra-noir-estructura",
    name: "Chamarra Noir estructurada",
    price: 480,
    compareAtPrice: 600,
    category: "jackets",
    categoryLabel: "Chamarras",
    image: img("1539109136881-3be0616acf4b"),
    images: gallery(
      "1539109136881-3be0616acf4b",
      "1518049362265-d5b2a6467637",
      "1529139574466-a303027c1d8b",
    ),
    description:
      "Hombros definidos y un entallado preciso que proyecta confianza. La chaqueta que ordena cualquier conjunto al instante.",
    colors: [C.noir, C.camel],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "sale"],
  },
  {
    slug: "blazer-doble-botonadura-celine",
    name: "Blazer doble botonadura Céline",
    price: 420,
    category: "jackets",
    categoryLabel: "Chamarras",
    image: img("1518049362265-d5b2a6467637"),
    images: gallery(
      "1518049362265-d5b2a6467637",
      "1539109136881-3be0616acf4b",
      "1529139574466-a303027c1d8b",
    ),
    description:
      "Doble botonadura con solapas anchas y un forro suave de raso. Sastrería atemporal con un guiño masculino reinterpretado.",
    colors: [C.camel, C.noir, C.medianoche],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "new"],
  },
  {
    slug: "trench-gabardina-lumiere",
    name: "Trench de gabardina Lumière",
    price: 560,
    compareAtPrice: 700,
    category: "jackets",
    categoryLabel: "Chamarras",
    image: img("1529139574466-a303027c1d8b"),
    images: gallery(
      "1529139574466-a303027c1d8b",
      "1518049362265-d5b2a6467637",
      "1539109136881-3be0616acf4b",
    ),
    description:
      "Gabardina de algodón con cinturón y vuelo amplio para envolverse con gracia. El abrigo que define las estaciones de transición.",
    colors: [C.arena, C.camel],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant", "sale"],
  },

  // ---------------- Sets ----------------
  {
    slug: "conjunto-belle-coordinado",
    name: "Conjunto Belle coordinado",
    price: 390,
    category: "sets",
    categoryLabel: "Conjuntos",
    image: img("1496747611176-843222e1e57c"),
    images: gallery(
      "1496747611176-843222e1e57c",
      "1554568218-0f1715e72254",
      "1566174053879-31528523f8ae",
    ),
    description:
      "Top y pantalón a juego en una paleta serena y elegante. La solución sin esfuerzo para un look pulido de pies a cabeza.",
    colors: [C.marfil, C.champagne, C.oliva],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant"],
  },
  {
    slug: "conjunto-punto-serein",
    name: "Conjunto de punto Serein",
    price: 340,
    category: "sets",
    categoryLabel: "Conjuntos",
    image: img("1554568218-0f1715e72254"),
    images: gallery(
      "1554568218-0f1715e72254",
      "1496747611176-843222e1e57c",
      "1566174053879-31528523f8ae",
    ),
    description:
      "Punto fino de tacto suave en top y falda coordinados. Comodidad envolvente sin renunciar a la línea depurada.",
    colors: [C.perla, C.arena, C.blush],
    sizes: APPAREL_SIZES,
    styleTags: ["casual", "new"],
  },
  {
    slug: "conjunto-sastre-monaco",
    name: "Conjunto sastre Mónaco",
    price: 460,
    category: "sets",
    categoryLabel: "Conjuntos",
    image: img("1566174053879-31528523f8ae"),
    images: gallery(
      "1566174053879-31528523f8ae",
      "1496747611176-843222e1e57c",
      "1554568218-0f1715e72254",
    ),
    description:
      "Blazer y pantalón de sastre en tejido estructurado para una presencia impecable. Poder y refinamiento en una sola firma.",
    colors: [C.medianoche, C.noir, C.camel],
    sizes: APPAREL_SIZES,
    styleTags: ["elegant"],
  },

  // ---------------- Accessories ----------------
  {
    slug: "bolso-aura-cuero",
    name: "Bolso Aura en cuero",
    price: 540,
    category: "accessories",
    categoryLabel: "Accesorios",
    image: img("1584917865442-de89df76afd3"),
    images: gallery(
      "1584917865442-de89df76afd3",
      "1496217590455-aa63a8350eea",
      "1554412933-514a83d2f3c8",
    ),
    description:
      "Cuero pleno con herrajes dorados y una silueta estructurada que perdura. Un bolso pensado para acompañar toda una vida.",
    colors: [C.camel, C.noir, C.cacao],
    sizes: ONE_SIZE,
    styleTags: ["elegant"],
  },
  {
    slug: "panuelo-seda-constellation",
    name: "Pañuelo de seda Constellation",
    price: 120,
    category: "accessories",
    categoryLabel: "Accesorios",
    image: img("1496217590455-aa63a8350eea"),
    images: gallery(
      "1496217590455-aa63a8350eea",
      "1584917865442-de89df76afd3",
      "1554412933-514a83d2f3c8",
    ),
    description:
      "Twill de seda con un estampado celeste pintado a mano. El acento que transforma cualquier conjunto en un gesto de estilo.",
    colors: [C.champagne, C.blush, C.medianoche],
    sizes: ONE_SIZE,
    styleTags: ["elegant", "new"],
  },
  {
    slug: "cinturon-cuero-aurum",
    name: "Cinturón de cuero Aurum",
    price: 160,
    compareAtPrice: 210,
    category: "accessories",
    categoryLabel: "Accesorios",
    image: img("1554412933-514a83d2f3c8"),
    images: gallery(
      "1554412933-514a83d2f3c8",
      "1584917865442-de89df76afd3",
      "1496217590455-aa63a8350eea",
    ),
    description:
      "Cuero curtido con una hebilla dorada de inspiración escultórica. Marca la cintura con un toque de luz metálica.",
    colors: [C.cacao, C.noir],
    sizes: ["S", "M", "L"],
    styleTags: ["sale"],
  },
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
