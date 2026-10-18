import { domains as baseDomains, type DomainId } from "@/lib/recruitment";
export type ExperienceId = DomainId | "showcase" | "arcade" | "applications";
export const experienceOrder: ExperienceId[] = [
  "tech",
  "research",
  "management",
  "design",
  "cc",
  "showcase",
  "arcade",
  "applications",
];
export const domainOrder: DomainId[] = [
  "tech",
  "research",
  "management",
  "design",
  "cc",
];
export const experiences: Record<
  ExperienceId,
  {
    title: string;
    subtitle: string;
    description: string;
    color: string;
    category: string;
  }
> = {
  tech: {
    title: "TECH",
    subtitle: "Build. Break. Understand.",
    description:
      "Web, app, game development, open source and DevOps. Build the things you wish existed.",
    color: "#8bbbd8",
    category: "RECRUITMENT · DOMAIN 01",
  },
  research: {
    title: "RESEARCH",
    subtitle: "Question the obvious.",
    description:
      "Explore AI, emerging computing and experiments. Turn a good question into a better understanding.",
    color: "#8bbbd8",
    category: "RECRUITMENT · DOMAIN 02",
  },
  management: {
    title: "MANAGEMENT",
    subtitle: "Bring it all together.",
    description:
      "The strategy, people and execution behind a great experience. Make ambitious ideas happen.",
    color: "#8bbbd8",
    category: "RECRUITMENT · DOMAIN 03",
  },
  design: {
    title: "DESIGN",
    subtitle: "Make an impression.",
    description:
      "Interfaces, identities, motion and 3D. Shape how people experience everything we create.",
    color: "#8bbbd8",
    category: "RECRUITMENT · DOMAIN 04",
  },
  cc: {
    title: "COMPETITIVE CODING",
    subtitle: "Think beyond the first solution.",
    description:
      "Algorithms, data structures and the satisfaction of a problem solved. Find your next challenge.",
    color: "#8bbbd8",
    category: "RECRUITMENT · DOMAIN 05",
  },
  showcase: {
    title: "THE COLLECTION",
    subtitle: "Made by ACM-VIT.",
    description:
      "Explore real chapter projects and events. A library of ideas brought to life.",
    color: "#8bbbd8",
    category: "CHAPTER LIBRARY · PROJECTS & EVENTS",
  },
  arcade: {
    title: "SIGNAL / SNAKE",
    subtitle: "One more run.",
    description:
      "Collect the signal. Keep moving. A playable original console mini-game with local high scores.",
    color: "#8bbbd8",
    category: "ARCADE · SINGLE PLAYER",
  },
  applications: {
    title: "MY CONSOLE",
    subtitle: "Pick up where you left off.",
    description:
      "Your profile, saved applications and progress. Every domain is a new possibility.",
    color: "#8bbbd8",
    category: "PROFILE · LOCAL COLLECTION",
  },
};
export const domainById = Object.fromEntries(
  baseDomains.map((d) => [d.id, d]),
) as Record<DomainId, (typeof baseDomains)[number]>;
export const domainInfo: Record<
  DomainId,
  { responsibilities: string[]; expectations: string[]; work: string }
