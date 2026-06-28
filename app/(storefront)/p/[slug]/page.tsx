import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/product/Gallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductGrid } from "@/components/product/ProductGrid";
import { formatPrice } from "@/lib/format";
import {
  demoProducts,
  getProductBySlug,
  getRelatedProducts,
  isOnSale,
} from "@/lib/demo-data";

type ProductPageProps = {
  params: { slug: string };
};

/** Pre-render every catalog product at build time. */
export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) {
    return { title: "Pieza no encontrada" };
  }
  return {
    title: product.name,
    description: product.description,
  };
}

/** Static "materials & care" content — generic luxury copy for the demo. */
const CARE_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Materiales",
    body: "Tejidos nobles seleccionados por su tacto y caída. Cada pieza se confecciona en talleres especializados con un control artesanal del acabado.",
  },
  {
    heading: "Cuidado",
    body: "Limpieza en seco recomendada. Planchar a baja temperatura del revés y guardar en lugar fresco para preservar la fibra y el color.",
  },
  {
    heading: "Envíos y devoluciones",
    body: "Envío de cortesía en pedidos seleccionados y devoluciones sin cargo durante 30 días. Tu pieza llega protegida en el empaque firma AURÉLLE.",
  },
];

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const onSale = isOnSale(product);
  const related = getRelatedProducts(product.slug);

  return (
    <div className="mx-auto max-w-editorial px-6 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex items-center gap-2 text-xs uppercase tracking-eyebrow text-taupe">
          <li>
            <Link
              href="/"
              className="transition-colors duration-300 ease-luxe hover:text-noir"
            >
              Inicio
            </Link>
          </li>
          <li aria-hidden>·</li>
          <li>
            <Link
              href={`/c/${product.category}`}
              className="transition-colors duration-300 ease-luxe hover:text-noir"
            >
              {product.categoryLabel}
            </Link>
          </li>
        </ol>
      </nav>

      {/* Two-column layout */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Gallery images={product.images} alt={product.name} />

        <div className="lg:py-4">
          <Link
            href={`/c/${product.category}`}
            className="eyebrow transition-colors duration-300 ease-luxe hover:text-champagne-deep"
          >
            {product.categoryLabel}
          </Link>

          <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-noir">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`text-xl tabular-nums ${
                onSale ? "text-champagne-deep" : "text-noir"
              }`}
            >
              {formatPrice(product.price)}
            </span>
            {onSale && product.compareAtPrice !== undefined && (
              <>
                <span className="text-base tabular-nums text-taupe line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <span className="bg-champagne-deep px-3 py-1 text-[0.65rem] uppercase tracking-eyebrow text-ivory">
                  Oferta
                </span>
              </>
            )}
          </div>

          <p className="mt-6 max-w-prose text-base leading-relaxed text-taupe">
            {product.description}
          </p>

          <div className="mt-10">
            <VariantSelector
              colors={product.colors}
              sizes={product.sizes}
              slug={product.slug}
              productName={product.name}
              price={product.price}
            />
          </div>

          {/* Materials & care */}
          <div className="mt-12 border-t border-line">
            {CARE_SECTIONS.map((section) => (
              <details key={section.heading} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-xs uppercase tracking-eyebrow text-noir transition-colors duration-300 ease-luxe hover:text-champagne-deep">
                  {section.heading}
                  <span
                    aria-hidden
                    className="text-champagne-deep transition-transform duration-300 ease-luxe group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-taupe">
                  {section.body}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-24">
          <div className="border-b border-line pb-8">
            <p className="eyebrow text-champagne-deep">Para combinar</p>
            <h2 className="mt-3 font-display text-3xl font-medium text-noir">
              Te puede gustar
            </h2>
          </div>
          <div className="mt-12">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
