import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getNewProducts } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Nueva colección",
  description:
    "Las últimas incorporaciones a la colección AURÉLLE. Piezas vestidas de luz para la temporada.",
};

export default function NewCollectionPage() {
  const products = getNewProducts();

  return (
    <section className="mx-auto max-w-editorial px-6 py-20">
      <header className="border-b border-line pb-8">
        <p className="eyebrow text-champagne-deep">Lo más reciente · Otoño</p>
        <h1 className="mt-3 font-display text-4xl font-medium text-noir">
          Nueva colección
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-taupe">
          La temporada se viste de luz. Descubre las piezas recién llegadas al
          atelier, confeccionadas con materiales nobles y siluetas atemporales.
        </p>
      </header>

      <div className="mt-12">
        <ProductGrid
          products={products}
          emptyMessage="Muy pronto revelaremos las nuevas piezas de la temporada."
        />
      </div>
    </section>
  );
}
