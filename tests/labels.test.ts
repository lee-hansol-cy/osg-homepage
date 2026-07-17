import { describe, expect, test } from "bun:test";
import { getLabelRasterMetrics, OSG_CAP_HEIGHT_RATIO } from "../src/labels";
import { px } from "../src/config";

describe("getLabelRasterMetrics", () => {
  test("rasterizes a 17px Figma label at 4x without shrinking its cap height", () => {
    const metrics = getLabelRasterMetrics(px(71), px(13), 17);

    expect(metrics.canvasWidth).toBe(284);
    expect(metrics.canvasHeight).toBe(52);
    expect(metrics.fontSize).toBe(68);
    expect(metrics.baseline).toBeCloseTo(((13 + 17 * OSG_CAP_HEIGHT_RATIO) / 2) * 4, 8);
    expect(metrics.letterSpacing).toBeCloseTo(0.68, 8);
  });

  test("keeps the 11px function labels at their exact 9px source slot", () => {
    const metrics = getLabelRasterMetrics(px(63), px(9), 11);

    expect(metrics.canvasWidth).toBe(252);
    expect(metrics.canvasHeight).toBe(36);
    expect(metrics.fontSize).toBe(44);
    expect(metrics.baseline).toBeCloseTo(((9 + 11 * OSG_CAP_HEIGHT_RATIO) / 2) * 4, 8);
  });
});
