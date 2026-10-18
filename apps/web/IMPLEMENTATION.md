# Implementation

## Current experience

The page is a single viewport containing a 3D room and a focused black television. The TV displays the startup sequence, profile picker, sign-in/account creation screens, and game home interface. There is no surrounding site navigation, marketing copy, footer, or scrollable landing page.

A first signed-out visit runs a 17.4-second code-rendered startup after the room is ready, then enters the picker. Later signed-out visits enter the picker directly. Signing in or creating an account opens home; a valid existing session goes directly home on page load. Browser storage retains the startup flag and up to five profile hints. It is not the account authority.

## Source map

| File | Responsibility |
| --- | --- |
| `src/components/Lounge.tsx` | Room lifecycle and the React portal into the TV surface |
| `src/components/ConsoleExperience.tsx` | Canvas/CSS startup, profile picker, authentication forms, session restore |
| `src/components/GameScreen.tsx` | Games/Media home, search, library, details, launch screen, account menus |
| `src/lib/create-room.ts` | WebGPU/WebGL renderer, shared camera, CSS3D TV, model loading, cleanup |
| `src/lib/controller-pickup.ts` | Raycast picking, reversible pickup animation, camera-relative grip, keyboard access |
| `src/lib/room-objects.ts` | Procedural room, walnut furniture, plants, lights, photographic gallery |
| `src/lib/auth.ts` | SQLite users/sessions, validation, password hashing, origin and cookie handling |
| `src/app/api/auth/*/route.ts` | Local account HTTP endpoints |
| `scripts/optimize-models.mjs` | Model optimization and verification through Meshopt encoding/decoding |

## Local authentication

Node's built-in SQLite stores accounts and sessions in `.data/console.sqlite` relative to the app directory. Passwords use individual random salts and scrypt (`N=32768`, `r=8`, `p=3`). Only SHA-256 hashes of random session tokens are stored. The session cookie is HTTPOnly, SameSite=Lax, expires after 30 days, and adds Secure over HTTPS. Registration atomically enforces case-insensitive email uniqueness and creates a session. Login errors do not reveal whether an account exists, and attempts are rate limited.

These are local console accounts. There is no Sony/PlayStation Network authentication, email delivery, password recovery, or external account provider.

| Endpoint | Contract |
| --- | --- |
| `GET /api/auth/session` | `{ user: { id, name, email, avatar } }` or `{ user: null }` |
| `POST /api/auth/register` | JSON `{ name, email, password, avatar? }`; returns `{ user }`, status 201 |
| `POST /api/auth/login` | JSON `{ email, password }`; returns `{ user }` |
| `POST /api/auth/logout` | Revokes the current session, clears its cookie, returns `{ ok: true }` |
| `GET /api/auth/profiles` | Returns `{ profiles: [] }`; server accounts are never enumerated |

Names are 2–24 characters, email addresses are normalized, passwords are 8–128 characters at registration, and avatars are `astro`, `horizon`, `cosmic`, `sunset`, `forest`, or `violet`. Mutation requests must have a matching Origin. JSON request bodies are limited to 4 KiB. Error responses use `{ error, code }` and all auth responses disable caching.

## Graphics and media

WebGPURenderer selects WebGPU or falls back to WebGL 2. `?renderer=webgl` forces the fallback; inspect `.room-stage[data-renderer]` to identify the active backend. The default camera stays focused on the TV and adapts to viewport aspect ratio. The HTML interface is a CSS3DObject using that same camera, so its controls remain native DOM controls.

The GPU canvas sits above the DOM layer. The TV's depth-tested aperture writes zero RGBA with a TSL fragment node and disabled blending, revealing the HTML display while allowing the held controller to cover it. One renderer and the same supplied controller model serve both cabinet and first-person poses. Picking uses a bounding-box broad phase followed by mesh raycasting; actual controller pixels intercept clicks before underlying TV controls. Pickup and return interpolate position, quaternion, and scale from the current pose, including interrupted/reversed movement. The camera-relative grip follows camera/viewport changes, and reduced motion disables travel and sway. Event listeners, the accessible hit target, and state attributes are removed when the room is disposed.

Both optimized device models require `EXT_meshopt_compression` and `KHR_mesh_quantization`. Meshopt WASM decodes their geometry. The optimization script reads the retained canonical inputs `assets/ps5.glb` and `assets/playstation_5_dualsense (1).glb`, then writes only optimized runtime models into `public/models/`. It welds, deduplicates, prunes, and compresses geometry, then decodes the results and checks triangle counts, embedded image hashes, and unchanged input files. Duplicate raw models, source archives, unused font files, and the obsolete screenshot are removed; credits remain alongside the runtime assets.

The room uses local photographic prints from `public/art/`, a Poly Haven CC0 wood texture, and supplied PS5/DualSense models. ASTRO BOT's local hero and cover images come from its [official PlayStation page](https://www.playstation.com/en-us/games/astro-bot/). Other game artwork sources are recorded in `public/games/CREDITS.md`; photographs, models, and wood credits are recorded in `public/art/CREDITS.txt`, `public/models/ATTRIBUTION.txt`, and `public/textures/walnut-source.txt`.

## References and checks

- Startup motion reference: [PS5 Startup Screen](https://www.youtube.com/watch?v=k_6M31kHTzk). The implementation uses 17.4 seconds of canvas/CSS animation, not an embedded recording.
- Interface reference: [Sony's PS5 user experience overview](https://blog.playstation.com/2020/10/15/first-look-playstation-5s-next-generation-user-experience/).
- Account-screen reference: [Sony's account creation guide](https://www.playstation.com/en-us/support/account/create-account/). This is a visual/workflow reference; this app's accounts remain local.

From the repository root, use `pnpm typecheck`, `pnpm test`, and `pnpm build:web`. Auth tests run against temporary isolated databases and cover persistence, registration races, incorrect passwords, expiry, origin checks, body limits, cookies, and the actual route handlers. Model verification runs with `pnpm --filter @ocs/web optimize:models`. See the [README](README.md) for installation and server commands.
