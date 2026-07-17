export const DEVICE = {
  width: 40,
  panelHeight: 24,
  lowerDepth: 24,
  lowerThickness: 1.8,
  upperThickness: 1.35,
  hingeRadius: 0.62,
  openAngle: 170,
  closedAngle: 0.8,
  buttonTravel: 0.08,
  uiScale: 0.05,
  screenWidth: 24,
  screenHeight: 18,
  bezelWidth: 24.8,
  bezelHeight: 18.8,
  screenCenterY: 12.3,
  dpadX: -16.2,
  controlX: 16.2,
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
