import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { dataPath } from "@/lib/store";

// Anonymous visitor progress. A random id lives in an httpOnly first-party cookie (set by the
// server, so browsers keep it far longer than script-written storage); the progress itself is
// one small JSON file per visitor. No account, no personal data.

const COOKIE = "ah_vid";
const MAX_AGE = 60 * 60 * 24 * 400;
const dir = dataPath("progress");

async function visitorId(create: boolean) {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
  if (!create) return null;
  const id = randomBytes(16).toString("hex");
  store.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
  return id;
}

export async function GET() {
  const id = await visitorId(true);
  try {
    const raw = await fs.readFile(path.join(dir, `${id}.json`), "utf8");
    return new Response(raw, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({}, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const id = await visitorId(true);
  const text = await request.text();
  if (text.length > 64_000) return Response.json({ error: "Too large" }, { status: 413 });
  let body: { progress?: unknown; keys?: Record<string, unknown> };
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Bad JSON" }, { status: 400 });
  }
  if (!body || typeof body.progress !== "object") return Response.json({ error: "Missing progress" }, { status: 400 });
  const keys: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.keys ?? {})) if (/^ah-[\w-]{1,30}$/.test(k) && typeof v === "string") keys[k] = v.slice(0, 12_000);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${id}.json`), JSON.stringify({ progress: body.progress, keys, updatedAt: new Date().toISOString() }), "utf8");
  return Response.json({ ok: true });
}
