import { describe, expect, it } from "vitest";
import { fieldStage } from "./fieldStage";

/** wave steepness: amplitude over wavelength, both proportional to the stage */
const steepness = (w: number, h: number) => {
  const s = fieldStage(w, h);
  return s.v / s.width;
};

describe("fieldStage", () => {
  it("leaves desktop and wide boxes as they were", () => {
    expect(fieldStage(1440, 900)).toEqual({ width: 1440, v: 900, offset: 0 });
    expect(fieldStage(1920, 980)).toEqual({ width: 1920, v: 980, offset: 0 });
    expect(fieldStage(1440, 500)).toEqual({ width: 1440, v: 500, offset: 0 });
  });

  it("keeps the desktop wave proportions on a portrait phone", () => {
    const desktop = steepness(1440, 900);
    expect(steepness(390, 844)).toBeLessThanOrEqual(desktop + 1e-9);
    expect(steepness(360, 740)).toBeLessThanOrEqual(desktop + 1e-9);
  });

  it("crops a wider stage evenly on both sides of a narrow box", () => {
    const s = fieldStage(390, 844);
    expect(s.width).toBeGreaterThan(390);
    expect(s.offset).toBeCloseTo((s.width - 390) / 2);
  });
});
