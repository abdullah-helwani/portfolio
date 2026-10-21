"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authConfigured, createSession, destroySession, isAdmin, passwordMatches } from "@/lib/auth";
import {
  postStatuses,
  projectVisuals,
  sectionIds,
  skillIcons,
  type Post,
  type PostStatus,
  type Project,
  type ProjectVisual,
  type SkillClass,
  type SkillIcon,
} from "@/lib/site";
import { schemas, safeUrl, sanitizeList, sanitizeObject, type ListSchema } from "@/lib/schemas";
import { mediaDir, newId, updateDb } from "@/lib/store";

export type ActionResult = { ok: boolean; message: string; at?: number };

const ok = (message: string): ActionResult => ({ ok: true, message, at: Date.now() });
const fail = (message: string): ActionResult => ({ ok: false, message, at: Date.now() });

async function guard() {
  if (!(await isAdmin())) redirect("/dashboard/login");
}

function refresh() {
  revalidatePath("/", "layout");
}

// ---------- helpers ----------

function str(fd: FormData, key: string, max = 500) {
  return String(fd.get(key) ?? "")
    .trim()
    .slice(0, max);
}

function bool(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function list(value: string, max = 30) {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function lines(value: string, max = 30) {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

// ---------- auth ----------

export async function login(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!authConfigured()) return fail("The dashboard is locked. Set ADMIN_PASSWORD in .env.local and restart the server.");
  const password = String(fd.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return fail("That password didn't work. Check caps lock and try again.");
  }
  await createSession();
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/dashboard/login");
}

// ---------- messages ----------

export async function setMessageRead(id: string, read: boolean) {
  await guard();
  await updateDb((db) => {
    const m = db.messages.find((x) => x.id === id);
    if (m) m.read = read;
  });
  revalidatePath("/dashboard", "layout");
}

export async function setMessageArchived(id: string, archived: boolean) {
  await guard();
  await updateDb((db) => {
    const m = db.messages.find((x) => x.id === id);
    if (m) {
      m.archived = archived;
      m.read = true;
    }
  });
  revalidatePath("/dashboard", "layout");
}

export async function deleteMessage(id: string) {
  await guard();
  await updateDb((db) => {
    db.messages = db.messages.filter((x) => x.id !== id);
  });
  revalidatePath("/dashboard", "layout");
}

export async function markAllRead() {
  await guard();
  await updateDb((db) => {
    db.messages.forEach((m) => (m.read = true));
  });
  revalidatePath("/dashboard", "layout");
}

// ---------- projects ----------

export async function saveProject(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const title = str(fd, "title", 80);
  if (!title) return fail("Give the project a title.");
  const href = safeUrl(str(fd, "href", 300));
  if (str(fd, "href") && !href) return fail("The link must start with https://");
  const visual = str(fd, "visual") as ProjectVisual;
  const urls: Record<"liveUrl" | "presentationUrl" | "coverUrl" | "videoUrl", string> = { liveUrl: "", presentationUrl: "", coverUrl: "", videoUrl: "" };
  for (const key of Object.keys(urls) as (keyof typeof urls)[]) {
    const raw = str(fd, key, 600);
    urls[key] = safeUrl(raw);
    if (raw && !urls[key]) return fail("Links must start with https:// (or be an uploaded file).");
  }
  const data: Omit<Project, "id"> = {
    title,
    kicker: str(fd, "kicker", 80),
    description: str(fd, "description", 600),
    details: str(fd, "details", 12000),
    highlights: lines(str(fd, "highlights", 2000), 12),
    role: str(fd, "role", 120),
    tags: list(str(fd, "tags", 300), 10),
    href,
    ...urls,
    demoId: str(fd, "demoId", 40),
    year: str(fd, "year", 10),
    featured: bool(fd, "featured"),
    visible: bool(fd, "visible"),
    visual: projectVisuals.includes(visual) ? visual : "none",
  };
  const id = str(fd, "id", 40);
  await updateDb((db) => {
    if (data.featured) db.projects.forEach((p) => (p.featured = false));
    const existing = db.projects.find((p) => p.id === id);
    if (existing) Object.assign(existing, data);
    else db.projects.unshift({ id: slugify(title) || newId(), ...data });
    // keep ids unique
    const seen = new Set<string>();
    db.projects.forEach((p) => {
      while (seen.has(p.id)) p.id = `${p.id}-${newId().slice(0, 3)}`;
      seen.add(p.id);
    });
  });
  refresh();
  return ok(id ? "Project updated." : "Project added.");
}

export async function deleteProject(id: string) {
  await guard();
  await updateDb((db) => {
    db.projects = db.projects.filter((p) => p.id !== id);
  });
  refresh();
}

export async function moveProject(id: string, dir: -1 | 1) {
  await guard();
  await updateDb((db) => {
    const i = db.projects.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= db.projects.length) return;
    [db.projects[i], db.projects[j]] = [db.projects[j], db.projects[i]];
  });
  refresh();
}

export async function toggleProject(id: string, field: "visible" | "featured") {
  await guard();
  await updateDb((db) => {
    const p = db.projects.find((x) => x.id === id);
    if (!p) return;
    const next = !p[field];
    if (field === "featured" && next) db.projects.forEach((x) => (x.featured = false));
    p[field] = next;
  });
  refresh();
}

// ---------- posts ----------

export async function savePost(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const title = str(fd, "title", 120);
  if (!title) return fail("Give the entry a title.");
  const status = str(fd, "status") as PostStatus;
  const date = str(fd, "date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Pick a date for the entry.");
  const link = safeUrl(str(fd, "link", 300));
  if (str(fd, "link") && !link) return fail("The link must start with https://");
  const id = str(fd, "id", 40);
  let slug = slugify(str(fd, "slug", 80) || title);
  if (!slug) slug = newId();

  const data: Omit<Post, "id" | "slug"> = {
    title,
    status: postStatuses.includes(status) ? status : "shipped",
    date,
    summary: str(fd, "summary", 300),
    body: str(fd, "body", 20000),
    tags: list(str(fd, "tags", 300), 8),
    link,
    published: bool(fd, "published"),
    pinned: bool(fd, "pinned"),
  };

  const conflict = await updateDb((db) => {
    if (db.posts.some((p) => p.slug === slug && p.id !== id)) return true;
    const existing = db.posts.find((p) => p.id === id);
    if (existing) Object.assign(existing, data, { slug });
    else db.posts.unshift({ id: newId(), slug, ...data });
    return false;
  });
  if (conflict) return fail(`Another entry already uses the address /log/${slug}. Change the slug.`);
  refresh();
  return ok(id ? "Entry updated." : data.published ? "Entry published." : "Draft saved.");
}

export async function deletePost(id: string) {
  await guard();
  await updateDb((db) => {
    db.posts = db.posts.filter((p) => p.id !== id);
  });
  refresh();
}

export async function togglePost(id: string, field: "published" | "pinned") {
  await guard();
  await updateDb((db) => {
    const p = db.posts.find((x) => x.id === id);
    if (p) p[field] = !p[field];
  });
  refresh();
}

// ---------- skills ----------

export async function saveSkills(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("skills") ?? "[]"));
  } catch {
    return fail("The skills data couldn't be read. Reload the page and try again.");
  }
  if (!Array.isArray(raw)) return fail("The skills data couldn't be read.");
  const classes: SkillClass[] = raw.slice(0, 12).map((c: Partial<SkillClass>) => ({
    id: slugify(String(c.id || c.name || "")) || newId(),
    name: String(c.name ?? "").trim().slice(0, 40) || "Untitled class",
    level: clamp(Math.round(Number(c.level)), 1, 10),
    xp: clamp(Math.round(Number(c.xp)), 0, 100),
    blurb: String(c.blurb ?? "").trim().slice(0, 240),
    icon: skillIcons.includes(c.icon as SkillIcon) ? (c.icon as SkillIcon) : "code",
    skills: (Array.isArray(c.skills) ? c.skills : [])
      .slice(0, 16)
      .map((s) => ({ name: String(s?.name ?? "").trim().slice(0, 40), level: clamp(Math.round(Number(s?.level)), 1, 5) }))
      .filter((s) => s.name),
  }));
  await updateDb((db) => {
    db.skills = classes;
  });
  refresh();
  return ok("Skills saved.");
}

