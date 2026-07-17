import { describe, expect, test } from "bun:test";
import { getPathParamsForCorner } from "@lisse/core";
import * as THREE from "three";
import { asymmetricRoundedRectShape, centerHingeShape, extrudedMesh, panelShape, roundedRectShape } from "../src/geometry";
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

  test("builds broad CSS-sized fillets with a smooth round profile", () => {
    const mesh = extrudedMesh(roundedRectShape({ width: px(800), height: px(480), radius: px(60) }), {
      thickness: px(36),
      material: new THREE.MeshBasicMaterial(),
      fillet: { radius: px(12), depth: px(8), segments: 12 },
    });
    const options = mesh.geometry.parameters.options as {
      readonly bevelEnabled: boolean;
      readonly bevelSegments: number;
      readonly bevelSize: number;
      readonly bevelThickness: number;
    };

    expect(options.bevelEnabled).toBe(true);
    expect(options.bevelSegments).toBe(12);
    expect(options.bevelSize).toBe(px(12));
    expect(options.bevelThickness).toBe(px(8));
  });

  test("keeps rolled-back surfaces on the legacy four-segment bevel path", () => {
    const mesh = extrudedMesh(roundedRectShape({ width: px(112), height: px(42), radius: px(21) }), {
      thickness: px(1.2),
      material: new THREE.MeshBasicMaterial(),
      bevel: px(0.25),
    });
    const options = mesh.geometry.parameters.options as {
      readonly bevelSegments: number;
      readonly bevelSize: number;
      readonly bevelThickness: number;
    };

    expect(options.bevelSegments).toBe(4);
    expect(options.bevelSize).toBe(px(0.25));
    expect(options.bevelThickness).toBe(px(0.25));
  });

  test("allows an inner fillet to terminate on its adjoining flat face", () => {
    const mesh = extrudedMesh(roundedRectShape({ width: px(784), height: px(464), radius: px(58) }), {
      thickness: px(8),
      material: new THREE.MeshBasicMaterial(),
      fillet: { radius: px(2), depth: px(0.6), segments: 6, bevelOffset: 0 },
    });
    const options = mesh.geometry.parameters.options as { readonly bevelOffset: number };
    expect(options.bevelOffset).toBe(0);
  });

  test("builds the center hinge with a square lower-left union corner", () => {
    const shape = centerHingeShape({ width: px(61), height: px(61), radius: px(30.5) });
    const points = shape.extractPoints(4).shape;
    expect(points[0]?.x).toBe(-px(30.5));
    expect(points[0]?.y).toBe(-px(30.5));
    expect(points.some((point) => point.x === -px(30.5) && point.y > -px(30.5))).toBe(true);
  });

  test("preserves the supplied asymmetric side radii", () => {
    const shape = asymmetricRoundedRectShape({
      width: px(64),
      height: px(541),
      radii: { topLeft: px(0), topRight: px(16), bottomRight: px(16), bottomLeft: px(2) },
    });
    const points = shape.extractPoints(4).shape;
    expect(points.some((point) => point.x === -px(32) && point.y === px(541 / 2))).toBe(true);
    expect(shape.curves.some((curve) => curve instanceof THREE.QuadraticBezierCurve)).toBe(true);
  });
});
