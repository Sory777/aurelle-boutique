/**
 * Deterministic, pure size-recommendation algorithm for the AURÉLLE Virtual
 * Fitting Room.
 *
 * This mirrors the design's `recommendSize` contract
 * (.kiro/specs/luxury-womens-boutique/design.md → "Size Recommendation") and
 * guarantees correctness **Property 4**:
 *
 *   - `recommendedSize ∈ availableSizes`  (chosen by INDEX into the available
 *     set, so membership is structurally guaranteed)
 *   - `confidence ∈ [0, 1]`
 *   - `fitNote ∈ {"ajustado", "regular", "holgado"}`
 *
 * It is intentionally framework-free and side-effect free so it can run in the
 * browser (no API key, no per-call cost) and be exhaustively property-tested.
 */

export type BodyType =
  | "pear"
  | "hourglass"
  | "rectangle"
  | "apple"
  | "inverted-triangle";

/** Qualitative fit note, in Spanish to match the storefront copy. */
export type FitNote = "ajustado" | "regular" | "holgado";

export interface RecommendSizeInput {
  /** The garment's available sizes. MUST be non-empty. */
  availableSizes: string[];
  /** Optional body height in centimetres. */
  heightCm?: number;
  /** Optional body weight in kilograms. */
  weightKg?: number;
  /** Optional body-shape hint. */
  bodyType?: BodyType;
  /** The size the shopper usually buys (used when measurements are absent). */
  usualSize?: string;
}

export interface SizeRecommendation {
  /** Always a member of `input.availableSizes`. */
  recommendedSize: string;
  /** Confidence in the closed interval [0, 1]. */
  confidence: number;
  /** Qualitative fit relative to the chosen size. */
  fitNote: FitNote;
}

/**
 * Canonical ordering of common alphabetic apparel sizes. Used to find the
 * "nearest" available size when matching a historical/usual size.
 */
const ALPHA_SIZE_ORDER: Record<string, number> = {
  XXS: 0,
  XS: 1,
  S: 2,
  M: 3,
  L: 4,
  XL: 5,
  XXL: 6,
  "2XL": 6,
  XXXL: 7,
  "3XL": 7,
};

/** Lower/upper BMI bounds used to normalise body metrics onto [0, 1]. */
const BMI_MIN = 16;
const BMI_MAX = 34;

/** A small, deterministic nudge applied per body type. */
const BODY_TYPE_NUDGE: Record<BodyType, number> = {
  pear: 0.02,
  hourglass: -0.02,
  rectangle: 0,
  apple: 0.06,
  "inverted-triangle": 0.04,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/** Whether a numeric body measurement is usable (finite and strictly positive). */
function isUsableMeasurement(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Map a size label onto a numeric ordinal for nearest-size matching.
 * Alphabetic sizes use {@link ALPHA_SIZE_ORDER}; otherwise a leading number is
 * parsed (e.g. "38"); unknown labels fall back to their position in the list.
 */
function sizeOrdinal(label: string, fallbackIndex: number): number {
  const normalized = label.trim().toUpperCase();
  if (normalized in ALPHA_SIZE_ORDER) {
    return ALPHA_SIZE_ORDER[normalized];
  }
  const numeric = Number.parseFloat(normalized);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return fallbackIndex;
}

/**
 * Index of the available size nearest to `target`. Ties resolve to the lower
 * index. Always returns a valid index into `availableSizes`.
 */
function indexOfNearest(target: string, availableSizes: string[]): number {
  // Exact match wins.
  const exact = availableSizes.indexOf(target);
  if (exact !== -1) {
    return exact;
  }

  const targetOrdinal = sizeOrdinal(target, 0);
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  availableSizes.forEach((size, index) => {
    const distance = Math.abs(sizeOrdinal(size, index) - targetOrdinal);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

/** Round and clamp a (possibly non-finite) ideal index into a valid range. */
function clampIndex(ideal: number, length: number): number {
  if (!Number.isFinite(ideal)) {
    return Math.floor((length - 1) / 2);
  }
  return clamp(Math.round(ideal), 0, length - 1);
}

/** Classify the fit by comparing the continuous ideal to the chosen index. */
function classifyFit(continuousIdeal: number, chosenIndex: number): FitNote {
  if (!Number.isFinite(continuousIdeal)) {
    return "regular";
  }
  const delta = continuousIdeal - chosenIndex;
  if (delta > 0.33) {
    // Body sits above the chosen size → the garment runs tight.
    return "ajustado";
  }
  if (delta < -0.33) {
    // Body sits below the chosen size → the garment runs loose.
    return "holgado";
  }
  return "regular";
}

/**
 * Recommend a size for a garment. Pure and deterministic.
 *
 * @throws {Error} when `availableSizes` is empty.
 */
export function recommendSize(input: RecommendSizeInput): SizeRecommendation {
  const { availableSizes, heightCm, weightKg, bodyType, usualSize } = input;

  if (!Array.isArray(availableSizes) || availableSizes.length === 0) {
    throw new Error("recommendSize: availableSizes must be non-empty");
  }

  const length = availableSizes.length;
  const median = Math.floor((length - 1) / 2);

  let continuousIdeal: number;
  let confidence: number;

  if (isUsableMeasurement(heightCm) && isUsableMeasurement(weightKg)) {
    // Highest-signal path: derive a BMI-driven position on the size spectrum.
    const heightM = heightCm / 100;
    const bmi = clamp(weightKg / (heightM * heightM), BMI_MIN, BMI_MAX);
    let fraction = (bmi - BMI_MIN) / (BMI_MAX - BMI_MIN);
    if (bodyType) {
      fraction += BODY_TYPE_NUDGE[bodyType];
    }
    fraction = clamp01(fraction);
    continuousIdeal = fraction * (length - 1);
    confidence = 0.85;
  } else if (typeof usualSize === "string" && usualSize.length > 0) {
    // Fall back to the available size closest to the shopper's usual size.
    continuousIdeal = indexOfNearest(usualSize, availableSizes);
    confidence = 0.6;
  } else {
    // No signal: default to the middle of the range with low confidence.
    continuousIdeal = median;
    confidence = 0.4;
  }

  const idx = clampIndex(continuousIdeal, length);

  return {
    recommendedSize: availableSizes[idx],
    confidence,
    fitNote: classifyFit(continuousIdeal, idx),
  };
}

export default recommendSize;
