# Domain disc sequence

Run the frontend from the repository root using pnpm.

## Interaction

Click the blue CD collection below the TV (or Tab to **Explore domains**).
Five physical cases come forward: Tech, Research, Competitive Coding, Design,
and Management. Click a case, or use Left/Right and Enter to select one.

The selected case opens around its spine. The disc lifts out, travels to the
PS5, turns edge-first, and enters the open drive. The drive closes before the
domain boot begins. The empty case returns to its exact shelf slot while the
camera moves toward the TV. The domain view remains until **Back to room** or
Escape. Back is also available during the sequence; it brakes before reversing
the current playhead, then restores the disc, case, and room.

The physical controller returns to the cabinet while the collection is open.
The underlying account/game screen stays mounted but inert, preserving its
state and preventing hidden focus traps from consuming collection controls.

## Implementation

- `apps/web/src/lib/domain-sequence.ts`: domain names/copy/colors and one
  deterministic, reversible timeline. Presentation takes 1.8 seconds; insertion
  and boot take 11.7 seconds after selection. `CUES` controls the timing.
- `domain-spatial.ts`: case poses, disc trajectory, quaternion alignment, and
  camera framing. Cases retain their physical dimensions throughout.
- `domain-library.ts`: procedural case/disc/shutter geometry and native button
  targets projected from the same camera. Drive placement raycasts the imported
  PS5 front surface. No additional downloaded models or runtime packages.
- `room-objects.ts`: reserves five original shelf instances for the articulated
  cases; the remaining 31 cases stay instanced.
- `DomainScreen.tsx`: console-style domain screens and a compact toolkit for
  small viewports. Content is configured in `domain-catalog.ts`; matching local
  vector artwork is in `public/domains/`. See `domain-console-design.md`.
  No domain backend or external navigation has been added.
- `create-room.ts`: advances the playhead from visible frame time, synchronizes
  GPU/CSS cameras, pauses when hidden/offscreen, and snaps framing atomically on
  resize. The loading shot includes the PS5 even on portrait screens.

Reduced-motion mode immediately settles spatial transforms and retains a short
TV boot. Event handlers, DOM controls, geometries, textures and materials are
released with the room lifecycle. Procedural textures are painted once; frame
updates reuse models and vector objects.

## Verification

```powershell
pnpm test
pnpm typecheck
pnpm build:web
pnpm start:web
```

Tests cover timing/order, repeated input, interruption at each stage, reversible
poses, hidden time, reduced motion, keyboard controls, teardown, portrait/wide
projection, resizing, and a drive-anchor raycast against the real optimized PS5
GLB. The DOM fixtures use jsdom; they do not emulate or verify GPU rendering.

For visual review in the running page, check the initial case spread, hinge and
disc clearance, insertion, final TV shot, midflight Back, all five domains, and
portrait orientation. Visual appearance and frame rate require that live review;
automated geometry and build checks do not establish those results.
