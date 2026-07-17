import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { PHYSICAL, px } from "./config";
import type { DeviceModel } from "./device";

type LogoSpec = {
  readonly anchor: THREE.Group;
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly material: THREE.Material | THREE.Material[];
  readonly rotation: number;
  readonly recessed: boolean;
};

async function mountSvgLogo(spec: LogoSpec): Promise<void> {
  const data = await new SVGLoader().loadAsync(spec.url);
  const content = new THREE.Group();
  data.paths.forEach((path) => {
    SVGLoader.createShapes(path).forEach((shape) => {
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: spec.depth,
        steps: 1,
        curveSegments: 32,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: Math.min(px(0.35), spec.depth * 0.3),
        bevelThickness: Math.min(px(0.35), spec.depth * 0.3),
      });
      if (spec.recessed) geometry.translate(0, 0, -spec.depth);
      geometry.computeVertexNormals();
      content.add(new THREE.Mesh(geometry, spec.material));
    });
  });
  content.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(content);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  content.position.set(-center.x, center.y, 0);
  content.scale.y = -1;

  const container = new THREE.Group();
  container.rotation.z = spec.rotation;
  container.add(content);
  const rotatedWidth = Math.abs(Math.cos(spec.rotation)) < 0.5 ? size.y : size.x;
  const rotatedHeight = Math.abs(Math.cos(spec.rotation)) < 0.5 ? size.x : size.y;
  const scale = Math.min(spec.width / rotatedWidth, spec.height / rotatedHeight);
  container.scale.set(scale, scale, 1);
  container.userData.sourceAsset = spec.url;
  spec.anchor.add(container);
}

async function engraveOuterLogo(spec: Omit<LogoSpec, "material" | "recessed">, floorMaterial: THREE.Material): Promise<void> {
  const data = await new SVGLoader().loadAsync(spec.url);
  const cutterContent = new THREE.Group();
  const cutterDepth = spec.depth + px(0.35);
  data.paths.forEach((path) => {
    SVGLoader.createShapes(path).forEach((shape) => {
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: cutterDepth,
        steps: 1,
        curveSegments: 32,
        bevelEnabled: false,
      });
      geometry.translate(0, 0, -cutterDepth);
      geometry.clearGroups();
      cutterContent.add(new Brush(geometry));
    });
  });
  cutterContent.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(cutterContent);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  cutterContent.position.set(-center.x, center.y, 0);
  cutterContent.scale.y = -1;

  const cutterContainer = new THREE.Group();
  cutterContainer.rotation.z = spec.rotation;
  cutterContainer.add(cutterContent);
  const rotatedWidth = Math.abs(Math.cos(spec.rotation)) < 0.5 ? size.y : size.x;
  const rotatedHeight = Math.abs(Math.cos(spec.rotation)) < 0.5 ? size.x : size.y;
  const scale = Math.min(spec.width / rotatedWidth, spec.height / rotatedHeight);
  cutterContainer.scale.set(scale, scale, 1);
  spec.anchor.add(cutterContainer);

  const pivot = spec.anchor.parent;
  const backSkin = pivot?.getObjectByName("upperBackSkin");
  if (!pivot || !(backSkin instanceof THREE.Mesh)) throw new Error("Upper back skin is unavailable for logo engraving");
  pivot.updateMatrixWorld(true);
  backSkin.updateMatrix();
  const baseGeometry = backSkin.geometry.clone();
  baseGeometry.clearGroups();
  let result = new Brush(baseGeometry, backSkin.material);
  result.matrixAutoUpdate = false;
  result.matrix.copy(backSkin.matrix);
  result.updateMatrixWorld(true);
  const pivotWorldInverse = pivot.matrixWorld.clone().invert();
  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  cutterContent.children.forEach((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const cutter = new Brush(child.geometry.clone(), backSkin.material);
    cutter.geometry.clearGroups();
    cutter.matrixAutoUpdate = false;
    cutter.matrix.copy(pivotWorldInverse).multiply(child.matrixWorld);
    cutter.updateMatrixWorld(true);
    const previous = result;
    result = evaluator.evaluate(previous, cutter, SUBTRACTION);
    if (previous !== result) previous.geometry.dispose();
    cutter.geometry.dispose();
  });
  backSkin.geometry.dispose();
  backSkin.geometry = result.geometry;
  result.geometry.computeVertexNormals();
  spec.anchor.remove(cutterContainer);

  const floorContent = new THREE.Group();
  data.paths.forEach((path) => {
    SVGLoader.createShapes(path).forEach((shape) => {
      const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape, 32), floorMaterial);
      floor.position.z = -spec.depth + px(0.03);
      floorContent.add(floor);
    });
  });
  floorContent.position.set(-center.x, center.y, 0);
  floorContent.scale.y = -1;
  const floorContainer = new THREE.Group();
  floorContainer.rotation.z = spec.rotation;
  floorContainer.scale.set(scale, scale, 1);
  floorContainer.userData.sourceAsset = spec.url;
  floorContainer.add(floorContent);
  spec.anchor.add(floorContainer);
}

export async function mountDeviceLogos(device: Pick<DeviceModel, "outerLogoAnchor" | "badgeLogoAnchor">): Promise<void> {
  const engravedFloor = new THREE.MeshPhysicalMaterial({
    color: 0xb94fa8,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.28,
    clearcoatRoughness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const badgeLogoMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  await Promise.all([
    engraveOuterLogo({
      anchor: device.outerLogoAnchor,
      url: "/assets/osg-main-logo.svg",
      width: PHYSICAL.outerLogo.width,
      height: PHYSICAL.outerLogo.height,
      depth: px(1.2),
      rotation: Math.PI / 2,
    }, engravedFloor),
    mountSvgLogo({
      anchor: device.badgeLogoAnchor,
      url: "/assets/osg-logo-white.svg",
      width: px(40),
      height: px(28),
      depth: px(0.7),
      material: badgeLogoMaterial,
      rotation: 0,
      recessed: false,
    }),
  ]);
}
