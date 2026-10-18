# Implementation

The console is a stateful single-screen application. Domain exploration, application writing, collection, arcade, and profile library replace the console content surface while preserving system chrome and contextual controls. No external form redirect is used.

## Source map

| File | Responsibility |
| --- | --- |
| `src/components/Lounge.tsx` | Original room lifecycle, React TV portal, focus/room camera, direct mobile mode |
| `src/components/console/ConsoleShell.tsx` | Console routes, selection, session restore, directional input dispatch |
| `BootScreen.tsx` | Original ACM startup; 3.2 seconds, skippable, session remembered |
| `ConsoleHome.tsx`, `Glyph.tsx`, `ExperiencePreview.tsx`, `BrandMark.tsx` | Cartridge rail, consistent SVG symbols, selected-software contents and actual chapter branding |
| `DomainExperience.tsx`, `content.ts` | Overview / responsibilities / selections; editable content separate from presentation |
| `ApplicationExperience.tsx`, `src/lib/recruitment.ts` | Six-step native HTML application, validation, review, consent, receipt |
| `AuthPanel.tsx`, `SystemPanel.tsx` | Account forms, system drawer, focus trap, reset, logout, help |
| `StudentExperience.tsx`, `useLibrary.ts` | Account-isolated local applications and high scores; storage failures and migration |
| `ShowcaseExperience.tsx` | Directional chapter library with public source links |
| `ArcadeExperience.tsx`, `src/lib/snake.ts` | Playable Snake; pause, collision, scoring, high scores, touch controls |
| `src/components/ControllerControls.tsx`, `src/lib/controller-input.ts` | Keyboard, physical/onscreen controls, held feedback, standard gamepad polling |
| `src/lib/create-room.ts`, `src/lib/room-objects.ts` | Retained GPU/CSS3D scene, model loading and disposal, retained hardware and furniture |
| `src/lib/auth.ts`, `src/app/api/auth/*` | Existing SQLite account security and API |

Component filenames without a directory above are in `src/components/console/`.

## Application storage and boundaries

The library uses `ocs:console:v2:<account-id>` or `ocs:console:v2:guest` in localStorage. Submitted answers are immutable in the UI and explicitly marked local. Guest drafts migrate into an account on successful sign-in without overwriting existing account applications. The migration removes the guest copy after a successful write. Previous prototype application records are readable from `acm:ocs:prototype:v1:<account-id>`; old simulated interview/result states are not imported.

Storage is schema-checked. Quota/disabled-storage errors keep a visible warning; submission failure never produces a success receipt. Reset is confirmed in the system drawer. This isolation improves prototype usability, but localStorage is accessible to other users of the same browser/device. There is no recruitment submission endpoint, server-side application authority, cross-device synchronization, selection result generator, or real scheduler.

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

## Graphics, motion and accessibility

The original room uses `WebGPURenderer` and a CSS3DObject driven by one camera. WebGL 2 fallback is retained. The interface uses SVG/HTML rather than a second graphics renderer. It shares one slate palette, consistent Lucide icon strokes, the real chapter lockup, and verified collection artwork.

The room caps rendering at 30 fps and DPR 1.75. Hidden/offscreen rendering is suspended. Reduced motion reduces transitions, shortens boot, and makes the room render on demand. Phone layouts avoid rendering the room. These are implementation budgets, not a measured claim about every laptop.

All interactive text, buttons and forms are DOM elements. Buttons have accessible names, focus is visible, form steps focus their headings, the system drawer traps Tab, and back behavior is contextual. Input fields keep native arrows, Backspace, Home and Enter behavior; Escape remains console back. The game supports pointer/touch swipes and explicit direction buttons. No sound is used.

Retained model and texture licenses are in `public/models/ATTRIBUTION.txt` and `public/textures/walnut-source.txt`. Domain symbols are consistent SVGs; the redundant room poster gallery is removed. Project and event marks come from verified chapter repositories. See [inspection and verification notes](../../docs/console-rebuild.md).
