export const DOMAIN_IDS = [
  "tech",
  "research",
  "management",
  "design",
  "cc",
] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];
export type Domain = {
  id: DomainId;
  name: string;
  number: string;
  color: string;
  heading: string;
  description: string;
  areas: string[];
  work: string;
  questions: string[];
};
export const domains: Domain[] = [
  {
    id: "tech",
    name: "Tech",
    number: "01",
    color: "#b9a0ff",
    heading: "Build what comes next.",
    description:
      "Turn a curious “what if” into something people can use. Find your people in code, experiments, and the occasional late-night bug hunt.",
    areas: ["Web & App", "Game development", "DevOps & Open source"],
    work: "Explore products, useful campus tools, open-source contributions, and the engineering behind chapter experiences.",
    questions: [
      "What would you like to build, and which technologies interest you?",
      "Tell us about a project or a problem you worked on. What did you learn?",
      "You need an unfamiliar tool for a project. How would you get started?",
    ],
  },
  {
    id: "management",
    name: "Management",
    number: "03",
    color: "#f1bd7b",
    heading: "Make the big ideas happen.",
    description:
      "Bring people, plans, and a little controlled chaos together. Create the experiences that make a chapter feel like a community.",
    areas: ["Events & Operations", "Outreach", "Community"],
    work: "Explore event planning, participant experiences, collaboration, and turning an ambitious idea into an executable plan.",
    questions: [
      "Pitch an event you would love ACM VIT to organize. Who is it for?",
      "Tell us about a time you coordinated with a team.",
      "A key deadline is missed just before an event. What do you do next?",
    ],
  },
  {
    id: "design",
    name: "Design",
    number: "04",
    color: "#f1a1bf",
    heading: "Give your ideas a form.",
    description:
      "Make people stop, look, and feel something. Shape experiences through visual stories, thoughtful interfaces, and a fresh point of view.",
    areas: ["UI / UX", "Illustration & Branding", "Motion & 3D"],
    work: "Explore visual identities, event campaigns, interfaces, illustrations, and the small details that make an experience memorable.",
    questions: [
      "Which area of design excites you, and why?",
      "Choose an interface you use often. What would you improve?",
      "How would you approach a visual campaign for OCS? Walk us through your process.",
    ],
  },
  {
    id: "cc",
    name: "Competitive Coding",
    number: "05",
    color: "#8ad7bd",
    heading: "One problem. A new perspective.",
    description:
      "Find the pattern, challenge your approach, and enjoy that moment when it finally clicks. Get better at solving together.",
    areas: ["Algorithms", "Data structures", "Contests"],
    work: "Explore algorithmic thinking, collaborative practice, and problem-solving experiences such as Reverse Coding.",
    questions: [
      "Which programming language do you prefer, and what have you practiced so far?",
      "Describe a problem you solved. How did you arrive at your approach?",
      "When your solution fails a hidden test, how do you investigate?",
    ],
  },
  {
    id: "research",
    name: "Research",
    number: "02",
    color: "#93c9ef",
    heading: "Follow the better question.",
    description:
      "Go beyond what already works. Read, question, test, and discover with people who are just as curious about the unknown.",
    areas: ["AI & Emerging tech", "Reading & Analysis", "Experiments"],
    work: "Explore emerging computing ideas, paper discussions, evidence-led experiments, and questions worth investigating.",
    questions: [
      "What research topic are you curious about, and what draws you to it?",
      "Propose a question you would investigate. What would your first experiment be?",
      "How would you decide whether a source or a result is trustworthy?",
    ],
  },
];
export type Applicant = {
  name: string;
  email: string;
  registration: string;
  branch: string;
  year: string;
  motivation: string;
  portfolio: string;
};
export type Application = {
  domain: DomainId;
  applicant: Applicant;
  answers: string[];
  updatedAt: string;
  submittedAt?: string;
};
export const emptyApplicant = (name = "", email = ""): Applicant => ({
  name,
  email,
  registration: "",
  branch: "",
  year: "",
  motivation: "",
  portfolio: "",
});
