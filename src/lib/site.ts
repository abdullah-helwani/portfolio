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
  portraitUrl: string;
  tagline: string;
};

export const projectVisuals = ["classroom", "fuzzy", "scatter", "sun", "code", "none"] as const;
export type ProjectVisual = (typeof projectVisuals)[number];

export type Project = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  /** Longer write-up for the project page. Blank lines start new paragraphs. */
  details: string;
  highlights: string[];
  role: string;
  tags: string[];
  /** Source code (usually GitHub). */
  href: string;
  /** The real, running website or app. */
  liveUrl: string;
  /** Uploaded PDF deck or an external slides link. */
  presentationUrl: string;
  coverUrl: string;
  /** YouTube / Vimeo / uploaded video link. */
  videoUrl: string;
  /** An AI Lab demo to try from the project page. */
  demoId: string;
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

// ---------------------------------------------------------------- résumé

export type Experience = { id: string; role: string; org: string; place: string; start: string; end: string; body: string };
export type Education = { id: string; degree: string; school: string; start: string; end: string; body: string };
export type Certification = { id: string; name: string; issuer: string; date: string; url: string; credentialId: string };
export type Course = { id: string; name: string; provider: string; date: string; url: string };
export type Language = { id: string; name: string; level: string };

export type Resume = {
  summary: string;
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  courses: Course[];
  languages: Language[];
  interests: string[];
};

// ---------------------------------------------------------------- page sections

export const sectionIds = ["about", "resume", "skills", "work", "lab", "journey", "playground", "videos", "log", "focus", "city", "contact"] as const;
export type SectionId = (typeof sectionIds)[number];

export type SectionConfig = {
  id: SectionId;
  visible: boolean;
  /** Small label above the heading, e.g. "Selected work". */
  kicker: string;
  /** Heading. Wrap words in *asterisks* to colour them. */
  title: string;
  intro: string;
};

export type SiteCopy = {
  heroKicker: string;
  heroPrimaryCta: string;
  heroCityCta: string;
  introEnabled: boolean;
  introLine: string;
  footerHeadline: string;
  footerNote: string;
  contactNote: string;
  rainEnabled: boolean;
};

// ---------------------------------------------------------------- business card

export type BusinessCard = {
  enabled: boolean;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  note: string;
  accent: string;
  showInNav: boolean;
};

// ---------------------------------------------------------------- city

export const accessories = ["none", "cap", "headphones"] as const;
export type Accessory = (typeof accessories)[number];

export type GuideConfig = {
  enabled: boolean;
  name: string;
  shirt: string;
  pants: string;
  hair: string;
  skin: string;
  accessory: Accessory;
  /** One line per dialogue step, shown when a visitor first arrives. */
  intro: string[];
  /** Said when a visitor talks to the guide again. */
  idle: string[];
};

export const placeKinds = ["tower", "shop", "kiosk"] as const;
export type PlaceKind = (typeof placeKinds)[number];

export type CityPlace = {
  id: string;
  name: string;
  description: string;
  url: string;
  color: string;
  kind: PlaceKind;
  height: number;
  visible: boolean;
};

export type CityConfig = {
  guide: GuideConfig;
  places: CityPlace[];
  citizenLines: string[];
  billboards: string[];
  traffic: boolean;
  citizens: number; // 0-24
  startAtNight: boolean;
};

// ---------------------------------------------------------------- AI lab

export const demoKinds = ["builtin", "api", "embed"] as const;
export type DemoKind = (typeof demoKinds)[number];
export const builtinDemos = ["sentiment", "fuzzy-tip", "kmeans", "regression", "digits"] as const;
export type BuiltinDemo = (typeof builtinDemos)[number];
export const demoInputs = ["text", "number", "json"] as const;
export type DemoInput = (typeof demoInputs)[number];

export type AiDemo = {
  id: string;
  title: string;
  description: string;
  kind: DemoKind;
  builtin: BuiltinDemo;
  /** For "api": the server forwards { input } as JSON to this URL. */
  endpoint: string;
  /** For "api": optional bearer token. Never sent to the browser. */
  token: string;
  inputType: DemoInput;
  inputLabel: string;
  placeholder: string;
  /** For "api": dot path into the JSON response to show, e.g. "result.label". Blank shows everything. */
  outputPath: string;
  /** For "embed": a Hugging Face Space, Gradio or Streamlit URL. */
  embedUrl: string;
  projectId: string;
  visible: boolean;
};

// ---------------------------------------------------------------- videos

export const videoStatuses = ["processing", "ready", "failed"] as const;
export type VideoStatus = (typeof videoStatuses)[number];

