import * as THREE from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { DEVICE, FILLET_REFERENCE, PHYSICAL, UPPER_POCKET_FILLET_REFERENCE, exteriorRadius, px } from "./config";
import { catalogueStepForDpad, dpadTiltForDirection, type DpadDirection } from "./controls";
import {
  circleHole,
  crossShape,
  cylinderMesh,
  extrudedMesh,
  flatRoundedMesh,
  frameMesh,
  materials,
  panelHole,
  panelShape,
  roundedBox,
  roundedRectHole,
  roundedRectShape,
} from "./geometry";
import { createUvLabel } from "./labels";

export type DeviceAction = "previous" | "next" | "artworks" | "fonts" | "tools" | "toggle" | "theme";

export type DeviceModel = {
  readonly root: THREE.Group;
  readonly upperPivot: THREE.Group;
  readonly interactives: readonly THREE.Object3D[];
  readonly outerLogoAnchor: THREE.Group;
  readonly badgeLogoAnchor: THREE.Group;
  readonly update: (delta: number) => void;
  readonly press: (object: THREE.Object3D) => DeviceAction | undefined;
  readonly setClosed: (closed: boolean) => void;
  readonly isClosed: () => boolean;
  readonly isHingeSettled: () => boolean;
  readonly screensVisible: () => boolean;
};

type PressMotion = {
  readonly object: THREE.Object3D;
  readonly rest: THREE.Vector3;
  readonly restRotation: THREE.Euler;
  readonly normal: THREE.Vector3;
  readonly activeTilt: THREE.Vector3;
  readonly travel: number;
  depression: number;
  holdRemaining: number;
};

type PressRecord = {
  readonly action: DeviceAction | undefined;
  readonly motion: PressMotion;
  readonly tilt: THREE.Vector3;
};

type BuildState = {
  readonly interactives: THREE.Object3D[];
  readonly records: Map<THREE.Object3D, PressRecord>;
  readonly motions: Map<THREE.Object3D, PressMotion>;
  readonly ledMaterials: THREE.MeshStandardMaterial[];
};

type LowerAssembly = {
  readonly group: THREE.Group;
  readonly toggleMotion: PressMotion;
};

type UpperAssembly = {
  readonly pivot: THREE.Group;
  readonly outerLogoAnchor: THREE.Group;
  readonly badgeLogoAnchor: THREE.Group;
};

const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
hitMaterial.colorWrite = false;

export function panelRotationForOpening(openingDegrees: number): number {
  return THREE.MathUtils.degToRad(90 - openingDegrees);
}

export function openingForPanelRotation(rotationRadians: number): number {
  return 90 - THREE.MathUtils.radToDeg(rotationRadians);
}

function sourceLabel(spec: {
  readonly text: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly fontSizePx: number;
  readonly weight: number;
  readonly color: string;
  readonly align: "left" | "center" | "right";
}): THREE.Mesh {
  return createUvLabel({
    text: spec.text,
    sourceWidthPx: spec.widthPx,
    sourceHeightPx: spec.heightPx,
    fontSizePx: spec.fontSizePx,
    weight: spec.weight,
    color: spec.color,
    align: spec.align,
  });
}

function registerPress(state: BuildState, spec: {
  readonly target: THREE.Object3D;
  readonly moving: THREE.Object3D;
  readonly action: DeviceAction | undefined;
  readonly tilt?: THREE.Vector3;
  readonly travel?: number;
}): PressMotion {
  let motion = state.motions.get(spec.moving);
  if (!motion) {
    motion = {
      object: spec.moving,
      rest: spec.moving.position.clone(),
      restRotation: spec.moving.rotation.clone(),
      normal: new THREE.Vector3(0, 1, 0),
      activeTilt: new THREE.Vector3(),
      travel: spec.travel ?? DEVICE.buttonTravel,
      depression: 0,
      holdRemaining: 0,
    };
    state.motions.set(spec.moving, motion);
  }
  state.interactives.push(spec.target);
  state.records.set(spec.target, { action: spec.action, motion, tilt: spec.tilt ?? new THREE.Vector3() });
  return motion;
}

