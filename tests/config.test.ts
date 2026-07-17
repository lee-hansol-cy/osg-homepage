import { describe, expect, test } from "bun:test";
import { DEVICE, FILLET_REFERENCE, FIGMA_PIXELS_PER_WORLD_UNIT, PHYSICAL, UPPER_POCKET_FILLET_REFERENCE, px } from "../src/config";

describe("Figma geometry contract", () => {
  test("derives every primary enclosure dimension from the shared 20:1 scale", () => {
    expect(FIGMA_PIXELS_PER_WORLD_UNIT).toBe(20);
    expect(DEVICE.width).toBe(px(800));
    expect(DEVICE.panelHeight).toBe(px(480));
    expect(DEVICE.bezelWidth).toBe(px(496));
    expect(DEVICE.bezelHeight).toBe(px(376));
    expect(DEVICE.screenWidth).toBe(px(480));
    expect(DEVICE.screenHeight).toBe(px(360));
  });

  test("uses a flush closed contact plane and inset-matched exterior cover edges", () => {
    expect(DEVICE.upperThickness).toBe(px(28));
    expect(DEVICE.lowerThickness).toBe(px(64));
    expect(DEVICE.lowerDepth).toBe(px(541));
    expect(DEVICE.lowerPanelCenterZ).toBe(-px(1.5));
    expect(DEVICE.upperContactFaceZ).toBe(0);
    expect(DEVICE.upperBackFaceZ).toBe(-px(28));
    expect(DEVICE.upperInnerSurfaceZ).toBe(-px(6));
    expect(DEVICE.upperOuterRadius).toBe(px(60));
    expect(DEVICE.upperHingeRadius).toBe(px(10));
    expect(DEVICE.centerHingeRadius).toBe(px(30.5));
    expect(DEVICE.sideHingeTopRadius).toBe(px(8));
    expect(DEVICE.upperInsetOuterRadius).toBeCloseTo(px(54), 10);
    expect(DEVICE.upperInsetHingeRadius).toBeCloseTo(px(4), 10);
    expect(DEVICE.lowerOuterRadius).toBe(px(60));
    expect(DEVICE.lowerHingeRadius).toBe(0);
  });

  test("keeps the enclosure fillet tied to the CSS highlight values", () => {
    expect(FILLET_REFERENCE.radius).toBe(px(12));
    expect(FILLET_REFERENCE.depth).toBe(px(8));
    expect(FILLET_REFERENCE.segments).toBe(12);
  });

  test("keeps the upper pocket fillet inside the six-pixel inset", () => {
    expect(UPPER_POCKET_FILLET_REFERENCE.radius).toBe(px(6));
    expect(UPPER_POCKET_FILLET_REFERENCE.depth).toBe(px(6));
    expect(UPPER_POCKET_FILLET_REFERENCE.segments).toBe(12);
  });

  test("preserves exact hinge and control source envelopes", () => {
    expect(PHYSICAL.hinge.center.coreWidth).toBe(px(610));
    expect(PHYSICAL.hinge.center.coverWidth).toBe(px(608));
    expect(PHYSICAL.hinge.center.coreRadius).toBe(px(20));
    expect(PHYSICAL.hinge.left.width).toBe(px(95));
    expect(PHYSICAL.hinge.right.width).toBe(px(95));
    expect(DEVICE.hingeZ).toBe(-px(270));
    expect(PHYSICAL.button.outerWidth).toBe(px(112));
    expect(PHYSICAL.button.outerHeight).toBe(px(42));
    expect(PHYSICAL.button.outerRadius).toBe(px(21));
    expect(PHYSICAL.button.capRadius).toBe(px(20));
    expect(PHYSICAL.toggle.outerWidth).toBe(px(16));
    expect(PHYSICAL.toggle.outerHeight).toBe(px(40));
    expect(PHYSICAL.toggle.outerRadius).toBe(px(16));
    expect(PHYSICAL.theme.outerRadius).toBe(px(6));
    expect(PHYSICAL.dpad.outerCornerRadius).toBe(px(8));
    expect(PHYSICAL.dpad.innerCornerRadius).toBe(px(7));
    expect(DEVICE.buttonTravel).toBe(px(2.6));
  });
});
