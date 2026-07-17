import * as THREE from "three";
import { generateClipPath } from "@lisse/core";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { DEVICE, WORKS } from "./config";
import { createDeviceModel, type DeviceAction } from "./device";
import { mountDeviceLogos } from "./svg-logos";
import { createScreenUi } from "./ui";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Application mount point is missing");

app.innerHTML = `
  <header class="site-header">
    <a class="wordmark" href="#device" aria-label="OSG home"><span>OSG</span><i></i><span>001</span></a>
    <p>Interactive portfolio object · drag to rotate</p>
  </header>
  <section class="stage" id="device" aria-label="Interactive folding portfolio device">
    <div class="render-layer" id="render-layer"></div>
  </section>
  <footer class="site-controls">
    <p class="device-status" role="status">OPEN · WORK 05 / 09</p>
    <div class="control-cluster">
      <button class="interface-button" id="reset-view" type="button">RESET VIEW</button>
      <button class="interface-button interface-button--primary" id="hinge-control" type="button" aria-expanded="true">CLOSE DEVICE</button>
    </div>
  </footer>`;

await Promise.all([
  document.fonts.load("300 17px OSG Capsules"),
  document.fonts.load("400 17px OSG Capsules"),
  document.fonts.load("700 17px OSG Capsules"),
]);
document.querySelectorAll<HTMLElement>(".interface-button").forEach((button) => {
  const bounds = button.getBoundingClientRect();
  button.style.clipPath = generateClipPath(bounds.width, bounds.height, { radius: bounds.height / 2, smoothing: 0.6 });
});

const renderLayer = document.querySelector<HTMLElement>("#render-layer");
const status = document.querySelector<HTMLElement>(".device-status");
const hingeButton = document.querySelector<HTMLButtonElement>("#hinge-control");
const resetButton = document.querySelector<HTMLButtonElement>("#reset-view");
if (!renderLayer || !status || !hingeButton || !resetButton) throw new Error("Interface controls are incomplete");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 360);
const openCameraScale = (aspect: number): number => Math.max(1, 0.92 / aspect);
camera.position.set(0, 109.4, 4);
camera.lookAt(0, 0, DEVICE.hingeZ);
const cameraGoal = camera.position.clone();
const cameraFocus = new THREE.Vector3(0, 0, DEVICE.hingeZ);
const cameraFocusGoal = cameraFocus.clone();
const closedCameraPosition = new THREE.Vector3(0, 110, 8);
const closedCameraFocusZ = DEVICE.hingeZ + DEVICE.lowerDepth / 2;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 0.94;
renderer.domElement.className = "webgl-layer";
renderLayer.append(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const roomEnvironment = new RoomEnvironment();
const environmentTarget = pmrem.fromScene(roomEnvironment, 0.04);
scene.environment = environmentTarget.texture;
scene.environmentIntensity = 0.35;
roomEnvironment.dispose();
pmrem.dispose();

const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.className = "css3d-layer";
cssRenderer.domElement.style.overflow = "clip";
renderLayer.append(cssRenderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0xf4e9f2, 0.12));
const key = new THREE.RectAreaLight(0xffffff, 5, 32, 20);
key.position.set(-2, 34, 42);
key.lookAt(0, 0, -8);
scene.add(key);

const device = createDeviceModel();
await mountDeviceLogos(device);
scene.add(device.root);
let focused = 4;
const setStatus = (message: string): void => { status.textContent = message; };
const focusWork = (index: number): void => {
  focused = THREE.MathUtils.clamp(index, 0, WORKS.length - 1);
  screens.setFocused(focused);
  setStatus(`OPEN · WORK ${String(focused + 1).padStart(2, "0")} / 09`);
};
const screens = createScreenUi({
  onFocus: focusWork,
  onOpenWork: (work) => {
    const detailVisible = screens.toggleDetail();
    setStatus(detailVisible ? `VIEWING · ${work.title}` : `OPEN · WORK ${String(focused + 1).padStart(2, "0")} / 09`);
  },
});
device.root.add(screens.bottomObject);
device.upperPivot.add(screens.topObject);
focusWork(focused);