function dpadAction(direction: DpadDirection): DeviceAction | undefined {
  const step = catalogueStepForDpad(direction);
  if (step === -1) return "previous";
  if (step === 1) return "next";
  return undefined;
}

function addLowerDisplay(lower: THREE.Group): void {
  const shoulderMaterial = materials.shell.clone();
  shoulderMaterial.roughness = 0.2;
  shoulderMaterial.clearcoat = 0.78;
  shoulderMaterial.emissiveIntensity = 0.46;
  const shoulder = frameMesh({
    outer: {
      width: DEVICE.bezelWidth + px(24),
      height: DEVICE.bezelHeight + px(24),
      radius: DEVICE.lowerBezelRadius + exteriorRadius(12),
    },
    inner: {
      width: DEVICE.bezelWidth,
      height: DEVICE.bezelHeight,
      radius: DEVICE.lowerBezelRadius,
    },
    thickness: px(3),
    material: shoulderMaterial,
    fillet: FILLET_REFERENCE,
  });
  shoulder.rotation.x = Math.PI / 2;
  shoulder.position.set(0, DEVICE.lowerSurfaceY + px(1.5), DEVICE.lowerScreenCenterZ);
  lower.add(shoulder);
  const bezel = frameMesh({
    outer: { width: DEVICE.bezelWidth, height: DEVICE.bezelHeight, radius: DEVICE.lowerBezelRadius },
    inner: { width: DEVICE.screenWidth, height: DEVICE.screenHeight, radius: 0 },
    thickness: px(2),
    material: materials.ink,
    bevel: px(0.35),
  });
  bezel.rotation.x = Math.PI / 2;
  bezel.position.set(0, DEVICE.lowerSurfaceY + px(3.5), DEVICE.lowerScreenCenterZ);
  lower.add(bezel);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(DEVICE.screenWidth, px(0.5), DEVICE.screenHeight), materials.screen);
  screen.position.set(0, DEVICE.lowerSurfaceY + px(4), DEVICE.lowerScreenCenterZ);
  lower.add(screen);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(DEVICE.screenWidth, px(0.25), DEVICE.screenHeight), materials.glass);
  glass.position.set(0, DEVICE.lowerSurfaceY + px(4.65), DEVICE.lowerScreenCenterZ);
  lower.add(glass);
}

function addDpad(lower: THREE.Group, state: BuildState): void {
  const dpad = PHYSICAL.dpad;
  const well = extrudedMesh(crossShape({ total: dpad.outerSize, arm: dpad.outerArm, radius: dpad.outerCornerRadius }), {
    thickness: px(1.2), material: materials.wellDeep, bevel: px(0.25),
  });
  well.rotation.x = Math.PI / 2;
  well.position.set(dpad.x, DEVICE.lowerSurfaceY - DEVICE.wellFloorInset - px(0.6), dpad.z);
  lower.add(well);

  const moving = new THREE.Group();
  moving.position.set(dpad.x, DEVICE.lowerSurfaceY, dpad.z);
  lower.add(moving);
  const cap = extrudedMesh(crossShape({ total: dpad.innerSize, arm: dpad.innerArm, radius: dpad.innerCornerRadius }), {
    thickness: px(1.8), material: materials.control.clone(), bevel: px(0.35),
  });
  cap.rotation.x = Math.PI / 2;
  cap.position.y = px(1.45);
  moving.add(cap);

  const directionSpecs: readonly { readonly direction: DpadDirection; readonly x: number; readonly z: number; readonly width: number; readonly depth: number }[] = [
    { direction: "up", x: 0, z: -px(38), width: dpad.innerArm, depth: px(36) },
    { direction: "right", x: px(38), z: 0, width: px(36), depth: dpad.innerArm },
    { direction: "down", x: 0, z: px(38), width: dpad.innerArm, depth: px(36) },
    { direction: "left", x: -px(38), z: 0, width: px(36), depth: dpad.innerArm },
  ];
  directionSpecs.forEach((spec) => {
    dpad.dots[spec.direction].forEach(([x, z]) => {
      const dot = cylinderMesh({ radius: dpad.dotRadius, depth: px(0.5), material: materials.shellDeep, segments: 16 });
      dot.position.set(px(x), px(3.05), px(z));
      moving.add(dot);
    });
    const target = roundedBox({ size: [spec.width, px(0.4), spec.depth], radius: px(2), material: hitMaterial, segments: 3 });
    target.position.set(spec.x, px(3), spec.z);
    moving.add(target);
    const tilt = dpadTiltForDirection(spec.direction, dpad.tiltAngle);
    registerPress(state, {
      target,
      moving,
      action: dpadAction(spec.direction),
      tilt: new THREE.Vector3(tilt.x, 0, tilt.z),
      travel: 0,
    });
  });
}

