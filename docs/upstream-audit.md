# Upstream integration audit

Audited and fetched both configured repositories before integration:

| Repository / branch | Audited head | Outcome |
| --- | --- | --- |
| AkhandSoni/ocs-27 `main` | da125fd | Original console foundation, already in feature ancestry. |
| AkhandSoni/ocs-27 `feat/ocs-console-rebuild` | 9119eb4 | Published OCS baseline; current work extends it. |
| NeerajCodz/ocs-27 `main` | 56a948c | Integrated into the OCS branch. |
| NeerajCodz/ocs-27 `feat/realistic-game-collection` | 56a948c | Identical to upstream main. |
| NeerajCodz/ocs-27 `feat/controller-pickup` | 2b7f7d6 | Already an ancestor of upstream main; retained. |

The pre-integration state is recoverable at
`backup/ocs-before-upstream-integration` (5a9d76b). Previous local backup branches
preserve older prototype and artwork versions; they are archives, not newer
upstream features. No user files or account databases were discarded.

Integrated useful upstream engineering: reversible physical five-domain disc
transport, preview-before-insert, matched-case ejection, drive anchoring, shared
case dimensions, controller pickup/return, instanced shelf geometry, material
finishes, local tool logos and the port-2027 scripts. Retained OCS authentication,
profiles, accessible forms, application drafts, arcade and original system shell.

Replaced upstream's old domain overlay with the actual OCS domain/forms. The
console's launch action now owns physical disc insertion and queues ejection
before replacement. Camera and input ownership end when transport finishes, so
loaded domains cannot lock Room view or steal contextual form Back.

Excluded upstream's commercial game-cover download script and stock wall-photo
requests. The later four owner-supplied illustrations explicitly replace those
domains' artwork, with provenance and crop metadata retained. Removed upright
decorative display cases while preserving interactive cases and horizontal stacks.

Validation includes the original auth/game tests, upstream geometry/timeline
checks, OCS integration regressions, production build, and actual Chromium
screenshots. Headless Chromium verifies WebGL fallback; native WebGPU still
requires a supported GPU/browser and is never forced with an unsafe WebGPU flag.
