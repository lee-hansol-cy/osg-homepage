import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export const COLORS = {
  shell: 0xff81ea,
  shellDeep: 0xf02bd1,
  shellShadow: 0xb94fa8,
  control: 0xfbe1f6,
  ink: 0x100b10,
  chrome: 0xc9c9c9,
  led: 0xffffff,
  lensA: 0x3c00a3,
  lensB: 0x0a0090,
} as const;

function createAbsMicrotexture(): THREE.DataTexture {
  const size = 64;
  const pixels = new Uint8Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const coarse = (x * 37 + y * 61 + ((x * y) % 23) * 17) % 53;
      const fine = ((x + y * 3) % 7) * 3;
      pixels[y * size + x] = 176 + coarse + fine;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 18);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const absMicrotexture = createAbsMicrotexture();

export const materials = {
  shell: new THREE.MeshPhysicalMaterial({ color: COLORS.shell, emissive: COLORS.shell, emissiveIntensity: 0.34, roughness: 0.27, metalness: 0, clearcoat: 0.62, clearcoatRoughness: 0.16, specularIntensity: 0.36, bumpMap: absMicrotexture, bumpScale: 0.018, roughnessMap: absMicrotexture }),
  shellDeep: new THREE.MeshPhysicalMaterial({ color: COLORS.shellDeep, roughness: 0.3, metalness: 0, clearcoat: 0.78, clearcoatRoughness: 0.18, bumpMap: absMicrotexture, bumpScale: 0.012 }),
  control: new THREE.MeshPhysicalMaterial({ color: COLORS.control, roughness: 0.28, metalness: 0, clearcoat: 0.82, clearcoatRoughness: 0.16, bumpMap: absMicrotexture, bumpScale: 0.01 }),
  ink: new THREE.MeshPhysicalMaterial({ color: COLORS.ink, roughness: 0.4, metalness: 0.02, clearcoat: 0.2 }),
  screen: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.84, metalness: 0, clearcoat: 0.1, clearcoatRoughness: 0.76, transparent: true, opacity: 0.08, depthWrite: false }),
  chrome: new THREE.MeshPhysicalMaterial({ color: 0x888888, roughness: 0.13, metalness: 1, clearcoat: 0.82, clearcoatRoughness: 0.06 }),
  chromeRim: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, metalness: 0.82, clearcoat: 0.95, clearcoatRoughness: 0.035 }),
  lensCore: new THREE.MeshStandardMaterial({ color: COLORS.lensA, emissive: COLORS.lensB, emissiveIntensity: 0.72, roughness: 0.42, metalness: 0.05 }),
  lensGlass: new THREE.MeshPhysicalMaterial({ color: 0x8e95ff, roughness: 0.025, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.015, transparent: true, opacity: 0.18, depthWrite: false }),
  led: new THREE.MeshStandardMaterial({ color: COLORS.led, emissive: COLORS.led, emissiveIntensity: 2.6, roughness: 0.25 }),
  portVoid: new THREE.MeshStandardMaterial({ color: 0x050305, roughness: 0.82, metalness: 0 }),
} as const;

type RoundedRectSpec = {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly x?: number;
  readonly y?: number;
};

function traceRoundedRect(path: THREE.Path, spec: RoundedRectSpec, clockwise: boolean): void {
  const halfWidth = spec.width / 2;
  const halfHeight = spec.height / 2;
  const radius = Math.min(spec.radius, halfWidth, halfHeight);
  const x = spec.x ?? 0;
  const y = spec.y ?? 0;
  if (clockwise) {
    path.moveTo(x - halfWidth + radius, y - halfHeight);
    path.quadraticCurveTo(x - halfWidth, y - halfHeight, x - halfWidth, y - halfHeight + radius);
    path.lineTo(x - halfWidth, y + halfHeight - radius);
    path.quadraticCurveTo(x - halfWidth, y + halfHeight, x - halfWidth + radius, y + halfHeight);
    path.lineTo(x + halfWidth - radius, y + halfHeight);
    path.quadraticCurveTo(x + halfWidth, y + halfHeight, x + halfWidth, y + halfHeight - radius);
    path.lineTo(x + halfWidth, y - halfHeight + radius);
    path.quadraticCurveTo(x + halfWidth, y - halfHeight, x + halfWidth - radius, y - halfHeight);
  } else {
    path.moveTo(x - halfWidth + radius, y - halfHeight);
    path.lineTo(x + halfWidth - radius, y - halfHeight);
    path.quadraticCurveTo(x + halfWidth, y - halfHeight, x + halfWidth, y - halfHeight + radius);
    path.lineTo(x + halfWidth, y + halfHeight - radius);
    path.quadraticCurveTo(x + halfWidth, y + halfHeight, x + halfWidth - radius, y + halfHeight);
    path.lineTo(x - halfWidth + radius, y + halfHeight);
    path.quadraticCurveTo(x - halfWidth, y + halfHeight, x - halfWidth, y + halfHeight - radius);
    path.lineTo(x - halfWidth, y - halfHeight + radius);
    path.quadraticCurveTo(x - halfWidth, y - halfHeight, x - halfWidth + radius, y - halfHeight);
  }
  path.closePath();
}

