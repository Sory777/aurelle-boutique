import { ProductCard } from "@/components/product/ProductCard";
import type { DemoProduct } from "@/lib/demo-data";

type ProductGridProps = {
  products: DemoProduct[];
  /** Optional message rendered when the collection is empty. */
  emptyMessage?: string;
};

/**
 * Responsive grid of {@link ProductCard}s shared by the home, category, new,
 * sale, and related-products sections. Two columns on mobile, scaling up to
 * four on large screens, matching the home-page rhythm.
 */
export function ProductGrid({ products, emptyMessage }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-taupe">
        {emptyMessage ?? "No hay piezas disponibles por el momento."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;
