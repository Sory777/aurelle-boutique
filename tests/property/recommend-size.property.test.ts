import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  recommendSize,
  type BodyType,
} from "@/lib/fitting-room/recommend-size";

/**
 * Property 4 — Size recommendation ∈ available sizes.
 *
 * **Validates: Requirements 9.1, 9.2**
 *
 * For ANY non-empty set of available sizes and ANY combination of (possibly
 * absent) body parameters, the recommended size must be a member of the
 * available sizes and the confidence must lie in the closed interval [0, 1].
 * The fit note must also be one of the three defined qualitative values.
 */
describe("recommendSize — Property 4 (Requirements 9.1, 9.2)", () => {
  const bodyTypes: BodyType[] = [
    "pear",
    "hourglass",
    "rectangle",
    "apple",
    "inverted-triangle",
  ];

  it("recommends a member of availableSizes with confidence in [0, 1]", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        fc.option(fc.double({ min: 120, max: 215, noNaN: true }), {
          nil: undefined,
        }),
        fc.option(fc.double({ min: 35, max: 180, noNaN: true }), {
          nil: undefined,
        }),
        fc.option(fc.constantFrom(...bodyTypes), { nil: undefined }),
        fc.option(fc.string(), { nil: undefined }),
        (availableSizes, heightCm, weightKg, bodyType, usualSize) => {
          const rec = recommendSize({
            availableSizes,
            heightCm,
            weightKg,
            bodyType,
            usualSize,
          });

          // P4: membership is guaranteed.
          expect(availableSizes).toContain(rec.recommendedSize);
          // Confidence bounds.
          expect(rec.confidence).toBeGreaterThanOrEqual(0);
          expect(rec.confidence).toBeLessThanOrEqual(1);
          // Fit note is one of the defined values.
          expect(["ajustado", "regular", "holgado"]).toContain(rec.fitNote);
        },
      ),
    );
  });

  it("holds for realistic apparel size runs and edge body values", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ["XS", "S", "M", "L", "XL"],
          ["S", "M", "L"],
          ["Única"],
          ["36", "38", "40", "42", "44"],
        ),
        fc.option(fc.double({ min: 0, max: 260, noNaN: true }), {
          nil: undefined,
        }),
        fc.option(fc.double({ min: 0, max: 220, noNaN: true }), {
          nil: undefined,
        }),
        (availableSizes, heightCm, weightKg) => {
          const rec = recommendSize({ availableSizes, heightCm, weightKg });
          expect(availableSizes).toContain(rec.recommendedSize);
          expect(rec.confidence).toBeGreaterThanOrEqual(0);
          expect(rec.confidence).toBeLessThanOrEqual(1);
        },
      ),
    );
  });

  it("is deterministic for identical inputs", () => {
    const input = {
      availableSizes: ["XS", "S", "M", "L", "XL"],
      heightCm: 168,
      weightKg: 62,
      bodyType: "hourglass" as const,
    };
    expect(recommendSize(input)).toEqual(recommendSize(input));
  });

  it("throws when availableSizes is empty", () => {
    expect(() => recommendSize({ availableSizes: [] })).toThrow();
  });
});
