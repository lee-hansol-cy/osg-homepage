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

export const materials = {
  shell: new THREE.MeshPhysicalMaterial({ color: 0x22001c, emissive: 0xff78e8, emissiveIntensity: 1.18, roughness: 0.2, metalness: 0, clearcoat: 0.85, clearcoatRoughness: 0.22 }),
  shellDeep: new THREE.MeshPhysicalMaterial({ color: 0x240020, emissive: COLORS.shellDeep, emissiveIntensity: 1, roughness: 0.28, clearcoat: 0.55 }),
  control: new THREE.MeshPhysicalMaterial({ color: 0x201c20, emissive: COLORS.control, emissiveIntensity: 1, roughness: 0.25, clearcoat: 0.62 }),
  ink: new THREE.MeshStandardMaterial({ color: COLORS.ink, roughness: 0.58 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.78, transmission: 0.04, transparent: true, opacity: 0.88 }),
  chrome: new THREE.MeshStandardMaterial({ color: COLORS.chrome, emissive: 0x8f8f8f, emissiveIntensity: 0.72, metalness: 0.72, roughness: 0.18 }),
  lens: new THREE.MeshPhysicalMaterial({ color: COLORS.lensA, emissive: COLORS.lensB, emissiveIntensity: 0.12, metalness: 0.18, roughness: 0.12, transmission: 0.35, thickness: 0.2 }),
  led: new THREE.MeshStandardMaterial({ color: COLORS.led, emissive: COLORS.led, emissiveIntensity: 2.8 }),
};

export function roundedMesh(
  size: readonly [number, number, number],
  radius: number,
  material: THREE.Material,
  segments = 5,
): THREE.Mesh {
  const geometry = new RoundedBoxGeometry(size[0], size[1], size[2], segments, radius);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function panelShape(
  width: number,
  height: number,
  radius: number,
  roundTop: boolean,
  holes: readonly { readonly x: number; readonly y: number; readonly radius: number }[] = [],
): THREE.Shape {
  const half = width / 2;
  const minY = -height / 2;
  const maxY = height / 2;
  const k = 0.72;
  const shape = new THREE.Shape();
  shape.moveTo(-half, minY);
  shape.lineTo(half, minY);
  shape.lineTo(half, maxY - radius);
  shape.bezierCurveTo(half, maxY - radius + k * radius, half - radius + k * radius, maxY, half - radius, maxY);
  shape.lineTo(-half + radius, maxY);
  shape.bezierCurveTo(-half + radius - k * radius, maxY, -half, maxY - radius + k * radius, -half, maxY - radius);
  if (!roundTop) {
    shape.lineTo(-half, minY + radius);
    shape.bezierCurveTo(-half, minY + radius - k * radius, -half + radius - k * radius, minY, -half + radius, minY);
    shape.lineTo(half - radius, minY);
    shape.bezierCurveTo(half - radius + k * radius, minY, half, minY + radius - k * radius, half, minY + radius);
    shape.lineTo(half, maxY - radius);
    shape.bezierCurveTo(half, maxY - radius + k * radius, half - radius + k * radius, maxY, half - radius, maxY);
    shape.lineTo(-half + radius, maxY);
    shape.bezierCurveTo(-half + radius - k * radius, maxY, -half, maxY - radius + k * radius, -half, maxY - radius);
  }
  shape.closePath();
  holes.forEach((hole) => {
    const path = new THREE.Path();
    path.absarc(hole.x, hole.y, hole.radius, 0, Math.PI * 2, true);
    shape.holes.push(path);
  });
  return shape;
}

export function extrudedShape(
  shape: THREE.Shape,
  thickness: number,
  material: THREE.Material,
  bevel = 0.07,
): THREE.Mesh {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -thickness / 2);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

export function crossShape(total: number, arm: number, radius: number): THREE.Shape {
  const h = total / 2;
  const a = arm / 2;
  const r = Math.min(radius, (h - a) / 2);
  const points: readonly [number, number][] = [
    [-a, -h], [a, -h], [a, -a], [h, -a], [h, a], [a, a], [a, h], [-a, h], [-a, a], [-h, a], [-h, -a], [-a, -a],
  ];
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    if (!previous || !next) return;
    const inX = x + Math.sign(previous[0] - x) * r;
    const inY = y + Math.sign(previous[1] - y) * r;
    const outX = x + Math.sign(next[0] - x) * r;
    const outY = y + Math.sign(next[1] - y) * r;
    if (index === 0) shape.moveTo(inX, inY);
    else shape.lineTo(inX, inY);
    shape.quadraticCurveTo(x, y, outX, outY);
  });
  shape.closePath();
  return shape;
}

export function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const r = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + r, -halfHeight);
  shape.lineTo(halfWidth - r, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + r);
  shape.lineTo(halfWidth, halfHeight - r);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - r, halfHeight);
  shape.lineTo(-halfWidth + r, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - r);
  shape.lineTo(-halfWidth, -halfHeight + r);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + r, -halfHeight);
  shape.closePath();
  return shape;
}

export function cylinder(
  radius: number,
  depth: number,
  material: THREE.Material,
  segments = 32,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, segments), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function addGlyph(group: THREE.Group, scale = 1, material: THREE.Material = materials.shellDeep): void {
  const line = (width: number, x: number, y: number, rotation = 0): void => {
    const mesh = roundedMesh([width * scale, 0.18 * scale, 0.12 * scale], 0.055 * scale, material, 3);
    mesh.position.set(x * scale, y * scale, 0);
    mesh.rotation.z = rotation;
    group.add(mesh);
  };
  line(1.05, -1.2, 0.45);
  line(1.05, -1.2, -0.45);
  line(0.9, -1.7, 0, Math.PI / 2);
  line(0.9, -0.7, 0, Math.PI / 2);
  line(1.05, 0, 0.45);
  line(1.05, 0, 0);
  line(1.05, 0, -0.45);
  line(0.9, -0.5, 0, Math.PI / 2);
  line(0.45, 0.5, -0.23, Math.PI / 2);
  line(1.05, 1.25, 0.45);
  line(1.05, 1.25, -0.45);
  line(0.62, 1.52, 0);
  line(0.9, 0.72, 0, Math.PI / 2);
  line(0.45, 1.77, -0.22, Math.PI / 2);
}
