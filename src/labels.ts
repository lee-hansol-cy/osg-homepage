import * as THREE from "three";
import { FIGMA_PIXELS_PER_WORLD_UNIT, px } from "./config";

export const LABEL_RASTER_SCALE = 4;
export const OSG_CAP_HEIGHT_RATIO = 12816 / 16376;

type LabelAlignment = "left" | "center" | "right";

type WorldLabelDimensions = {
  readonly width: number;
  readonly height: number;
  readonly sourceWidthPx?: never;
  readonly sourceHeightPx?: never;
};

type SourceLabelDimensions = {
  readonly width?: never;
  readonly height?: never;
  readonly sourceWidthPx: number;
  readonly sourceHeightPx: number;
};

export type LabelOptions = (WorldLabelDimensions | SourceLabelDimensions) & {
  readonly text: string;
  readonly color?: string;
  readonly fontSizePx?: number;
  readonly weight?: number;
  readonly align?: LabelAlignment;
};

export type LabelRasterMetrics = {
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly fontSize: number;
  readonly baseline: number;
  readonly textX: number;
  readonly letterSpacing: number;
};

/**
 * Figma trims these labels to the font cap edge. OSG Capsules has a measured
 * OpenType cap-height of 12816 / 16376 em, so em-box or line-height centering
 * makes the printed lettering look visibly undersized.
 */
export function getLabelRasterMetrics(
  widthWorld: number,
  heightWorld: number,
  fontSizePx: number,
  align: LabelAlignment = "center",
): LabelRasterMetrics {
  const sourceWidth = widthWorld * FIGMA_PIXELS_PER_WORLD_UNIT;
  const sourceHeight = heightWorld * FIGMA_PIXELS_PER_WORLD_UNIT;
  const canvasWidth = Math.max(1, Math.round(sourceWidth * LABEL_RASTER_SCALE));
  const canvasHeight = Math.max(1, Math.round(sourceHeight * LABEL_RASTER_SCALE));
  const fontSize = fontSizePx * LABEL_RASTER_SCALE;
  const baseline = ((sourceHeight + fontSizePx * OSG_CAP_HEIGHT_RATIO) / 2) * LABEL_RASTER_SCALE;
  const textX = align === "left" ? 0 : align === "right" ? canvasWidth : canvasWidth / 2;
  return {
    canvasWidth,
    canvasHeight,
    fontSize,
    baseline,
    textX,
    letterSpacing: fontSizePx * 0.01 * LABEL_RASTER_SCALE,
  };
}

export function createUvLabel(options: LabelOptions): THREE.Mesh {
  const fontSizePx = options.fontSizePx ?? 17;
  const align = options.align ?? "center";
  const width = options.width ?? px(options.sourceWidthPx);
  const height = options.height ?? px(options.sourceHeightPx);
  const metrics = getLabelRasterMetrics(width, height, fontSizePx, align);
  const canvas = document.createElement("canvas");
  canvas.width = metrics.canvasWidth;
  canvas.height = metrics.canvasHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = options.color ?? "#ffffff";
  context.font = `${options.weight ?? 300} ${metrics.fontSize}px "OSG Capsules"`;
  context.fontKerning = "normal";
  context.textAlign = align;
  context.textBaseline = "alphabetic";
  context.letterSpacing = `${metrics.letterSpacing}px`;
  context.fillText(options.text, metrics.textX, metrics.baseline);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    alphaTest: 0.01,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  label.renderOrder = 4;
  return label;
}
