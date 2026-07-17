import { describe, expect, test } from "bun:test";
import { catalogueStepForDpad, dpadTiltForDirection } from "../src/controls";
import { PHYSICAL, px } from "../src/config";

describe("catalogueStepForDpad", () => {
  test("moves the catalogue only with the vertical physical arrows", () => {
    expect(catalogueStepForDpad("up")).toBe(-1);
    expect(catalogueStepForDpad("down")).toBe(1);
    expect(catalogueStepForDpad("left")).toBeUndefined();
    expect(catalogueStepForDpad("right")).toBeUndefined();
  });

  test("tilts each arrow toward its own cutout edge by the button travel", () => {
    const angle = PHYSICAL.dpad.tiltAngle;
    expect(dpadTiltForDirection("up", angle)).toEqual({ x: -angle, z: 0 });
    expect(dpadTiltForDirection("down", angle)).toEqual({ x: angle, z: 0 });
    expect(dpadTiltForDirection("left", angle)).toEqual({ x: 0, z: angle });
    expect(dpadTiltForDirection("right", angle)).toEqual({ x: 0, z: -angle });
    expect(Math.tan(angle) * (PHYSICAL.dpad.innerSize / 2)).toBeCloseTo(px(2.6), 12);
  });
});
