# Verification of the integrated OCS console

Final local verification on the integrated branch:

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passed |
| `pnpm test` | 52 passed |
| `pnpm build:web` | Production build passed |
| `OCS_E2E_PRODUCTION=1 pnpm --filter @ocs/web test:browser` | 14 passed |

Browser checks use actual Chromium with the WebGL 2 fallback. Native WebGPU is
preferred by the application but could not be exercised on this host. There is
no unsafe WebGPU flag. Gamepad API coverage uses a simulated standard-mapping
device; no physical controller hardware was attached.

Verified: reference opening and player registration, all five domains, physical
power-off/static/restart, all 25 onscreen buttons, held keyboard feedback,
contextual back and saved drafts, gamepad polling, authentication and account
isolation, playable arcade, storage failures, wide/desktop/mobile viewports,
physical disc loading and ordered replacement, room controls with a loaded disc,
view preservation, direct tile launches, and click-away dismissal with a 20px
case buffer. No missing-asset responses or page exceptions were recorded.

Slow visible frames are subdivided into bounded timeline updates rather than
discarding elapsed time. Hidden/offscreen time still does not advance the room.
The five-domain browser scenario dropped from 2.3 minutes to 42.6 seconds under
the same software renderer after that fix. This is a test-run observation, not
a performance guarantee for every GPU.

[Screenshots](screenshots/README.md) are live captures of the verified build.
Application submissions and high scores remain browser-local prototype data;
authentication uses the retained SQLite backend. There is no live recruitment
submission/review/selection backend.