export type Video = {
  id: string;
  title: string;
  description: string;
  file: string; // processed file name in uploads
  original: string; // original upload file name
  poster: string;
  status: VideoStatus;
  error: string;
  createdAt: string;
  visible: boolean;
  downloadable: boolean;
  /** External link (YouTube etc.) shown instead of a file when set. */
  externalUrl: string;
};

export const watermarkCorners = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
export type WatermarkCorner = (typeof watermarkCorners)[number];

export type VideoBranding = {
  intro: boolean;
  outro: boolean;
  watermark: boolean;
  corner: WatermarkCorner;
  opacity: number; // 10-100
  cardSeconds: number; // 1-6
  /** Rendered in the dashboard from the logo and name. */
  cardUrl: string;
  markUrl: string;
};

// ---------------------------------------------------------------- points

export type AchievementOverride = { title?: string; hint?: string; xp?: number; enabled?: boolean };

export const rewardKinds = ["message", "link", "code", "certificate", "cosmetic"] as const;
export type RewardKind = (typeof rewardKinds)[number];

export type Reward = {
  id: string;
  title: string;
  description: string;
  /** XP needed. 0 means "unlock every achievement". */
  xp: number;
  kind: RewardKind;
  /** Message text, link URL, discount/secret code, or cosmetic id. */
  payload: string;
  enabled: boolean;
};

export type GameConfig = {
  achievements: Record<string, AchievementOverride>;
  rewards: Reward[];
};

// ---------------------------------------------------------------- content

export type Content = {
  profile: Profile;
  projects: Project[];
  stack: string[];
  focus: FocusItem[];
  journey: Milestone[];
  skills: SkillClass[];
  posts: Post[];
  resume: Resume;
  sections: SectionConfig[];
  copy: SiteCopy;
  card: BusinessCard;
  city: CityConfig;
  demos: AiDemo[];
  videos: Video[];
  branding: VideoBranding;
  game: GameConfig;
};

export const emptyProject: Omit<Project, "id" | "title"> = {
  kicker: "",
  description: "",
  details: "",
  highlights: [],
  role: "",
  tags: [],
  href: "",
  liveUrl: "",
  presentationUrl: "",
  coverUrl: "",
  videoUrl: "",
  demoId: "",
  year: "",
  featured: false,
  visible: true,
  visual: "code",
};