function addRightButtons(lower: THREE.Group, state: BuildState): void {
  PHYSICAL.buttons.forEach((spec) => {
    const z = px(spec.top + 21 - 240);
    const well = flatRoundedMesh({
      width: PHYSICAL.button.outerWidth, depth: PHYSICAL.button.outerHeight, thickness: px(1.2),
      radius: PHYSICAL.button.outerRadius, material: materials.wellDeep, bevel: px(0.25),
    });
    well.position.set(PHYSICAL.button.x, DEVICE.lowerSurfaceY - DEVICE.wellFloorInset - px(0.6), z);
    lower.add(well);
    const cap = flatRoundedMesh({
      width: PHYSICAL.button.capWidth, depth: PHYSICAL.button.capHeight, thickness: px(1.8),
      radius: PHYSICAL.button.capRadius, material: materials.control.clone(), bevel: px(0.35),
    });
    cap.position.set(PHYSICAL.button.x, DEVICE.lowerSurfaceY + px(1.45), z);
    const label = sourceLabel({
      text: spec.text, widthPx: spec.labelWidthPx, heightPx: PHYSICAL.button.labelHeightPx,
      fontSizePx: PHYSICAL.button.labelFontSizePx, weight: 300, color: "#f02bd1", align: "center",
    });
    label.rotation.x = Math.PI;
    label.scale.x = -1;
    if (label.material instanceof THREE.MeshBasicMaterial && label.material.map) {
      label.material.map.wrapS = THREE.RepeatWrapping;
      label.material.map.repeat.x = -1;
      label.material.map.offset.x = 1;
    }
    label.position.z = -px(1.15);
    cap.add(label);
    lower.add(cap);
    registerPress(state, { target: cap, moving: cap, action: spec.action });
  });
}

function addToggleAndTheme(lower: THREE.Group, state: BuildState): PressMotion {
  const toggle = PHYSICAL.toggle;
  const well = flatRoundedMesh({
    width: toggle.outerWidth, depth: toggle.outerHeight, thickness: px(1.2), radius: toggle.outerRadius,
    material: materials.control.clone(), bevel: px(0.25),
  });
  well.position.set(toggle.x, DEVICE.lowerSurfaceY - DEVICE.wellFloorInset - px(0.6), toggle.z);
  lower.add(well);
  const handle = flatRoundedMesh({
    width: toggle.handleWidth, depth: toggle.handleHeight, thickness: px(1.8), radius: toggle.handleRadius,
    material: materials.shell.clone(), bevel: px(0.3),
  });
  handle.position.set(toggle.x, DEVICE.lowerSurfaceY + px(1.45), toggle.onZ);
  lower.add(handle);
  const toggleMotion = registerPress(state, { target: handle, moving: handle, action: "toggle" });
  const motionLabel = sourceLabel({
    text: "Motion", widthPx: toggle.labelWidthPx, heightPx: toggle.labelHeightPx,
    fontSizePx: toggle.labelFontSizePx, weight: 400, color: "#ffffff", align: "left",
  });
  motionLabel.rotation.x = -Math.PI / 2;
  motionLabel.position.set(toggle.labelX, DEVICE.lowerSurfaceY + px(1.5), toggle.labelZ);
  lower.add(motionLabel);

  const theme = PHYSICAL.theme;
  const themeWell = flatRoundedMesh({
    width: px(16), depth: px(16), thickness: px(1.2), radius: theme.outerRadius,
    material: materials.wellDeep, bevel: px(0.25),
  });
  themeWell.position.set(theme.x, DEVICE.lowerSurfaceY - DEVICE.wellFloorInset - px(0.6), theme.z);
  lower.add(themeWell);
  const themeCap = flatRoundedMesh({
    width: px(14), depth: px(14), thickness: px(1.8), radius: theme.capRadius,
    material: materials.shell.clone(), bevel: px(0.3),
  });
  themeCap.position.set(theme.x, DEVICE.lowerSurfaceY + px(1.45), theme.z);
  lower.add(themeCap);
  registerPress(state, { target: themeCap, moving: themeCap, action: "theme" });
  const themeLabel = sourceLabel({
    text: "Light / Dark", widthPx: theme.labelWidthPx, heightPx: theme.labelHeightPx,
    fontSizePx: theme.labelFontSizePx, weight: 300, color: "#ffffff", align: "left",
  });
  themeLabel.rotation.x = -Math.PI / 2;
  themeLabel.position.set(theme.labelX, DEVICE.lowerSurfaceY + px(1.5), theme.labelZ);
  lower.add(themeLabel);
  return toggleMotion;
}