// ---------- tools list ----------

export async function saveStack(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const stack = list(str(fd, "stack", 2000), 40);
  await updateDb((db) => {
    db.stack = stack;
  });
  refresh();
  return ok("Toolbox saved.");
}

// ---------- profile ----------

export async function saveProfile(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const firstName = str(fd, "firstName", 40);
  const lastName = str(fd, "lastName", 40);
  if (!firstName) return fail("First name can't be empty.");
  const email = str(fd, "email", 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("That email address doesn't look right.");

  const links = ["github", "linkedin", "url", "website", "x", "cvUrl", "logoUrl", "portraitUrl"] as const;
  const cleaned: Record<string, string> = {};
  for (const key of links) {
    const value = str(fd, key, 300);
    const safe = safeUrl(value);
    if (value && !safe) return fail(`The ${key} link must start with https://`);
    cleaned[key] = safe;
  }
  const githubHandle = cleaned.github ? cleaned.github.replace(/\/$/, "").split("/").pop() ?? "" : "";

  await updateDb((db) => {
    db.profile = {
      ...db.profile,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      role: str(fd, "role", 80),
      tagline: str(fd, "tagline", 120),
      roles: list(str(fd, "roles", 400), 8),
      intro: str(fd, "intro", 400),
      about: str(fd, "about", 1500),
      status: str(fd, "status", 80),
      available: bool(fd, "available"),
      location: str(fd, "location", 80),
      phone: str(fd, "phone", 40),
      email,
      github: cleaned.github,
      githubHandle,
      linkedin: cleaned.linkedin,
      url: cleaned.url,
      website: cleaned.website,
      x: cleaned.x,
      cvUrl: cleaned.cvUrl,
      logoUrl: cleaned.logoUrl,
      portraitUrl: cleaned.portraitUrl,
    };
  });
  refresh();
  return ok("Profile saved.");
}

export async function setAvailability(available: boolean) {
  await guard();
  await updateDb((db) => {
    db.profile.available = available;
    if (available && /heads down/i.test(db.profile.status)) db.profile.status = "Open to work & collaborations";
  });
  refresh();
}

const uploadTypes: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export async function uploadFile(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const target = str(fd, "target");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Choose a file first.");
  const ext = uploadTypes[file.type];
  if (!ext) return fail("Use a PNG, JPG, WebP or GIF image (or a PDF for your CV).");
  if (target === "logoUrl" && ext === "pdf") return fail("A logo needs to be an image, not a PDF.");
  if (target === "cvUrl" && ext !== "pdf") return fail("Upload your CV as a PDF.");
  if (file.size > 4 * 1024 * 1024) return fail("That file is over 4 MB. Export a smaller version.");

  const name = `${target === "cvUrl" ? "cv" : "logo"}-${newId()}.${ext}`;
  await fs.mkdir(mediaDir, { recursive: true });
  await fs.writeFile(path.join(mediaDir, name), Buffer.from(await file.arrayBuffer()));
  const url = `/api/media/${name}`;
  await updateDb((db) => {
    if (target === "cvUrl") db.profile.cvUrl = url;
    else db.profile.logoUrl = url;
  });
  refresh();
  return ok(target === "cvUrl" ? "CV uploaded." : "Logo uploaded.");
}

export async function clearFile(target: "logoUrl" | "cvUrl" | "portraitUrl") {
  await guard();
  await updateDb((db) => {
    db.profile[target] = "";
  });
  refresh();
}

// ---------- schema-driven editors ----------

type ListTarget = "experience" | "education" | "certifications" | "courses" | "languages" | "journey" | "focus" | "places" | "demos" | "rewards";
type ObjectTarget = "copy" | "card" | "guide" | "citySettings" | "branding" | "resumeMeta";

function parseJson(fd: FormData): unknown {
  try {
    return JSON.parse(String(fd.get("json") ?? "null"));
  } catch {
    return undefined;
  }
}

export async function saveList(target: ListTarget, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const raw = parseJson(fd);
  if (!Array.isArray(raw)) return fail("That couldn't be read. Reload the page and try again.");
  const schema = schemas[target] as ListSchema;
  const items = sanitizeList(schema, raw, newId);
  await updateDb((db) => {
    switch (target) {
      case "experience":
      case "education":
      case "certifications":
      case "courses":
      case "languages":
        (db.resume as Record<string, unknown>)[target] = items;
        break;
      case "journey":
        db.journey = items.map((m) => ({ date: String(m.date), title: String(m.title), body: String(m.body) })).filter((m) => m.title);
        break;
      case "focus":
        db.focus = items.map((f) => ({ title: String(f.title), body: String(f.body) })).filter((f) => f.title);
        break;
      case "places":
        db.city.places = items as unknown as typeof db.city.places;
        break;
      case "rewards":
        db.game.rewards = items as unknown as typeof db.game.rewards;
        break;
      case "demos": {
        // "set" means "keep the saved token"; the real value never reaches the browser
        const previous = new Map(db.demos.map((d) => [d.id, d.token]));
        db.demos = (items as unknown as typeof db.demos).map((d, i) => {
          const sent = String((raw[i] as Record<string, unknown>)?.token ?? "");
          return { ...d, token: sent === "set" ? (previous.get(d.id) ?? "") : sent.slice(0, 400) };
        });
        break;
      }
    }
  });
  refresh();
  return ok("Saved.");
}

export async function saveObject(target: ObjectTarget, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const raw = parseJson(fd);
  if (!raw || typeof raw !== "object") return fail("That couldn't be read. Reload the page and try again.");
  const clean = sanitizeObject(schemas[target].fields, raw);
  await updateDb((db) => {
    switch (target) {
      case "copy":
        Object.assign(db.copy, clean);
        break;
      case "card":
        Object.assign(db.card, clean);
        break;
      case "guide":
        Object.assign(db.city.guide, clean);
        break;
      case "citySettings":
        Object.assign(db.city, clean);
        break;
      case "branding":
        Object.assign(db.branding, clean);
        break;
      case "resumeMeta":
        Object.assign(db.resume, clean);
        break;
    }
  });
  refresh();
  return ok("Saved.");
}

export async function setCardEnabled(enabled: boolean) {
  await guard();
  await updateDb((db) => {
    db.card.enabled = enabled;
  });
  refresh();
}

// ---------- page sections ----------

export async function saveSections(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const raw = parseJson(fd);
  if (!Array.isArray(raw)) return fail("That couldn't be read. Reload the page and try again.");
  const seen = new Set<string>();
  const sections = raw
    .map((r: Record<string, unknown>) => ({
      id: String(r?.id ?? "") as (typeof sectionIds)[number],
      visible: r?.visible === true,
      kicker: String(r?.kicker ?? "").trim().slice(0, 60),
      title: String(r?.title ?? "").trim().slice(0, 160),
      intro: String(r?.intro ?? "").trim().slice(0, 600),
    }))
    .filter((r) => sectionIds.includes(r.id) && !seen.has(r.id) && seen.add(r.id));
  await updateDb((db) => {
    db.sections = sections;
  });
  refresh();
  return ok("Sections saved.");
}

// ---------- achievements ----------

export async function saveAchievements(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const raw = parseJson(fd);
  if (!raw || typeof raw !== "object") return fail("That couldn't be read.");
  const out: Record<string, { title: string; hint: string; xp: number; enabled: boolean }> = {};
  for (const [id, v] of Object.entries(raw as Record<string, Record<string, unknown>>).slice(0, 60)) {
    if (!/^[\w-]{1,40}$/.test(id)) continue;
    out[id] = {
      title: String(v?.title ?? "").trim().slice(0, 60),
      hint: String(v?.hint ?? "").trim().slice(0, 160),
      xp: clamp(Math.round(Number(v?.xp)), 0, 1000),
      enabled: v?.enabled !== false,
    };
  }
  await updateDb((db) => {
    db.game.achievements = out;
  });
  refresh();
  return ok("Points saved.");
}

// ---------- videos ----------

export async function saveVideo(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await guard();
  const id = str(fd, "id", 40);
  const externalRaw = str(fd, "externalUrl", 600);
  const externalUrl = safeUrl(externalRaw);
  if (externalRaw && !externalUrl) return fail("The link must start with https://");
  const title = str(fd, "title", 120);
  if (!title) return fail("Give the video a title.");
  await updateDb((db) => {
    const v = db.videos.find((x) => x.id === id);
    const data = { title, description: str(fd, "description", 2000), visible: bool(fd, "visible"), downloadable: bool(fd, "downloadable"), externalUrl };
    if (v) Object.assign(v, data);
    else
      db.videos.unshift({ id: newId(), file: "", original: "", poster: "", status: "ready", error: "", createdAt: new Date().toISOString(), ...data });
  });
  refresh();
  return ok(id ? "Video updated." : "Video added.");
}

export async function deleteVideo(id: string) {
  await guard();
  const removed = await updateDb((db) => {
    const v = db.videos.find((x) => x.id === id);
    db.videos = db.videos.filter((x) => x.id !== id);
    return v;
  });
  if (removed) {
    for (const name of [removed.file, removed.original, removed.poster.replace("/api/media/", "")]) {
      if (/^[\w.-]+$/.test(name)) await fs.rm(path.join(mediaDir, name), { force: true });
    }
  }
  refresh();
}

export async function toggleVideo(id: string, field: "visible" | "downloadable") {
  await guard();
  await updateDb((db) => {
    const v = db.videos.find((x) => x.id === id);
    if (v) v[field] = !v[field];
  });
  refresh();
}

export async function rebrandVideo(id: string) {
  await guard();
  const { processVideo } = await import("@/lib/video");
  const exists = await updateDb((db) => {
    const v = db.videos.find((x) => x.id === id);
    if (v && v.original) {
      v.status = "processing";
      v.error = "";
      return true;
    }
    return false;
  });
  if (exists) void processVideo(id).then(() => refresh());
  revalidatePath("/dashboard/videos");
}

// ---------- leaderboard ----------

export async function deleteScore(id: string) {
  await guard();
  await updateDb((db) => {
    db.scores = db.scores.filter((s) => s.id !== id);
  });
  refresh();
}

export async function clearScores(game: string) {
  await guard();
  await updateDb((db) => {
    db.scores = db.scores.filter((s) => s.game !== game);
  });
  refresh();
}
