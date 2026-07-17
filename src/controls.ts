export type DpadDirection = "up" | "right" | "down" | "left";

export type DpadTilt = {
  readonly x: number;
  readonly z: number;
};

export function catalogueStepForDpad(direction: DpadDirection): -1 | 1 | undefined {
  if (direction === "up") return -1;
  if (direction === "down") return 1;
  return undefined;
}

export function dpadTiltForDirection(direction: DpadDirection, angleRadians: number): DpadTilt {
  if (direction === "up") return { x: -angleRadians, z: 0 };
  if (direction === "down") return { x: angleRadians, z: 0 };
  if (direction === "left") return { x: 0, z: angleRadians };
  return { x: 0, z: -angleRadians };
}
