// Types and first-run defaults for the site content.
// After the first run, content lives in the JSON store and is edited from /dashboard.

export type Profile = {
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  roles: string[];
  intro: string;
  about: string;
  status: string;
  available: boolean;
  github: string;
  githubHandle: string;
  email: string;
  linkedin: string;
  url: string;
  location: string;
  phone: string;
  website: string;
  x: string;
  cvUrl: string;
  logoUrl: string;
  tagline: string;
};

export const projectVisuals = ["classroom", "fuzzy", "scatter", "sun", "code", "none"] as const;
export type ProjectVisual = (typeof projectVisuals)[number];

export type Project = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  tags: string[];
  href: string;
  year: string;
  featured: boolean;
  visible: boolean;
  visual: ProjectVisual;
};

export type FocusItem = { title: string; body: string };

export type Milestone = { date: string; title: string; body: string };

export type Message = {
  id: string;
  name: string;
  email: string;
  body: string;
  createdAt: string;
  read: boolean;
  archived: boolean;
};

export const skillIcons = ["brain", "chart", "code", "browser", "database", "stack"] as const;
export type SkillIcon = (typeof skillIcons)[number];

export type Skill = { name: string; level: number }; // level 1-5

export type SkillClass = {
  id: string;
  name: string;
  level: number; // 1-10
  xp: number; // 0-100, progress towards the next level
  blurb: string;
  icon: SkillIcon;
  skills: Skill[];
};

export const postStatuses = ["shipped", "building", "planned"] as const;
export type PostStatus = (typeof postStatuses)[number];

export type Post = {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  date: string; // YYYY-MM-DD
  summary: string;
  body: string;
  tags: string[];
  link: string;
  published: boolean;
  pinned: boolean;
};

export type Content = {
  profile: Profile;
  projects: Project[];
  stack: string[];
  focus: FocusItem[];
  journey: Milestone[];
  skills: SkillClass[];
  posts: Post[];
};

