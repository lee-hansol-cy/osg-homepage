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
| `--color-well-deep` | `#682e5f` | recessed D-pad, capsule-button, and Light/Dark wells |
| `--color-control` | `#fbe1f6` | control caps and wells |
| `--color-ink` | `#100b10` | bezels, ports, primary text |
| `--color-screen` | `#ffffff` | matte display surface |
| `--color-divider` | `#ded9df` | catalogue dividers |
| `--color-chrome` | `#c9c9c9` | inside OSG badge |
| `--color-lens-a` | `#3c00a3` | camera optical tint |
| `--color-lens-b` | `#0a0090` | camera optical tint |

Physical material: UV-printed glossy ABS with a very fine procedural emboss/roughness texture below the scale of any modeled feature. Displays use exceptionally matte glass. Chrome uses a bright multi-lobe reflective physical material. Shells use Lisse's Figma-derived continuous-corner algorithm at smoothing `0.6`; explicit capsules, circles, and supplied cross silhouettes retain their exact source geometry. No decorative material, color, or geometry may be introduced outside the reference packet.

## 3. Typography

Primary and sole display stack: bundled `OSG Capsules`. Light is mapped to weight 300, Regular to 400, and Bold to 700. Catalogue dates/durations and right capsule buttons use 17px with 21px line-height and `0.01em` tracking; dates/buttons are Light 300 and centered catalogue titles are Regular 400. Function labels use the source's 11px with 13px line-height. UV-print decals render at four times the Figma pixel resolution, keep the exact source size and weight, disable blur-inducing minification mipmaps, and sit clear of the receiving surface to prevent depth fuzz; they must never auto-shrink to a texture canvas. OSG marks are the supplied SVG paths, never live text.

## 4. Geometry and spacing

Every physical X/Y dimension derives from one equation: `world units = Figma pixels / 20`. No component may use an independent visual scale. This session's latest all-layer CSS supersedes every earlier radius and position override. The source panels are 800 × 480px (40 × 24 world), both bezels are 496 × 376px, and both active displays are 480 × 360px with square corners. The lower thickness remains exactly `1.8 × 1.75 = 3.15` world. The upper thickness is 36px (1.8 world), with a flush contact plane at 0px, an 8px recessed inner surface, and a -36px outer back. Its 784 × 464px inner face is inset 8px; a real 8px beveled bridge joins the outer rim to that inner face so angled views cannot expose the stage through a floating skin. Default hinge opening is 170 degrees and closed clearance is 0 degrees.

Latest shell corner contract: UI radii remain untouched, while every physical 3D corner radius is modeled at exactly 50% of its latest CSS value. The upper 800 × 480px panel therefore uses 60/60/10/10px model radii from CSS 120/120/20/20px; the lower panel uses 60/60/0/0px before its source vertical flip; and the upper inset uses 58/58/8/8px from CSS 116/116/16/16px. These remain Lisse continuous corners at smoothing `0.6`, not ordinary circular arcs. The D-pad is the explicit exception and retains its supplied 8/7px radii so its directional cap remains visually faithful.

Exact source geometry: side hinge envelopes are 95 × 60px, the center cover is 608 × 60px, and the visible dark core/web are intentionally absent; the center cover is tangent to and physically continuous with the upper panel rather than a detached rod. Upper speakers are 8px apertures at X 56/88 and 704/736, Y 203.43/235.43/267.43/299.43. Both display bezels are 496 × 376px with the same 10px CSS corner radius. Right buttons are 112 × 42px outer cutouts using a 21px model radius from CSS 42px, with 110 × 40px caps using 20px from CSS 40px, at X 668 and latest CSS Y 179/225/271 within the lower body. The toggle is a 16 × 40px cutout using 16px from CSS 32px with a 14 × 22px handle using 7px from CSS 14px; Light/Dark is a 16px cutout using 6px from CSS 12px with a 14px handle using 7.5px from CSS 15px. The D-pad is a 112px source cutout with a 110px cap and source-directed five-dot arrows; its modeled corner radii retain the explicit 8/7px source exception.

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
- Structure: every perimeter is a real shell cutout with a recessed floor; the D-pad, three capsule buttons, and Light/Dark well use source dark purple `#682E5F`, while the Motion toggle well uses source light `#FBE1F6`. The independently modeled cap fits inside its opening without intersecting the well, with 2.6px deeper press travel. Each control remains a separate raycastable mesh with DOM mirror control where appropriate.
- States: rest, local-normal pressed travel, return; no scale-based hover or press. The D-pad tilts toward the pressed direction around its central pivot, while each other cap travels along the local surface normal. Toggle and Light/Dark each have two stable positions without material replacement or transient black geometry.
- Accessibility: keyboard mappings are documented in the help overlay and every screen action remains operable through the catalogue.

### Device View Controls
- Structure: open/close, reset view, soundless help status.
- States: default, hover, active, visible focus, disabled while transitioning.
- Accessibility: semantic buttons, 44px minimum target, status text describes device state.

## 6. Motion and interaction

Micro presses translate only along the control's local surface normal and return without scale changes. Catalogue focus uses 180ms transform/opacity/color transitions. Hinge travel uses damped interpolation and stops at configured limits. Orbit interaction is pointer-driven with constrained pitch/yaw and must not steal wheel input from the lower display. Reduced-motion snaps hinge and content transitions to their end states.

## 7. Depth and lighting

Depth comes from articulated geometry, thicker lower housing, the 8px concave upper inner surround with a continuous beveled bridge, the raised lower-display bevel derived from the source 12px blur/8px spread highlight, deeper button travel inside actual dark-purple/light-control shell cutouts, recessed black speaker apertures, flush black side ports, microscopic ABS embossing, and physically based reflections. The 36px lid and its contact rim fully contain every inner component so the closed state has no coplanar intersection or depth flicker. One broad viewing-direction key plus restrained fills reveal the glossy shell, chrome badge, and lens. The product casts no ground/contact shadow and the stage remains the supplied flat `#FAFAFA`.

## 8. Accessibility constraints and accepted debt

Target WCAG 2.2 AA. Keyboard catalogue controls, visible focus, reduced motion, semantic status, and non-color active cues are required. The 3D model is enhanced content; the catalogue remains a real DOM interface.

Accepted limitation: the supplied open-state SVG contains exact placeholder and inner-badge OSG paths but no closed-lid vector. The lid engraving must reuse the supplied OSG path as a documented source-derived assumption rather than synthesizing letterforms. Supplied portfolio thumbnails were not present, so the upper display retains the source placeholder state.
