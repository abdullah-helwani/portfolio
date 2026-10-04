import { promises as fs } from "node:fs";
import path from "node:path";
import { mediaDir } from "@/lib/store";

const types: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

export async function GET(_request: Request, ctx: RouteContext<"/api/media/[file]">) {
  const { file } = await ctx.params;
  const match = /^(logo|cv)-[a-f0-9]{8}\.(png|jpg|webp|gif|pdf)$/.exec(file);
  if (!match) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(mediaDir, file));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": types[match[2]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        ...(match[2] === "pdf" ? {} : { "Content-Security-Policy": "default-src 'none'; sandbox" }),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
