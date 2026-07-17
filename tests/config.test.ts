import { describe, expect, test } from "bun:test";
import { DEVICE, FIGMA_PIXELS_PER_WORLD_UNIT, PHYSICAL, px } from "../src/config";

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

  test("keeps the requested shell thickness and edge-radius overrides exact", () => {
    expect(DEVICE.upperThickness).toBe(1.35);
    expect(DEVICE.lowerThickness).toBe(3.15);
    expect(DEVICE.upperOuterRadius).toBe(px(4));
    expect(DEVICE.lowerOuterRadius).toBe(px(16));
    expect(DEVICE.matingRadius).toBe(px(2));
  });

  test("preserves exact hinge and control source envelopes", () => {
    expect(PHYSICAL.hinge.center.width).toBe(px(610));
    expect(PHYSICAL.hinge.left.width).toBe(px(95));
    expect(PHYSICAL.hinge.right.width).toBe(px(95));
    expect(DEVICE.hingeZ).toBe(-px(270));
    expect(PHYSICAL.button.outerWidth).toBe(px(112));
    expect(PHYSICAL.button.outerHeight).toBe(px(42));
    expect(PHYSICAL.toggle.outerWidth).toBe(px(16));
    expect(PHYSICAL.toggle.outerHeight).toBe(px(40));
  });
});
