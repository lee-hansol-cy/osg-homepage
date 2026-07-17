import * as THREE from "three";

type LabelOptions = {
  readonly text: string;
  readonly width: number;
  readonly height: number;
  readonly color?: string;
  readonly fontSize?: number;
  readonly weight?: number;
};

export function createUvLabel(options: LabelOptions): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = Math.max(64, Math.round((options.height / options.width) * 512));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = options.color ?? "#ffffff";
  const fontSize = options.fontSize ?? Math.min(104, canvas.height * 0.65);
  context.font = `${options.weight ?? 300} ${fontSize}px OSG Capsules`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.letterSpacing = `${Math.max(1, fontSize * 0.045)}px`;
  context.fillText(options.text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.92, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(options.width, options.height), material);
  label.renderOrder = 4;
  return label;
}