> = {
  tech: {
    responsibilities: [
      "Build useful web and mobile experiences.",
      "Collaborate on code, testing and deployment.",
      "Explore open source, game development and developer tools.",
    ],
    expectations: [
      "Curiosity about how software works.",
      "Willingness to learn and explain your approach.",
      "Foundations matter more than a long list of frameworks.",
    ],
    work: "UniPool is an ACM-VIT student ride-sharing project. Explore it in The Collection.",
  },
  research: {
    responsibilities: [
      "Read and discuss technical ideas and research papers.",
      "Design small experiments and evaluate evidence.",
      "Explore AI/ML, IoT, cybersecurity and emerging computing.",
    ],
    expectations: [
      "Ask specific, testable questions.",
      "Explain your reasoning and acknowledge uncertainty.",
      "Be ready to investigate unfamiliar topics.",
    ],
    work: "Explore the chapter’s public repositories and interests. No unverified publication or achievement claims are included here.",
  },
  management: {
    responsibilities: [
      "Plan events and coordinate teams.",
      "Communicate with participants and collaborators.",
      "Turn plans into a dependable participant experience.",
    ],
    expectations: [
      "Clear communication and follow-through.",
      "Comfort working with people and changing constraints.",
      "Thoughtful decisions when things do not go to plan.",
    ],
    work: "Code 2 Create, Reverse Coding and Cryptic Hunt are featured in the previous OCS chapter library.",
  },
  design: {
    responsibilities: [
      "Create visual identities, interfaces and campaigns.",
      "Explore illustration, motion, video and 3D.",
      "Make information clear through visual decisions.",
    ],
    expectations: [
      "Show your process, not just a final image.",
      "Notice details and accept useful feedback.",
      "A portfolio is welcome but optional for this prototype.",
    ],
    work: "The OCS experiences themselves bring together branding, interface design, illustration and motion.",
  },
  cc: {
    responsibilities: [
      "Practice algorithms and data structures.",
      "Discuss approaches and learn from other solutions.",
      "Participate in problem-solving and contest experiences.",
    ],
    expectations: [
      "Explain how you arrive at a solution.",
      "Know the fundamentals of your chosen language.",
      "Persistence matters when the first attempt fails.",
    ],
    work: "Reverse Coding is a chapter event featured in the previous OCS library.",
  },
};
export const showcaseItems = [
  {
    id: "unipool",
    image: "/console/projects/unipool.svg",
    title: "UniPool",
    type: "PROJECT",
    symbol: "tech" as ExperienceId,
    summary: "Student ride sharing.",
    body: "UniPool is a student ride-sharing application. ACM-VIT’s public web repository describes a Next.js web app with authentication and map-based experiences.",
    url: "https://github.com/ACM-VIT/unipool-webapp",
    source: "ACM-VIT / unipool-webapp",
  },
  {
    id: "c2c",
    image: "/console/projects/code2create.svg",
    title: "Code 2 Create",
    type: "CHAPTER EVENT",
    symbol: "design" as ExperienceId,
    summary: "An event from the ACM-VIT collection.",
    body: "Code 2 Create is featured in the previous ACM-VIT OCS showcase. This entry preserves the verified event identity; this prototype does not claim dates, attendance, prizes or current registration.",
    url: "https://github.com/ACM-VIT/explore.acmvit.in/blob/main/src/app/components/landing/home-page.tsx",
    source: "OCS ’26 / chapter showcase",
  },
  {
    id: "rc",
    image: "/console/projects/reverse-coding.svg",
    title: "Reverse Coding",
    type: "CHAPTER EVENT",
    symbol: "cc" as ExperienceId,
    summary: "A different approach to problem solving.",
    body: "Reverse Coding appears in both previous OCS repositories. Explore the public chapter source for the original event material. This is a historical showcase entry, not a live event registration.",
    url: "https://github.com/ACM-VIT/explore.acmvit.in",
    source: "OCS ’26 / chapter showcase",
  },
  {
    id: "ch",
    image: "/console/projects/cryptic-hunt.svg",
    title: "Cryptic Hunt",
    type: "CHAPTER EVENT",
    symbol: "research" as ExperienceId,
    summary: "Curiosity has a place here.",
    body: "Cryptic Hunt is named in the previous OCS chapter showcase. Its official event mark is preserved from the chapter repository. This is a historical showcase entry, not a live event registration.",
    url: "https://github.com/ACM-VIT/explore.acmvit.in/blob/main/src/app/components/landing/home-page.tsx",
    source: "OCS ’26 / chapter showcase",
  },
  {
    id: "chapter",
    image: "/ocs/logo.svg",
    title: "ACM-VIT",
    type: "THE CHAPTER",
    symbol: "showcase" as ExperienceId,
    summary: "Because Technology Matters.",
    body: "The Association for Computing Machinery student chapter at VIT. Tech, Research, Management, Design and Competitive Coding are the five recruitment domains represented in the previous OCS source. Explore, learn and build with the chapter.",
    url: "https://acmvit.in",
    source: "ACM-VIT",
  },
];
