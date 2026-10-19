# ACM console startup

Reference supplied by the user: [PS5 Startup Screen](https://www.youtube.com/watch?v=k_6M31kHTzk).
Inspected the 27-second clip frame by frame. Only its opening and player-selection sequence is the visual reference; the commercial game artwork and recordings are not shipped.

| Reference time | ACM implementation |
| --- | --- |
| 0–6.3 seconds | White official ACM diamond, centered on black; held still, then faded. |
| 6.4–9.2 seconds | Small ACM-VIT OCS identification and “Because Technology Matters” during the dark blue optical transition. |
| 9–11.6 seconds | Large defocused blue lens shapes pass across the screen and dissolve into the player backdrop. |
| 10.4–13.2 seconds | Warm upper-left illumination, gray horizon, fine gold/white points resolve into the stationary composition. |
| 13.2 seconds onward | Welcome heading, circular Add User and primary player, active-controller marker, clock, power, and Select controls. This state waits for the student. |
| After player confirmation | Player UI fades out over the continuing backdrop; Home fades in after 1.2 seconds. |

The backdrop is a deterministic, live Canvas 2D reconstruction using the approach already present on `main`, inside the existing Three.js WebGPU/WebGL room. Its clock continues from boot into player selection; it stops drawing at Home. No second GPU renderer or recorded background is needed.

The opening is skippable. Reduced motion uses a short static logo hold and static player backdrop. Guest browsing, startup sign-in/registration, contextual Back, power-off/static, and the existing account protections remain functional. The reference's Sony soundtrack is not included.

## Assets

- `public/ocs/logo.svg`: official ACM-VIT lockup preserved from the previous OCS repository. `BrandSymbol` crops its original diamond without modifying its geometry.
- Lato Light, Łukasz Dziedzic: [Google Fonts source](https://github.com/google/fonts/tree/main/ofl/lato), SIL Open Font License. Bundled as WOFF2 with `public/console/fonts/Lato-OFL.txt`; no external font request is made at runtime.
