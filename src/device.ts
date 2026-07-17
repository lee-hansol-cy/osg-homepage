import * as THREE from "three";
import { DEVICE } from "./config";
import { crossShape, cylinder, extrudedShape, materials, panelShape, roundedMesh, roundedRectShape } from "./geometry";
import { createUvLabel } from "./labels";

export type DeviceAction = "previous" | "next" | "artworks" | "fonts" | "tools" | "toggle" | "theme";

export type DeviceModel = {
  readonly root: THREE.Group;
  readonly upperPivot: THREE.Group;
  readonly interactives: readonly THREE.Object3D[];
  readonly update: (delta: number) => void;
  readonly press: (object: THREE.Object3D) => DeviceAction | undefined;
  readonly setClosed: (closed: boolean) => void;
  readonly isClosed: () => boolean;
  readonly screensVisible: () => boolean;
};

function uvLabel(text: string, width: number, height: number, color = "#ffffff", weight = 300): THREE.Mesh {
  const label = createUvLabel({ text, width, height, color, weight });
  label.rotation.x = -Math.PI / 2;
  return label;
}

function frontLabel(text: string, width: number, height: number, color = "#ffffff", weight = 300): THREE.Mesh {
  return createUvLabel({ text, width, height, color, weight });
}

function actionMesh(mesh: THREE.Mesh, action: DeviceAction, interactives: THREE.Object3D[]): void {
  mesh.userData.action = action;
  mesh.userData.restY = mesh.position.y;
  mesh.userData.pressOffset = 0;
  interactives.push(mesh);
}

function isDeviceAction(value: unknown): value is DeviceAction {
  return value === "previous" || value === "next" || value === "artworks" || value === "fonts" || value === "tools" || value === "toggle" || value === "theme";
}

