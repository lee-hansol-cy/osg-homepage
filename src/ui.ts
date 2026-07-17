import { generateClipPath } from "@lisse/core";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { DEVICE, px, WORKS, type Work } from "./config";

type UiCallbacks = {
  readonly onFocus: (index: number) => void;
  readonly onOpenWork: (work: Work) => void;
};

export type ScreenUi = {
  readonly topObject: CSS3DObject;
  readonly bottomObject: CSS3DObject;
  readonly setFocused: (index: number) => void;
  readonly setVisible: (visible: boolean) => void;
  readonly toggleDetail: () => boolean;
};

function getWork(index: number): Work {
  const work = WORKS[index];
  if (!work) throw new Error(`Portfolio work ${index} is unavailable`);
  return work;
}

function smooth(element: HTMLElement, width: number, height: number, radius: number): void {
  element.style.clipPath = generateClipPath(width, height, { radius, smoothing: 0.6 });
}

function arrowMarkup(): string {
  const dots = [
    [5.04, 2.82], [10.08, 2.82], [15.12, 2.82], [15.12, 7.86], [15.12, 12.9],
    [12.6, 5.34], [10.08, 7.86], [7.56, 10.38], [5.04, 12.9], [2.52, 15.42], [0, 17.94],
  ];
  return `<svg class="row-arrow" viewBox="0 0 18 21" aria-hidden="true">${dots.map(([x, y]) => `<circle cx="${Number(x) + 1.44}" cy="${Number(y) + 1.44}" r="1.44"/>`).join("")}</svg>`;
}

function buildUpper(): HTMLElement {
  const screen = document.createElement("section");
  screen.className = "screen screen--upper";
  screen.setAttribute("aria-live", "polite");
  screen.innerHTML = `
    <div class="work-visual" aria-hidden="true">
      <div class="work-logo-box"><img src="/assets/osg-logo.svg" width="69" height="48" alt=""></div>
    </div>
    <div class="sr-only"><p class="work-category"></p><h1 class="work-title"></h1><p class="work-summary"></p><span class="work-number"></span></div>`;
  const logoBox = screen.querySelector<HTMLElement>(".work-logo-box");
  if (!logoBox) throw new Error("Upper display logo frame is missing");
  smooth(logoBox, 105, 60, 8);
  return screen;
}

function buildCatalogue(callbacks: UiCallbacks): HTMLElement {
  const screen = document.createElement("section");
  screen.className = "screen screen--lower";
  screen.tabIndex = 0;
  screen.setAttribute("role", "listbox");
  screen.setAttribute("aria-label", "Portfolio works catalogue");
  const list = document.createElement("div");
  list.className = "catalogue-list";

  WORKS.forEach((work, index) => {
    const row = document.createElement("div");
    row.className = "catalogue-row";
    row.dataset.index = String(index);
    row.setAttribute("role", "option");
    row.setAttribute("aria-label", `${work.duration} ${work.title}`);
    row.innerHTML = `<span class="row-pill" aria-hidden="true"></span><span class="row-duration">${work.duration}</span><span class="row-title">${work.title}</span>${arrowMarkup()}`;
    row.addEventListener("click", () => callbacks.onFocus(index));
    row.addEventListener("dblclick", () => callbacks.onOpenWork(work));
    const pill = row.querySelector<HTMLElement>(".row-pill");
    if (!pill) throw new Error("Catalogue focus capsule is missing");
    smooth(pill, 464, 48, 24);
    list.append(row);
  });

  let wheelAccumulator = 0;
  screen.append(list);
  document.addEventListener("wheel", (event) => {
    if (screen.classList.contains("is-hidden")) return;
    const bounds = screen.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    wheelAccumulator += event.deltaY;
    if (Math.abs(wheelAccumulator) < 36) return;
    const current = Number(screen.dataset.focused ?? "0");
    callbacks.onFocus(Math.max(0, Math.min(WORKS.length - 1, current + Math.sign(wheelAccumulator))));
    wheelAccumulator = 0;
    event.preventDefault();
  }, { passive: false });
  screen.addEventListener("keydown", (event) => {
    const current = Number(screen.dataset.focused ?? "0");
    if (event.key === "ArrowDown") callbacks.onFocus(Math.min(WORKS.length - 1, current + 1));
    else if (event.key === "ArrowUp") callbacks.onFocus(Math.max(0, current - 1));
    else if (event.key === "Home") callbacks.onFocus(0);
    else if (event.key === "End") callbacks.onFocus(WORKS.length - 1);
    else if (event.key === "Enter") callbacks.onOpenWork(getWork(current));
    else return;
    event.preventDefault();
  });
  return screen;
}

export function createScreenUi(callbacks: UiCallbacks): ScreenUi {
  const upper = buildUpper();
  const lower = buildCatalogue(callbacks);
  const topObject = new CSS3DObject(upper);
  topObject.scale.setScalar(DEVICE.uiScale);
  topObject.position.set(0, DEVICE.screenCenterY + DEVICE.hingeRadius, DEVICE.upperThickness / 2 + 0.006);
  const bottomObject = new CSS3DObject(lower);
  bottomObject.scale.setScalar(DEVICE.uiScale);
  bottomObject.rotation.x = -Math.PI / 2;
  bottomObject.position.set(0, DEVICE.lowerSurfaceY + px(2.15), DEVICE.lowerScreenCenterZ);

  const setFocused = (index: number): void => {
    const work = getWork(index);
    lower.dataset.focused = String(index);
    lower.querySelectorAll<HTMLElement>(".catalogue-row").forEach((row, rowIndex) => {
      const focused = rowIndex === index;
      row.classList.toggle("is-focused", focused);
      row.setAttribute("aria-selected", String(focused));
    });
    const category = upper.querySelector<HTMLElement>(".work-category");
    const title = upper.querySelector<HTMLElement>(".work-title");
    const summary = upper.querySelector<HTMLElement>(".work-summary");
    const number = upper.querySelector<HTMLElement>(".work-number");
    if (category) category.textContent = work.category;
    if (title) title.textContent = work.title;
    if (summary) summary.textContent = work.summary;
    if (number) number.textContent = String(index + 1).padStart(2, "0");
    upper.dataset.workIndex = String(index);
  };
  const setVisible = (visible: boolean): void => {
    upper.classList.toggle("is-hidden", !visible);
    lower.classList.toggle("is-hidden", !visible);
  };
  const toggleDetail = (): boolean => {
    upper.classList.toggle("is-detail");
    return upper.classList.contains("is-detail");
  };
  setFocused(4);
  return { topObject, bottomObject, setFocused, setVisible, toggleDetail };
}
