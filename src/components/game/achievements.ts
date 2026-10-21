import type { AchievementOverride } from "@/lib/site";

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
  | "world-walker"
  | "scientist"
  | "gamer"
  | "cinephile"
  | "tour"
  | "recruiter"
  | "leaderboard";

export type Achievement = {
  id: AchievementId;
  title: string;
  hint: string;
  xp: number;
  secret?: boolean;
};

export const baseAchievements: Achievement[] = [
  { id: "hello", title: "Hello, world", hint: "Land on the site.", xp: 10 },
  { id: "explorer", title: "Cartographer", hint: "Visit every section of the page.", xp: 60 },
  { id: "bottom", title: "Rock bottom", hint: "Scroll all the way to the footer.", xp: 20 },
  { id: "inspector", title: "Character inspector", hint: "Inspect 3 skill classes.", xp: 30 },
  { id: "skill-master", title: "Full party", hint: "Inspect every skill class.", xp: 50 },
  { id: "snake-10", title: "Bug hunter", hint: "Score 10 in Snake.", xp: 40 },
  { id: "snake-25", title: "Exterminator", hint: "Score 25 in Snake.", xp: 80 },
  { id: "gamer", title: "Arcade regular", hint: "Play three different arcade games.", xp: 50 },
  { id: "leaderboard", title: "Name in lights", hint: "Put your name on an arcade leaderboard.", xp: 40 },
  { id: "scientist", title: "Lab partner", hint: "Run an AI Lab demo.", xp: 30 },
  { id: "cinephile", title: "Front row", hint: "Watch one of my videos.", xp: 20 },
  { id: "recruiter", title: "Recruiter mode", hint: "Download my CV.", xp: 30 },
  { id: "networker", title: "Networker", hint: "Send me a message.", xp: 100 },
  { id: "palette", title: "Power user", hint: "Open the command palette (Ctrl/⌘ + K).", xp: 15 },
  { id: "reader", title: "Read the log", hint: "Open a post from the build log.", xp: 20 },
  { id: "github", title: "Source diver", hint: "Visit my GitHub.", xp: 10 },
  { id: "character", title: "New player", hint: "Create a character in the City.", xp: 15 },
  { id: "tour", title: "Guided tour", hint: "Listen to the guide in the City plaza.", xp: 20 },
  { id: "curator", title: "Curator", hint: "Inspect every project tower in the City.", xp: 60 },
  { id: "collector", title: "Bit collector", hint: "Collect 25 bits in the City.", xp: 40 },
  { id: "world-walker", title: "City explorer", hint: "Visit every district of the City.", xp: 80 },
  { id: "logo", title: "Tap tap tap", hint: "Something happens if you keep clicking the logo.", xp: 25, secret: true },
  { id: "konami", title: "Old school", hint: "↑ ↑ ↓ ↓ ← → ← → B A", xp: 100, secret: true },
];

/** Repeatable actions that grant a little XP each time. */
export type ActivityId = "xp-bit" | "xp-orb" | "xp-monument" | "xp-tower" | "xp-talk" | "xp-place" | "xp-demo" | "xp-game" | "xp-video";

export const baseActivities: { id: ActivityId; title: string; xp: number }[] = [
  { id: "xp-bit", title: "Collect a bit in the City", xp: 2 },
  { id: "xp-orb", title: "Collect a skill orb in the Academy", xp: 25 },
  { id: "xp-monument", title: "Visit a Journey Park monument", xp: 15 },
  { id: "xp-tower", title: "Inspect a project tower", xp: 30 },
  { id: "xp-place", title: "Visit one of the custom places", xp: 20 },
  { id: "xp-talk", title: "Chat with a citizen", xp: 5 },
  { id: "xp-demo", title: "Run an AI Lab demo", xp: 5 },
  { id: "xp-game", title: "Finish an arcade game", xp: 5 },
  { id: "xp-video", title: "Watch a video to the end", xp: 10 },
];

export type ResolvedAchievement = Achievement & { enabled: boolean };

export function resolveAchievements(overrides: Record<string, AchievementOverride> = {}): ResolvedAchievement[] {
  return baseAchievements.map((a) => {
    const o = overrides[a.id] ?? {};
    return {
      ...a,
      title: o.title || a.title,
      hint: o.hint || a.hint,
      xp: typeof o.xp === "number" ? o.xp : a.xp,
      enabled: o.enabled !== false,
    };
  });
}

export function resolveActivities(overrides: Record<string, AchievementOverride> = {}) {
  return Object.fromEntries(
    baseActivities.map((a) => {
      const o = overrides[a.id] ?? {};
      return [a.id, o.enabled === false ? 0 : typeof o.xp === "number" ? o.xp : a.xp];
    }),
  ) as Record<ActivityId, number>;
}

/** Kept for places that only need the default list (e.g. server-side counts). */
export const achievements = baseAchievements;

export const levels = [0, 40, 100, 180, 280, 400, 560, 760, 1000, 1300, 1650, 2050];

export function levelFor(xp: number) {
  let level = 1;
  for (let i = 0; i < levels.length; i++) if (xp >= levels[i]) level = i + 1;
  const floor = levels[level - 1] ?? 0;
  const ceil = levels[level] ?? floor;
  const progress = ceil === floor ? 1 : (xp - floor) / (ceil - floor);
  return { level, floor, ceil, progress, max: level === levels.length };
}

export const questSections = ["top", "about", "resume", "skills", "work", "lab", "journey", "play", "videos", "log", "focus", "city", "contact"];
