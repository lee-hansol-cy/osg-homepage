export type DpadDirection = "up" | "right" | "down" | "left";

export function catalogueStepForDpad(direction: DpadDirection): -1 | 1 | undefined {
  if (direction === "up") return -1;
  if (direction === "down") return 1;
  return undefined;
}