function flatRounded(width: number, depth: number, thickness: number, radius: number, material: THREE.Material): THREE.Mesh {
  const mesh = extrudedShape(roundedRectShape(width, depth, radius), thickness, material, 0.015);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function addDpadDots(key: THREE.Mesh, rotation: number): void {
  const dots = new THREE.Group();
  dots.rotation.y = rotation;
  const points = [[-0.48, 0.3], [-0.24, 0.06], [0, -0.18], [0.24, 0.06], [0.48, 0.3]] as const;
  points.forEach(([x, z]) => {
    const dot = cylinder(0.084, 0.018, materials.shellDeep, 14);
    dot.position.set(x, 0.055, z);
    dots.add(dot);
  });
  key.add(dots);
}

function createLower(interactives: THREE.Object3D[]): THREE.Group {
  const lower = new THREE.Group();
  const shell = extrudedShape(panelShape(DEVICE.width, DEVICE.lowerDepth, 1.5, true), DEVICE.lowerThickness, materials.shell, 0.08);
  shell.rotation.x = Math.PI / 2;
  lower.add(shell);
  const bezel = flatRounded(DEVICE.bezelWidth, DEVICE.bezelHeight, 0.07, 0.25, materials.ink);
  bezel.position.set(0, 1.005, 0.2);
  lower.add(bezel);

  const dpad = new THREE.Group();
  dpad.position.set(DEVICE.dpadX, 1.005, 0.25);
  lower.add(dpad);
  const dpadWell = extrudedShape(crossShape(5.6, 2.1, 0.38), 0.06, materials.ink, 0.02);
  dpadWell.rotation.x = Math.PI / 2;
  dpad.add(dpadWell);
  const dpadCap = extrudedShape(crossShape(5.5, 2, 0.36), 0.08, materials.control, 0.025);
  dpadCap.rotation.x = Math.PI / 2;
  dpadCap.position.y = 0.06;
  dpad.add(dpadCap);
  const directions: readonly [DeviceAction, number, number, number, number, number][] = [
    ["previous", 0, -1.8, 1.9, 1.5, 0],
    ["next", 0, 1.8, 1.9, 1.5, Math.PI],
    ["previous", -1.8, 0, 1.5, 1.9, -Math.PI / 2],
    ["next", 1.8, 0, 1.5, 1.9, Math.PI / 2],
  ];
  directions.forEach(([action, x, z, width, depth, rotation]) => {
    const key = roundedMesh([width, 0.025, depth], 0.28, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 4);
    key.position.set(x, 0.12, z);
    dpad.add(key);
    addDpadDots(key, rotation);
    actionMesh(key, action, interactives);
  });

  const buttonSpecs: readonly [string, DeviceAction, number][] = [
    ["Artworks", "artworks", -2],
    ["Fonts", "fonts", 0.3],
    ["Tools", "tools", 2.6],
  ];
  buttonSpecs.forEach(([labelText, action, z]) => {
    const well = flatRounded(5.6, 2.1, 0.055, 1.02, materials.ink);
    well.position.set(DEVICE.controlX, 1.005, z);
    lower.add(well);
    const button = flatRounded(5.5, 2, 0.08, 0.97, materials.control);
    button.position.set(DEVICE.controlX, 1.065, z);
    lower.add(button);
    actionMesh(button, action, interactives);
    const label = uvLabel(labelText, 5, 0.65, "#f02bd1");
    label.position.set(DEVICE.controlX, 1.125, z);
    lower.add(label);
    button.userData.label = label;
  });

  const toggleWell = flatRounded(0.8, 2, 0.055, 0.4, materials.control);
  toggleWell.position.set(14, 1.005, 7);
  lower.add(toggleWell);
  const toggle = flatRounded(0.7, 1.1, 0.08, 0.35, materials.shell);
  toggle.position.set(14, 1.065, 6.6);
  toggle.userData.toggleOn = true;
  toggle.userData.onZ = 6.6;
  toggle.userData.offZ = 7.4;
  lower.add(toggle);
  actionMesh(toggle, "toggle", interactives);
  const motionLabel = uvLabel("Motion", 2.15, 0.45, "#ffffff", 400);
  motionLabel.position.set(16.12, 1.03, 6.68);
  lower.add(motionLabel);
  const motionState = uvLabel("On / Off", 2.15, 0.42);
  motionState.position.set(16.12, 1.03, 7.16);
  lower.add(motionState);

  const selectWell = cylinder(0.4, 0.055, materials.ink, 28);
  selectWell.position.set(14, 1.005, 9);
  lower.add(selectWell);
  const select = cylinder(0.35, 0.08, materials.shell, 28);
  select.position.set(14, 1.065, 9);
  lower.add(select);
  actionMesh(select, "theme", interactives);
  const selectLabel = uvLabel("Light / Dark", 3.15, 0.45);
  selectLabel.position.set(16.62, 1.03, 9);
  lower.add(selectLabel);

  const ledPositions = [[19.53, 1.03, -9.63], [19.53, 1.03, -7.18]] as const;
  ledPositions.forEach(([x, y, z]) => {
    const led = cylinder(0.075, 0.025, materials.led.clone(), 18);
    led.position.set(x, y, z);
    led.userData.statusLed = true;
    lower.add(led);
  });
  const audioLabel = uvLabel("Audio", 1.4, 0.45);
  audioLabel.position.set(18.45, 1.03, -9.63);
  lower.add(audioLabel);
  const powerLabel = uvLabel("Power", 1.6, 0.45);
  powerLabel.position.set(18.32, 1.03, -7.18);
  lower.add(powerLabel);

  const jack = cylinder(0.33, 0.32, materials.ink, 24);
  jack.rotation.z = Math.PI / 2;
  jack.position.set(20.02, 0.1, -9.63);
  lower.add(jack);
  const usb = roundedMesh([0.28, 0.5, 1.55], 0.22, materials.ink, 5);
  usb.position.set(20.02, 0.08, -7.18);
  lower.add(usb);
  return lower;
}

function createUpper(): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(0, 0.65, -12);
  const speakerHoles = [-17, -15.4, 15.4, 17].flatMap((x) => [8.83, 10.43, 12.03, 13.63].map((y) => ({ x, y: y - 12, radius: 0.2 })));
  const shell = extrudedShape(panelShape(DEVICE.width, DEVICE.panelHeight, 2.56, true), DEVICE.upperThickness, materials.shell, 0.08);
  shell.position.y = 12;
  pivot.add(shell);
  const bezel = extrudedShape(roundedRectShape(DEVICE.bezelWidth, DEVICE.bezelHeight, 0.25), 0.055, materials.ink, 0.015);
  bezel.position.set(0, DEVICE.screenCenterY, 0.8);
  pivot.add(bezel);
  speakerHoles.forEach((holeSpec) => {
    const backing = cylinder(0.2, 0.05, materials.ink, 24);
    backing.rotation.x = Math.PI / 2;
    backing.position.set(holeSpec.x, holeSpec.y + 12, 0.76);
    pivot.add(backing);
  });
  const cameraFrame = cylinder(0.5, 0.05, materials.ink, 32);
  cameraFrame.rotation.x = Math.PI / 2;
  cameraFrame.position.set(0, 23.1, 0.79);
  pivot.add(cameraFrame);
  const lens = cylinder(0.22, 0.28, materials.lens, 32);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 23.1, 0.82);
  pivot.add(lens);
  const cameraLed = roundedMesh([0.4, 0.1, 0.1], 0.04, materials.led, 3);
  cameraLed.position.set(1.1, 23.1, 0.82);
  pivot.add(cameraLed);
  const badge = extrudedShape(roundedRectShape(3.5, 2, 0.4), 0.08, materials.chrome, 0.02);
  badge.position.set(0, 1.35, 0.81);
  pivot.add(badge);
  const badgeGlyph = frontLabel("OSG", 2.3, 1.6, "#ffffff", 700);
  badgeGlyph.position.set(0, 1.35, 0.87);
  pivot.add(badgeGlyph);
  const engraved = frontLabel("OSG", 4.8, 2, "#b94fa8", 700);
  engraved.position.set(0, 12, -0.761);
  engraved.rotation.z = Math.PI / 2;
  pivot.add(engraved);
  return pivot;
}