let hingeTransitioning = false;
const setClosed = (closed: boolean): void => {
  device.setClosed(closed);
  hingeTransitioning = true;
  hingeButton.disabled = true;
  screens.setVisible(false);
  const scale = openCameraScale(camera.aspect);
  cameraGoal.copy(closed ? closedCameraPosition : new THREE.Vector3(0, 109.4 * scale, 4));
  cameraFocusGoal.set(0, 0, closed ? closedCameraFocusZ : DEVICE.hingeZ);
  hingeButton.textContent = closed ? "OPEN DEVICE" : "CLOSE DEVICE";
  hingeButton.setAttribute("aria-expanded", String(!closed));
  setStatus(closed ? "CLOSING · OSG 001" : "OPENING · OSG 001");
};
hingeButton.addEventListener("click", () => setClosed(!device.isClosed()));
resetButton.addEventListener("click", () => {
  device.root.rotation.set(0, 0, 0);
  setStatus("VIEW RESET");
});

const runAction = (action: DeviceAction): void => {
  if (action === "previous") focusWork(focused - 1);
  else if (action === "next") focusWork(focused + 1);
  else if (action === "toggle") setStatus("MOTION TOGGLED");
  else if (action === "theme") {
    document.documentElement.classList.toggle("is-dark");
    setStatus(document.documentElement.classList.contains("is-dark") ? "DARK MODE" : "LIGHT MODE");
  } else if (action === "artworks") focusWork(0);
  else if (action === "fonts") focusWork(1);
  else if (action === "tools") focusWork(2);
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let dragging = false;
let moved = false;
let lastX = 0;
let lastY = 0;
renderer.domElement.addEventListener("pointerdown", (event) => {
  dragging = true;
  moved = false;
  lastX = event.clientX;
  lastY = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener("pointermove", (event) => {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
  if (!dragging) {
    raycaster.setFromCamera(pointer, camera);
    const hovered = raycaster.intersectObjects([...device.interactives], false)[0]?.object;
    device.interactives.forEach((object) => { object.userData.hovered = object === hovered; });
    renderer.domElement.style.cursor = hovered ? "pointer" : "grab";
    return;
  }
  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;
  if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
  device.root.rotation.y = THREE.MathUtils.clamp(device.root.rotation.y + dx * 0.005, -0.48, 0.48);
  device.root.rotation.x = THREE.MathUtils.clamp(device.root.rotation.x + dy * 0.003, -0.24, 0.1);
  lastX = event.clientX;
  lastY = event.clientY;
});
renderer.domElement.addEventListener("pointerup", (event) => {
  dragging = false;
  if (moved) return;
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects([...device.interactives], false)[0];
  if (!hit) return;
  const action = device.press(hit.object);
  if (action) runAction(action);
});

const resize = (): void => {
  const width = renderLayer.clientWidth;
  const height = renderLayer.clientHeight;
  camera.aspect = width / height;
  const scale = openCameraScale(camera.aspect);
  cameraGoal.copy(device.isClosed() ? closedCameraPosition : new THREE.Vector3(0, 109.4 * scale, 4));
  if (!device.isClosed()) camera.position.copy(cameraGoal);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  cssRenderer.setSize(width, height);
};
new ResizeObserver(resize).observe(renderLayer);
resize();

const clock = new THREE.Clock();
let visible = true;
renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.04);
  device.update(delta);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    camera.position.copy(cameraGoal);
    cameraFocus.copy(cameraFocusGoal);
  } else {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraGoal.x, 6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraGoal.y, 6, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraGoal.z, 6, delta);
    cameraFocus.x = THREE.MathUtils.damp(cameraFocus.x, cameraFocusGoal.x, 6, delta);
    cameraFocus.y = THREE.MathUtils.damp(cameraFocus.y, cameraFocusGoal.y, 6, delta);
    cameraFocus.z = THREE.MathUtils.damp(cameraFocus.z, cameraFocusGoal.z, 6, delta);
  }
  camera.lookAt(cameraFocus);
  const nextVisible = device.screensVisible();
  if (nextVisible !== visible) {
    visible = nextVisible;
    screens.setVisible(visible);
  }
  if (hingeTransitioning && device.isHingeSettled()) {
    hingeTransitioning = false;
    hingeButton.disabled = false;
    setStatus(device.isClosed() ? "CLOSED · OSG 001" : `OPEN · WORK ${String(focused + 1).padStart(2, "0")} / 09`);
  }
  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
});
