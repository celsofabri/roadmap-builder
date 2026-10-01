import { describe, expect, it } from 'vitest';
import {
  LEGIBILITY_FLOOR,
  MIN_SCALE,
  computeFit,
  computeGridOffsets,
  rulerLabelStride,
} from './fullscreenFit';

const TOLERANCE_PX = 0.5;

describe('computeFit', () => {
  it('F2: 12 months in 1280x720 fills the width without a per-day minimum', () => {
    const fit = computeFit({ viewportW: 1280, viewportH: 720, naturalH: 500, totalDays: 261 });
    expect(fit.scale).toBe(1);
    expect(fit.logicalW).toBe(1280);
    // (1280 - 220) / 261 ≈ 4.06px/day: below the 5px MIN_DAY_WIDTH of the interactive view.
    expect(fit.dayWidth).toBeCloseTo((1280 - 220) / 261, 5);
    expect(fit.dayWidth).toBeLessThan(5);
    expect(fit.belowFloor).toBe(false);
  });

  it('F3: dense roadmap in 1366x768 scales down uniformly to fit the height', () => {
    const fit = computeFit({ viewportW: 1366, viewportH: 768, naturalH: 1536, totalDays: 261 });
    expect(fit.scale).toBeCloseTo(0.5, 5);
    expect(fit.logicalW * fit.scale).toBeCloseTo(1366, 5);
    expect(fit.logicalW).toBeCloseTo(2732, 5);
  });

  it('F15: small roadmap never enlarges and stretches the grid in width', () => {
    const fit = computeFit({ viewportW: 1280, viewportH: 720, naturalH: 200, totalDays: 21 });
    expect(fit.scale).toBe(1);
    expect(fit.dayWidth).toBeCloseTo((1280 - 220) / 21, 5);
  });

  it('F10: 360x640 uses the narrow label column and still fits', () => {
    const fit = computeFit({ viewportW: 360, viewportH: 640, naturalH: 1000, totalDays: 261 });
    expect(fit.scale).toBeCloseTo(0.64, 5);
    expect(fit.labelWidth).toBe(150);
    expect(fit.logicalW * fit.scale).toBeCloseTo(360, 5);
  });

  it('F16: very dense roadmap goes below the legibility floor but still fits', () => {
    const fit = computeFit({ viewportW: 1366, viewportH: 768, naturalH: 3000, totalDays: 261 });
    expect(fit.scale).toBeLessThan(LEGIBILITY_FLOOR);
    expect(fit.belowFloor).toBe(true);
    expect(fit.logicalW * fit.scale).toBeCloseTo(1366, 5);
  });

  it('F22: daily-sized period still ignores any minimum day width', () => {
    const fit = computeFit({ viewportW: 1280, viewportH: 720, naturalH: 400, totalDays: 520 });
    expect(fit.dayWidth).toBeGreaterThan(0);
    expect(fit.dayWidth).toBeLessThan(2.1);
  });

  it('clamps the scale to MIN_SCALE for absurdly tall content', () => {
    const fit = computeFit({ viewportW: 1000, viewportH: 100, naturalH: 1_000_000, totalDays: 100 });
    expect(fit.scale).toBe(MIN_SCALE);
    expect(Number.isFinite(fit.logicalW)).toBe(true);
    expect(fit.dayWidth).toBeGreaterThan(0);
  });

  it('limits the label column to 40% of the logical width in a tiny window', () => {
    const fit = computeFit({ viewportW: 200, viewportH: 600, naturalH: 600, totalDays: 50 });
    expect(fit.labelWidth).toBeCloseTo(200 * 0.4, 5);
    expect(fit.dayWidth).toBeGreaterThan(0);
  });

  it.each([
    [0, 0, 0],
    [-5, -5, 0],
    [0, 720, 500],
    [1280, 0, 500],
    [1280, 720, 0],
    [Number.NaN, 720, 500],
  ])('does not break with unmeasured sizes (w=%s h=%s naturalH=%s)', (w, h, natural) => {
    const fit = computeFit({ viewportW: w, viewportH: h, naturalH: natural, totalDays: 0 });
    expect(fit.scale).toBeGreaterThan(0);
    expect(fit.scale).toBeLessThanOrEqual(1);
    expect(fit.dayWidth).toBeGreaterThan(0);
    expect(Number.isFinite(fit.logicalW)).toBe(true);
  });

  it('invariants hold across a grid of viewports and heights', () => {
    for (const w of [320, 360, 768, 1280, 1920, 3440]) {
      for (const h of [400, 640, 720, 1080]) {
        for (const naturalH of [100, 700, 900, 2500, 9000]) {
          for (const totalDays of [1, 21, 261, 1000]) {
            const fit = computeFit({ viewportW: w, viewportH: h, naturalH, totalDays });
            expect(fit.scale).toBeLessThanOrEqual(1);
            expect(Math.abs(fit.logicalW * fit.scale - w)).toBeLessThanOrEqual(TOLERANCE_PX);
            expect(fit.dayWidth).toBeGreaterThan(0);
            expect(fit.labelWidth).toBeLessThanOrEqual(fit.logicalW * 0.4 + 1e-9);
            // No vertical overflow: scaled height fits (unless clamped at MIN_SCALE).
            if (fit.scale > MIN_SCALE) expect(naturalH * fit.scale).toBeLessThanOrEqual(h + 1e-6);
          }
        }
      }
    }
  });

  describe('hysteresis', () => {
    const base = { viewportW: 1280, viewportH: 720, naturalH: 1000, totalDays: 261 };

    it('keeps a slightly smaller previous scale (still fits)', () => {
      const raw = computeFit(base).scale; // 0.72
      const fit = computeFit({ ...base, previousScale: raw - 0.003 });
      expect(fit.scale).toBe(raw - 0.003);
      expect(1000 * fit.scale).toBeLessThanOrEqual(720);
    });

    it('never keeps a larger previous scale, which would overflow', () => {
      const raw = computeFit(base).scale;
      const fit = computeFit({ ...base, previousScale: raw + 0.003 });
      expect(fit.scale).toBe(raw);
    });

    it('adopts the new scale when the change is larger than the threshold', () => {
      const raw = computeFit(base).scale;
      expect(computeFit({ ...base, previousScale: raw - 0.05 }).scale).toBe(raw);
    });
  });
});

