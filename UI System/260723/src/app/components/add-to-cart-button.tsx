import { useState } from "react";
import { motion } from "motion/react";
import buyReflect from "../../imports/BuyItNow버튼/835be69efb66b4fa2c6eec6a9cb8abaadf28d07e.png";
import buyReflectHover from "../../imports/BuyItNow버튼호버/835be69efb66b4fa2c6eec6a9cb8abaadf28d07e.png";

/** 2,000 × 300px Figma coordinate system. */
const FIGMA = {
  bodyHeight: 300,
  bodyWidth: 2000,
  radius: 160,
  fontSize: 160,
  letterSpacing: 1.6,
  labelCenterY: 127.5,
  textShadowY: 30,
  textShadowBlur: 15,
  topInsetShadowY: 15,
  topInsetShadowBlur: 15,
  bottomInsetShadowY: 10,
  bottomInsetShadowBlur: 15,
  glossyLeft: 60,
  glossyTop: 70,
  glossyWidth: 1880,
  glossyHeight: 230,
  glossyBlur: 30,
  reflectLeft: 75,
  reflectTop: 10,
  reflectWidth: 1850,
  reflectHeight: 100,
  reflectRadiusTop: 70,
  reflectRadiusBottom: 30,
  reflectShadowLeft: 30,
  reflectShadowTop: 180,
  reflectShadowWidth: 1940,
  reflectShadowHeight: 230,
  reflectShadowBlur: 30,
  lift: 44,
} as const;

type ButtonKind = "cart" | "buy";
type ButtonVariant = "default" | "mobile";

interface Props {
  height?: number;
  variant?: ButtonVariant;
  onClick?: () => void;
}

const TONES = {
  cart: {
    label: "Add to Cart",
    reflect: buyReflect,
    reflectHover: buyReflectHover,
    baseTop: "#f570e0",
    baseBottom: "#ffccf6",
    hoverTop: "#f570e0",
    hoverBottom: "#ffccf6",
    baseGloss: "rgba(251,225,246,0.4)",
    hoverGloss: "rgba(251,225,246,0.4)",
    insetTop: "rgba(251,225,246,0.6)",
    insetBottom: "rgba(245,112,224,0.6)",
    hoverInsetBottom: "rgba(245,112,224,0.6)",
    baseBorder: "#f02bd1",
    baseText: "#f02bd1",
    hoverBorder: "#f02bd1",
    hoverText: "#f02bd1",
    reflectShadow: "rgba(251,225,246,0.8)",
  },
  buy: {
    label: "Buy it Now",
    reflect: buyReflect,
    reflectHover: buyReflectHover,
    baseTop: "#f02bd1",
    baseBottom: "#ff81ea",
    hoverTop: "#f570e0",
    hoverBottom: "#ffccf6",
    baseGloss: "rgba(251,225,246,0.4)",
    hoverGloss: "rgba(251,225,246,0.4)",
    insetTop: "rgba(251,225,246,0.6)",
    insetBottom: "rgba(240,43,209,0.6)",
    hoverInsetBottom: "rgba(245,112,224,0.6)",
    baseBorder: "#000000",
    baseText: "#ffffff",
    hoverBorder: "#f02bd1",
    hoverText: "#f02bd1",
    reflectShadow: "rgba(251,225,246,0.8)",
  },
} as const;

type Tone = (typeof TONES)[ButtonKind];
const px = (value: number, height: number) => (value * height) / FIGMA.bodyHeight;
const horizontal = (value: number) => `${(value / FIGMA.bodyWidth) * 100}%`;

/** Add to Cart: fixed light-pink purchase state. */
export function AddToCartButton(props: Props) {
  return <CommerceButton {...props} kind="cart" />;
}

/** Buy it Now: pink base with a lighter hover state. */
export function BuyItNowButton(props: Props) {
  return <CommerceButton {...props} kind="buy" />;
}

