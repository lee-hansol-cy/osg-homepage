# OSG desktop QA evidence

These true-PNG captures are the durable 1920 × 1080 verification set for the source-faithful desktop revision. Physical shell radii use exactly 50% of the latest CSS values, with the D-pad's supplied 8/7px corners retained as the explicit control exception; CSS3D UI radii are unchanged.

- `osg-final-open-1920.png`: settled 170-degree open state, work 05 selected.
- `osg-final-dpad-down-pressed-1920.png`: down-direction D-pad tilt while the catalogue advances from work 05 to work 06.
- `osg-final-capsule-pressed-1920.png`: a right capsule button inside its dark-purple cutout at the deeper 2.6px press travel.
- `osg-final-closed-1920.png`: settled closed state at the source 800 × 540 envelope.
- `osg-final-hinge-mid-1920.png`: hinge in transit with CSS3D screen content hidden to prevent bleed/intersection.

The lower display keeps its original black bezel. The upper shell is one CSG-carved solid: a 6px inset pocket leaves a flat shell-colored floor, a smooth 6px filleted shoulder, and a vertical wall in the same closed mesh. The upper center hinge uses the supplied asymmetric 61px profile and is merged into that upper pivot; the lower left/right 61px hinge profiles are merged into the lower shell assembly. The 2/8/16px side-profile radii and 40px center core are retained, so no hinge piece remains fixed at the root while its panel moves. The upper screen/bezel, camera, and badge remain inside the pocket. Closed-state stability and incremental tilt must be checked across fresh captures; there are no separate upper face/rim/wall skins for an endpoint gap or depth flicker to form.

The browser scenarios, exact type/geometry contracts, build results, limitations, and all user-mandated fidelity notes are recorded in `.debug-journal.md` and `.codex/session-logs/2026-07-17T23-06-22+09-00-osg-folding-portfolio.json`.
