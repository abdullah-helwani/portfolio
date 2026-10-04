export type AchievementId =
  | "hello"
  | "explorer"
  | "bottom"
  | "inspector"
  | "skill-master"
  | "snake-10"
  | "snake-25"
  | "networker"
  | "konami"
  | "logo"
  | "palette"
  | "reader"
  | "github"
  | "character"
  | "curator"
  | "collector"
  | "world-walker";

export type Achievement = {
  id: AchievementId;
  title: string;
  hint: string;
  xp: number;
  secret?: boolean;
};

export const achievements: Achievement[] = [
  { id: "hello", title: "Hello, world", hint: "Land on the site.", xp: 10 },
  { id: "explorer", title: "Cartographer", hint: "Visit every section of the page.", xp: 60 },
  { id: "bottom", title: "Rock bottom", hint: "Scroll all the way to the footer.", xp: 20 },
  { id: "inspector", title: "Character inspector", hint: "Inspect 3 skill classes.", xp: 30 },
  { id: "skill-master", title: "Full party", hint: "Inspect every skill class.", xp: 50 },
  { id: "snake-10", title: "Bug hunter", hint: "Score 10 in Snake.", xp: 40 },
  { id: "snake-25", title: "Exterminator", hint: "Score 25 in Snake.", xp: 80 },
  { id: "networker", title: "Networker", hint: "Send me a message.", xp: 100 },
  { id: "palette", title: "Power user", hint: "Open the command palette (Ctrl/⌘ + K).", xp: 15 },
  { id: "reader", title: "Read the log", hint: "Open a post from the build log.", xp: 20 },
  { id: "github", title: "Source diver", hint: "Visit my GitHub.", xp: 10 },
  { id: "character", title: "New player", hint: "Create a character in the World.", xp: 15 },
  { id: "curator", title: "Curator", hint: "Inspect every project kiosk in the World.", xp: 60 },
  { id: "collector", title: "Bit collector", hint: "Collect 25 bits in the World.", xp: 40 },
  { id: "world-walker", title: "World walker", hint: "Reach the end of the World.", xp: 80 },
  { id: "logo", title: "Tap tap tap", hint: "Something happens if you keep clicking the logo.", xp: 25, secret: true },
  { id: "konami", title: "Old school", hint: "↑ ↑ ↓ ↓ ← → ← → B A", xp: 100, secret: true },
];

export const levels = [0, 40, 100, 180, 280, 400, 560, 760, 1000, 1300];

export function levelFor(xp: number) {
  let level = 1;
  for (let i = 0; i < levels.length; i++) if (xp >= levels[i]) level = i + 1;
  const floor = levels[level - 1] ?? 0;
  const ceil = levels[level] ?? floor;
  const progress = ceil === floor ? 1 : (xp - floor) / (ceil - floor);
  return { level, floor, ceil, progress, max: level === levels.length };
}

export const questSections = ["top", "about", "skills", "journey", "work", "log", "play", "focus", "contact"];
