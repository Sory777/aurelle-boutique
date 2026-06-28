/**
 * Hardcoded demo catalog for the AURÉLLE storefront first increment.
 *
 * This is intentionally a static, in-memory array — there is NO database and
 * NO external service in this increment. Imagery uses Unsplash placeholder URLs.
 * When the transactional backend lands, this module is replaced by the
 * CatalogService backed by PostgreSQL (see design.md → Data Models).
 */

export type CategorySlug =
  | "dresses"
  | "blouses"
  | "pants"
  | "skirts"
  | "jackets"
  | "sets"
  | "accessories";

export interface DemoProduct {
  /** Stable slug used for keys and future PDP routing. */
  slug: string;
  name: string;
  /** Price in whole currency units (USD) for display in this demo. */
  price: number;
  category: CategorySlug;
  /** Human-readable category label (Spanish navigation copy). */
  categoryLabel: string;
  /** Unsplash placeholder image URL. */
  image: string;
}

/** A wide, full-bleed hero image (Unsplash placeholder). */
export const heroImage =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=80";

/** Editorial banner image (Unsplash placeholder). */
export const editorialImage =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80";

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

/** Demo products powering the "Nueva colección" grid on the home page. */
export const demoProducts: DemoProduct[] = [
  {
    slug: "vestido-seda-aurore",
    name: "Vestido Aurore en seda",
    price: 420,
    category: "dresses",
    categoryLabel: "Vestidos",
    image: img("1539008835657-9e8e9680c956"),
  },
  {
    slug: "blusa-lumiere-marfil",
    name: "Blusa Lumière marfil",
    price: 180,
    category: "blouses",
    categoryLabel: "Blusas",
    image: img("1485462537746-965f33f7f6a7"),
  },
  {
    slug: "pantalon-sillage-sastre",
    name: "Pantalón Sillage de sastre",
    price: 260,
    category: "pants",
    categoryLabel: "Pantalones",
    image: img("1495385794356-15371f348c31"),
  },
  {
    slug: "falda-plisada-doree",
    name: "Falda plisada Dorée",
    price: 210,
    category: "skirts",
    categoryLabel: "Faldas",
    image: img("1551163943-3f6a855d1153"),
  },
  {
    slug: "chamarra-noir-estructura",
    name: "Chamarra Noir estructurada",
    price: 480,
    category: "jackets",
    categoryLabel: "Chamarras",
    image: img("1539109136881-3be0616acf4b"),
  },
  {
    slug: "conjunto-belle-coordinado",
    name: "Conjunto Belle coordinado",
    price: 390,
    category: "sets",
    categoryLabel: "Conjuntos",
    image: img("1496747611176-843222e1e57c"),
  },
  {
    slug: "bolso-aura-cuero",
    name: "Bolso Aura en cuero",
    price: 540,
    category: "accessories",
    categoryLabel: "Accesorios",
    image: img("1584917865442-de89df76afd3"),
  },
  {
    slug: "vestido-soiree-noche",
    name: "Vestido Soirée de noche",
    price: 620,
    category: "dresses",
    categoryLabel: "Vestidos",
    image: img("1502716119720-b23a93e5fe1b"),
  },
];
