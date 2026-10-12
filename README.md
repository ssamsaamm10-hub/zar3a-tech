# ZAR3A-TECH Digital Twin (lean build)
`npm install && npm run dev` · `npm test` · `npm run build`
Models: `public/models/zar3a_assembled.glb` (from ..._192611.glb) and `zar3a_cutaway.glb` (from ..._194514.glb). Swap the files if reversed.
Node names print via console.table on load. Tune anchors in `src/config/simConfig.ts`.
## Assumptions
Plain CSS instead of Tailwind. Not yet built: vision module, recharts sparklines, anchor debug editor, wiring panel, tour/demo, manual-pump 10 s watchdog, sensor noise, DLI.

## Notes
The AI leaf-vision module was removed (it was a placeholder).

## Build 3
Anchor debug editor + JSON copy, 3D labels, OLED overlay (assembled), wiring panel, root-rot gauge, tour, demo, DLI, display noise, CSV, scan flash. Anchors are bbox-normalised (world = n*2 after auto-fit); paste copied JSON into simConfig.ts.
## Build 4
Cross-fade, refill pour FX, low-water 3D pulse + buzzer badge, tank glyph, Clear log, ESLint/Prettier (run npm install then npm run lint), extra Vitest tests.
