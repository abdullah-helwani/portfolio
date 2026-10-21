import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { mediaNamePattern, mediaTypes } from "@/lib/media";
import { mediaDir } from "@/lib/store";

export async function GET(request: Request, ctx: RouteContext<"/api/media/[file]">) {
  const { file } = await ctx.params;
  const match = mediaNamePattern.exec(file);
  if (!match || match[1] === "raw") return new Response("Not found", { status: 404 });
  const ext = match[2];
  const full = path.join(mediaDir, file);
  let size: number;
  try {
    size = (await fs.stat(full)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get("download");
  const headers: Record<string, string> = {
    "Content-Type": mediaTypes[ext],
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  if (["png", "jpg", "webp", "gif"].includes(ext)) headers["Content-Security-Policy"] = "default-src 'none'; sandbox";
  if (download) {
    const safe = download.replace(/[^\w .-]/g, "").slice(0, 80) || file;
    headers["Content-Disposition"] = `attachment; filename="${safe}.${ext}"`;
  }

  // Range requests let browsers seek inside videos without downloading them whole.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const stream = Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
