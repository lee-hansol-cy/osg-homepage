# OSG Folding Portfolio Design Contract

## 1. Brief and reference fidelity

The authoritative reference is the supplied Figma open-state export (`UI_largeScreen_open`, 800 × 1021) and closed-state export (`UI_largeScreen_closed`, 800 × 540). The Nintendo photographs inform only believable thickness, hinge articulation, and manufacturing detail. The memorable moment is a glossy candy-pink object opening into two crisp, working portfolio displays.

Primary visitor: a prospective collaborator reviewing work quickly. Stress contexts: keyboard-only navigation, touch input, reduced motion, narrow/mobile landscape, and low vision at 200% zoom.

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

Physical material: UV-printed glossy ABS with restrained highlight rolloff. Displays use very rough glass. Chrome uses high metalness. Shells use continuous cubic corner profiles and control caps use the supplied capsule/cross silhouettes.

## 3. Typography

Primary and sole display stack: bundled `OSG Capsules`. Light is mapped to weight 300, Regular to 400, and Bold to 700. Catalogue dates/durations use Light 300 at 17px; centered titles use Regular 400 at 17px; marks and the wordmark use Bold 700. UV-print decals load the same bundled face before their canvas textures are generated. UI scales with its CSS3D surface rather than changing internal typography.

## 4. Geometry and spacing

Figma units map to world units at 20:1. Device width 40, panel height 24, hinge height 3, lower thickness 1.8, upper thickness 1.35. Display active area is 24 × 18, bezel is 0.8. Default hinge opening is 170 degrees; closed retains a 0.8 degree manufacturing clearance. Button travel is 0.08.

CSS spacing follows a 4px base. The catalogue has 8px screen inset, 36px default rows, a 64px focused row containing a 48px focus pill, and 14px horizontal text inset. All UI rounded surfaces use Lisse-generated Figma squircles with smoothing 0.6; round controls remain circles/caps where explicitly drawn.

## 5. Components

### Portfolio Catalogue
- Structure: scroll region → interactive rows → date/duration, centered title, dotted pixel arrow.
- States: default pink text, hover tint, focused solid pink pill with white text, keyboard focus ring.
- Accessibility: listbox semantics, selectable options, Arrow Up/Down, Home/End, Enter, wheel and touch scrolling.
- Motion: 180ms transform/opacity/color transitions; instant under reduced motion.

### Upper Work Display
- Structure: 464 × 348 live thumbnail area with a centered 105 × 60 project/logo frame; descriptive text remains available to assistive technology.
- States: selection changes the project content while preserving the supplied pink/white/black palette.
- Accessibility: `aria-live="polite"`; decorative composition hidden from assistive technology.
- Motion: 260ms opacity/transform crossfade.

### Physical Control
- Structure: separate raycastable mesh with DOM mirror control where appropriate.
- States: rest, hover highlight, pressed travel, return; toggle has two stable positions.
- Accessibility: keyboard mappings are documented in the help overlay and every screen action remains operable through the catalogue.

### Device View Controls
- Structure: open/close, reset view, soundless help status.
- States: default, hover, active, visible focus, disabled while transitioning.
- Accessibility: semantic buttons, 44px minimum target, status text describes device state.

## 6. Motion and interaction

Micro presses use 120ms ease-out. Catalogue focus uses 180ms ease-in-out. Hinge travel uses a damped 900ms interpolation and stops at configured limits. Orbit interaction is pointer-driven with constrained pitch/yaw and no page scroll capture outside the device. Reduced-motion snaps hinge and content transitions to their end states.

## 7. Depth and lighting

Depth comes from articulated geometry, shallow button travel, recessed black speaker apertures, and restrained material highlights. Renderer shadows, contact planes, bloom, stage glows, and atmospheric gradients are intentionally disabled so the product sits on the supplied flat `#FAFAFA` frame without a cast shadow.

## 8. Accessibility constraints and accepted debt

Target WCAG 2.2 AA. Keyboard catalogue controls, visible focus, reduced motion, semantic status, and non-color active cues are required. The 3D model is enhanced content; the catalogue remains a real DOM interface.

Accepted limitation: supplied portfolio thumbnails were not present in the workspace, so the prototype uses original procedural work visuals. Replace the `WORKS` data and visual recipes when final assets arrive.
