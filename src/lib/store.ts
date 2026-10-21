// Tiny JSON-file store. Good for local use and any host with a writable disk.
// To deploy on a read-only host (e.g. Vercel), swap readDb/writeDb for a database.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { defaultContent, defaultSections, emptyProject, type Content, type Message, type SectionConfig } from "./site";

export type Score = { id: string; game: string; name: string; score: number; createdAt: string };

export type Db = Content & {
  messages: Message[];
  views: Record<string, number>; // "YYYY-MM-DD" -> count
  scores: Score[];
};

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");
export const mediaDir = path.join(dataDir, "uploads");
export const dataPath = (name: string) => path.join(dataDir, name);

function seed(): Db {
  return {
    ...structuredClone(defaultContent),
    messages: [],
    views: {},
    scores: [],
  };
}

function mergeSections(saved: SectionConfig[] | undefined): SectionConfig[] {
  if (!Array.isArray(saved)) return structuredClone(defaultSections);
  const known = new Map(defaultSections.map((s) => [s.id, s]));
  const out: SectionConfig[] = [];
  for (const s of saved) {
    const base = known.get(s.id);
    if (!base || out.some((o) => o.id === s.id)) continue;
    out.push({ ...base, ...s });
  }
  // sections added in later versions slot in where the defaults put them
  defaultSections.forEach((s, i) => {
    if (out.some((o) => o.id === s.id)) return;
    const before = defaultSections[i - 1];
    const at = before ? out.findIndex((o) => o.id === before.id) + 1 : 0;
    out.splice(at, 0, structuredClone(s));
  });
  return out;
}

/** Fill in anything a saved file from an older version doesn't have yet. */
function normalize(parsed: Partial<Db>): Db {
  const base = seed();
  const city = parsed.city;
  return {
    ...base,
    ...parsed,
    profile: { ...base.profile, ...parsed.profile },
    projects: (parsed.projects ?? base.projects).map((p) => ({ ...emptyProject, ...p })),
    skills: parsed.skills ?? base.skills,
    posts: parsed.posts ?? base.posts,
    resume: { ...base.resume, ...parsed.resume },
    sections: mergeSections(parsed.sections),
    copy: { ...base.copy, ...parsed.copy },
    card: { ...base.card, ...parsed.card },
    city: {
      ...base.city,
      ...city,
      guide: { ...base.city.guide, ...city?.guide },
      places: city?.places ?? base.city.places,
    },
    demos: (parsed.demos ?? base.demos).map((d) => ({ ...base.demos[0], ...d })),
    videos: parsed.videos ?? [],
    branding: { ...base.branding, ...parsed.branding },
    game: {
      achievements: { ...parsed.game?.achievements },
      rewards: parsed.game?.rewards ?? base.game.rewards,
    },
    messages: parsed.messages ?? [],
    views: parsed.views ?? {},
    scores: parsed.scores ?? [],
  };
}

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(dbFile, "utf8");
    return normalize(JSON.parse(raw) as Partial<Db>);
  } catch {
    return seed();
  }
}

async function writeDb(db: Db) {
  await fs.mkdir(dataDir, { recursive: true });
  const tmp = `${dbFile}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, dbFile);
}

// Serialize writes inside this process so concurrent requests don't clobber each other.
let queue: Promise<unknown> = Promise.resolve();

export function getDb() {
  return readDb();
}

export function updateDb<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Public content. Secrets (demo API tokens) never leave the server. */
export async function getContent(): Promise<Content> {
  const db = await readDb();
  return {
    profile: db.profile,
    projects: db.projects,
    stack: db.stack,
    focus: db.focus,
    journey: db.journey,
    skills: db.skills,
    posts: db.posts,
    resume: db.resume,
    sections: db.sections,
    copy: db.copy,
    card: db.card,
    city: db.city,
    demos: db.demos.map((d) => ({ ...d, token: d.token ? "set" : "" })),
    videos: db.videos,
    branding: db.branding,
    game: db.game,
  };
}

export function newId() {
  return randomUUID().slice(0, 8);
}

export function today(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