function addIndicatorsAndPorts(lower: THREE.Group, state: BuildState): void {
  PHYSICAL.indicators.forEach((spec) => {
    const label = sourceLabel({
      text: spec.text, widthPx: spec.labelWidthPx, heightPx: 9, fontSizePx: 11,
      weight: 300, color: "#ffffff", align: "right",
    });
    label.rotation.x = -Math.PI / 2;
    label.position.set(spec.labelX, DEVICE.lowerSurfaceY + px(1.25), spec.labelZ);
    lower.add(label);
    const ledMaterial = materials.led.clone();
    state.ledMaterials.push(ledMaterial);
    const led = cylinderMesh({ radius: px(1.5), depth: px(0.7), material: ledMaterial, segments: 18 });
    led.position.set(px(390.5), DEVICE.lowerSurfaceY + px(1.15), spec.ledZ);
    lower.add(led);
  });
  const audioZ = PHYSICAL.indicators[0].ledZ;
  const powerZ = PHYSICAL.indicators[1].ledZ;
  const portDepth = px(6);
  const portCenterX = DEVICE.width / 2 - portDepth / 2;
  const jackVoid = cylinderMesh({ radius: px(6.5), depth: portDepth, material: materials.portVoid, segments: 32 });
  jackVoid.rotation.z = Math.PI / 2;
  jackVoid.position.set(portCenterX, -px(12), audioZ);
  lower.add(jackVoid);
  const usbVoid = roundedBox({ size: [portDepth, px(11), px(31)], radius: exteriorRadius(2), material: materials.portVoid, segments: 5 });
  usbVoid.position.set(portCenterX, -px(12), powerZ);
  lower.add(usbVoid);
}

