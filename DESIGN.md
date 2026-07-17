# OSG Folding Portfolio Design Contract

## 1. Brief and reference fidelity

The authoritative reference is the supplied Figma open-state export (`UI_largeScreen_open`, 800 × 1021) and closed-state export (`UI_largeScreen_closed`, 800 × 540). The Nintendo photographs inform only believable thickness, hinge articulation, and manufacturing detail. The memorable moment is a glossy candy-pink object opening into two crisp, working portfolio displays.

Primary visitor: a prospective collaborator reviewing work quickly. This revision targets the supplied 1920 × 1080 desktop frame only; tablet and mobile extrapolation is explicitly out of scope until the desktop object is reference-accurate. Keyboard-only navigation, wheel scrolling, reduced motion, and low vision at 200% zoom remain required.

## 2. Color and material tokens

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-canvas` | `#fafafa` | Figma frame background |
| `--color-shell` | `#ff81ea` | glossy ABS shell |
| `--color-shell-deep` | `#f02bd1` | seams, labels, active details |
| `--color-shell-shadow` | `#b94fa8` | engraved lid mark |
| `--color-control` | `#fbe1f6` | control caps and wells |
| `--color-ink` | `#100b10` | bezels, ports, primary text |
| `--color-screen` | `#ffffff` | matte display surface |
| `--color-divider` | `#ded9df` | catalogue dividers |
| `--color-chrome` | `#c9c9c9` | inside OSG badge |
| `--color-lens-a` | `#3c00a3` | camera optical tint |
| `--color-lens-b` | `#0a0090` | camera optical tint |

Physical material: UV-printed glossy ABS with a very fine procedural emboss/roughness texture below the scale of any modeled feature. Displays use exceptionally matte glass. Chrome uses a bright multi-lobe reflective physical material. Shells use continuous corner profiles and control caps use the supplied capsule/cross silhouettes. No decorative material, color, or geometry may be introduced outside the reference packet.

## 3. Typography

Primary and sole display stack: bundled `OSG Capsules`. Light is mapped to weight 300, Regular to 400, and Bold to 700. Catalogue dates/durations and right capsule buttons use 17px with 21px line-height and `0.01em` tracking; dates/buttons are Light 300 and centered catalogue titles are Regular 400. Function labels use the source's 11px with 13px line-height. UV-print decals render at four times the Figma pixel resolution and are placed at the source slot size divided by 20; they must never auto-shrink to a texture canvas. OSG marks are the supplied SVG paths, never live text.

## 4. Geometry and spacing

Every physical X/Y dimension derives from one equation: `world units = Figma pixels / 20`. No component may use an independent visual scale. The source panels are 800 × 480px (40 × 24 world), both bezels are 496 × 376px with 5px radius, and both active displays are 480 × 360px with square corners. The upper thickness remains 1.35 world. The user-specified lower thickness is exactly `1.8 × 1.75 = 3.15` world. User-specified exterior corner radii are upper 4px (0.2 world) and lower 16px (0.8 world); mating/inner edges are 2px (0.1 world). Default hinge opening is 170 degrees and closed clearance is 0.8 degrees.

Exact source geometry: side hinge envelopes are 95 × 60px and the center hinge envelope is 610 × 60px; the center hinge is tangent to and physically continuous with the upper panel rather than a detached cylinder. Upper speakers are 8px apertures at X 56/88 and 704/736, Y 203.43/235.43/267.43/299.43. Right buttons are 112 × 42px outer capsules with 110 × 40px inner capsules at X 668 and Y 239/285/331. The toggle is a 16 × 40px capsule with a 14 × 22px sliding handle; Light/Dark is a 16px circular well with a 14px handle. The D-pad is a 112px source silhouette with a 110px cap and source-directed five-dot arrows.

CSS spacing follows the source pixels. The catalogue has an 8px screen inset, 36px default rows, a 64px focused row containing a 48px focus capsule, and 14px horizontal text inset. Rounded UI elements use Lisse-generated continuous paths at the source radius; explicit capsules and circles retain their exact capsule/circle geometry. The 480 × 360 active display surface itself is always rectangular and receives no corner clipping.

## 5. Components

### Portfolio Catalogue
- Structure: reusable catalogue-row component → date/duration, centered title, exact SVG-derived dot arrow.
- States: default pink text, hover tint, focused solid pink pill with white text, keyboard focus ring.
- Accessibility: listbox semantics, selectable options, Arrow Up/Down only for adjacent movement, Home/End, Enter, and real wheel scrolling. Arrow Left/Right have no catalogue behavior.
- Motion: 180ms transform/opacity/color transitions; instant under reduced motion.

### Upper Work Display
- Structure: 464 × 348 live thumbnail area with a centered 105 × 60 project/logo frame and the exact supplied 69 × 48 OSG SVG; descriptive text remains available to assistive technology.
- States: selection changes the project content while preserving the supplied pink/white/black palette.
- Accessibility: `aria-live="polite"`; decorative composition hidden from assistive technology.
- Motion: 260ms opacity/transform crossfade.

### Physical Control
- Structure: separate raycastable mesh with DOM mirror control where appropriate.
- States: rest, local-normal pressed travel, return; no scale-based hover or press. Toggle and Light/Dark each have two stable positions without material replacement or transient black geometry.
- Accessibility: keyboard mappings are documented in the help overlay and every screen action remains operable through the catalogue.

### Device View Controls
- Structure: open/close, reset view, soundless help status.
- States: default, hover, active, visible focus, disabled while transitioning.
- Accessibility: semantic buttons, 44px minimum target, status text describes device state.

## 6. Motion and interaction

Micro presses translate only along the control's local surface normal and return without scale changes. Catalogue focus uses 180ms transform/opacity/color transitions. Hinge travel uses damped interpolation and stops at configured limits. Orbit interaction is pointer-driven with constrained pitch/yaw and must not steal wheel input from the lower display. Reduced-motion snaps hinge and content transitions to their end states.

## 7. Depth and lighting

Depth comes from articulated geometry, thicker lower housing, a softly concave upper inner surround, shallow button travel, recessed black speaker apertures, microscopic ABS embossing, and physically based reflections. One broad viewing-direction key plus restrained fills reveal the glossy shell, chrome badge, and lens. The product casts no ground/contact shadow and the stage remains the supplied flat `#FAFAFA`.

## 8. Accessibility constraints and accepted debt

Target WCAG 2.2 AA. Keyboard catalogue controls, visible focus, reduced motion, semantic status, and non-color active cues are required. The 3D model is enhanced content; the catalogue remains a real DOM interface.

Accepted limitation: the supplied open-state SVG contains exact placeholder and inner-badge OSG paths but no closed-lid vector. The lid engraving must reuse the supplied OSG path as a documented source-derived assumption rather than synthesizing letterforms. Supplied portfolio thumbnails were not present, so the upper display retains the source placeholder state.