export const defaultContent: Content = {
  profile: {
    name: "Abdullah Helwani",
    firstName: "Abdullah",
    lastName: "Helwani",
    role: "AI & software engineer",
    roles: ["machine learning", "mobile apps", "fuzzy systems", "web interfaces"],
    intro:
      "I build software that pays attention, from AI systems that watch over classrooms to small tools that make a day run smoother.",
    about:
      "I study and build intelligent systems. I like the part where a model leaves the notebook and becomes something a teacher, a parent or a student can actually use. Most of my work sits between machine learning, fuzzy logic and the apps that put them in people's hands.",
    status: "Open to work & collaborations",
    available: true,
    github: "https://github.com/abdullah-helwani",
    githubHandle: "abdullah-helwani",
    email: "",
    linkedin: "",
    url: "https://github.com/abdullah-helwani/portfolio",
    location: "",
    phone: "",
    website: "",
    x: "",
    cvUrl: "",
    logoUrl: "",
    tagline: "Full-stack developer · AI & ML engineer",
  },
  projects: [
    {
      id: "senior-project",
      title: "Senior Project",
      kicker: "School management · AI monitoring",
      description:
        "A school management system with AI-assisted student monitoring: one place for staff, students and parents, with models surfacing what teachers would otherwise miss.",
      tags: ["Flutter", "Dart", "AI", "Team project"],
      href: "https://github.com/abdullah-helwani/Senior-Project",
      year: "2026",
      featured: true,
      visible: true,
      visual: "classroom",
    },
    {
      id: "luminary",
      title: "Luminary",
      kicker: "Daily assistant",
      description: "A personal assistant for the small things: plans, reminders and the day at a glance.",
      tags: ["HTML", "JavaScript", "UI"],
      href: "https://github.com/abdullah-helwani/Luminary",
      year: "2026",
      featured: false,
      visible: true,
      visual: "sun",
    },
    {
      id: "fuzzy-logic",
      title: "ANFIS vs Fuzzy Logic",
      kicker: "Research notebook",
      description:
        "An adaptive neuro-fuzzy inference system trained and benchmarked against a classic hand-tuned fuzzy controller.",
      tags: ["Python", "ANFIS", "Fuzzy logic"],
      href: "https://github.com/abdullah-helwani/Fuzzy_Logic",
      year: "2026",
      featured: false,
      visible: true,
      visual: "fuzzy",
    },
    {
      id: "ml-coursework",
      title: "ML Coursework",
      kicker: "Machine learning · Neural networks",
      description:
        "University work across machine learning, knowledge discovery and neural networks, from clean data pipelines to trained models.",
      tags: ["Jupyter", "scikit-learn", "Neural nets"],
      href: "https://github.com/abdullah-helwani/Homeworks",
      year: "2026",
      featured: false,
      visible: true,
      visual: "scatter",
    },
    {
      id: "odin-recipes",
      title: "Odin Recipes",
      kicker: "Where it started",
      description: "My first project from The Odin Project: plain HTML, semantic structure, the foundations.",
      tags: ["HTML"],
      href: "https://github.com/abdullah-helwani/odin_recipes",
      year: "2025",
      featured: false,
      visible: true,
      visual: "code",
    },
  ],
  stack: [
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
  ],
  focus: [
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
  ],
  journey: [
    { date: "Apr 2022", title: "First commit", body: "Opened a GitHub account and started shipping small experiments." },
    { date: "Oct 2025", title: "Back to foundations", body: "Worked through The Odin Project, starting with semantic HTML." },
    { date: "Apr 2026", title: "Senior project kicks off", body: "A school management system with AI monitoring, built as a team." },
    { date: "May 2026", title: "Into intelligent systems", body: "ANFIS research, ML coursework, and Luminary, a daily assistant." },
    { date: "Now", title: "Building in the open", body: "This site, its dashboard, and whatever comes next." },
  ],
  skills: [
    {
      id: "ai-ml",
      name: "AI & ML Engineer",
      level: 8,
      xp: 64,
      blurb: "Training, evaluating and shipping models: from classic ML to neural nets and neuro-fuzzy systems.",
      icon: "brain",
      skills: [
        { name: "Python", level: 5 },
        { name: "scikit-learn", level: 4 },
        { name: "Neural networks", level: 4 },
        { name: "PyTorch", level: 3 },
        { name: "Fuzzy logic & ANFIS", level: 4 },
        { name: "Computer vision", level: 3 },
      ],
    },
    {
      id: "data",
      name: "Data Scientist",
      level: 7,
      xp: 40,
      blurb: "Cleaning, exploring and explaining data until the story is obvious.",
      icon: "chart",
      skills: [
        { name: "Pandas", level: 4 },
        { name: "NumPy", level: 4 },
        { name: "SQL", level: 4 },
        { name: "Jupyter", level: 5 },
        { name: "Data visualisation", level: 4 },
        { name: "Knowledge discovery", level: 3 },
      ],
    },
    {
      id: "software",
      name: "Software Engineer",
      level: 7,
      xp: 72,
      blurb: "Readable code, sound architecture, version control and tests that catch things.",
      icon: "code",
      skills: [
        { name: "OOP & design patterns", level: 4 },
        { name: "Data structures & algorithms", level: 4 },
        { name: "Git & GitHub", level: 4 },
        { name: "Dart", level: 4 },
        { name: "Testing", level: 3 },
        { name: "Clean architecture", level: 3 },
      ],
    },
    {
      id: "frontend",
      name: "Front-end Developer",
      level: 7,
      xp: 55,
      blurb: "Interfaces that feel fast and considered, on the web and on mobile.",
      icon: "browser",
      skills: [
        { name: "React", level: 4 },
        { name: "Next.js", level: 4 },
        { name: "TypeScript", level: 4 },
        { name: "HTML & CSS", level: 5 },
        { name: "Tailwind CSS", level: 4 },
        { name: "Flutter", level: 4 },
      ],
    },
    {
      id: "backend",
      name: "Back-end Developer",
      level: 6,
      xp: 48,
      blurb: "APIs, databases and the plumbing that keeps data honest.",
      icon: "database",
      skills: [
        { name: "SQL", level: 4 },
        { name: "REST APIs", level: 4 },
        { name: "Node.js", level: 3 },
        { name: "Python", level: 5 },
        { name: "Database design", level: 4 },
        { name: "Authentication", level: 3 },
      ],
    },
    {
      id: "fullstack",
      name: "Full-stack Developer",
      level: 7,
      xp: 30,
      blurb: "Taking a feature from database schema to pixels, and deploying it.",
      icon: "stack",
      skills: [
        { name: "Next.js", level: 4 },
        { name: "React", level: 4 },
        { name: "Node.js", level: 3 },
        { name: "SQL", level: 4 },
        { name: "Flutter", level: 4 },
        { name: "Deployment", level: 3 },
      ],
    },
  ],
  posts: [
    {
      id: "p-portfolio",
      slug: "new-portfolio",
      title: "Launched this portfolio",
      status: "shipped",
      date: "2026-10-04",
      summary: "A new home on the web with a WebGL hero, a playable retro PC and a dashboard I can run it from.",
      body: "This site is built with Next.js, Tailwind CSS and Motion. The hero runs a single-draw WebGL aurora shader, the playground hides a CSS-3D computer you can play Snake on, and everything you read here is editable from my own dashboard.\n\nThe source is on GitHub if you want to see how it works.",
      tags: ["Next.js", "Motion", "WebGL"],
      link: "https://github.com/abdullah-helwani/portfolio",
      published: true,
      pinned: true,
    },
    {
      id: "p-senior",
      slug: "senior-project-ai-monitoring",
      title: "Senior project: AI-assisted school management",
      status: "building",
      date: "2026-08-23",
      summary: "One system for staff, students and parents, with models that help teachers notice what matters.",
      body: "My team and I are building a school management system with AI-assisted student monitoring. The app side is Flutter; the intelligence sits behind it.\n\nI'll post progress here as milestones land.",
      tags: ["Flutter", "AI", "Team"],
      link: "https://github.com/abdullah-helwani/Senior-Project",
      published: true,
      pinned: false,
    },
    {
      id: "p-anfis",
      slug: "anfis-write-up",
      title: "Write up the ANFIS experiments",
      status: "planned",
      date: "2026-11-01",
      summary: "A readable comparison of an adaptive neuro-fuzzy system against a hand-tuned fuzzy controller.",
      body: "The notebook is done; the explanation isn't. Next up: turning the results into a short article with charts.",
      tags: ["Fuzzy logic", "Writing"],
      link: "https://github.com/abdullah-helwani/Fuzzy_Logic",
      published: true,
      pinned: false,
    },
  ],
};
