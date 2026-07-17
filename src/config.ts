export const FIGMA_PIXELS_PER_WORLD_UNIT = 20;

export function px(sourcePixels: number): number {
  return sourcePixels / FIGMA_PIXELS_PER_WORLD_UNIT;
}

export const EXTERIOR_CURVE_SCALE = 0.5;

export function exteriorRadius(sourcePixels: number): number {
  return px(sourcePixels * EXTERIOR_CURVE_SCALE);
}

const panelCenterX = (left: number, width: number): number => px(left + width / 2 - 400);
const upperCenterY = (top: number, height: number): number => px(480 - top - height / 2);
const lowerCenterZ = (top: number, height: number): number => px(top + height / 2 - 240);

const upperContactFaceZ = 0;
const upperThickness = px(36);
const upperBackFaceZ = upperContactFaceZ - upperThickness;

export const DEVICE = {
  width: px(800),
  panelHeight: px(480),
  lowerDepth: px(480),
  lowerThickness: px(63),
  upperThickness,
  upperContactFaceZ,
  upperBackFaceZ,
  upperBodyCenterZ: (upperContactFaceZ + upperBackFaceZ) / 2,
  upperInsetDepth: px(8),
  upperInnerSurfaceZ: -px(8),
  upperInternalClearance: px(1.2),
  upperInternalMaxZ: upperContactFaceZ - px(1.2),
  lowerSurfaceY: px(18),
  cornerSmoothing: 0.6,
  upperOuterRadius: exteriorRadius(120),
  upperHingeRadius: exteriorRadius(20),
  upperInsetOuterRadius: exteriorRadius(116),
  upperInsetHingeRadius: exteriorRadius(16),
  lowerOuterRadius: exteriorRadius(120),
  lowerHingeRadius: 0,
  hingeEnvelope: px(60),
  hingeRadius: px(30),
  hingeAxisY: px(18),
  hingeZ: -px(270),
  openAngle: 170,
  closedAngle: 0,
  screenVisibilityAngle: 145,
  hingeSettleEpsilon: 0.15,
  buttonTravel: px(2.6),
  wellFloorInset: px(2.4),
  uiScale: px(1),
  screenWidth: px(480),
  screenHeight: px(360),
  bezelWidth: px(496),
  bezelHeight: px(376),
  lowerBezelRadius: exteriorRadius(10),
  upperBezelRadius: exteriorRadius(10),
  screenCenterY: upperCenterY(46, 376),
  lowerScreenCenterZ: lowerCenterZ(56, 376),
  dpadX: panelCenterX(20, 112),
  controlX: panelCenterX(668, 112),
} as const;

