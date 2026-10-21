import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { extFor, mediaUrl, type MediaPrefix } from "@/lib/media";
import { mediaDir, newId, updateDb } from "@/lib/store";
import { processVideo } from "@/lib/video";

// Raw-body uploads (the browser sends the File as the request body), so large videos stream
// straight to disk instead of being buffered in memory.

const kinds = {
  image: { prefix: "img", max: 10 * 1024 * 1024, exts: ["png", "jpg", "webp", "gif"] },
  logo: { prefix: "logo", max: 8 * 1024 * 1024, exts: ["png", "jpg", "webp", "gif"] },
  portrait: { prefix: "portrait", max: 10 * 1024 * 1024, exts: ["png", "jpg", "webp"] },
  card: { prefix: "card", max: 10 * 1024 * 1024, exts: ["png"] },
  mark: { prefix: "mark", max: 4 * 1024 * 1024, exts: ["png"] },
  pdf: { prefix: "doc", max: 40 * 1024 * 1024, exts: ["pdf"] },
  cv: { prefix: "cv", max: 20 * 1024 * 1024, exts: ["pdf"] },
  media: { prefix: "doc", max: 40 * 1024 * 1024, exts: ["png", "jpg", "webp", "gif", "pdf"] },
  video: { prefix: "raw", max: 1024 * 1024 * 1024, exts: ["mp4", "webm", "mov"] },
} satisfies Record<string, { prefix: MediaPrefix; max: number; exts: string[] }>;

type Kind = keyof typeof kinds;

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(request: Request) {
  if (!(await isAdmin())) return json({ error: "Sign in again to upload." }, 401);
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as Kind;
  const spec = kinds[kind];
  if (!spec) return json({ error: "Unknown upload type." }, 400);
  const filename = (url.searchParams.get("name") ?? "").slice(0, 200);
  const ext = extFor(request.headers.get("content-type") ?? "", filename);
  if (!spec.exts.includes(ext)) return json({ error: `Use a ${spec.exts.join(", ").toUpperCase()} file.` }, 415);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > spec.max) return json({ error: `That file is over ${Math.round(spec.max / 1024 / 1024)} MB.` }, 413);
  if (!request.body) return json({ error: "The upload was empty." }, 400);

  const name = `${spec.prefix}-${newId()}.${ext}`;
  await fs.mkdir(mediaDir, { recursive: true });
  const full = path.join(mediaDir, name);
  let bytes = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      bytes += chunk.length;
      if (bytes > spec.max) cb(new Error("too-large"));
      else cb(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(request.body as import("node:stream/web").ReadableStream), limiter, createWriteStream(full));
  } catch (e) {
    await fs.rm(full, { force: true });
    const tooLarge = e instanceof Error && e.message === "too-large";
    return json({ error: tooLarge ? `That file is over ${Math.round(spec.max / 1024 / 1024)} MB.` : "The upload was interrupted. Try again." }, tooLarge ? 413 : 400);
  }
  if (bytes === 0) {
    await fs.rm(full, { force: true });
    return json({ error: "The upload was empty." }, 400);
  }

  if (kind === "logo" || kind === "portrait" || kind === "cv") {
    const field = kind === "logo" ? "logoUrl" : kind === "portrait" ? "portraitUrl" : "cvUrl";
    await updateDb((db) => {
      db.profile[field] = mediaUrl(name);
    });
    revalidatePath("/", "layout");
  }
  if (kind === "card" || kind === "mark") {
    await updateDb((db) => {
      db.branding[kind === "card" ? "cardUrl" : "markUrl"] = mediaUrl(name);
    });
  }

  if (kind === "video") {
    const id = newId();
    const title = (url.searchParams.get("title") ?? "").trim().slice(0, 120) || filename.replace(/\.[^.]+$/, "").slice(0, 120) || "Untitled video";
    await updateDb((db) => {
      db.videos.unshift({
        id,
        title,
        description: "",
        file: "",
        original: name,
        poster: "",
        status: "processing",
        error: "",
        createdAt: new Date().toISOString(),
        visible: false,
        downloadable: true,
        externalUrl: "",
      });
    });
    void processVideo(id).then(() => revalidatePath("/", "layout"));
    revalidatePath("/dashboard/videos");
    return json({ ok: true, id, url: mediaUrl(name) });
  }

  return json({ ok: true, url: mediaUrl(name), name });
}
