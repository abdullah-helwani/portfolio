// Tiny JSON-file store. Good for local use and any host with a writable disk.
// To deploy on a read-only host (e.g. Vercel), swap readDb/writeDb for a database.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { defaultContent, type Content, type Message } from "./site";

export type Db = Content & {
  messages: Message[];
  views: Record<string, number>; // "YYYY-MM-DD" -> count
};

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");
export const mediaDir = path.join(dataDir, "uploads");

function seed(): Db {
  return {
    ...structuredClone(defaultContent),
    messages: [],
    views: {},
  };
}

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(dbFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<Db>;
    const base = seed();
    return {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...parsed.profile },
      skills: parsed.skills ?? base.skills,
      posts: parsed.posts ?? base.posts,
    };
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
  };
}

export function newId() {
  return randomUUID().slice(0, 8);
}

export function today(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
