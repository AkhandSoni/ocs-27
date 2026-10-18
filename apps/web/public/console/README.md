# Console asset manifest

No generated imagery, domain photos, commercial game covers, fake buttons, or flattened interactive screens are used.

| Asset | Source / implementation | Use |
| --- | --- | --- |
| `mark.svg` | Diamond path extracted without alteration from the actual ACM-VIT lockup in `../ocs/logo.svg` | Favicon / chapter identifier |
| Interface and utility symbols | Lucide React, existing project dependency, ISC license; `src/components/console/Glyph.tsx` | System navigation, utility apps and controller feedback |
| `projects/unipool.svg` | https://raw.githubusercontent.com/ACM-VIT/unipool-webapp/main/public/brand/unipool-hero.svg | Identifies the real UniPool project in the collection |
| `projects/code2create.svg` | https://raw.githubusercontent.com/ACM-VIT/explore.acmvit.in/main/public/images/events/c2c.svg | Real event identity |
| `projects/reverse-coding.svg` | https://raw.githubusercontent.com/ACM-VIT/explore.acmvit.in/main/public/images/events/rc.svg | Real event identity |
| `projects/cryptic-hunt.svg` | https://raw.githubusercontent.com/ACM-VIT/explore.acmvit.in/main/public/images/events/ch.svg | Real event identity |

Chapter/project marks remain their owners’ branding; reused here for the corresponding ACM-VIT prototype content. Source files are preserved unmodified. Decorative sculptures, the custom ACM-like monogram, photographic gallery, and per-domain gradients have been removed.

Physical hardware and walnut material retain their attribution in `../models/ATTRIBUTION.txt` and `../textures/walnut-source.txt`. All functional text, controls, focus outlines and application inputs remain independent HTML/CSS.


## Domain game artwork

The five worlds are original SVG components in `src/components/console/art/`. Their source briefs and reference analysis are in `docs/art-direction/RULES.md`. Reference game screenshots were inspected in `/tmp` and are not runtime assets. Domain titles are HTML overlays, not baked into artwork. The same scene supplies the game jacket and widescreen selection view, with an explicit crop for the paper bird.

`fonts/BebasNeue-Regular.ttf` is from [Google Fonts / Bebas Neue](https://github.com/google/fonts/tree/main/ofl/bebasneue), copyright Dharma Type, licensed under the SIL Open Font License 1.1. The original license is retained in `fonts/OFL.txt`. Used only for the Assembly identity, not system controls.
