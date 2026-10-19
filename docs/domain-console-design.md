# Domain art and content

The owner supplied four covers in upload order: Tech, Research, Management,
Design. The same original PNG is used for its home wallpaper, jacket, domain
background, physical case and disc label. CC retains its existing SVG artwork.

`apps/web/src/lib/domain-cover-art.ts` defines the crop and background color once.
Runtime SVG clipping removes screenshot borders and left-edge cursors. Images
retain their proportions; narrow illustrations extend their background color
rather than stretching characters. Original uploads remain intact in
`public/console/covers`; see that directory's provenance notes. Native HTML
supplies domain labels and every interactive control.

`DomainArtwork.tsx` and `CoverArtwork.tsx` render the console artwork;
`domain-package-art.ts` paints the same crops onto the case/disc CanvasTextures.
Image-load callbacks invalidate the room and detach during disposal.
`pnpm --filter @ocs/web build:art` rebuilds CC's two vector editions and the
neutral system-library symbol. Superseded domain vector posters are removed.

The Tools tab uses `domain-catalog.ts` and locally vendored tool logos. These
are examples to explore, not prerequisites or verified claims about ACM's stack.
Exact logo sources and licenses remain in `public/domains/logos`.

The original optimized models, room furniture and WebGPU/WebGL fallback remain.
Materials gain corrected plastic/metal response and one small environment
reflection capture. Upright decorative display cases and obsolete wall-photo
requests are removed. The interactive shelf and horizontal stacks remain.

Focus enlarges the TV while retaining the room around it. Room view pulls back
and works with a disc loaded. Only active disc transport temporarily owns the
camera; a loaded domain does not lock room controls. Phones use the practical
HTML console directly.
