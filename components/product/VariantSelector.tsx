"use client";

import { useState } from "react";
import type { ProductColor } from "@/lib/demo-data";

type VariantSelectorProps = {
  colors: ProductColor[];
  sizes: string[];
};

/**
 * Color + size selection and the primary purchase actions for the PDP.
 *
 * The "Agregar a la bolsa" and "Probar virtualmente" actions are intentionally
 * non-functional placeholders in this increment — the cart and Virtual Fitting
 * Room land in later tasks (see tasks.md → 12 and 17). They give lightweight
 * local feedback so the page feels alive without any backend dependency.
 */
export function VariantSelector({ colors, sizes }: VariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors[0]?.name ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddToBag = () => {
    if (!selectedSize) {
      setNotice("Selecciona una talla para continuar.");
      return;
    }
    setNotice(
      `Añadido a la bolsa · ${selectedColor ?? "Color único"} · Talla ${selectedSize}`,
    );
  };

  const handleTryOn = () => {
    setNotice("El probador virtual estará disponible muy pronto.");
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
            <button
              type="button"
              onClick={handleTryOn}
              className="text-xs uppercase tracking-eyebrow text-taupe underline-offset-4 transition-colors duration-300 ease-luxe hover:text-champagne-deep hover:underline"
            >
              Guía de tallas
            </button>
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
        <button
          type="button"
          onClick={handleAddToBag}
          className="btn-primary w-full"
        >
          Agregar a la bolsa
        </button>
        <button
          type="button"
          onClick={handleTryOn}
          className="btn-ghost w-full"
        >
          Probar virtualmente
        </button>
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
