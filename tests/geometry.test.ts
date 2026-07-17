import { describe, expect, test } from "bun:test";
import { getPathParamsForCorner } from "@lisse/core";
import * as THREE from "three";
import { panelShape, roundedRectShape } from "../src/geometry";
import { px } from "../src/config";

describe("continuous enclosure geometry", () => {
  test("starts the 800x480 exterior contour at the half-radius 60px smoothed-corner tangent", () => {
    const radius = px(120);
    const params = getPathParamsForCorner({
      cornerRadius: radius,
      cornerSmoothing: 0.6,
      preserveSmoothing: true,
      roundingAndSmoothingBudget: px(240),
    });
    const shape = panelShape({
      width: px(800),
      height: px(480),
      minYRadius: px(10),
      maxYRadius: radius,
    });
    const first = shape.getPoints(8)[0];

    expect(first).toBeDefined();
    expect(first?.x).toBeCloseTo(-px(400) + params.p, 8);
    expect(first?.y).toBeCloseTo(px(240), 8);
  });

  test("keeps every continuous-corner arc on the short sweep", () => {
    const shape = roundedRectShape({ width: px(112), height: px(42), radius: px(21) });
    const arcs = shape.curves.filter((curve): curve is THREE.EllipseCurve => curve instanceof THREE.EllipseCurve);

    expect(arcs).toHaveLength(4);
    arcs.forEach((arc) => {
      let sweep = arc.aEndAngle - arc.aStartAngle;
      while (sweep < 0) sweep += Math.PI * 2;
      if (arc.aClockwise) sweep = Math.PI * 2 - sweep;
      expect(sweep).toBeLessThanOrEqual(Math.PI / 2);
    });
  });
});
