# OSG Folding Portfolio

An interactive Three.js portfolio interface built as one articulated, Nintendo-inspired folding object. The Figma open and closed frames define the component inventory, proportions, colors, typography, and interface states; the supplied product photographs inform thickness, hinge behavior, and material response only.

## Run

```bash
bun install
bun run dev
```

Production verification:

```bash
bun run test
bun run build
bun run preview
```

## Controls

- Drag the shell to rotate the product view.
- Click or tap catalogue rows, or focus the catalogue and use Arrow Up/Down, Home, End, and Enter.
- D-pad up selects the previous work and down selects the next work. Left/right press physically but do not move the vertical catalogue.
- `Artworks`, `Fonts`, and `Tools` press and return, selecting their catalogue destinations.
- `Motion` clicks between two physical positions and changes the status LEDs.
- `Light / Dark` toggles the device state; the page-level Open/Close control articulates the continuous hinge.

## Configuration

Physical dimensions and interaction limits are in `src/config.ts`:

- open angle: 170 degrees
- closed clearance: 0.8 degrees
- lower body: 40 × 24 × 3.15 world units
- upper body: 40 × 24 × 1.35 world units
- upper/lower exterior radii: 0.2 / 0.8 world units
- mating-edge radius: 0.1 world units
- button travel: 0.08 world units
- CSS3D scale: 0.05

All source-planar dimensions use one conversion: `world units = Figma pixels / 20`.

Portfolio content is the `WORKS` array in the same file. Replace those entries with final project metadata and assets without changing the device or catalogue components.

## Implementation notes

- `src/device.ts` owns the hinge, shell, screens, recessed surfaces, speaker wells, camera/glass, ports, chrome badge, LEDs, controls, and engraved outer logo.
- `src/ui.ts` owns the live catalogue and upper work display. Both are DOM/CSS3D surfaces rather than baked screenshots.
- `@lisse/core` generates the continuous paths used by rounded UI elements. The active 480 × 360 display areas remain square, while bezels, capsules, and focus pills retain the source curvature.
- `OSG Capsules` Light/Regular/Bold are bundled locally and mapped exactly to 300/400/700. UV labels rasterize at 4× the exact 17px/11px Figma size and use the font's measured cap height, so no label is auto-shrunk inside its texture.
- Every OSG mark is rendered from the supplied SVG paths. No logo is reconstructed with live text.
- The renderer has no shadow map or ground/contact-shadow plane; the page background is the flat supplied `#FAFAFA`.

## Assumptions and limitation

Port depth, button travel, hinge clearance, and camera-glass separation were inferred from the two physical references and kept configurable. The supplied vector packet contains the open-state OSG marks but no separate closed-lid path, so the lid engraving reuses that supplied SVG silhouette at the closed-frame bounding box. Final portfolio thumbnails were not included in the supplied workspace, so the upper display keeps the provided placeholder state; swap the `WORKS` visuals when the production assets arrive.

Fresh working screenshots are written to `artifacts/` during verification and intentionally excluded from Git. The accepted 1920 × 1080 open, closed, and mid-hinge evidence set is committed under `docs/qa/`.
