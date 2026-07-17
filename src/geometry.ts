import * as THREE from "three";
import { distributeAndNormalize, getPathParamsForCorner, toRadians, type CornerPathParams } from "@lisse/core";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export const COLORS = {
  shell: 0xff81ea,
  shellDeep: 0xf02bd1,
  shellShadow: 0xb94fa8,
  control: 0xfbe1f6,
  ink: 0x100b10,
  chrome: 0xc9c9c9,
  led: 0xffffff,
  wellDeep: 0x682e5f,
  hingeCore: 0x575757,
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
  control: new THREE.MeshPhysicalMaterial({ color: COLORS.control, emissive: COLORS.control, emissiveIntensity: 0.16, roughness: 0.34, metalness: 0, clearcoat: 0.58, clearcoatRoughness: 0.24, bumpMap: absMicrotexture, bumpScale: 0.006 }),
  ink: new THREE.MeshPhysicalMaterial({ color: COLORS.ink, roughness: 0.4, metalness: 0.02, clearcoat: 0.2 }),
  screen: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.84, metalness: 0, clearcoat: 0.1, clearcoatRoughness: 0.76, transparent: true, opacity: 0.08, depthWrite: false }),
  chrome: new THREE.MeshPhysicalMaterial({ color: 0x888888, roughness: 0.13, metalness: 1, clearcoat: 0.82, clearcoatRoughness: 0.06 }),
  chromeRim: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, metalness: 0.82, clearcoat: 0.95, clearcoatRoughness: 0.035 }),
  lensCore: new THREE.MeshStandardMaterial({ color: COLORS.lensA, emissive: COLORS.lensB, emissiveIntensity: 0.72, roughness: 0.42, metalness: 0.05 }),
  lensGlass: new THREE.MeshPhysicalMaterial({ color: 0x8e95ff, roughness: 0.025, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.015, transparent: true, opacity: 0.18, depthWrite: false }),
  led: new THREE.MeshStandardMaterial({ color: COLORS.led, emissive: COLORS.led, emissiveIntensity: 2.6, roughness: 0.25 }),
  wellDeep: new THREE.MeshPhysicalMaterial({ color: COLORS.wellDeep, roughness: 0.38, metalness: 0, clearcoat: 0.24, clearcoatRoughness: 0.34 }),
  hingeCore: new THREE.MeshStandardMaterial({ color: COLORS.hingeCore, roughness: 0.52, metalness: 0.12 }),
  portVoid: new THREE.MeshStandardMaterial({ color: 0x050305, roughness: 0.82, metalness: 0 }),
} as const;

type RoundedRectSpec = {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly x?: number;
  readonly y?: number;
};

type CornerRadii = {
  readonly topLeft: number;
  readonly topRight: number;
  readonly bottomRight: number;
  readonly bottomLeft: number;
};

type ResolvedCorners = {
  readonly topLeft: CornerPathParams;
  readonly topRight: CornerPathParams;
  readonly bottomRight: CornerPathParams;
  readonly bottomLeft: CornerPathParams;
};

export type FilletSpec = {
  readonly radius: number;
  readonly depth?: number;
  readonly segments?: number;
  readonly bevelOffset?: number;
};

function resolveContinuousCorners(width: number, height: number, radii: CornerRadii, smoothing: number): ResolvedCorners {
  const normalized = distributeAndNormalize({
    topLeftCornerRadius: radii.topLeft,
    topRightCornerRadius: radii.topRight,
    bottomRightCornerRadius: radii.bottomRight,
    bottomLeftCornerRadius: radii.bottomLeft,
    width,
    height,
  });
  const resolve = (corner: { readonly radius: number; readonly roundingAndSmoothingBudget: number }): CornerPathParams => getPathParamsForCorner({
    cornerRadius: corner.radius,
    cornerSmoothing: smoothing,
    preserveSmoothing: true,
    roundingAndSmoothingBudget: corner.roundingAndSmoothingBudget,
  });
  return {
    topLeft: resolve(normalized.topLeft),
    topRight: resolve(normalized.topRight),
    bottomRight: resolve(normalized.bottomRight),
    bottomLeft: resolve(normalized.bottomLeft),
  };
}

