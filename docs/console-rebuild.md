# OCS ’27 console rebuild

## Recovery and original foundation

Before replacement, every tracked edit and untracked prototype file was committed on `backup/ocs-prototype-before-console-rebuild` (`4024098`). The rebuild branch `feat/ocs-console-rebuild` starts at the original working console baseline `da125fd`. The source history includes the working console UI at `f2ece46` and WebGPU room work at `0723c89`. Original commits and the entire prior redesign remain recoverable.

The earlier redesign substituted a conventional content/card interface and domain photographs for the console's selectable software, and pushed the room away from the primary interaction. Retaining a 3D background alone did not preserve console behavior. This implementation returns the TV to the operating surface: a focused cartridge changes both the software identifier and its preview; entering it changes the console state. Applications, collection, arcade and system controls share that surface and interaction grammar.

Retained engineering: WebGPU/WebGL renderer selection, procedural room and lighting, original optimized physical device models, Meshopt decoding, shared GPU/CSS3D camera, React TV portal, local account/session backend and security tests. Refined camera fit, direct mobile mode, contextual controller input and render scheduling.

Replaced: Sony startup and Games/Media screens, commercial game launch placeholders/covers, landscape photographs, previous domain group photos, and simulated recruitment-result displays. Previous unrelated media/gallery navigation is replaced by five domain experiences, a real sourced collection, a working original game, and an application library.

## Previous OCS inspection

