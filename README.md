# OSG Folding Portfolio

An interactive Three.js portfolio interface built as one articulated, Nintendo-inspired folding object. The Figma open and closed frames define the component inventory, proportions, colors, typography, and interface states; the supplied product photographs inform thickness, hinge behavior, and material response only.

## Run

```bash
bun install
bun run dev
```

Production verification:

```bash
bun run build
bun run preview
```

## Controls

- Drag the shell to rotate the product view.
- Click or tap catalogue rows, or focus the catalogue and use Arrow Up/Down, Home, End, and Enter.
- D-pad left/up selects the previous work; right/down selects the next work.
- `Artworks`, `Fonts`, and `Tools` press and return, selecting their catalogue destinations.
- `Motion` clicks between two physical positions and changes the status LEDs.
- `Light / Dark` toggles the device state; the page-level Open/Close control articulates the continuous hinge.

## Configuration

Physical dimensions and interaction limits are in `src/config.ts`:

- open angle: 170 degrees
- closed clearance: 0.8 degrees
- lower body: 40 × 24 × 1.8 world units
- upper body: 40 × 24 × 1.35 world units
- button travel: 0.08 world units
- CSS3D scale: 0.05

Portfolio content is the `WORKS` array in the same file. Replace those entries with final project metadata and assets without changing the device or catalogue components.

## Implementation notes

- `src/device.ts` owns the hinge, shell, screens, recessed surfaces, speaker wells, camera/glass, ports, chrome badge, LEDs, controls, and engraved outer logo.
- `src/ui.ts` owns the live catalogue and upper work display. Both are DOM/CSS3D surfaces rather than baked screenshots.
- `@lisse/core` generates the Figma-smoothing clip paths used by the screen and catalogue components. Rounded 3D geometry uses multi-segment manufacturing bevels and continuous shell profiles.
- `OSG Capsules` Light/Regular/Bold are bundled locally and mapped exactly to 300/400/700. Button and body labels use the same face in low-opacity canvas decals to read as UV printing.
- The renderer has no shadow map or ground/contact-shadow plane; the page background is the flat supplied `#FAFAFA`.

## Assumptions and limitation

Hidden thicknesses, port depth, button travel, hinge clearance, and camera glass separation were inferred from the two physical references and kept configurable. Final portfolio thumbnails were not included in the supplied workspace, so the upper display uses procedural project visuals; swap the `WORKS` visuals when the production assets arrive.

Fresh QA screenshots are written to `artifacts/` during verification and intentionally excluded from Git.
