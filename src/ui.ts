import { generateClipPath } from "@lisse/core";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { DEVICE, WORKS, type Work } from "./config";

type UiCallbacks = {
  readonly onFocus: (index: number) => void;
  readonly onOpenWork: (work: Work) => void;
};

function getWork(index: number): Work {
  const work = WORKS[index] ?? WORKS[0];
  if (!work) throw new Error("Portfolio catalogue requires at least one work");
  return work;
}

export type ScreenUi = {
  readonly topObject: CSS3DObject;
  readonly bottomObject: CSS3DObject;
  readonly setFocused: (index: number) => void;
  readonly setVisible: (visible: boolean) => void;
  readonly toggleDetail: () => boolean;
};

function smooth(element: HTMLElement, width: number, height: number, radius: number): void {
  element.style.clipPath = generateClipPath(width, height, { radius, smoothing: 0.6 });
}

function buildUpper(): HTMLElement {
  const screen = document.createElement("section");
  screen.className = "screen screen--upper";
  screen.setAttribute("aria-live", "polite");
  screen.innerHTML = `
    <div class="work-visual" aria-hidden="true">
      <div class="work-logo-box"><div class="work-mark"><span>O</span><span>S</span><span>G</span></div></div>
    </div>
    <div class="sr-only"><p class="work-category"></p><h1 class="work-title"></h1><p class="work-summary"></p><span class="work-number"></span></div>`;
  const visual = screen.querySelector<HTMLElement>(".work-visual");
  const logoBox = screen.querySelector<HTMLElement>(".work-logo-box");
  if (!visual || !logoBox) throw new Error("Upper screen visual is incomplete");
  smooth(visual, 464, 348, 5);
  smooth(logoBox, 105, 60, 8);
  smooth(screen, 480, 360, 7);
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
    const row = document.createElement("button");
    row.className = "catalogue-row";
    row.type = "button";
    row.dataset.index = String(index);
    row.setAttribute("role", "option");
    row.innerHTML = `<span class="row-pill" aria-hidden="true"></span><span class="row-duration">${work.duration}</span><span class="row-title">${work.title}</span><span class="row-arrow" aria-hidden="true">••••›</span>`;
    row.addEventListener("click", () => callbacks.onFocus(index));
    row.addEventListener("dblclick", () => callbacks.onOpenWork(work));
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      callbacks.onFocus(index);
      callbacks.onOpenWork(work);
      event.preventDefault();
      event.stopPropagation();
    });
    const pill = row.querySelector<HTMLElement>(".row-pill");
    if (!pill) throw new Error("Catalogue focus pill is missing");
    smooth(pill, 464, 48, 24);
    list.append(row);
  });
  screen.append(list);
  screen.addEventListener("keydown", (event) => {
    const current = Number(screen.dataset.focused ?? "0");
    if (event.key === "ArrowDown") callbacks.onFocus(Math.min(WORKS.length - 1, current + 1));
    else if (event.key === "ArrowUp") callbacks.onFocus(Math.max(0, current - 1));
    else if (event.key === "Home") callbacks.onFocus(0);
    else if (event.key === "End") callbacks.onFocus(WORKS.length - 1);
    else if (event.key === "Enter" && event.target === screen) callbacks.onOpenWork(getWork(current));
    else return;
    event.preventDefault();
  });
  smooth(screen, 480, 360, 7);
  return screen;
}

export function createScreenUi(callbacks: UiCallbacks): ScreenUi {
  const upper = buildUpper();
  const lower = buildCatalogue(callbacks);
  const list = lower.querySelector<HTMLElement>(".catalogue-list");
  if (!list) throw new Error("Catalogue list is missing");
  const topObject = new CSS3DObject(upper);
  topObject.scale.setScalar(DEVICE.uiScale);
  topObject.position.set(0, DEVICE.screenCenterY, 0.835);
  const bottomObject = new CSS3DObject(lower);
  bottomObject.scale.setScalar(DEVICE.uiScale);
  bottomObject.rotation.x = -Math.PI / 2;
  bottomObject.position.set(0, 1.05, 0.2);

  const setFocused = (index: number): void => {
    const work = getWork(index);
    lower.dataset.focused = String(index);
    lower.querySelectorAll<HTMLButtonElement>(".catalogue-row").forEach((row, rowIndex) => {
      const focused = rowIndex === index;
      row.classList.toggle("is-focused", focused);
      row.setAttribute("aria-selected", String(focused));
      if (focused) {
        const top = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
        list.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    });
    upper.style.setProperty("--work-primary", "#ff81ea");
    upper.style.setProperty("--work-dark", "#100b10");
    upper.style.setProperty("--work-light", "#ffffff");
    const category = upper.querySelector<HTMLElement>(".work-category");
    const title = upper.querySelector<HTMLElement>(".work-title");
    const summary = upper.querySelector<HTMLElement>(".work-summary");
    const number = upper.querySelector<HTMLElement>(".work-number");
    if (category) category.textContent = work.category;
    if (title) title.textContent = work.title;
    if (summary) summary.textContent = work.summary;
    if (number) number.textContent = String(index + 1).padStart(2, "0");
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
