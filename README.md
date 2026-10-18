# PS5 Room

A Next.js 16.4.2 application in `apps/web`: a PS5 interface on a black 3D television, with a code-animated startup, local console accounts, and a game home screen. The page stays in one viewport with the TV focused by default.

Requires Node.js 22.22.0 or newer and pnpm 10.28.2.

## Run

From the repository root:

```powershell
pnpm install
pnpm dev:web
```

Open [localhost:3000](http://localhost:3000).

```powershell
pnpm typecheck
pnpm test
pnpm build:web
pnpm start:web
```

Stop the development server before starting the production server on the same port.

## Console flow

- The first signed-out visit plays a 17.4-second startup animation, then opens the profile picker. The animation is rendered with canvas and CSS; no video is embedded.
- Select **Add User** to sign in or create an account. Successful authentication opens the home screen. The picker remembers up to five profile hints in this browser.
- A returning user with a valid 30-day session cookie goes directly home. **Switch User**, **Log Out**, and **Restart PS5** are available in the console interface.
- Accounts are real local server accounts stored in `apps/web/.data/console.sqlite`. They do not connect to Sony or PlayStation Network. Authentication requires no external service.

The room uses WebGPU with WebGL 2 fallback and Meshopt WASM model decoding. The interface has no surrounding site header, footer, marketing sections, or page scrolling.

See [app documentation](apps/web/README.md) for controls, assets, and renderer checks, and [implementation notes](apps/web/IMPLEMENTATION.md) for the authentication contract and source references.