export function createDeviceModel(): DeviceModel {
  const interactives: THREE.Object3D[] = [];
  const root = new THREE.Group();
  root.rotation.x = 0;
  root.add(createLower(interactives));
  const upperPivot = createUpper();
  root.add(upperPivot);
  const hingeMaterial = materials.shell;
  for (const x of [-17.6, 0, 17.6]) {
    const hinge = cylinder(DEVICE.hingeRadius, x === 0 ? 30.5 : 4.8, hingeMaterial, 48);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, 1.1, -12);
    root.add(hinge);
  }
  let closed = false;
  let targetRotation = THREE.MathUtils.degToRad(90 - DEVICE.openAngle);
  const update = (delta: number): void => {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    upperPivot.rotation.x = reducedMotion ? targetRotation : THREE.MathUtils.damp(upperPivot.rotation.x, targetRotation, 7, delta);
    interactives.forEach((object) => {
      const restY = Number(object.userData.restY ?? object.position.y);
      const offset = Number(object.userData.pressOffset ?? 0);
      object.position.y = reducedMotion ? restY - offset : THREE.MathUtils.damp(object.position.y, restY - offset, 22, delta);
      const hoverScale = object.userData.hovered ? 1.035 : 1;
      object.scale.setScalar(reducedMotion ? hoverScale : THREE.MathUtils.damp(object.scale.x, hoverScale, 18, delta));
      const label = object.userData.label;
      if (label instanceof THREE.Object3D) label.position.y = object.position.y + 0.06;
    });
  };
  const press = (object: THREE.Object3D): DeviceAction | undefined => {
    const action: unknown = object.userData.action;
    if (!isDeviceAction(action)) return undefined;
    object.userData.pressOffset = DEVICE.buttonTravel;
    window.setTimeout(() => { object.userData.pressOffset = 0; }, 120);
    if (action === "toggle") {
      object.userData.toggleOn = !Boolean(object.userData.toggleOn);
      object.position.z = Number(object.userData.toggleOn ? object.userData.onZ : object.userData.offZ);
      root.traverse((child) => {
        if (!child.userData.statusLed || !(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshStandardMaterial)) return;
        child.material.emissiveIntensity = object.userData.toggleOn ? 2.8 : 0.08;
      });
    }
    return action;
  };
  const setClosed = (next: boolean): void => {
    closed = next;
    targetRotation = THREE.MathUtils.degToRad(90 - (next ? DEVICE.closedAngle : DEVICE.openAngle));
  };
  upperPivot.rotation.x = targetRotation;
  return { root, upperPivot, interactives, update, press, setClosed, isClosed: () => closed, screensVisible: () => upperPivot.rotation.x < 0.45 };
}
