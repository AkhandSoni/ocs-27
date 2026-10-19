# OCS console web app

Next.js / React / TypeScript / Three.js. See the [root README](../../README.md) for installation, controls, verification commands and the honest prototype scope.

The console uses WebGPU by default through Three.js `WebGPURenderer`, with WebGL 2 fallback. There is no separate WebGPU runtime to install. `@webgpu/types` provides TypeScript declarations. Inspect `.room-stage[data-renderer]` for the active rendering backend. `?renderer=webgl` forces WebGL 2.

Every browser launch and console power-on plays the short skippable boot sequence, then opens the player sign-in screen. Guest play remains available there. In Room view, click the physical console to power down to TV static; the onscreen controller exposes the DualSense controls and the standard Gamepad API uses the same navigation actions.

The room retains the original optimized device models, perspective camera, CSS3D TV alignment, procedural furniture, lights, and model loader. The camera starts focused for usable controls. On narrow screens, the same console UI renders directly without the room. Graphics initialization failure also offers that direct mode.

Domain previews, jackets, physical cases and discs share the four supplied illustrations; CC keeps its authored SVG world. System utilities keep their consistent SVG icon family. The art styles and their production references are defined in [the rule set](../../docs/art-direction/RULES.md). The weak room poster gallery and floating sculptures have been removed. No photographic domain representations are used. Supplied fan art provenance is documented in [cover notes](public/console/covers/README.md).

Retained asset credits:

- [Device models, CC BY 4.0](public/models/ATTRIBUTION.txt).
- [Poly Haven wood texture, CC0](public/textures/walnut-source.txt).
- [Original interface and procedural art](public/console/README.md).

Models can be regenerated from canonical files in `assets/` with `pnpm --filter @ocs/web optimize:models`. The original licensed physical hardware models remain room scenery; the operating interface has its own ACM identity.
