# PS5 Room web app

The `@ocs/web` workspace package renders a PS5 console interface inside a Three.js room. The TV remains focused in a single viewport, with no surrounding landing-page content.

## Commands

Use Node.js 22.22.0+ and pnpm 10.28.2. Run commands from the repository root:

```powershell
pnpm install
pnpm dev:web
```

Open [localhost:2027](http://localhost:2027). For verification and production:

```powershell
pnpm typecheck
pnpm test
pnpm build:web
pnpm start:web
```

Development and production both use port 2027; run one server at a time.

## Use the console

On a first signed-out visit, the 17.4-second canvas/CSS startup leads to the profile picker. Choose **Add User** to sign in or create a local account with an email, an Online ID of 2–24 characters, a password of 8–128 characters, and an avatar. Account creation signs you in immediately. Valid returning sessions open the home screen directly.

The picker stores up to five browser-local profile hints. Account passwords and sessions are maintained by the server in `.data/console.sqlite`, outside `public/`. Preserve this directory across server restarts. These accounts are local to this application; they are not Sony or PlayStation Network accounts, and no external authentication service is used.

Browse **Games** and **Media**, select games with the mouse or left/right arrows, search the collection, and open game details or the library. **Play Game** opens a local launch screen; commercial games are not executed. Media **Start** links open the provider's website. The user menu provides **Switch User** and **Log Out**; the profile picker's power menu can replay startup with **Restart PS5**.

Click the DualSense on the cabinet to pick it up. It lifts along a curved path into a camera-relative first-person position, with a backward tilt, slight roll, and subtle hand sway. Click it again or press **Escape** to return it to its original position. The controller also has an invisible keyboard-focusable target: Tab to **Pick up controller** and press Enter or Space. Reduced-motion mode skips the flight and sway.

The physical shelf has a larger collection with printed spines, staggered stacks, and outward-facing covers. Games and all five domain cases share the dimensions in `src/lib/game-case.ts`. The handwritten yellow **Domains** sticky note lifts on hover; hovering any case shows the **Domains** title. Clicking the collection brings five overlapping cases close to the camera, with Tech foremost on the left. Each sleeve has a vertical domain-name strip printed along its exposed right edge. Click a case to bring it forward, then click it again after it settles to insert its disc. The disc pulls straight toward the viewer, waits in front while the case closes, then turns toward the drive. Arrow keys change the front case; Enter or Space inserts it. **Back** or **Escape** returns the collection. Cases have original domain cover art, rounded plastic edges, molded hinges, glossy sleeves, and matching printed discs. The TV library contains 16 actual game titles with local artwork; it keeps only three recent hero backgrounds decoded for transitions.

## Rendering and assets

Three.js uses WebGPU when available and falls back to WebGL 2. Open [the explicit WebGL fallback](http://localhost:2027/?renderer=webgl) to check it. The `.room-stage` element records the active backend in its `data-renderer` attribute and controller pose in `data-controller-state`. CSS3DRenderer aligns the interactive HTML TV interface with the same perspective camera as the 3D room. A depth-tested transparent TV aperture lets foreground geometry occlude that interface using the same GPU renderer.

Runtime models use `EXT_meshopt_compression` and are decoded with Meshopt WASM:

| Model | Runtime file | Size |
| --- | --- | --- |
| PS5 | `public/models/ps5-optimized.glb` | 100,000 bytes |
| DualSense | `public/models/dualsense-optimized.glb` | 2,681,508 bytes |

Two canonical uncompressed sources are retained for regeneration: `assets/ps5.glb` and `assets/playstation_5_dualsense (1).glb`. Duplicate models, source archives, unused fonts, and the obsolete screenshot have been removed. Only optimized models are served from `public/models/`. Rebuild them from the repository root with:

```powershell
pnpm --filter @ocs/web optimize:models
```

The black TV, walnut cabinet, floor, plants, lamps, and frames are procedural geometry. Room photographs are local files in `public/art/`. The initial game selection is ASTRO BOT, using official PlayStation artwork in `public/games/astro-bot-hero.jpg` and `public/games/astro-bot-cover.jpg`.

Credits and source records:

- [PS5 and DualSense model attribution](public/models/ATTRIBUTION.txt), CC BY 4.0.
- [Poly Haven wood texture source](public/textures/walnut-source.txt), CC0.
- [Landscape photograph credits](public/art/CREDITS.txt), including Unsplash source pages.
- [Game artwork credits](public/games/CREDITS.md), including official ASTRO BOT artwork sources.

The startup reference is [PS5 Startup Screen](https://www.youtube.com/watch?v=k_6M31kHTzk). The 17.4-second implementation is animated code rather than playback of that reference. See [implementation notes](IMPLEMENTATION.md) for the source map and API.