export const defaultSections: SectionConfig[] = [
  { id: "about", visible: true, kicker: "About", title: "About me", intro: "" },
  {
    id: "resume",
    visible: true,
    kicker: "Résumé",
    title: "The *paper* version",
    intro: "Experience, education, certifications and the courses that got me here.",
  },
  { id: "skills", visible: true, kicker: "Skills", title: "My *character* sheet", intro: "" },
  { id: "work", visible: true, kicker: "Selected work", title: "Things I've *built* and studied", intro: "" },
  {
    id: "lab",
    visible: true,
    kicker: "AI Lab",
    title: "Don't take my word for it. *Run it.*",
    intro: "Small, working versions of the models I build. Type something in and watch them answer.",
  },
  { id: "journey", visible: true, kicker: "Journey", title: "How I got *here*", intro: "" },
  {
    id: "playground",
    visible: true,
    kicker: "Arcade",
    title: "Take a break. *Beat the board.*",
    intro: "A tiny computer with a handful of games. Put your name on the leaderboard.",
  },
  { id: "videos", visible: true, kicker: "Videos", title: "Watch me *build*", intro: "Walkthroughs, demos and behind-the-scenes." },
  { id: "log", visible: true, kicker: "Build log", title: "Done, doing, *next*", intro: "" },
  { id: "focus", visible: true, kicker: "Services", title: "What I can *do* for you", intro: "" },
  {
    id: "city",
    visible: true,
    kicker: "The City",
    title: "Prefer to *explore?*",
    intro: "This whole portfolio is also a 3D city. Make a character, meet me in the plaza and walk around.",
  },
  { id: "contact", visible: true, kicker: "Contact", title: "Let's build something that *pays attention.*", intro: "" },
];

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
    portraitUrl: "",
    tagline: "Full-stack developer · AI & ML engineer",
  },
  projects: [
    {
      ...emptyProject,
      id: "senior-project",
      title: "Senior Project",
      kicker: "School management · AI monitoring",
      description:
        "A school management system with AI-assisted student monitoring: one place for staff, students and parents, with models surfacing what teachers would otherwise miss.",
      details:
        "Schools run on a dozen disconnected tools. This project puts staff, students and parents in one system, then adds a layer of AI that watches attendance, grades and behaviour signals so teachers hear about a struggling student early.\n\nI worked on the Flutter app and the parts that turn model output into screens people can act on.",
      highlights: ["One app for staff, students and parents", "AI-assisted student monitoring", "Built as a team"],
      role: "Flutter developer · AI integration",
      tags: ["Flutter", "Dart", "AI", "Team project"],
      href: "https://github.com/abdullah-helwani/Senior-Project",
      year: "2026",
      featured: true,
      visual: "classroom",
    },
    {
      ...emptyProject,
      id: "luminary",
      title: "Luminary",
      kicker: "Daily assistant",
      description: "A personal assistant for the small things: plans, reminders and the day at a glance.",
      tags: ["HTML", "JavaScript", "UI"],
      href: "https://github.com/abdullah-helwani/Luminary",
      year: "2026",
      visual: "sun",
    },
    {
      ...emptyProject,
      id: "fuzzy-logic",
      title: "ANFIS vs Fuzzy Logic",
      kicker: "Research notebook",
      description:
        "An adaptive neuro-fuzzy inference system trained and benchmarked against a classic hand-tuned fuzzy controller.",
      details:
        "A head-to-head between a hand-tuned Mamdani fuzzy controller and an ANFIS model that learns its membership functions from data.\n\nThe notebook covers the rule base, training, and where each approach wins.",
      tags: ["Python", "ANFIS", "Fuzzy logic"],
      href: "https://github.com/abdullah-helwani/Fuzzy_Logic",
      demoId: "fuzzy-tip",
      year: "2026",
      visual: "fuzzy",
    },
    {
      ...emptyProject,
      id: "ml-coursework",
      title: "ML Coursework",
      kicker: "Machine learning · Neural networks",
      description:
        "University work across machine learning, knowledge discovery and neural networks, from clean data pipelines to trained models.",
      tags: ["Jupyter", "scikit-learn", "Neural nets"],
      href: "https://github.com/abdullah-helwani/Homeworks",
      demoId: "kmeans",
      year: "2026",
      visual: "scatter",
    },
    {
      ...emptyProject,
      id: "odin-recipes",
      title: "Odin Recipes",
      kicker: "Where it started",
      description: "My first project from The Odin Project: plain HTML, semantic structure, the foundations.",
      tags: ["HTML"],
      href: "https://github.com/abdullah-helwani/odin_recipes",
      year: "2025",
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
  resume: {
    summary:
      "AI and software engineering student who likes shipping. I train and evaluate models, build the apps around them, and care about the last mile: the screen a real person uses.",
    experience: [
      {
        id: "exp-senior",
        role: "Flutter developer & AI integration",
        org: "Senior Project team",
        place: "University",
        start: "Apr 2026",
        end: "Present",
        body: "Building a school management system with AI-assisted student monitoring for staff, students and parents.",
      },
      {
        id: "exp-research",
        role: "Research project",
        org: "Intelligent systems coursework",
        place: "University",
        start: "May 2026",
        end: "Jun 2026",
        body: "Trained an ANFIS model and benchmarked it against a hand-tuned fuzzy controller.",
      },
    ],
    education: [
      {
        id: "edu-1",
        degree: "B.Sc. in Software & AI Engineering",
        school: "Add your university in the dashboard",
        start: "2022",
        end: "2026",
        body: "Machine learning, neural networks, knowledge discovery, fuzzy systems, software engineering.",
      },
    ],
    certifications: [],
    courses: [
      { id: "course-odin", name: "Foundations", provider: "The Odin Project", date: "2025", url: "https://www.theodinproject.com" },
    ],
    languages: [
      { id: "lang-ar", name: "Arabic", level: "Native" },
      { id: "lang-en", name: "English", level: "Professional" },
    ],
    interests: ["Applied AI", "Fuzzy systems", "Game-like interfaces", "Teaching"],
  },
  sections: defaultSections,
  copy: {
    heroKicker: "Portfolio",
    heroPrimaryCta: "See selected work",
    heroCityCta: "Explore the city",
    introEnabled: true,
    introLine: "compiling portfolio",
    footerHeadline: "Have an idea? *Let's build it.*",
    footerNote: "Designed and built in the open.",
    contactNote: "",
    rainEnabled: true,
  },
  card: {
    enabled: false,
    name: "Abdullah Helwani",
    title: "AI & software engineer",
    company: "",
    email: "",
    phone: "",
    website: "",
    location: "",
    note: "Let's build something that pays attention.",
    accent: "#5fd6c0",
    showInNav: true,
  },
  city: {
    guide: {
      enabled: true,
      name: "Abdullah",
      shirt: "#1f6f63",
      pants: "#1d2433",
      hair: "#1a1310",
      skin: "#c98b62",
      accessory: "headphones",
      intro: [
        "Hey, welcome! I'm Abdullah. This city is my portfolio, and I'll be your guide.",
        "North of here is the Project District. Every tower is something I built. Walk up to a door to go inside.",
        "East is the Skill Academy: collect a glowing orb for each of my skill classes.",
        "West is my house, south is Journey Park, the newsroom, the arcade and the Post Office where you can send me a letter.",
        "Pick up the little crystals on the way, they're worth XP. Your progress is saved on this device.",
        "That's the tour. Press M for the map any time. Go explore!",
      ],
      idle: [
        "Need a hint? Open the map and look for the coloured markers you haven't visited yet.",
        "The Project District has the towers. Walk up to a door and press E.",
        "Leave me a letter at the Post Office. I read every one.",
      ],
    },
    places: [],
    citizenLines: [
      "The Skill Academy is east of the plaza. Grab every orb!",
      "Each tower up north is one of Abdullah's projects.",
      "Heard the arcade has a Snake high score to beat.",
      "Drop a letter at the Post Office down south. He reads them all.",
      "Journey Park tells the whole story, monument by monument.",
      "Those little crystals? Bits. Collect them for XP.",
      "The newsroom posts what he shipped and what's next.",
      "Try sprinting with Shift. The city is bigger than it looks.",
      "Lost? Press M for the map.",
      "Nice outfit, by the way.",
    ],
    billboards: [],
    traffic: true,
    citizens: 14,
    startAtNight: true,
  },
  demos: [
    {
      id: "sentiment",
      title: "Sentiment reader",
      description: "A lexicon model with negation handling. Type a review, a tweet or a message and it scores the mood, word by word.",
      kind: "builtin",
      builtin: "sentiment",
      endpoint: "",
      token: "",
      inputType: "text",
      inputLabel: "Text to analyse",
      placeholder: "The app is fast and the team was really helpful, but setup was not easy.",
      outputPath: "",
      embedUrl: "",
      projectId: "",
      visible: true,
    },
    {
      id: "fuzzy-tip",
      title: "Fuzzy tip controller",
      description: "A Mamdani fuzzy inference system: rate the service and the food, and it reasons its way to a tip with overlapping rules.",
      kind: "builtin",
      builtin: "fuzzy-tip",
      endpoint: "",
      token: "",
      inputType: "number",
      inputLabel: "Service and food quality",
      placeholder: "",
      outputPath: "",
      embedUrl: "",
      projectId: "fuzzy-logic",
      visible: true,
    },
    {
      id: "kmeans",
      title: "K-means clustering",
      description: "Click to drop points, choose k, and watch the algorithm assign and move centroids step by step.",
      kind: "builtin",
      builtin: "kmeans",
      endpoint: "",
      token: "",
      inputType: "number",
      inputLabel: "Clusters",
      placeholder: "",
      outputPath: "",
      embedUrl: "",
      projectId: "ml-coursework",
      visible: true,
    },
    {
      id: "digits",
      title: "Handwriting reader",
      description: "Draw a digit from 0 to 9. A small nearest-template classifier guesses what you wrote and how sure it is.",
      kind: "builtin",
      builtin: "digits",
      endpoint: "",
      token: "",
      inputType: "text",
      inputLabel: "Draw a digit",
      placeholder: "",
      outputPath: "",
      embedUrl: "",
      projectId: "",
      visible: true,
    },
  ],
  videos: [],
  branding: {
    intro: true,
    outro: true,
    watermark: true,
    corner: "bottom-right",
    opacity: 70,
    cardSeconds: 2.5,
    cardUrl: "",
    markUrl: "",
  },
  game: {
    achievements: {},
    rewards: [
      {
        id: "reward-certificate",
        title: "Explorer certificate",
        description: "A certificate with your name on it, ready to download.",
        xp: 400,
        kind: "certificate",
        payload: "",
        enabled: true,
      },
      {
        id: "reward-gold",
        title: "Golden outfit",
        description: "A gold jacket for your character in the City.",
        xp: 280,
        kind: "cosmetic",
        payload: "gold",
        enabled: true,
      },
      {
        id: "reward-message",
        title: "A note from me",
        description: "Unlock every achievement to read it.",
        xp: 0,
        kind: "message",
        payload: "You found everything. Thank you for exploring this far. Send me a message with the word 'explorer' and I'll reply personally.",
        enabled: true,
      },
    ],
  },
};