function createLower(state: BuildState): LowerAssembly {
  const lower = new THREE.Group();
  const controlHoles: THREE.Path[] = [
    crossShape({
      total: PHYSICAL.dpad.outerSize,
      arm: PHYSICAL.dpad.outerArm,
      radius: PHYSICAL.dpad.outerCornerRadius,
      x: PHYSICAL.dpad.x,
      y: PHYSICAL.dpad.z,
    }),
    roundedRectHole({
      width: PHYSICAL.toggle.outerWidth,
      height: PHYSICAL.toggle.outerHeight,
      radius: PHYSICAL.toggle.outerRadius,
      x: PHYSICAL.toggle.x,
      y: PHYSICAL.toggle.z,
    }),
    roundedRectHole({
      width: px(16),
      height: px(16),
      radius: PHYSICAL.theme.outerRadius,
      x: PHYSICAL.theme.x,
      y: PHYSICAL.theme.z,
    }),
  ];
  PHYSICAL.buttons.forEach((spec) => {
    controlHoles.push(roundedRectHole({
      width: PHYSICAL.button.outerWidth,
      height: PHYSICAL.button.outerHeight,
      radius: PHYSICAL.button.outerRadius,
      x: PHYSICAL.button.x,
      y: px(spec.top - 240) + PHYSICAL.button.outerHeight / 2,
    }));
  });
  const shell = extrudedMesh(panelShape({
    width: DEVICE.width, height: DEVICE.lowerDepth,
    minYRadius: DEVICE.lowerHingeRadius, maxYRadius: DEVICE.lowerOuterRadius,
    holes: controlHoles,
  }), { thickness: DEVICE.lowerThickness, material: materials.shell, bevel: px(1.2) });
  shell.rotation.x = Math.PI / 2;
  shell.position.y = DEVICE.lowerSurfaceY - DEVICE.lowerThickness / 2;
  lower.add(shell);
  addLowerDisplay(lower);
  addDpad(lower, state);
  addRightButtons(lower, state);
  const toggleMotion = addToggleAndTheme(lower, state);
  addIndicatorsAndPorts(lower, state);
  return { group: lower, toggleMotion };
}

function addUpperDisplay(pivot: THREE.Group): void {
  const bezel = frameMesh({
    outer: { width: DEVICE.bezelWidth, height: DEVICE.bezelHeight, radius: DEVICE.upperBezelRadius },
    inner: { width: DEVICE.screenWidth, height: DEVICE.screenHeight, radius: 0 },
    thickness: px(2), material: materials.ink, bevel: px(0.35),
  });
  bezel.position.set(0, DEVICE.screenCenterY + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(1.2));
  pivot.add(bezel);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(DEVICE.screenWidth, DEVICE.screenHeight, px(1)), materials.screen);
  screen.position.set(0, DEVICE.screenCenterY + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(0.9));
  pivot.add(screen);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(DEVICE.screenWidth, DEVICE.screenHeight, px(0.25)), materials.glass);
  glass.position.set(0, DEVICE.screenCenterY + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(2));
  pivot.add(glass);
}

function addCameraAndBadge(pivot: THREE.Group): { readonly outer: THREE.Group; readonly badge: THREE.Group } {
  const camera = PHYSICAL.camera;
  const frame = cylinderMesh({ radius: camera.frameRadius, depth: px(2), material: materials.ink, segments: 40 });
  frame.rotation.x = Math.PI / 2;
  frame.position.set(camera.x, camera.y + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(2));
  pivot.add(frame);
  const lens = cylinderMesh({ radius: camera.lensRadius, depth: px(1.2), material: materials.lensCore, segments: 36 });
  lens.rotation.x = Math.PI / 2;
  lens.position.set(camera.x, camera.y + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(3.5));
  pivot.add(lens);
  const lensGlass = cylinderMesh({ radius: camera.lensRadius, depth: px(0.35), material: materials.lensGlass, segments: 36 });
  lensGlass.rotation.x = Math.PI / 2;
  lensGlass.position.set(camera.x, camera.y + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(4.25));
  pivot.add(lensGlass);
  const cameraLed = roundedBox({ size: [camera.ledWidth, camera.ledHeight, px(0.7)], radius: exteriorRadius(2), material: materials.led, segments: 3 });
  cameraLed.position.set(camera.ledX, camera.ledY + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(2.5));
  pivot.add(cameraLed);

  const badge = PHYSICAL.badge;
  const badgeRim = extrudedMesh(roundedRectShape({ width: badge.width, height: badge.height, radius: badge.radius }), {
    thickness: px(2.4), material: materials.chromeRim, bevel: px(0.5),
  });
  badgeRim.position.set(badge.x, badge.y + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(2));
  pivot.add(badgeRim);
  const badgePlate = extrudedMesh(roundedRectShape({
    width: badge.width - badge.border * 2, height: badge.height - badge.border * 2, radius: badge.radius - badge.border,
  }), { thickness: px(1.4), material: materials.chrome, bevel: px(0.35) });
  badgePlate.position.set(badge.x, badge.y + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(3.6));
  pivot.add(badgePlate);
  const badgeAnchor = new THREE.Group();
  badgeAnchor.name = "badgeLogoAnchor";
  badgeAnchor.position.set(badge.x, badge.y + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(5));
  pivot.add(badgeAnchor);

  const outerAnchor = new THREE.Group();
  outerAnchor.name = "outerLogoAnchor";
  outerAnchor.position.set(PHYSICAL.outerLogo.x, PHYSICAL.outerLogo.y + DEVICE.hingeRadius, DEVICE.upperBackFaceZ - px(0.05));
  outerAnchor.rotation.y = Math.PI;
  pivot.add(outerAnchor);
  return { outer: outerAnchor, badge: badgeAnchor };
}

