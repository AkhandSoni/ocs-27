# ACM-VIT OCS ’27 — Console prototype

An interactive recruitment console running on the original Three.js television and room foundation. Eight selectable cartridges launch five domains, a chapter collection, a playable arcade, and the student library. Domain identities use a consistent SVG icon family and selected-software details. The real ACM-VIT logo and verified project/event marks identify chapter content; no group photographs, floating sculptures or commercial game images are used.

Requires **Node.js 22.22.0+** and **pnpm 10.28.2+**.

```sh
pnpm install --frozen-lockfile
pnpm dev:web
```

Open http://localhost:3000. WebGPU is preferred automatically, with WebGL 2 fallback. Use `/?renderer=webgl` to force that path. The interface remains accessible HTML inside the CSS3D television; phones use the same console directly.

## Controls

- Left/right: select a cartridge, domain tab, or collection item. Enter: launch.
- Escape/Backspace: contextual back. Home: return to console home.
- Tab, mouse, touch, physical room controller, and the expandable onscreen controller also work. Text fields retain normal editing keys.
- Standard Gamepad API mapping: D-pad/stick, A, B, Start. Hardware support depends on the browser.
- **Room view** pulls the camera back; **Focus console** returns to a readable screen.
- System controls contain sign-in, logout, restart, help, and reset local progress.

## Operational scope

Guest exploration, five domain applications, native input validation, autosaved drafts, account creation/login/logout, account-specific local receipts, a sourced chapter collection, and Signal/Snake are implemented. Sign-in is requested at submission, not browsing. Authentication uses the existing SQLite/scrypt backend and session cookies.

**Applications and high scores live in this browser. Saving a submission creates a local prototype receipt; it does not send an application to ACM-VIT.** Questions and round descriptions are prototype content. Live selection dates, reviewer tools, interview scheduling, result notifications, email verification/recovery, and university identity verification are not connected. Accounts and drafts are not an official recruitment record.

## Verify / production

```sh
pnpm typecheck
pnpm test
pnpm --filter @ocs/web test:browser
pnpm build:web
OCS_E2E_PRODUCTION=1 pnpm --filter @ocs/web test:browser
pnpm start:web
```

Browser tests use Chromium (system `/usr/bin/chromium` when available) and an isolated temporary account database on port 3100. If needed, install Chromium with `pnpm --filter @ocs/web exec playwright install chromium`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use another installation. Stop the development server before running browser tests or a build, since Next shares its generated output directory. Development and production previews both use port 3000.

The default account database is `apps/web/.data/console.sqlite`; retain it across restarts. `OCS_AUTH_DATABASE=/absolute/path/console.sqlite` overrides its location. Do not commit account databases.

See [implementation and inspection notes](docs/console-rebuild.md), [screenshots](docs/screenshots), and [app architecture / API](apps/web/IMPLEMENTATION.md). The complete previous prototype is recoverable at backup commit `4024098` on `backup/ocs-prototype-before-console-rebuild`; this rebuild starts from original console commit `da125fd` on `feat/ocs-console-rebuild`.
