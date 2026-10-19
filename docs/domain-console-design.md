# Domain console refresh

Domain screens use a small cover strip, a clear title, local tool-logo artwork,
and a toolkit for each domain. The artwork is built from SVG compositions.

## Content and assets

- Edit `apps/web/src/lib/domain-catalog.ts` to change the example tool lists,
  descriptions or discipline names. These are starting examples, not a claim
  that ACM currently deploys every listed technology.
- Six self-contained vector posters live in `apps/web/public/domains/`: Tech,
  Research, Competitive Coding, Design, Management and the combined collection.
  Five matching `*-cover.svg` assets are used on the physical cases.
- The collection poster has no domain titles. Product marks retain their own
  shapes; names and explanatory text are native UI, not rasterized into art.
- Rebuild compositions with `pnpm --filter @ocs/web exec node scripts/build-domain-art.mjs`.
- Vendored logos, source URLs pinned to commit SHAs, and upstream licenses live
  in `apps/web/public/domains/logos/`. Re-fetching is an authoring operation only;
  visitors do not request assets from third-party hosts.

## Motion and rendering

The combined collection remains visible during case opening and disc insertion.
The selected artwork starts loading on selection, then appears only when the
shared physical sequence reaches the TV boot cue. Decoding finishes before its
image fades in; the collection remains underneath if loading is slow or fails.
Reduced-motion settings remove the CSS movement and preserve the existing short
boot. Back/Escape and all disc/camera timings remain owned by the shared sequence.
On small portrait screens the toolkit moves to a native-size panel below the TV;
its tiny in-TV counterpart is hidden, with no duplicate visible instructions.

The case textures load into their existing canvases, with labels retained as a
fallback. Image callbacks are detached on disposal. No animation library or
runtime package was added.

Device rendering uses a single 128px room-reflection capture, corrected plastic
and metal responses, a rounded TV bezel and central stand, subtle TV glass edges,
walnut grain bump detail, shared leaf veins and curved planter rims with recessed
soil. There are no per-frame reflection captures or new external HDR downloads.

## References and provenance

- [PlayStation / Housemarque on Returnal UI](https://blog.playstation.com/2021/05/11/unpacking-returnals-ux-design-gameplay-first-ui-retro-futuristic-tech-and-accessibility/): focused visual hierarchy and restraint.
- [Three.js RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html) and
  [physical materials](https://threejs.org/docs/pages/MeshPhysicalMaterial.html):
  environment lighting and material response. Implementation was checked against
  the installed Three.js 0.180 source, including its WebGPU PMREM generator.
- [Devicon](https://github.com/devicons/devicon) and
  [Simple Icons](https://github.com/simple-icons/simple-icons): tool marks, with
  licenses and exact source commits retained beside the assets. Marks identify
  tools and do not imply affiliation or endorsement.
- The existing PS5 and controller models remain in use. Their CC BY 4.0
  attributions are in `apps/web/public/models/ATTRIBUTION.txt`.

## Validation boundary

Automated checks cover local SVG validity, complete asset/tool references, asset
size, boot sequencing, the five-case disc interactions, reverse/exit paths,
portrait framing, controller motion, authentication and cleanup. Type checking,
production build and HTTP delivery are checked separately.

Run `pnpm test`, `pnpm typecheck`, and `pnpm build:web` from the repository root.
The suite includes 35 tests. The poster, cover and logo SVG set is 162,520 bytes.
Live GPU rendering, animation smoothness and frame rate still require browser
review; static artwork inspection and automated geometry tests do not verify
those results.

The preview runs with
`pnpm --filter @ocs/web exec next start --hostname 127.0.0.1 --port 3000`.
Open `http://127.0.0.1:3000/` and click the CD shelf to open the collection.
