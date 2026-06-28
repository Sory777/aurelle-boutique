import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getSaleProducts } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Ofertas",
  description:
    "Piezas seleccionadas de la colección AURÉLLE con precios especiales por tiempo limitado.",
};

export default function SalePage() {
  const products = getSaleProducts();

  return (
    <section className="mx-auto max-w-editorial px-6 py-20">
      <header className="border-b border-line pb-8">
        <p className="eyebrow text-champagne-deep">Edición especial</p>
        <h1 className="mt-3 font-display text-4xl font-medium text-noir">
          Ofertas
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-taupe">
          Una selección de piezas icónicas a precios excepcionales. El lujo
          atemporal, ahora con una invitación irresistible.
        </p>
      </header>

      <div className="mt-12">
        <ProductGrid
          products={products}
          emptyMessage="No hay ofertas activas por el momento. Vuelve pronto."
        />
      </div>
    </section>
  );
}