function createUpper(): UpperAssembly {
  const pivot = new THREE.Group();
  pivot.position.set(0, DEVICE.hingeAxisY, DEVICE.hingeZ);
  const profile = {
    width: DEVICE.width, height: DEVICE.panelHeight,
    minYRadius: DEVICE.upperHingeRadius, maxYRadius: DEVICE.upperOuterRadius,
  } as const;
  const innerProfile = {
    width: DEVICE.width - DEVICE.upperInsetDepth * 2,
    height: DEVICE.panelHeight - DEVICE.upperInsetDepth * 2,
    minYRadius: DEVICE.upperInsetHingeRadius, maxYRadius: DEVICE.upperInsetOuterRadius,
  } as const;
  const base = extrudedMesh(panelShape(profile), {
    thickness: DEVICE.upperThickness, material: materials.shell,
  });
  base.position.set(0, DEVICE.panelHeight / 2 + DEVICE.hingeRadius, DEVICE.upperBodyCenterZ);
  base.updateMatrix();
  const baseBrush = new Brush(base.geometry.clone(), materials.shell);
  baseBrush.geometry.applyMatrix4(base.matrix);
  base.geometry.dispose();

  const pocketDepth = DEVICE.upperInsetDepth + UPPER_POCKET_FILLET_REFERENCE.depth + px(0.2);
  const pocket = extrudedMesh(panelShape(innerProfile), {
    thickness: pocketDepth,
    material: materials.shell,
    fillet: { ...UPPER_POCKET_FILLET_REFERENCE, bevelOffset: -UPPER_POCKET_FILLET_REFERENCE.radius },
  });
  pocket.position.set(0, DEVICE.panelHeight / 2 + DEVICE.hingeRadius, DEVICE.upperContactFaceZ);
  pocket.updateMatrix();
  const pocketBrush = new Brush(pocket.geometry.clone(), materials.shell);
  pocketBrush.geometry.applyMatrix4(pocket.matrix);
  pocket.geometry.dispose();

  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  const upperShell = evaluator.evaluate(baseBrush, pocketBrush, SUBTRACTION);
  upperShell.name = "upperBackSkin";
  upperShell.material = materials.shell;
  upperShell.geometry.computeVertexNormals();
  pivot.add(upperShell);
  baseBrush.geometry.dispose();
  pocketBrush.geometry.dispose();
  addUpperDisplay(pivot);
  PHYSICAL.speakerX.forEach((x) => PHYSICAL.speakerY.forEach((y) => {
    const aperture = cylinderMesh({ radius: PHYSICAL.speakerRadius, depth: px(1.6), material: materials.portVoid, segments: 24 });
    aperture.rotation.x = Math.PI / 2;
    aperture.position.set(x, y + DEVICE.hingeRadius, DEVICE.upperInnerSurfaceZ + px(0.6));
    pivot.add(aperture);
  }));
  const anchors = addCameraAndBadge(pivot);

  const centerCover = cylinderMesh({
    radius: DEVICE.hingeRadius,
    depth: PHYSICAL.hinge.center.coverWidth,
    material: materials.shell,
    segments: 64,
  });
  centerCover.rotation.z = Math.PI / 2;
  pivot.add(centerCover);
  return { pivot, outerLogoAnchor: anchors.outer, badgeLogoAnchor: anchors.badge };
}