function continuousRoundedRectPath<T extends THREE.Path>(
  path: T,
  spec: RoundedRectSpec & { readonly radii?: CornerRadii; readonly smoothing?: number },
): T {
  const halfWidth = spec.width / 2;
  const halfHeight = spec.height / 2;
  const x = spec.x ?? 0;
  const y = spec.y ?? 0;
  const radii = spec.radii ?? {
    topLeft: spec.radius,
    topRight: spec.radius,
    bottomRight: spec.radius,
    bottomLeft: spec.radius,
  };
  const corners = resolveContinuousCorners(spec.width, spec.height, radii, spec.smoothing ?? 0.6);
  const arc = (
    corner: CornerPathParams,
    centerX: number,
    centerY: number,
    startDegrees: number,
    endDegrees: number,
  ): void => {
    if (corner.cornerRadius <= 0) return;
    path.absarc(centerX, centerY, corner.cornerRadius, toRadians(startDegrees), toRadians(endDegrees), true);
  };

  const topLeft = corners.topLeft;
  const topRight = corners.topRight;
  const bottomRight = corners.bottomRight;
  const bottomLeft = corners.bottomLeft;
  path.moveTo(x - halfWidth + topLeft.p, y + halfHeight);
  path.lineTo(x + halfWidth - topRight.p, y + halfHeight);
  if (topRight.cornerRadius > 0) {
    const startX = x + halfWidth - topRight.p;
    const startY = y + halfHeight;
    path.bezierCurveTo(
      startX + topRight.a, startY,
      startX + topRight.a + topRight.b, startY,
      startX + topRight.a + topRight.b + topRight.c, startY - topRight.d,
    );
    const alpha = (90 - 90 * (1 - (spec.smoothing ?? 0.6))) / 2;
    arc(topRight, x + halfWidth - topRight.cornerRadius, y + halfHeight - topRight.cornerRadius, 90 - alpha, alpha);
    const endX = x + halfWidth - topRight.cornerRadius + topRight.cornerRadius * Math.cos(toRadians(alpha));
    const endY = y + halfHeight - topRight.cornerRadius + topRight.cornerRadius * Math.sin(toRadians(alpha));
    path.bezierCurveTo(
      endX + topRight.d, endY - topRight.c,
      endX + topRight.d, endY - topRight.b - topRight.c,
      endX + topRight.d, endY - topRight.a - topRight.b - topRight.c,
    );
  }
  path.lineTo(x + halfWidth, y - halfHeight + bottomRight.p);
  if (bottomRight.cornerRadius > 0) {
    const startX = x + halfWidth;
    const startY = y - halfHeight + bottomRight.p;
    path.bezierCurveTo(
      startX, startY - bottomRight.a,
      startX, startY - bottomRight.a - bottomRight.b,
      startX - bottomRight.d, startY - bottomRight.a - bottomRight.b - bottomRight.c,
    );
    const alpha = (90 - 90 * (1 - (spec.smoothing ?? 0.6))) / 2;
    arc(bottomRight, x + halfWidth - bottomRight.cornerRadius, y - halfHeight + bottomRight.cornerRadius, -alpha, alpha - 90);
    const endAngle = alpha - 90;
    const endX = x + halfWidth - bottomRight.cornerRadius + bottomRight.cornerRadius * Math.cos(toRadians(endAngle));
    const endY = y - halfHeight + bottomRight.cornerRadius + bottomRight.cornerRadius * Math.sin(toRadians(endAngle));
    path.bezierCurveTo(
      endX - bottomRight.c, endY - bottomRight.d,
      endX - bottomRight.b - bottomRight.c, endY - bottomRight.d,
      endX - bottomRight.a - bottomRight.b - bottomRight.c, endY - bottomRight.d,
    );
  }
  path.lineTo(x - halfWidth + bottomLeft.p, y - halfHeight);
  if (bottomLeft.cornerRadius > 0) {
    const startX = x - halfWidth + bottomLeft.p;
    const startY = y - halfHeight;
    path.bezierCurveTo(
      startX - bottomLeft.a, startY,
      startX - bottomLeft.a - bottomLeft.b, startY,
      startX - bottomLeft.a - bottomLeft.b - bottomLeft.c, startY + bottomLeft.d,
    );
    const alpha = (90 - 90 * (1 - (spec.smoothing ?? 0.6))) / 2;
    arc(bottomLeft, x - halfWidth + bottomLeft.cornerRadius, y - halfHeight + bottomLeft.cornerRadius, -90 - alpha, alpha - 180);
    const endAngle = alpha - 180;
    const endX = x - halfWidth + bottomLeft.cornerRadius + bottomLeft.cornerRadius * Math.cos(toRadians(endAngle));
    const endY = y - halfHeight + bottomLeft.cornerRadius + bottomLeft.cornerRadius * Math.sin(toRadians(endAngle));
    path.bezierCurveTo(
      endX - bottomLeft.d, endY + bottomLeft.c,
      endX - bottomLeft.d, endY + bottomLeft.b + bottomLeft.c,
      endX - bottomLeft.d, endY + bottomLeft.a + bottomLeft.b + bottomLeft.c,
    );
  }
  path.lineTo(x - halfWidth, y + halfHeight - topLeft.p);
  if (topLeft.cornerRadius > 0) {
    const startX = x - halfWidth;
    const startY = y + halfHeight - topLeft.p;
    path.bezierCurveTo(
      startX, startY + topLeft.a,
      startX, startY + topLeft.a + topLeft.b,
      startX + topLeft.d, startY + topLeft.a + topLeft.b + topLeft.c,
    );
    const alpha = (90 - 90 * (1 - (spec.smoothing ?? 0.6))) / 2;
    arc(topLeft, x - halfWidth + topLeft.cornerRadius, y + halfHeight - topLeft.cornerRadius, 180 - alpha, 90 + alpha);
    const endAngle = 90 + alpha;
    const endX = x - halfWidth + topLeft.cornerRadius + topLeft.cornerRadius * Math.cos(toRadians(endAngle));
    const endY = y + halfHeight - topLeft.cornerRadius + topLeft.cornerRadius * Math.sin(toRadians(endAngle));
    path.bezierCurveTo(
      endX + topLeft.c, endY + topLeft.d,
      endX + topLeft.b + topLeft.c, endY + topLeft.d,
      endX + topLeft.a + topLeft.b + topLeft.c, endY + topLeft.d,
    );
  }
  path.closePath();
  return path;
}

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

