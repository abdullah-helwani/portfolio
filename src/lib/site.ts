// Everything personal lives here. Edit this file to update the page.

export const site = {
  name: "Abdullah Helwani",
  firstName: "Abdullah",
  lastName: "Helwani",
  role: "AI & software engineer",
  roles: ["machine learning", "mobile apps", "fuzzy systems", "web interfaces"],
  intro:
    "I build software that pays attention, from AI systems that watch over classrooms to small tools that make a day run smoother.",
  status: "Open to work & collaborations",
  github: "https://github.com/abdullah-helwani",
  githubHandle: "abdullah-helwani",
  // Add your email (e.g. "you@domain.com") to show a mail button in the contact section.
  email: "",
  linkedin: "",
  url: "https://github.com/abdullah-helwani/portfolio",
} as const;

export type Project = {
  title: string;
  kicker: string;
  description: string;
  tags: string[];
  href: string;
  year: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: "Senior Project",
    kicker: "School management · AI monitoring",
    description:
      "A school management system with AI-assisted student monitoring: one place for staff, students and parents, with models surfacing what teachers would otherwise miss.",
    tags: ["Flutter", "Dart", "AI", "Team project"],
    href: "https://github.com/abdullah-helwani/Senior-Project",
    year: "2026",
    featured: true,
  },
  {
    title: "Luminary",
    kicker: "Daily assistant",
    description:
      "A personal assistant for the small things: plans, reminders and the day at a glance.",
    tags: ["HTML", "JavaScript", "UI"],
    href: "https://github.com/abdullah-helwani/Luminary",
    year: "2026",
  },
  {
    title: "ANFIS vs Fuzzy Logic",
    kicker: "Research notebook",
    description:
      "An adaptive neuro-fuzzy inference system trained and benchmarked against a classic hand-tuned fuzzy controller.",
    tags: ["Python", "ANFIS", "Fuzzy logic"],
    href: "https://github.com/abdullah-helwani/Fuzzy_Logic",
    year: "2026",
  },
  {
    title: "ML Coursework",
    kicker: "Machine learning · Neural networks",
    description:
      "University work across machine learning, knowledge discovery and neural networks, from clean data pipelines to trained models.",
    tags: ["Jupyter", "scikit-learn", "Neural nets"],
    href: "https://github.com/abdullah-helwani/Homeworks",
    year: "2026",
  },
  {
    title: "Odin Recipes",
    kicker: "Where it started",
    description:
      "My first project from The Odin Project: plain HTML, semantic structure, the foundations.",
    tags: ["HTML"],
    href: "https://github.com/abdullah-helwani/odin_recipes",
    year: "2025",
  },
];

export const stack = [
  "Python",
  "Dart",
  "Flutter",
  "TypeScript",
  "React",
  "Next.js",
  "PyTorch",
  "scikit-learn",
  "Pandas",
  "Jupyter",
  "Fuzzy logic",
  "Computer vision",
  "Git",
  "HTML & CSS",
];

export const focus = [
  {
    title: "Applied machine learning",
    body: "Classification, clustering and neural networks, taken from notebook to something people can use.",
  },
  {
    title: "Intelligent systems",
    body: "Fuzzy inference, ANFIS and hybrid models where explainability matters as much as accuracy.",
  },
  {
    title: "Cross-platform apps",
    body: "Flutter apps that turn model output into screens that teachers, parents and students can act on.",
  },
  {
    title: "Interfaces for the web",
    body: "Fast, accessible front-ends with motion that explains instead of decorates.",
  },
];
