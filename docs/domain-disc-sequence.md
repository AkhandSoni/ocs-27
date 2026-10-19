# Domain disc sequence

Launch any domain by selecting its console tile with a click or Enter. Its physical case
opens, the disc lifts out and enters the actual PS5 drive, the case returns to
its shelf slot, and the OCS domain opens on the TV. Selecting another domain
first ejects and shelves the loaded disc, then inserts the replacement.

**Domain discs** opens the physical five-case selector. Left/Right previews a
case and Enter inserts it. A mouse click brings an unselected case forward;
a second click inserts it (or queues insertion until the preview settles).
Clicking away from the cases dismisses the selector, with a 20px buffer around
the covers; controller controls remain usable. **Cancel disc**, Escape or controller Back cancels
transport. **Eject disc** unloads an active domain. Once a domain is running,
Escape/Backspace belongs to its OCS screens and forms, preserving contextual
back navigation. Browsing, authentication, forms and saved drafts remain in the
existing console shell.

The room controller and model-pickup hit tests ignore native buttons and form
inputs. Focus mode enlarges the TV while retaining the room; Room view stays
available after any number of loaded domains. TV interaction and domain launch
preserve the selected view; only the explicit view control changes it. Upright decorative display cases
are removed; the five interactive cases retain their shelf positions.

## Architecture

- `domain-sequence.ts`: reversible shared playhead, 1.8s case presentation and
  11.7s insertion/boot. Slow visible frames advance through bounded simulation
  steps instead of stretching the animation clock. Reduced motion settles spatial movement immediately and
  retains a short TV boot. Hidden tabs do not advance the sequence.
- `domain-spatial.ts`: case/disc trajectories, camera framing and drive geometry.
- `domain-library.ts`: physical geometry, projected accessible buttons, preview,
  cancellation and queued replacement after complete ejection.
- `DomainTransportScreen.tsx`: native TV status while the shared sequence runs.
- `ConsoleShell.tsx`: preserved OCS applications, temporarily suspended during
  transport and opened in the chosen domain after the disc reaches active.
- `create-room.ts`: WebGPU-first renderer, shared GPU/CSS camera, physical power,
  independently projected controller buttons and demand rendering capped at 30fps.

Run `pnpm test`, `pnpm typecheck`, `pnpm build:web`, then
`OCS_E2E_PRODUCTION=1 pnpm --filter @ocs/web test:browser`.
`pnpm dev:web` and `pnpm start:web` use port 2027. Browser tests use port 3100.
Authentication is operational; recruitment submissions remain browser-local
prototype receipts rather than applications sent to ACM-VIT.