export function roundedRectShape(spec: RoundedRectSpec, continuous = true): THREE.Shape {
  const shape = new THREE.Shape();
  if (continuous) continuousRoundedRectPath(shape, spec);
  else traceRoundedRect(shape, spec, false);
  return shape;
}

export function roundedRectHole(spec: RoundedRectSpec, continuous = true): THREE.Path {
  const path = new THREE.Path();
  if (continuous) continuousRoundedRectPath(path, spec);
  else traceRoundedRect(path, spec, true);
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
  const shape = new THREE.Shape();
  continuousRoundedRectPath(shape, {
    width: spec.width,
    height: spec.height,
    radius: 0,
    radii: {
      topLeft: spec.maxYRadius,
      topRight: spec.maxYRadius,
      bottomRight: spec.minYRadius,
      bottomLeft: spec.minYRadius,
    },
  });
  spec.holes?.forEach((hole) => shape.holes.push(hole));
  return shape;
}

export function panelHole(spec: {
  readonly width: number;
  readonly height: number;
  readonly minYRadius: number;
  readonly maxYRadius: number;
  readonly x?: number;
  readonly y?: number;
}): THREE.Path {
  return continuousRoundedRectPath(new THREE.Path(), {
    width: spec.width,
    height: spec.height,
    radius: 0,
    ...(spec.x === undefined ? {} : { x: spec.x }),
    ...(spec.y === undefined ? {} : { y: spec.y }),
    radii: {
      topLeft: spec.maxYRadius,
      topRight: spec.maxYRadius,
      bottomRight: spec.minYRadius,
      bottomLeft: spec.minYRadius,
    },
  });
}

