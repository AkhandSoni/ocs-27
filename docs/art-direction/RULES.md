# OCS console and five game identities

This brief precedes the replacement artwork. Baseline is commit `9f93b75`, preserved as `backup/console-before-game-art-study-9f93b75`.

## Recognition: two different visual systems

A console operating system is an **interaction system**: one focus ring, one navigation grammar, stable system controls, legible typography and repeatable movement. A game is a **world and identity**: a subject, composition, palette, material treatment and title typography. Making five app icons larger does not create five game identities. Applying one futuristic illustration style to every domain does not either.

Studied actual published screenshots and primary developer material, rather than image-search moodboards. Reference images are inspection material in `/tmp`, never shipped as ACM assets.

| Reference | Observed art / interaction language | Rule derived for OCS |
| --- | --- | --- |
| [PS5 UX, Sony](https://blog.playstation.com/2020/10/15/first-look-playstation-5s-next-generation-user-experience/) | Neutral chrome and focus treatment stay stable while game cover, background and title identity change. Published console screenshot inspected. | Separate system symbols from game jackets. One selected item, title-specific background, shared controls. |
| [Xbox Home, Microsoft](https://news.xbox.com/en-us/2023/07/26/welcome-to-your-new-xbox-home/) | Official documentation describes quick access, simplified hierarchy and art changing with highlighted software. | Selection must change the world immediately; system navigation must remain predictable. |
| [Factorio screenshots, Wube](https://factorio.com/game/screenshots) | Orthographic factory layouts; machines connected by material routes; industrial warm/cool materials. Official screenshot inspected. | Tech needs a constructed production scene with connected parts, not a floating tech symbol. |
| [Outer Wilds, Mobius](https://www.mobiusdigitalgames.com/outer-wilds.html) | Camping and expedition equipment, natural terrain, warm fire against dark surroundings; a discovery-led world. Official logo and campfire footage frame inspected. | Research needs a grounded expedition with a destination and observation equipment. No decorative atom or random starfield. |
| [Mini Metro, Dinosaur Polo Club](https://dinopoloclub.com/games/mini-metro/) | Flat cartographic art; river, meaningful stations and continuous routes; no lighting/rendered machinery. Official screenshot inspected. | Management is a coordinated network. Every route connects actual places. |
| [Tearaway, Sony / Media Molecule](https://blog.playstation.com/2014/08/12/tearaway-unfolded-coming-to-ps4/) | Folded-paper buildings and characters; angular surfaces, tangible material, assembled landscape. Official promotional still inspected. | Design uses a constructed paper world: consistent folds, restrained plane shading and a clear paper protagonist. |
| [Patrick’s Parabox, Patrick Traynor](https://www.patricksparabox.com/press/) | Flat nested rooms and contrasting movable pieces express a recursive puzzle; the mechanic produces the visual identity. Official screenshot inspected. | CC uses a connected, grid-based puzzle scene. Geometry expresses constraints and recursion, not arbitrary decoration. |

## Five original game briefs

References inform principles, not copied characters, logos, level layouts or screenshots. Domain names remain the software titles. These are recruitment experiences; the cover does not claim a second playable game exists.

| Domain | Genre identity | Subject and composition | Palette / material | Typography |
| --- | --- | --- | --- | --- |
| Tech | Automation / building sandbox | A three-quarter factory workbench, conveyor, gantry and assembled machine. Subject sits on the right, routes visibly join equipment. | Ink, slate steel, warm ochre. Orthographic blocks, hard edges, no bloom. | Condensed industrial capitals |
| Research | Expedition / discovery adventure | An observer with a field telescope on a ridge, distant terrain and one large celestial destination. | Midnight, rust, cream, muted sage. Broad silhouette planes and atmospheric depth. | Editorial serif capitals, generous spacing |
| Management | Route-planning strategy | A river with bridges, three connected transit lines and a central interchange. | Warm paper, charcoal, vermilion, blue, mustard. Flat strokes and station geometry. | Bold, tightly spaced sans serif |
| Design | Papercraft adventure | A folded bird crossing assembled terraces, cut-paper trees and folded buildings. | Cream, coral, teal, mustard. Explicit front/side/fold planes. | Soft italic serif, lower-case title treatment |
| CC | Recursive logic puzzle | A bounded tiled maze with a smaller room inside it, a player piece and a marked goal. | Deep aubergine, lavender, mint, amber. Square grid, sharp pixel edges, no gradients. | Bold monospace, compact line breaks |

## Rules that must survive implementation

1. **OS stays OS.** Header, tray, forms, focus ring, back behavior and keyboard/controller routing stay shared. Game art cannot imitate system buttons.
2. **Different games need different art.** Each domain changes composition, subject, palette, material and title treatment. A hue swap or enlarged icon fails this rule.
3. **A cover has a subject.** One dominant scene, a supporting environment and a readable silhouette at 88px. No disconnected decorative objects.
4. **One artwork family per title.** Square jacket, widescreen selection background and domain hub reuse the same authored world. Crops preserve its focal subject.
5. **Content-safe composition.** Art focal area sits in the right half; left-side content uses a quiet opaque reading area / functional contrast mask. Controls never sit on busy artwork.
6. **Artwork is editable SVG.** Named scene components, reusable geometric motifs, finite colour palettes. No image generation, photographs, stock art, copied game characters or embedded UI text.
7. **Text remains HTML.** Titles, domain labels, buttons, statuses and form inputs remain selectable and accessible. Artwork contains no fake buttons or text.
8. **Motion explains selection.** Selection uses a quick fade/translate and consistent outline. No drifting blobs, particles, spinning objects, bloom or continuous ambient effects in Home or domain artwork. The user specifically requested the startup optical/particle sequence described in [the startup reference](../startup-reference.md); it stops at Home. Honor reduced motion.
9. **System icons have a limited job.** Lucide is for system utilities and non-domain apps. It is not the game jacket or a domain’s main visual.
10. **Forms are the console’s practical layer.** Carry only the domain accent into forms; remove scenic art behind long answers. Keep native inputs, persistence, auth and honest local receipts.
11. **Keep the original engineering.** Retain the WebGPU/WebGL physical room and hardware. SVG artwork needs no second GPU context.
12. **Review at real sizes.** Inspect all five jackets together, each selected world, domain hub, phone layout and the existing interaction tests before delivery.

## Acceptance checklist

- [ ] Five covers are identifiable without their titles, including in grayscale.
- [ ] Each cover and its widescreen scene share the same focal subject.
- [ ] System navigation and form styles remain consistent between all five worlds.
- [ ] No commercial game image or logo is served as domain artwork.
- [ ] No artwork contains functional text, fake controls or decorative UI.
- [ ] Desktop/mobile crops preserve subjects; reduced motion is respected.
- [ ] Existing auth, application, controller and arcade checks still pass.
