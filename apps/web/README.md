# PS5 Room web app

The `@ocs/web` workspace package renders a PS5 console interface inside a Three.js room. The TV remains focused in a single viewport, with no surrounding landing-page content.

## Commands

Use Node.js 22.22.0+ and pnpm 10.28.2. Run commands from the repository root:

```powershell
pnpm install
pnpm dev:web
```

Open [localhost:3000](http://localhost:3000). For verification and production:

```powershell
pnpm typecheck
pnpm test
pnpm build:web
pnpm start:web
```

Development and production both use port 3000; run one server at a time.

## Use the console

On a first signed-out visit, the 17.4-second canvas/CSS startup leads to the profile picker. Choose **Add User** to sign in or create a local account with an email, an Online ID of 2–24 characters, a password of 8–128 characters, and an avatar. Account creation signs you in immediately. Valid returning sessions open the home screen directly.

The picker stores up to five browser-local profile hints. Account passwords and sessions are maintained by the server in `.data/console.sqlite`, outside `public/`. Preserve this directory across server restarts. These accounts are local to this application; they are not Sony or PlayStation Network accounts, and no external authentication service is used.

Browse **Games** and **Media**, select games with the mouse or left/right arrows, search the collection, and open game details or the library. **Play Game** opens a local launch screen; commercial games are not executed. Media **Start** links open the provider's website. The user menu provides **Switch User** and **Log Out**; the profile picker's power menu can replay startup with **Restart PS5**.

## Rendering and assets

Three.js uses WebGPU when available and falls back to WebGL 2. Open [the explicit WebGL fallback](http://localhost:3000/?renderer=webgl) to check it. The `.room-stage` element records the active backend in its `data-renderer` attribute. CSS3DRenderer aligns the interactive HTML TV interface with the same perspective camera as the 3D room.

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