export function crossShape(spec: {
  readonly total: number;
  readonly arm: number;
  readonly radius: number;
  readonly x?: number;
  readonly y?: number;
}): THREE.Shape {
  const half = spec.total / 2;
  const arm = spec.arm / 2;
  const radius = Math.min(spec.radius, (half - arm) / 2);
  const offsetX = spec.x ?? 0;
  const offsetY = spec.y ?? 0;
  const points: readonly (readonly [number, number])[] = [
    [-arm, -half], [arm, -half], [arm, -arm], [half, -arm], [half, arm], [arm, arm],
    [arm, half], [-arm, half], [-arm, arm], [-half, arm], [-half, -arm], [-arm, -arm],
  ];
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    if (!previous || !next) return;
    const incoming = [offsetX + x + Math.sign(previous[0] - x) * radius, offsetY + y + Math.sign(previous[1] - y) * radius] as const;
    const outgoing = [offsetX + x + Math.sign(next[0] - x) * radius, offsetY + y + Math.sign(next[1] - y) * radius] as const;
    if (index === 0) shape.moveTo(incoming[0], incoming[1]);
    else shape.lineTo(incoming[0], incoming[1]);
    shape.quadraticCurveTo(offsetX + x, offsetY + y, outgoing[0], outgoing[1]);
  });
  shape.closePath();
  return shape;
}

export function extrudedMesh(shape: THREE.Shape, spec: {
  readonly thickness: number;
  readonly material: THREE.Material;
  readonly bevel?: number;
  readonly fillet?: number | FilletSpec;
}): THREE.Mesh {
  const fillet = typeof spec.fillet === "number" ? { radius: spec.fillet } : spec.fillet;
  const legacyBevel = spec.bevel ?? 0;
  const radius = fillet?.radius ?? legacyBevel;
  const requestedDepth = fillet?.depth ?? legacyBevel;
  const depth = Math.min(requestedDepth, Math.max(0, spec.thickness / 2 - 0.0001));
  const coreDepth = spec.thickness - depth * 2;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: coreDepth,
    steps: 1,
    curveSegments: 24,
    bevelEnabled: radius > 0 && depth > 0,
    bevelSegments: radius > 0 && depth > 0 ? fillet?.segments ?? (fillet ? 8 : 4) : 1,
    bevelSize: radius,
    bevelThickness: depth,
    bevelOffset: fillet?.bevelOffset ?? -radius,
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
  readonly thetaStart?: number;
  readonly thetaLength?: number;
}): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(
    spec.radius,
    spec.radius,
    spec.depth,
    spec.segments ?? 40,
    1,
    spec.openEnded ?? false,
    spec.thetaStart ?? 0,
    spec.thetaLength ?? Math.PI * 2,
  );
  return new THREE.Mesh(geometry, spec.material);
}

export function flatRoundedMesh(spec: {
  readonly width: number;
  readonly depth: number;
  readonly thickness: number;
  readonly radius: number;
  readonly material: THREE.Material;
  readonly bevel?: number;
  readonly fillet?: number | FilletSpec;
  readonly continuous?: boolean;
}): THREE.Mesh {
  const mesh = extrudedMesh(roundedRectShape({ width: spec.width, height: spec.depth, radius: spec.radius }, spec.continuous ?? true), {
    thickness: spec.thickness,
    material: spec.material,
    ...(spec.bevel === undefined ? {} : { bevel: spec.bevel }),
    ...(spec.fillet === undefined ? {} : { fillet: spec.fillet }),
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
  readonly fillet?: number | FilletSpec;
}): THREE.Mesh {
  const shape = roundedRectShape(spec.outer);
  shape.holes.push(roundedRectHole(spec.inner));
  return extrudedMesh(shape, {
    thickness: spec.thickness,
    material: spec.material,
    ...(spec.bevel === undefined ? {} : { bevel: spec.bevel }),
    ...(spec.fillet === undefined ? {} : { fillet: spec.fillet }),
  });
}
