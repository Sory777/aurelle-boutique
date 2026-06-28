import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SizeRecommender } from "@/components/fitting-room/SizeRecommender";
import { TryOnStudioLoader } from "@/components/fitting-room/TryOnStudioLoader";
import { formatPrice } from "@/lib/format";
import { demoProducts, getProductBySlug, isOnSale } from "@/lib/demo-data";

type TryOnPageProps = {
  params: { slug: string };
};

/** Pre-render a try-on route for every catalog product. */
export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }: TryOnPageProps): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) {
    return { title: "Probador virtual" };
  }
  return {
    title: `Probador virtual · ${product.name}`,
    description: `Prueba «${product.name}» en tu propio cuerpo, directamente en tu navegador. Tu foto nunca se sube.`,
  };
}

export default function TryOnPage({ params }: TryOnPageProps) {
  const product = getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const onSale = isOnSale(product);

  return (
    <div className="mx-auto max-w-editorial px-6 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-eyebrow text-taupe">
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
          <li aria-hidden>·</li>
          <li>
            <Link
              href={`/p/${product.slug}`}
              className="transition-colors duration-300 ease-luxe hover:text-noir"
            >
              {product.name}
            </Link>
          </li>
        </ol>
      </nav>

      {/* Product header */}
      <header className="flex flex-col gap-6 border-b border-line pb-10 sm:flex-row sm:items-center">
        <div className="relative aspect-[3/4] w-32 shrink-0 overflow-hidden bg-blush">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="128px"
            className="object-cover object-center"
          />
        </div>
        <div>
          <p className="eyebrow text-champagne-deep">Probador virtual</p>
          <h1 className="mt-2 font-display text-4xl font-medium leading-tight text-noir">
            {product.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`text-lg tabular-nums ${
                onSale ? "text-champagne-deep" : "text-noir"
              }`}
            >
              {formatPrice(product.price)}
            </span>
            {onSale && product.compareAtPrice !== undefined && (
              <span className="text-sm tabular-nums text-taupe line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <Link
            href={`/p/${product.slug}`}
            className="mt-4 inline-block text-xs uppercase tracking-eyebrow text-taupe underline-offset-4 transition-colors duration-300 ease-luxe hover:text-champagne-deep hover:underline"
          >
            ← Volver a la pieza
          </Link>
        </div>
      </header>

      {/* Studio + recommender */}
      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TryOnStudioLoader product={product} />
        </div>
        <div className="lg:col-span-2">
          <SizeRecommender sizes={product.sizes} />
        </div>
      </div>
    </div>
  );
}