export const PHYSICAL = {
  hinge: {
    center: { coreWidth: px(610), coverWidth: px(608), coreRadius: px(20), x: 0 },
    left: { width: px(95), x: panelCenterX(0, 95) },
    right: { width: px(95), x: panelCenterX(705, 95) },
  },
  dpad: {
    x: panelCenterX(20, 112),
    z: lowerCenterZ(189, 112),
    outerSize: px(112),
    outerArm: px(42),
    outerCornerRadius: px(8),
    innerSize: px(110),
    innerArm: px(40),
    innerCornerRadius: px(7),
    tiltAngle: Math.atan(px(2.6) / (px(110) / 2)),
    dotRadius: px(1.68074),
    dots: {
      up: [[-8.319, -38], [-4.16, -42.16], [4.16, -42.16], [8.319, -38], [0, -46.319]],
      right: [[37, -9.319], [41.16, -5.16], [41.16, 3.16], [37, 7.319], [45.319, -1]],
      down: [[-8.319, 36], [-4.16, 40.16], [4.16, 40.16], [8.319, 36], [0, 44.319]],
      left: [[-37, -9.319], [-41.16, -5.16], [-41.16, 3.16], [-37, 7.319], [-45.319, -1]],
    },
  },
  buttons: [
    { action: "artworks", text: "Artworks", top: 179, labelWidthPx: 71 },
    { action: "fonts", text: "Fonts", top: 225, labelWidthPx: 45 },
    { action: "tools", text: "Tools", top: 271, labelWidthPx: 43 },
  ],
  button: {
    x: panelCenterX(668, 112),
    outerWidth: px(112),
    outerHeight: px(42),
    outerRadius: exteriorRadius(42),
    capWidth: px(110),
    capHeight: px(40),
    capRadius: exteriorRadius(40),
    labelHeightPx: 13,
    labelFontSizePx: 17,
  },
  toggle: {
    x: panelCenterX(672, 16),
    z: lowerCenterZ(360, 40),
    outerWidth: px(16),
    outerHeight: px(40),
    outerRadius: exteriorRadius(32),
    handleWidth: px(14),
    handleHeight: px(22),
    handleRadius: exteriorRadius(14),
    onZ: lowerCenterZ(361, 22),
    offZ: lowerCenterZ(377, 22),
    labelX: panelCenterX(701, 43),
    labelZ: lowerCenterZ(368, 22),
    labelWidthPx: 43,
    labelHeightPx: 22,
    labelFontSizePx: 11,
  },
  theme: {
    x: panelCenterX(672, 16),
    z: lowerCenterZ(412, 16),
    outerRadius: exteriorRadius(12),
    capRadius: exteriorRadius(15),
    labelX: panelCenterX(701, 63),
    labelZ: lowerCenterZ(415, 9),
    labelWidthPx: 63,
    labelHeightPx: 9,
    labelFontSizePx: 11,
  },
  indicators: [
    { text: "Audio", labelX: panelCenterX(755, 28), labelZ: lowerCenterZ(43, 9), ledZ: lowerCenterZ(47, 3), labelWidthPx: 28 },
    { text: "Power", labelX: panelCenterX(751, 32), labelZ: lowerCenterZ(92, 9), ledZ: lowerCenterZ(96, 3), labelWidthPx: 32 },
  ],
  speakerX: [px(-340), px(-308), px(308), px(340)],
  speakerY: [upperCenterY(203.432, 8), upperCenterY(235.432, 8), upperCenterY(267.432, 8), upperCenterY(299.432, 8)],
  speakerRadius: px(4),
  camera: {
    x: panelCenterX(390, 20),
    y: upperCenterY(22, 20),
    frameRadius: px(10),
    lensRadius: px(4),
    ledX: panelCenterX(416, 12),
    ledY: upperCenterY(30, 4),
    ledWidth: px(12),
    ledHeight: px(4),
  },
  badge: {
    x: panelCenterX(368, 64),
    y: upperCenterY(427, 36),
    width: px(64),
    height: px(36),
    radius: exteriorRadius(16),
    border: px(2),
  },
  outerLogo: {
    width: px(128),
    height: px(202.51),
    x: panelCenterX(336, 128),
    y: upperCenterY(108.75, 202.51),
  },
} as const;

export type Work = {
  readonly title: string;
  readonly duration: string;
  readonly category: string;
  readonly summary: string;
  readonly palette: readonly [string, string, string];
};

export const WORKS: readonly Work[] = [
  { title: "Liminal Bloom", duration: "2025.01.01.", category: "IDENTITY", summary: "A living identity system grown from soft geometry and generative rhythm.", palette: ["#ff81ea", "#27122b", "#fff6fd"] },
  { title: "Afterimage", duration: "2025.01.01.", category: "MOTION", summary: "An optical title sequence built around persistence, repetition, and light.", palette: ["#8c6cff", "#130b31", "#ede8ff"] },
  { title: "Mono Garden", duration: "2025.01.01.", category: "DIGITAL", summary: "A calm editorial archive where every interaction reveals another layer.", palette: ["#96e6bd", "#0e2c23", "#effff6"] },
  { title: "Soft Circuit", duration: "2025.01.01.", category: "PRODUCT", summary: "A tactile music object that makes software feel warm, direct, and physical.", palette: ["#ffb27a", "#35180c", "#fff3e9"] },
  { title: "Blue Hour", duration: "2026.01.01.", category: "FILM", summary: "A visual study of the thin boundary between a city and its reflection.", palette: ["#63b8ff", "#071c35", "#eaf6ff"] },
  { title: "Common Ground", duration: "2025.01.01.", category: "SPACE", summary: "An adaptive exhibition system for collective making and public exchange.", palette: ["#f7e36f", "#302b0b", "#fffce8"] },
  { title: "Future Relic", duration: "2025.01.01.", category: "OBJECT", summary: "Speculative tools shaped as if they had already accumulated a history.", palette: ["#ff6c8c", "#330914", "#fff0f4"] },
  { title: "Signal / Noise", duration: "2025.01.01.", category: "RESEARCH", summary: "A visual index for noticing patterns inside overwhelming information.", palette: ["#68e3dd", "#062d2b", "#ecfffe"] },
  { title: "OSG System", duration: "2025.01.01.", category: "PLATFORM", summary: "The folding portfolio itself: identity, interface, object, and interaction.", palette: ["#ff81ea", "#100b10", "#ffffff"] },
] as const;
