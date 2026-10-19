import { DOMAINS } from "./domain-sequence.ts";

export type DomainId = typeof DOMAINS[number]["id"];
export type DomainTool = { name: string; logo?: string };
export type DomainDiscipline = { name: string; tools: readonly DomainTool[] };
export type DomainCatalogEntry = {
  genre: string;
  headline: string;
  description: string;
  hero: string;
  disciplines: readonly DomainDiscipline[];
};

// Editable starting examples approved by the user, not a claim about ACM's
// current production stack. Keep copy, tool names and logos out of poster art.
export const DOMAIN_CATALOG: Record<DomainId, DomainCatalogEntry> = {
  tech: {
    genre: "BUILD TOGETHER",
    headline: "From the first line to the next big thing.",
    description: "Create interfaces, connect systems and ship ideas into the real world.",
    hero: "react",
    disciplines: [
      { name: "Frontend", tools: [{ name: "React", logo: "react" }, { name: "TypeScript", logo: "typescript" }] },
      { name: "Full stack", tools: [{ name: "Next.js", logo: "nextjs" }] },
      { name: "Backend", tools: [{ name: "Node.js", logo: "nodejs" }, { name: "PostgreSQL", logo: "postgresql" }] },
      { name: "DevOps", tools: [{ name: "Docker", logo: "docker" }] },
      { name: "Security", tools: [{ name: "OWASP", logo: "owasp" }] },
    ],
  },
  research: {
    genre: "FOLLOW YOUR CURIOSITY",
    headline: "Every discovery starts with a question.",
    description: "Explore an idea, test the evidence and share what you discover.",
    hero: "jupyter",
    disciplines: [
      { name: "Experiments", tools: [{ name: "Python", logo: "python" }, { name: "Jupyter", logo: "jupyter" }] },
      { name: "Data", tools: [{ name: "NumPy", logo: "numpy" }, { name: "pandas", logo: "pandas" }] },
      { name: "Writing", tools: [{ name: "LaTeX", logo: "latex" }] },
      { name: "Publications", tools: [{ name: "arXiv", logo: "arxiv" }] },
      { name: "References", tools: [{ name: "Zotero", logo: "zotero" }] },
    ],
  },
  "competitive-coding": {
    genre: "THINK. SOLVE. REPEAT.",
    headline: "One problem. A better way to solve it.",
    description: "Sharpen your algorithms, race the clock and rise to the challenge.",
    hero: "cpp",
    disciplines: [
      { name: "Performance", tools: [{ name: "C++", logo: "cpp" }] },
      { name: "Problem solving", tools: [{ name: "Python", logo: "python" }] },
      { name: "Practice", tools: [{ name: "LeetCode", logo: "leetcode" }] },
      { name: "Contests", tools: [{ name: "Codeforces", logo: "codeforces" }] },
      { name: "Team challenges", tools: [{ name: "ICPC" }] },
    ],
  },
  design: {
    genre: "MAKE YOUR MARK",
    headline: "A different way to see the world.",
    description: "Shape interfaces, tell visual stories and put ideas into motion.",
    hero: "figma",
    disciplines: [
      { name: "UI / UX", tools: [{ name: "Figma", logo: "figma" }] },
      { name: "Imagery", tools: [{ name: "Photoshop", logo: "photoshop" }] },
      { name: "Illustration", tools: [{ name: "Illustrator", logo: "illustrator" }] },
      { name: "3D", tools: [{ name: "Blender", logo: "blender" }] },
      { name: "Motion", tools: [{ name: "After Effects", logo: "aftereffects" }] },
    ],
  },
  management: {
    genre: "MAKE IT HAPPEN",
    headline: "Great experiences start with a great team.",
    description: "Bring people, plans and possibilities together. Make every move count.",
    hero: "notion",
    disciplines: [
      { name: "Planning", tools: [{ name: "Notion", logo: "notion" }] },
      { name: "Delivery", tools: [{ name: "Trello", logo: "trello" }] },
      { name: "Operations", tools: [{ name: "Sheets", logo: "sheets" }] },
      { name: "Communication", tools: [{ name: "Slack", logo: "slack" }] },
      { name: "Strategy", tools: [{ name: "Miro", logo: "miro" }] },
    ],
  },
};

export const COLLECTION_POSTER = "/domains/collection.svg";
export const domainPoster = (id: DomainId) => `/domains/${id}.svg`;
export const domainCover = (id: DomainId) => `/domains/${id}-cover.svg`;
export const toolLogo = (name: string) => `/domains/logos/${name}.svg`;

// The collection stays on the TV while the physical disc is moving. The
// domain appears only after the drive closes and the shared boot cue begins.
export function isDomainBootVisible(phase: string) {
  return phase === "booting" || phase === "active" || phase === "returning";
}
