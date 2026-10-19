/** User-supplied cover art. Crop in the presentation layer so original uploads
 * remain recoverable. The left trim removes screenshot cursors on the last two.
 * CC deliberately keeps its existing authored vector cover.
 */
export const domainCoverArt = {
  tech: { src: "/console/covers/tech.png", crop: [0, 0, 757, 690], background: "#b7c8b0", fit: "slice" },
  research: { src: "/console/covers/research.png", crop: [209, 0, 337, 690], background: "#2c746d", fit: "meet" },
  management: { src: "/console/covers/management.png", crop: [157, 0, 480, 690], background: "#1d797b", fit: "slice" },
  design: { src: "/console/covers/design.png", crop: [157, 0, 480, 690], background: "#e4aa27", fit: "slice" },
} as const;
