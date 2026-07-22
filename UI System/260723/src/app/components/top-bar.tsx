import { useState } from "react";
import { motion } from "motion/react";
import osgLogo from "../../assets/osg-logo-topbar.png";

/**
 * Figma "OSG 메인페이지" → top bar 영역 (1920 × 100 coordinate system).
 * Node refs: capsule 667:106, gloss 667:110, hovering capsule 667:111,
 * logo 667:112, button area 674:239, page indicator 667:121.
 */
const FIGMA = {
  areaHeight: 100,
  capsuleTop: 20,
  capsuleHeight: 64,
  glowInsetXPercent: (43.2 / 1440) * 100,
  glowTop: 14.93,
  glowHeight: 49.07,
  glowBlur: 60,
  glossInsetX: 18,
  glossTop: 3,
  glossHeight: 21,
  glossRadiusTop: 70,
  glossRadiusBottom: 30,
  hoverCapsuleWidth: 96,
  hoverCapsuleHeight: 49,
  hoverCapsuleTop: 7,
  logoTop: 8,
  logoWidth: 70,
  logoHeight: 48,
  navRight: 48,
  navTop: 21,
  navHeight: 21,
  navGap: 36,
  navFontSize: 17,
  dotTop: 52,
  dotWidth: 6,
  dotHeight: 4,
  promoLeft: 10,
  promoRight: 12,
  promoTop: 10,
  promoWidth: 216,
  promoHeight: 80,
} as const;

const NAV_ITEMS = ["Works", "Shop", "About"] as const;
type NavItem = (typeof NAV_ITEMS)[number];

const promoStyle = {
  width: FIGMA.promoWidth,
  height: FIGMA.promoHeight,
  background: "linear-gradient(90deg, #95d1ff 0%, rgba(224, 242, 255, 0.365) 100%)",
  border: "1px solid #000000",
} as const;

/** OSG 메인페이지 상단 캡슐 내비게이션. 1920 디자인 기준, 좌우 240px 여유를 유지하며 줄어듦. */
export function TopBar({ initialPage = "Works" }: { initialPage?: NavItem }) {
  const [active, setActive] = useState<NavItem>(initialPage);
  const [hovered, setHovered] = useState<NavItem | null>(null);

  return (
    <header className="relative w-full" style={{ height: FIGMA.areaHeight }}>
      <div
        aria-hidden
        className="absolute hidden xl:block"
        style={{ left: FIGMA.promoLeft, top: FIGMA.promoTop, ...promoStyle }}
      />
      <div
        aria-hidden
        className="absolute hidden xl:block"
        style={{ right: FIGMA.promoRight, top: FIGMA.promoTop + 2, ...promoStyle }}
      />

      <div
        className="absolute left-1/2 w-[min(1440px,calc(100%-480px))] min-w-[720px] -translate-x-1/2"
        style={{ top: FIGMA.capsuleTop, height: FIGMA.capsuleHeight, opacity: 0.8 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, #f02bd1 0%, #ff81ea 100%)",
            borderRadius: FIGMA.capsuleHeight / 2,
            border: "1px solid #000000",
            boxShadow: "inset 0 -10px 15px rgba(240,43,209,0.6), inset 0 15px 15px rgba(251,225,246,0.6)",
            overflow: "hidden",
          }}
        >
          <div
            className="absolute"
            style={{
              left: `${FIGMA.glowInsetXPercent}%`,
              right: `${FIGMA.glowInsetXPercent}%`,
              top: FIGMA.glowTop,
              height: FIGMA.glowHeight,
              borderRadius: 9999,
              background: "rgba(251, 225, 246, 0.4)",
              filter: `blur(${FIGMA.glowBlur}px)`,
            }}
          />
          <div
            className="absolute"
            style={{
              left: FIGMA.glossInsetX,
              right: FIGMA.glossInsetX,
              top: FIGMA.glossTop,
              height: FIGMA.glossHeight,
              borderRadius: `${FIGMA.glossRadiusTop}px ${FIGMA.glossRadiusTop}px ${FIGMA.glossRadiusBottom}px ${FIGMA.glossRadiusBottom}px`,
              background: "linear-gradient(180deg, #fbe1f6 0%, rgba(251, 225, 246, 0.2) 100%)",
            }}
          />
        </div>

        <a
          href="/"
          aria-label="OSG 홈"
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: FIGMA.logoTop, width: FIGMA.logoWidth, height: FIGMA.logoHeight }}
        >
          <img src={osgLogo} alt="" className="block size-full select-none" />
        </a>

        <nav
          aria-label="OSG main navigation"
          className="absolute hidden items-center md:flex"
          style={{ right: FIGMA.navRight, top: FIGMA.navTop, height: FIGMA.navHeight, gap: FIGMA.navGap }}
          onMouseLeave={() => setHovered(null)}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActive(item)}
              onMouseEnter={() => setHovered(item)}
              className="relative cursor-pointer border-0 bg-transparent p-0 outline-none"
              style={{
                fontFamily: "'OSG Capsules', sans-serif",
                fontSize: FIGMA.navFontSize,
                lineHeight: `${FIGMA.navHeight}px`,
                letterSpacing: "0.01em",
                color: "#ffffff",
                WebkitTextStroke: "2px #f02bd1",
                paintOrder: "stroke fill",
              }}
              aria-current={active === item ? "page" : undefined}
            >
              {hovered === item && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: FIGMA.hoverCapsuleTop - FIGMA.navTop,
                    width: FIGMA.hoverCapsuleWidth,
                    height: FIGMA.hoverCapsuleHeight,
                    borderRadius: FIGMA.hoverCapsuleHeight / 2,
                    background: "linear-gradient(180deg, #fbe1f6 0%, rgba(251, 225, 246, 0.2) 100%)",
                    opacity: 0.8,
                  }}
                />
              )}
              <span className="relative">{item}</span>
              {active === item && (
                <motion.span
                  layoutId="top-bar-page-indicator"
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: FIGMA.dotTop - FIGMA.navTop,
                    width: FIGMA.dotWidth,
                    height: FIGMA.dotHeight,
                    borderRadius: FIGMA.dotHeight / 2,
                    background: "#ffffff",
                  }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