export function roundedRectShape(spec: RoundedRectSpec): THREE.Shape {
  const shape = new THREE.Shape();
  traceRoundedRect(shape, spec, false);
  return shape;
}

export function roundedRectHole(spec: RoundedRectSpec): THREE.Path {
  const path = new THREE.Path();
  traceRoundedRect(path, spec, true);
  return path;
}

export function circleHole(spec: { readonly x: number; readonly y: number; readonly radius: number }): THREE.Path {
  const path = new THREE.Path();
  path.absarc(spec.x, spec.y, spec.radius, 0, Math.PI * 2, true);
  return path;
}

export function panelShape(spec: {
  readonly width: number;
  readonly height: number;
  readonly minYRadius: number;
  readonly maxYRadius: number;
  readonly holes?: readonly THREE.Path[];
}): THREE.Shape {
  const halfWidth = spec.width / 2;
  const halfHeight = spec.height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + spec.minYRadius, -halfHeight);
  shape.lineTo(halfWidth - spec.minYRadius, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + spec.minYRadius);
  shape.lineTo(halfWidth, halfHeight - spec.maxYRadius);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - spec.maxYRadius, halfHeight);
  shape.lineTo(-halfWidth + spec.maxYRadius, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - spec.maxYRadius);
  shape.lineTo(-halfWidth, -halfHeight + spec.minYRadius);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + spec.minYRadius, -halfHeight);
  shape.closePath();
  spec.holes?.forEach((hole) => shape.holes.push(hole));
  return shape;
}

export function crossShape(spec: { readonly total: number; readonly arm: number; readonly radius: number }): THREE.Shape {
  const half = spec.total / 2;
  const arm = spec.arm / 2;
  const radius = Math.min(spec.radius, (half - arm) / 2);
  const points: readonly (readonly [number, number])[] = [
    [-arm, -half], [arm, -half], [arm, -arm], [half, -arm], [half, arm], [arm, arm],
    [arm, half], [-arm, half], [-arm, arm], [-half, arm], [-half, -arm], [-arm, -arm],
  ];
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    if (!previous || !next) return;
    const incoming = [x + Math.sign(previous[0] - x) * radius, y + Math.sign(previous[1] - y) * radius] as const;
    const outgoing = [x + Math.sign(next[0] - x) * radius, y + Math.sign(next[1] - y) * radius] as const;
    if (index === 0) shape.moveTo(incoming[0], incoming[1]);
    else shape.lineTo(incoming[0], incoming[1]);
    shape.quadraticCurveTo(x, y, outgoing[0], outgoing[1]);
  });
  shape.closePath();
  return shape;
}

export function extrudedMesh(shape: THREE.Shape, spec: {
  readonly thickness: number;
  readonly material: THREE.Material;
  readonly bevel?: number;
}): THREE.Mesh {
  const requestedBevel = spec.bevel ?? 0;
  const bevel = Math.min(requestedBevel, Math.max(0, spec.thickness / 2 - 0.0001));
  const coreDepth = spec.thickness - bevel * 2;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: coreDepth,
    steps: 1,
    curveSegments: 24,
    bevelEnabled: bevel > 0,
    bevelSegments: bevel > 0 ? 4 : 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelOffset: -bevel,
  });
  geometry.translate(0, 0, -coreDepth / 2);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, spec.material);
}

export function roundedBox(spec: {
  readonly size: readonly [number, number, number];
  readonly radius: number;
  readonly material: THREE.Material;
  readonly segments?: number;
}): THREE.Mesh {
  const geometry = new RoundedBoxGeometry(spec.size[0], spec.size[1], spec.size[2], spec.segments ?? 5, spec.radius);
  return new THREE.Mesh(geometry, spec.material);
}

export function cylinderMesh(spec: {
  readonly radius: number;
  readonly depth: number;
  readonly material: THREE.Material;
  readonly segments?: number;
  readonly openEnded?: boolean;
}): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(spec.radius, spec.radius, spec.depth, spec.segments ?? 40, 1, spec.openEnded ?? false);
  return new THREE.Mesh(geometry, spec.material);
}

export function flatRoundedMesh(spec: {
  readonly width: number;
  readonly depth: number;
  readonly thickness: number;
  readonly radius: number;
  readonly material: THREE.Material;
  readonly bevel?: number;
}): THREE.Mesh {
  const mesh = extrudedMesh(roundedRectShape({ width: spec.width, height: spec.depth, radius: spec.radius }), {
    thickness: spec.thickness,
    material: spec.material,
    bevel: spec.bevel ?? 0,
  });
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export function frameMesh(spec: {
  readonly outer: RoundedRectSpec;
  readonly inner: RoundedRectSpec;
  readonly thickness: number;
  readonly material: THREE.Material;
  readonly bevel?: number;
}): THREE.Mesh {
  const shape = roundedRectShape(spec.outer);
  shape.holes.push(roundedRectHole(spec.inner));
  return extrudedMesh(shape, { thickness: spec.thickness, material: spec.material, bevel: spec.bevel ?? 0 });
}
