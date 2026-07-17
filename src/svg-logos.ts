import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { PHYSICAL, px } from "./config";
import type { DeviceModel } from "./device";

type LogoSpec = {
  readonly anchor: THREE.Group;
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly material: THREE.Material;
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
        bevelSize: Math.min(px(0.15), spec.depth * 0.2),
        bevelThickness: Math.min(px(0.15), spec.depth * 0.2),
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

export async function mountDeviceLogos(device: Pick<DeviceModel, "outerLogoAnchor" | "badgeLogoAnchor">): Promise<void> {
  const engravedMaterial = new THREE.MeshPhysicalMaterial({
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
    mountSvgLogo({
      anchor: device.outerLogoAnchor,
      url: "/assets/osg-logo.svg",
      width: PHYSICAL.outerLogo.width,
      height: PHYSICAL.outerLogo.height,
      depth: px(0.6),
      material: engravedMaterial,
      rotation: Math.PI / 2,
      recessed: true,
    }),
    mountSvgLogo({
      anchor: device.badgeLogoAnchor,
      url: "/assets/osg-logo-white.svg",
      width: px(46),
      height: px(32),
      depth: px(0.7),
      material: badgeLogoMaterial,
      rotation: 0,
      recessed: false,
    }),
  ]);
}
