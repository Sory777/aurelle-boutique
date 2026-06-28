"use client";

import { useMemo, useState } from "react";
import {
  recommendSize,
  type BodyType,
  type SizeRecommendation,
} from "@/lib/fitting-room/recommend-size";

type SizeRecommenderProps = {
  /** The garment's available sizes (drives the "usual size" select). */
  sizes: string[];
};

const BODY_TYPE_OPTIONS: { value: BodyType; label: string }[] = [
  { value: "hourglass", label: "Reloj de arena" },
  { value: "pear", label: "Triángulo (pera)" },
  { value: "rectangle", label: "Rectángulo" },
  { value: "apple", label: "Óvalo (manzana)" },
  { value: "inverted-triangle", label: "Triángulo invertido" },
];

const FIT_NOTE_COPY: Record<SizeRecommendation["fitNote"], string> = {
  ajustado: "Ajustado al cuerpo",
  regular: "Caída regular",
  holgado: "Caída holgada",
};

/** Parse an optional positive number from a form input value. */
function parsePositive(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * A small, elegant form that runs the deterministic {@link recommendSize}
 * algorithm entirely in the browser. No measurements are uploaded — the
 * recommendation is computed locally from the values entered here.
 */
export function SizeRecommender({ sizes }: SizeRecommenderProps) {
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bodyType, setBodyType] = useState<BodyType | "">("");
  const [usualSize, setUsualSize] = useState("");
  const [result, setResult] = useState<SizeRecommendation | null>(null);

  const safeSizes = useMemo(
    () => (sizes.length > 0 ? sizes : ["Única"]),
    [sizes],
  );

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(
      recommendSize({
        availableSizes: safeSizes,
        heightCm: parsePositive(heightCm),
        weightKg: parsePositive(weightKg),
        bodyType: bodyType === "" ? undefined : bodyType,
        usualSize: usualSize === "" ? undefined : usualSize,
      }),
    );
  };

  const inputClass =
    "mt-2 w-full border border-line bg-ivory px-4 py-3 text-sm text-noir outline-none transition-colors duration-300 ease-luxe focus:border-champagne-deep";
  const labelClass = "eyebrow";

  return (
    <div className="border border-line bg-white/40 p-6 sm:p-8">
      <p className="eyebrow text-champagne-deep">Talla a medida</p>
      <h2 className="mt-2 font-display text-2xl font-medium text-noir">
        Encuentra tu talla ideal
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-taupe">
        Comparte algunos datos opcionales y calcularemos la talla recomendada
        para esta pieza. El cálculo ocurre en tu dispositivo.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sr-height" className={labelClass}>
              Altura (cm)
            </label>
            <input
              id="sr-height"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="168"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sr-weight" className={labelClass}>
              Peso (kg)
            </label>
            <input
              id="sr-weight"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="62"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sr-body" className={labelClass}>
              Tipo de cuerpo
            </label>
            <select
              id="sr-body"
              value={bodyType}
              onChange={(event) =>
                setBodyType(event.target.value as BodyType | "")
              }
              className={inputClass}
            >
              <option value="">Sin especificar</option>
              {BODY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sr-usual" className={labelClass}>
              Talla habitual
            </label>
            <select
              id="sr-usual"
              value={usualSize}
              onChange={(event) => setUsualSize(event.target.value)}
              className={inputClass}
            >
              <option value="">Sin especificar</option>
              {safeSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full">
          Calcular mi talla
        </button>
      </form>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className="mt-7 border-t border-line pt-6"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Talla recomendada</p>
              <p className="mt-1 font-display text-4xl font-medium text-champagne-deep">
                {result.recommendedSize}
              </p>
            </div>
            <p className="text-sm text-taupe">{FIT_NOTE_COPY[result.fitNote]}</p>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-eyebrow text-taupe">
              <span>Confianza</span>
              <span className="tabular-nums">{confidencePct}%</span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden bg-line">
              <div
                className="h-full bg-champagne-deep transition-all duration-500 ease-luxe"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SizeRecommender;