Inspected public entry screens at [OCS ’25](https://os.acmvit.in) and [OCS ’26](https://explore.acmvit.in) through Chromium. The first presents a power-button entry and the second a press-any-key entry. After entry, both produced a blank body in the available browser session; authenticated flows were **not** verified live. The web fetch tool also timed out on the live sites. The following observations come from public source, not claims about currently operational private features:

- [OCS ’25 source](https://github.com/ACM-VIT/os.acmvit.in): domain/round submissions, tasks, meetings, notifications, database-backed account/application concepts, and bundled entertainment including DOOM/Solitaire.
- [OCS ’26 source](https://github.com/ACM-VIT/explore.acmvit.in): five domains, application/round/task/meeting data models, scheduler-related UI, Snake and PintooRun. `src/app/clients/domains-client.tsx` informed domain responsibilities; `src/app/components/landing/home-page.tsx` lists chapter events.
- Both projects treat recruitment as persistent software sessions rather than a marketing page. The new console adopts domain exploration → draft → protected save → personal library. It does not import their OS/browser layouts or pretend their backend is connected.

## Verified chapter content

- [UniPool](https://github.com/ACM-VIT/unipool-webapp): student ride sharing; its README documents Next.js/Firebase and mapping integration.
- Code 2 Create, Reverse Coding and Cryptic Hunt appear in the previous OCS chapter source. The collection links to that source rather than inventing annual dates, outcomes, attendance, awards or project statistics.
- Domain application questions and recruitment instructions are authored prototype content, explicitly identified in the application. Official ’27 dates and later rounds need chapter confirmation.

## Initial asset audit (superseded by the game-identity study)

| Asset / system                                         | Decision                               | Function                                                             |
| ------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------- |
| Original optimized hardware models                     | Retain with existing CC BY attribution | Physical console, controller and TV context                          |
| Original walnut material / room furniture              | Retain with CC0 source record          | Believable room materials                                            |
| Previous domain and group photos                       | Exclude from active branch             | A group photo does not identify a domain                             |
| Commercial game covers and fake launch pages           | Remove                                 | Replace with actual OCS software and a playable original game        |
| Floating metal gimbals / orbit sculptures / knots      | Remove                                 | They added visual noise without explaining selection                 |
| Decorative framed poster gallery                       | Remove                                 | Simplify the room around the operating TV                            |
| Per-domain gradients, rainbow colours and tilted cases | Remove                                 | One slate palette, one accent, clean vertical alignment              |
| Custom ACM-like monogram                               | Replace                                | Use the actual chapter lockup and diamond from OCS ’26               |
| Domain symbols                                         | Standardize                            | One Lucide SVG family, square proportions and 1.5-unit strokes       |
| Project/event identifiers                              | Source from chapter repos              | Real UniPool, Code 2 Create, Reverse Coding and Cryptic Hunt artwork |

`Glyph.tsx` is the single domain icon entry point. `BrandMark.tsx` renders the actual chapter lockup. `ExperiencePreview.tsx` identifies the selected software and lists its contents. All text, controls and focus indicators remain HTML/CSS. No image generation, baked controls, particles, random machinery, continuous decorative animation, neon gradients or generated illustrations are used. The only GPU scene is the retained physical console room.

Studied official production references: [Xbox Home](https://news.xbox.com/en-us/2023/07/26/welcome-to-your-new-xbox-home/) describes quick access and selection-related background behavior; [PlayStation Welcome hub](https://blog.playstation.com/2024/09/12/ps5-system-update-adds-welcome-hub-party-share-personalized-3d-audio-profiles-adaptive-controller-charging-and-more/) includes its actual console composition. Inspected Sony’s published console screenshot; Xbox’s linked image download returned 403, so its visual was not claimed as inspected. Applied restrained system chrome, a clear selected software rail, functional content hierarchy and consistent feedback. No vendor UI screenshot, game artwork or branding is embedded in the OCS interface.

Asset URLs and provenance: [console asset manifest](../apps/web/public/console/README.md), [chapter references](../apps/web/public/ocs/SOURCES.md). The optional historical mascot is preserved but unused, rather than inserted as filler.

## Current game art direction

After review, the initial icon-based domain treatment was replaced. The user asked for a different game identity per domain, while preserving shared console rules. The reference study and written rules precede asset creation: [art direction rules](art-direction/RULES.md).

The five domain worlds keep their distinct automation, expedition, route-planning, papercraft and puzzle art directions, while every visible title uses the ACM recruitment domain name. Covers, selected backgrounds and domain hubs use the same original SVG scene. System utilities keep their shared icons. No commercial game art is served; references are studies of principles. Forms remain neutral, with only a domain accent.

## Operational prototype boundaries

Implemented: per-launch boot and optional sign-in; guest browsing; five domain previews and native experiences; six-step forms; HTML validation and review; local drafts; sign-in/create-account at protected submission; account-isolated local receipts; storage errors; logout/reset/power-off; animated TV static and console power-on; source-linked collection; playable Snake; keyboard/mouse/touch, room and full onscreen controller; optional standard gamepad polling; mobile console; reduced motion.

Accounts are real local SQLite accounts. Applications, Snake scores and receipts are browser-local. No applications are sent to ACM-VIT, and no interview/status backend is represented as live. There is no official OCS ’27 schedule, server-side reviewer dashboard, verified university identity, password recovery/email service, or cross-device application sync. Shared browser storage is unsuitable as a production recruitment authority.

## Verification and screenshots

Use commands in the [README](../README.md). Browser tests cover boot and login/guest entry, all domains, in-console forms, keyboard editing/back, guest → account submission, persisted receipts, account isolation, collection navigation, power-off/static/restart, 25 controller inputs, Snake scoring/pause/collision/high scores, storage failure, room WebGPU/fallback, and a 390px mobile viewport. Existing auth tests remain intact; Snake tests cover engine edge cases.

The browser runner launches an isolated Next server and temporary SQLite database, cleans the database at teardown, records page exceptions, and retains failure traces. Headless Chromium uses a software GPU adapter; hardware-specific gamepad support and sustained performance across student laptops have not been measured.

Final verification (2026-10-18):

- `pnpm typecheck`: passed.
- `pnpm test`: all 15 tests passed, including the existing authentication suite.
- `pnpm build:web`: passed, including Next’s production TypeScript check.
- `OCS_E2E_PRODUCTION=1 pnpm --filter @ocs/web test:browser`: all 7 production browser scenarios passed in 1.4 minutes, with no uncaught page exceptions or missing requested image/model assets.
- Chromium selected **WebGPU** for the default room. Forced **WebGL 2** was also verified.
- Viewports checked: 1440×1000, 1280×720, 1920×1080, and direct mobile console at 390×844.
- Screenshots below come from the actual production application; no UI screenshot is used as an interactive asset.

The final room lighting uses restrained neutral screen reflection and the existing warm practical lights. The previous pink/blue split, emissive light strips, pulse, redundant poster gallery, and unused PlayStation font are removed. Reduced-motion changes mark the scene dirty so camera fit updates immediately.

| Console state      | Capture                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| Startup            | [startup](screenshots/startup.png)                                               |
| Home               | [home](screenshots/home.png)                                                     |
| Domain             | [selected domain](screenshots/selected-domain.png)                               |
| Application        | [application](screenshots/application.png)                                       |
| Arcade             | [arcade](screenshots/arcade.png), [completed run](screenshots/arcade-played.png) |
| Chapter collection | [verified project artwork](screenshots/collection.png)                           |
| Mobile form        | [mobile application](screenshots/mobile-application.png)                         |