function CommerceButton({ height = 54, variant = "default", onClick, kind }: Props & { kind: ButtonKind }) {
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState(false);
  const mobile = variant === "mobile";
  const tone = TONES[kind];
  const lift = px(FIGMA.lift, height);
  const transition = "0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  const clear = () => {
    setActive(false);
    setPressed(false);
  };

  if (mobile) {
    return (
      <button
        type="button"
        onClick={onClick}
        onPointerDown={() => {
          setActive(true);
          setPressed(true);
        }}
        onPointerUp={clear}
        onPointerCancel={clear}
        onPointerLeave={clear}
        className="relative block w-full cursor-pointer border-0 bg-transparent p-0 outline-none"
        style={{ height, WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
      >
        <ButtonBody active={active} pressed={pressed} height={height} tone={tone} transition="none" staticChrome />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={clear}
      onFocus={() => setActive(true)}
      onBlur={clear}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className="relative block w-full cursor-pointer border-0 bg-transparent p-0 outline-none"
      style={{ height }}
    >
      <motion.div
        className="absolute inset-x-0 top-0"
        animate={{ y: active ? -lift : 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height }}
      >
        <HoverShadows active={active} height={height} tone={tone} transition={transition} />
        <ButtonBody active={active} pressed={pressed} height={height} tone={tone} transition={transition} />
      </motion.div>
    </button>
  );
}

function HoverShadows({ active, height, tone, transition }: { active: boolean; height: number; tone: Tone; transition: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      <div
        className="absolute"
        style={{
          left: horizontal(FIGMA.reflectShadowLeft),
          top: px(FIGMA.reflectShadowTop, height),
          width: horizontal(FIGMA.reflectShadowWidth),
          height: px(FIGMA.reflectShadowHeight, height),
          borderRadius: px(FIGMA.radius, height),
          background: tone.reflectShadow,
          filter: `blur(${px(FIGMA.reflectShadowBlur, height)}px)`,
          opacity: active ? 1 : 0,
          transition: `opacity ${transition}`,
        }}
      />
    </div>
  );
}

function ButtonBody({
  active,
  pressed,
  height,
  tone,
  transition,
  staticChrome = false,
}: {
  active: boolean;
  pressed: boolean;
  height: number;
  tone: Tone;
  transition: string;
  staticChrome?: boolean;
}) {
  const radius = px(FIGMA.radius, height);
  const isInstant = transition === "none";
  const labelOffset = px(FIGMA.labelCenterY - FIGMA.bodyHeight / 2, height);
  const chromeActive = active && !staticChrome;
  const reflectRadius = `${px(FIGMA.reflectRadiusTop, height)}px ${px(FIGMA.reflectRadiusTop, height)}px ${px(FIGMA.reflectRadiusBottom, height)}px ${px(FIGMA.reflectRadiusBottom, height)}px`;

  return (
    <div
      className="absolute inset-0"
      style={{
        filter: pressed ? "brightness(1.04)" : "none",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          border: `1px solid ${chromeActive ? tone.hoverBorder : tone.baseBorder}`,
          overflow: "hidden",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${tone.baseTop}, ${tone.baseBottom})`,
            opacity: active ? 0 : 1,
            transition: isInstant ? "none" : `opacity ${transition}`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${tone.hoverTop}, ${tone.hoverBottom})`,
            opacity: active ? 1 : 0,
            transition: isInstant ? "none" : `opacity ${transition}`,
          }}
        />
        <div
          className="absolute"
          style={{
            left: horizontal(FIGMA.glossyLeft),
            top: px(FIGMA.glossyTop, height),
            width: horizontal(FIGMA.glossyWidth),
            height: px(FIGMA.glossyHeight, height),
            borderRadius: radius,
            background: chromeActive ? tone.hoverGloss : tone.baseGloss,
            filter: `blur(${px(FIGMA.glossyBlur, height)}px)`,
            transition: isInstant ? "none" : `background ${transition}`,
          }}
        />
        <div
          className="absolute"
          style={{
            left: horizontal(FIGMA.reflectLeft),
            top: px(FIGMA.reflectTop, height),
            width: horizontal(FIGMA.reflectWidth),
            height: px(FIGMA.reflectHeight, height),
            borderRadius: reflectRadius,
            overflow: "hidden",
          }}
        >
          <img alt="" src={active ? tone.reflectHover : tone.reflect} className="block size-full max-w-none object-cover" />
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          boxShadow: `inset 0 ${px(FIGMA.topInsetShadowY, height)}px ${px(FIGMA.topInsetShadowBlur, height)}px ${tone.insetTop}, inset 0 -${px(FIGMA.bottomInsetShadowY, height)}px ${px(FIGMA.bottomInsetShadowBlur, height)}px ${chromeActive ? tone.hoverInsetBottom ?? tone.insetBottom : tone.insetBottom}`,
          transition: isInstant ? "none" : `box-shadow ${transition}`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center whitespace-nowrap"
        style={{
          transform: `translateY(${labelOffset}px)`,
          fontFamily: "'OSG Capsules', sans-serif",
          fontSize: px(FIGMA.fontSize, height),
          fontWeight: 300,
          letterSpacing: `${px(FIGMA.letterSpacing, height)}px`,
          color: chromeActive ? tone.hoverText : tone.baseText,
          textShadow: `0 ${px(FIGMA.textShadowY, height)}px ${px(FIGMA.textShadowBlur, height)}px rgba(0,0,0,0.25)`,
          transition: isInstant ? "none" : `color ${transition}`,
        }}
      >
        {tone.label}
      </div>
    </div>
  );
}
