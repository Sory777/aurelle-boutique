"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProductColor } from "@/lib/demo-data";
import { formatPrice } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/payments/config";

type VariantSelectorProps = {
  colors: ProductColor[];
  sizes: string[];
  /** Product slug, used to launch the Virtual Fitting Room for this piece. */
  slug: string;
  /** Display name of the product — included in the WhatsApp order message. */
  productName: string;
  /** Current price (whole USD units) — included in the WhatsApp order message. */
  price: number;
};

/**
 * Color + size selection and the primary purchase actions for the PDP.
 *
 * "Agregar a la bolsa" remains a lightweight local placeholder (the cart lands
 * in a later task — see tasks.md → 12). "Probar virtualmente" and the size
 * guide now navigate to the flagship Virtual Fitting Room (tasks.md → 17).
 * "Comprar por WhatsApp" opens a chat with a pre-filled message containing the
 * product name, price, and the selected color/size (requirement 23.2).
 */
export function VariantSelector({
  colors,
  sizes,
  slug,
  productName,
  price,
}: VariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors[0]?.name ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const tryOnHref = `/p/${slug}/try-on`;

  const whatsappMessage = `Hola AURÉLLE 👋, me interesa "${productName}" (${formatPrice(
    price,
  )}) en color ${selectedColor ?? "-"}, talla ${
    selectedSize ?? "(por elegir)"
  }. ¿Sigue disponible?`;
  const whatsappHref = buildWhatsAppLink(whatsappMessage);

  const handleAddToBag = () => {
    if (!selectedSize) {
      setNotice("Selecciona una talla para continuar.");
      return;
    }
    setNotice(
      `Añadido a la bolsa · ${selectedColor ?? "Color único"} · Talla ${selectedSize}`,
    );
  };

  return (
    <div className="space-y-8">
      {/* Color selector */}
      {colors.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Color</p>
            <p className="text-sm text-taupe">{selectedColor}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((color) => {
              const isActive = color.name === selectedColor;
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.name)}
                  title={color.name}
                  aria-label={`Color ${color.name}`}
                  aria-pressed={isActive}
                  className={`h-9 w-9 rounded-full border transition-all duration-300 ease-luxe ${
                    isActive
                      ? "border-champagne-deep ring-1 ring-champagne-deep ring-offset-2 ring-offset-ivory"
                      : "border-line hover:border-taupe"
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Size selector */}
      {sizes.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Talla</p>
            <Link
              href={tryOnHref}
              className="text-xs uppercase tracking-eyebrow text-taupe underline-offset-4 transition-colors duration-300 ease-luxe hover:text-champagne-deep hover:underline"
            >
              Guía de tallas
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {sizes.map((size) => {
              const isActive = size === selectedSize;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setNotice(null);
                  }}
                  aria-pressed={isActive}
                  className={`min-w-[3rem] border px-4 py-2.5 text-xs uppercase tracking-eyebrow transition-all duration-300 ease-luxe ${
                    isActive
                      ? "border-noir bg-noir text-ivory"
                      : "border-line text-noir hover:border-noir"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 px-9 py-4 text-xs uppercase tracking-eyebrow text-white transition-transform duration-300 ease-luxe hover:scale-[1.01]"
          style={{ backgroundColor: "#25D366" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.967-.94 1.165-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Comprar por WhatsApp
        </a>
        <button
          type="button"
          onClick={handleAddToBag}
          className="btn-primary w-full"
        >
          Agregar a la bolsa
        </button>
        <Link href={tryOnHref} className="btn-ghost w-full">
          Probar virtualmente
        </Link>
      </div>

      {notice && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-champagne-deep"
        >
          {notice}
        </p>
      )}
    </div>
  );
}

export default VariantSelector;