describe('rulerLabelStride', () => {
  it('labels every cell when they are wide enough', () => {
    expect(rulerLabelStride([100, 100, 100], 44)).toBe(1);
  });

  it('skips cells when they are too narrow (3 years on a small screen)', () => {
    expect(rulerLabelStride(Array(36).fill(15), 44)).toBe(3);
  });

  it('is not thrown off by a short partial cell at the edge', () => {
    expect(rulerLabelStride([4, 50, 50, 50, 50, 50, 20], 44)).toBe(1);
  });

  it('returns 1 for empty, zero or invalid widths', () => {
    expect(rulerLabelStride([], 44)).toBe(1);
    expect(rulerLabelStride([0, 0], 44)).toBe(1);
    expect(rulerLabelStride([Number.NaN], 44)).toBe(1);
    expect(rulerLabelStride([10], 0)).toBe(1);
  });

  it('does not mutate its input', () => {
    const input = [30, 10, 20];
    rulerLabelStride(input, 44);
    expect(input).toEqual([30, 10, 20]);
  });
});

describe('computeGridOffsets', () => {
  it('returns cumulative boundaries and omits the last edge', () => {
    expect(computeGridOffsets([21, 20, 22], 2)).toEqual([42, 82]);
  });

  it('returns nothing for zero or one cell', () => {
    expect(computeGridOffsets([], 5)).toEqual([]);
    expect(computeGridOffsets([21], 5)).toEqual([]);
  });

  it('matches the original inline computation', () => {
    const cells = [{ n: 21 }, { n: 20 }, { n: 22 }, { n: 21 }];
    const dayWidth = 7.3;
    let x = 0;
    const legacy: number[] = [];
    for (const c of cells) {
      x += c.n * dayWidth;
      legacy.push(x);
    }
    expect(computeGridOffsets(cells.map((c) => c.n), dayWidth)).toEqual(legacy.slice(0, -1));
  });
});
