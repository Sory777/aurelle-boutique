import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  CATEGORY_LABELS,
  getCategorySlugs,
  getProductsByCategory,
  isCategorySlug,
} from "@/lib/demo-data";

type CategoryPageProps = {
  params: { category: string };
};

/** Short editorial intro line shown under each category title. */
const CATEGORY_INTRO: Record<string, string> = {
  dresses:
    "Siluetas fluidas y tejidos nobles para los momentos que merecen una pieza memorable.",
  blouses:
    "El arte del detalle: sedas, volantes y cuellos que elevan lo cotidiano.",
  pants:
    "Sastrería precisa y líneas depuradas para una elegancia sin esfuerzo.",
  skirts:
    "Pliegues, satenes y cueros que dibujan el movimiento con sofisticación.",
  jackets:
    "Estructura y carácter: las piezas que ordenan y definen cada conjunto.",
  sets: "Conjuntos coordinados para un look impecable de pies a cabeza.",
  accessories:
    "Los acentos que transforman: cuero pleno, seda pintada y herrajes dorados.",
};

/** Pre-render all seven known categories at build time. */
export function generateStaticParams() {
  return getCategorySlugs().map((category) => ({ category }));
}

export function generateMetadata({ params }: CategoryPageProps): Metadata {
  if (!isCategorySlug(params.category)) {
    return { title: "Colección" };
  }
  const label = CATEGORY_LABELS[params.category];
  return {
    title: label,
    description: `Descubre la colección de ${label.toLowerCase()} de AURÉLLE.`,
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  if (!isCategorySlug(params.category)) {
    notFound();
  }

  const label = CATEGORY_LABELS[params.category];
  const intro = CATEGORY_INTRO[params.category];
  const products = getProductsByCategory(params.category);

  return (
    <section className="mx-auto max-w-editorial px-6 py-20">
      <header className="border-b border-line pb-8">
        <p className="eyebrow text-champagne-deep">Colección</p>
        <h1 className="mt-3 font-display text-4xl font-medium text-noir">
          {label}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-taupe">
          {intro}
        </p>
        <p className="mt-6 text-xs uppercase tracking-eyebrow text-taupe">
          {products.length}{" "}
          {products.length === 1 ? "pieza" : "piezas"}
        </p>
      </header>

      <div className="mt-12">
        <ProductGrid
          products={products}
          emptyMessage="Pronto presentaremos nuevas piezas en esta colección."
        />
      </div>
    </section>
  );
}