function addFixedHinges(root: THREE.Group): void {
  [PHYSICAL.hinge.left, PHYSICAL.hinge.right].forEach((spec) => {
    const barrel = cylinderMesh({ radius: DEVICE.hingeRadius, depth: spec.width, material: materials.shell, segments: 64 });
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(spec.x, DEVICE.hingeAxisY, DEVICE.hingeZ);
    root.add(barrel);
  });
}

export function createDeviceModel(): DeviceModel {
  const state: BuildState = { interactives: [], records: new Map(), motions: new Map(), ledMaterials: [] };
  const root = new THREE.Group();
  const lower = createLower(state);
  root.add(lower.group);
  const upper = createUpper();
  root.add(upper.pivot);
  addFixedHinges(root);

  let closed = false;
  let toggleOn = true;
  let targetRotation = panelRotationForOpening(DEVICE.openAngle);
  const isHingeSettled = (): boolean => Math.abs(upper.pivot.rotation.x - targetRotation) <= THREE.MathUtils.degToRad(DEVICE.hingeSettleEpsilon);
  const update = (delta: number): void => {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    upper.pivot.rotation.x = reducedMotion ? targetRotation : THREE.MathUtils.damp(upper.pivot.rotation.x, targetRotation, 7, delta);
    state.motions.forEach((motion) => {
      motion.holdRemaining = Math.max(0, motion.holdRemaining - delta);
      const targetDepression = motion.holdRemaining > 0 ? motion.travel : 0;
      motion.depression = reducedMotion ? targetDepression : THREE.MathUtils.damp(motion.depression, targetDepression, 24, delta);
      const x = motion.rest.x - motion.normal.x * motion.depression;
      const y = motion.rest.y - motion.normal.y * motion.depression;
      const z = motion.rest.z - motion.normal.z * motion.depression;
      motion.object.position.x = reducedMotion ? x : THREE.MathUtils.damp(motion.object.position.x, x, 24, delta);
      motion.object.position.y = reducedMotion ? y : THREE.MathUtils.damp(motion.object.position.y, y, 24, delta);
      motion.object.position.z = reducedMotion ? z : THREE.MathUtils.damp(motion.object.position.z, z, 18, delta);
      const tiltWeight = motion.holdRemaining > 0 ? 1 : 0;
      const rotationX = motion.restRotation.x + motion.activeTilt.x * tiltWeight;
      const rotationZ = motion.restRotation.z + motion.activeTilt.z * tiltWeight;
      motion.object.rotation.x = reducedMotion ? rotationX : THREE.MathUtils.damp(motion.object.rotation.x, rotationX, 28, delta);
      motion.object.rotation.z = reducedMotion ? rotationZ : THREE.MathUtils.damp(motion.object.rotation.z, rotationZ, 28, delta);
    });
  };
  const press = (object: THREE.Object3D): DeviceAction | undefined => {
    const record = state.records.get(object);
    if (!record) return undefined;
    record.motion.holdRemaining = 0.1;
    record.motion.activeTilt.copy(record.tilt);
    if (record.action === "toggle") {
      toggleOn = !toggleOn;
      lower.toggleMotion.rest.z = toggleOn ? PHYSICAL.toggle.onZ : PHYSICAL.toggle.offZ;
      state.ledMaterials.forEach((material) => { material.emissiveIntensity = toggleOn ? 2.6 : 0.06; });
    }
    return record.action;
  };
  const setClosed = (next: boolean): void => {
    closed = next;
    targetRotation = panelRotationForOpening(next ? DEVICE.closedAngle : DEVICE.openAngle);
  };
  upper.pivot.rotation.x = targetRotation;
  return {
    root,
    upperPivot: upper.pivot,
    interactives: state.interactives,
    outerLogoAnchor: upper.outerLogoAnchor,
    badgeLogoAnchor: upper.badgeLogoAnchor,
    update,
    press,
    setClosed,
    isClosed: () => closed,
    isHingeSettled,
    screensVisible: () => !closed && isHingeSettled() && openingForPanelRotation(upper.pivot.rotation.x) >= DEVICE.screenVisibilityAngle,
  };
}
