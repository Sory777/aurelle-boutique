import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { isOnSale, type DemoProduct } from "@/lib/demo-data";

/**
 * Catalog card for a single product. Server component (no interactivity) so it
 * can be reused across the home page, category listings, and related grids.
 *
 * Visuals are lifted from the original home-page card: a 3:4 image with a slow
 * hover zoom, a category eyebrow, the product name, and a price. When the item
 * is on sale it shows an "Oferta" badge and a strikethrough original price.
 */
export function ProductCard({ product }: { product: DemoProduct }) {
  const onSale = isOnSale(product);

  return (
    <Link
      href={`/p/${product.slug}`}
      className="group block"
      aria-label={product.name}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-blush">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-700 ease-luxe group-hover:scale-105"
        />

        {onSale && (
          <span className="absolute left-4 top-4 bg-champagne-deep px-3 py-1 text-[0.65rem] uppercase tracking-eyebrow text-ivory">
            Oferta
          </span>
        )}

        <span className="absolute bottom-4 left-4 bg-ivory/90 px-3 py-1 text-[0.65rem] uppercase tracking-eyebrow text-noir opacity-0 transition-opacity duration-300 ease-luxe group-hover:opacity-100">
          Ver pieza
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{product.categoryLabel}</p>
          <h3 className="mt-1 font-display text-lg leading-snug text-noir transition-colors duration-300 ease-luxe group-hover:text-champagne-deep">
            {product.name}
          </h3>
        </div>
        <div className="shrink-0 pt-1 text-right">
          <p
            className={`text-sm tabular-nums ${
              onSale ? "text-champagne-deep" : "text-noir"
            }`}
          >
            {formatPrice(product.price)}
          </p>
          {onSale && product.compareAtPrice !== undefined && (
            <p className="text-xs tabular-nums text-taupe line-through">
              {formatPrice(product.compareAtPrice)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
