import { describe, expect, test } from "bun:test";
import { catalogueStepForDpad } from "../src/controls";

describe("catalogueStepForDpad", () => {
  test("moves the catalogue only with the vertical physical arrows", () => {
    expect(catalogueStepForDpad("up")).toBe(-1);
    expect(catalogueStepForDpad("down")).toBe(1);
    expect(catalogueStepForDpad("left")).toBeUndefined();
    expect(catalogueStepForDpad("right")).toBeUndefined();
  });
});
