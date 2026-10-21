// Video branding pipeline: logo card at the start and end, logo watermark in a corner.
// Runs ffmpeg (bundled through ffmpeg-static, or FFMPEG_PATH / system ffmpeg) one job at a time.

import { spawn } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import type { VideoBranding } from "./site";
import { mediaNameFromUrl, mediaUrl } from "./media";
import { getDb, mediaDir, newId, updateDb } from "./store";

function ffmpegBinary(): string | null {
  const candidates = [process.env.FFMPEG_PATH, ffmpegStatic, "/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/opt/homebrew/bin/ffmpeg"];
  for (const c of candidates) if (c && existsSync(/*turbopackIgnore: true*/ c)) return c;
  return null;
}

function run(bin: string, args: string[]): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
    });
    child.on("error", (e) => resolve({ code: -1, stderr: String(e) }));
    child.on("close", (code) => resolve({ code: code ?? -1, stderr }));
  });
}

type Probe = { width: number; height: number; duration: number; audio: boolean };

async function probe(bin: string, file: string): Promise<Probe | null> {
  const { stderr } = await run(bin, ["-hide_banner", "-i", file]);
  const dims = /Stream #\d+:\d+[^\n]*Video:[^\n]*?(\d{2,5})x(\d{2,5})/.exec(stderr);
  if (!dims) return null;
  let width = Number(dims[1]);
  let height = Number(dims[2]);
  const rot = /rotation of (-?\d+(?:\.\d+)?) degrees/.exec(stderr) ?? /rotate\s*:\s*(-?\d+)/.exec(stderr);
  if (rot && Math.abs(Math.round(Number(rot[1]))) % 180 === 90) [width, height] = [height, width];
  const d = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  const duration = d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0;
  return { width, height, duration, audio: /Stream #\d+:\d+[^\n]*Audio:/.test(stderr) };
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

function localFile(url: string) {
  const name = mediaNameFromUrl(url);
  if (!name) return null;
  const full = path.join(mediaDir, name);
  return existsSync(full) ? full : null;
}

async function brand(bin: string, input: string, output: string, branding: VideoBranding, logoUrl: string) {
  const info = await probe(bin, input);
  if (!info) throw new Error("That file doesn't look like a video ffmpeg can read.");

  const W = even(Math.min(1920, info.width));
  const H = even((info.height * W) / info.width);
  const card = localFile(branding.cardUrl) ?? localFile(logoUrl);
  const mark = localFile(branding.markUrl) ?? localFile(logoUrl);
  const T = Math.min(6, Math.max(1, branding.cardSeconds || 2.5));
  const useIntro = branding.intro && card;
  const useOutro = branding.outro && card;
  const useMark = branding.watermark && mark;

  const args = ["-hide_banner", "-y", "-i", input];
  let n = 1;
  const idx: Record<string, number> = {};
  const addInput = (key: string, extra: string[]) => {
    args.push(...extra);
    idx[key] = n++;
  };
  if (useIntro) addInput("intro", ["-loop", "1", "-framerate", "30", "-t", String(T), "-i", card]);
  if (useOutro) addInput("outro", ["-loop", "1", "-framerate", "30", "-t", String(T), "-i", card]);
  if (useMark) addInput("mark", ["-i", mark]);
  if (useIntro) addInput("introA", ["-f", "lavfi", "-t", String(T), "-i", "anullsrc=r=44100:cl=stereo"]);
  if (useOutro) addInput("outroA", ["-f", "lavfi", "-t", String(T), "-i", "anullsrc=r=44100:cl=stereo"]);
  if (!info.audio) addInput("mainA", ["-f", "lavfi", "-t", String(Math.max(0.1, info.duration)), "-i", "anullsrc=r=44100:cl=stereo"]);

  const f: string[] = [];
  f.push(`[0:v]scale=${W}:${H},setsar=1,fps=30,format=yuv420p[base]`);
  if (useMark) {
    const m = Math.round(W * 0.03);
    const pos: Record<VideoBranding["corner"], string> = {
      "top-left": `x=${m}:y=${m}`,
      "top-right": `x=main_w-overlay_w-${m}:y=${m}`,
      "bottom-left": `x=${m}:y=main_h-overlay_h-${m}`,
      "bottom-right": `x=main_w-overlay_w-${m}:y=main_h-overlay_h-${m}`,
    };
    const alpha = Math.min(1, Math.max(0.1, branding.opacity / 100)).toFixed(2);
    f.push(`[${idx.mark}:v]scale=${even(W * 0.13)}:-1,format=rgba,colorchannelmixer=aa=${alpha}[wm]`);
    f.push(`[base][wm]overlay=${pos[branding.corner]}:format=auto,format=yuv420p[mainv]`);
  } else {
    f.push(`[base]null[mainv]`);
  }
  f.push(info.audio ? `[0:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[maina]` : `[${idx.mainA}:a]aformat=sample_fmts=fltp:channel_layouts=stereo[maina]`);

  const cardChain = (key: string, label: string) =>
    `[${idx[key]}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x090b0c,setsar=1,fps=30,format=yuv420p,fade=t=in:st=0:d=0.45,fade=t=out:st=${(T - 0.45).toFixed(2)}:d=0.45[${label}]`;
  const segments: string[] = [];
  if (useIntro) {
    f.push(cardChain("intro", "iv"));
    f.push(`[${idx.introA}:a]aformat=sample_fmts=fltp:channel_layouts=stereo[ia]`);
    segments.push("[iv][ia]");
  }
  segments.push("[mainv][maina]");
  if (useOutro) {
    f.push(cardChain("outro", "ov"));
    f.push(`[${idx.outroA}:a]aformat=sample_fmts=fltp:channel_layouts=stereo[oa]`);
    segments.push("[ov][oa]");
  }
  f.push(`${segments.join("")}concat=n=${segments.length}:v=1:a=1[v][a]`);

  args.push(
    "-filter_complex",
    f.join(";"),
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    output,
  );
  const result = await run(bin, args);
  if (result.code !== 0) {
    const last = result.stderr.trim().split("\n").slice(-3).join(" ").slice(0, 300);
    throw new Error(`ffmpeg failed: ${last}`);
  }
}

let queue: Promise<unknown> = Promise.resolve();

/** Queue a video for branding. Safe to call again to re-brand with new settings. */
export function processVideo(id: string) {
  const job = queue.then(() => runJob(id));
  queue = job.catch(() => undefined);
  return job;
}

async function runJob(id: string) {
  const db = await getDb();
  const video = db.videos.find((v) => v.id === id);
  if (!video) return;
  const input = path.join(mediaDir, video.original);
  const previous = video.file;
  const outName = `video-${newId().replace(/[^a-f0-9]/g, "0")}.mp4`;
  const output = path.join(mediaDir, outName);
  const posterName = `poster-${newId().replace(/[^a-f0-9]/g, "0")}.jpg`;

  await updateDb((d) => {
    const v = d.videos.find((x) => x.id === id);
    if (v) {
      v.status = "processing";
      v.error = "";
    }
  });

  const bin = ffmpegBinary();
  try {
    if (!bin) throw new Error("ffmpeg isn't available on this server, so the video was published without branding.");
    await brand(bin, input, output, db.branding, db.profile.logoUrl);
    const posterAt = (db.branding.intro ? Math.min(6, Math.max(1, db.branding.cardSeconds || 2.5)) : 0) + 1;
    await run(bin, ["-hide_banner", "-y", "-ss", String(posterAt), "-i", output, "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "4", path.join(mediaDir, posterName)]);
    const posterOk = existsSync(path.join(mediaDir, posterName));
    await updateDb((d) => {
      const v = d.videos.find((x) => x.id === id);
      if (!v) return;
      if (v.poster && v.poster !== mediaUrl(posterName)) void fs.rm(path.join(mediaDir, path.basename(v.poster)), { force: true });
      v.file = outName;
      v.poster = posterOk ? mediaUrl(posterName) : "";
      v.status = "ready";
      v.error = "";
    });
    if (previous && previous !== outName && previous !== video.original) await fs.rm(path.join(mediaDir, previous), { force: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await fs.rm(output, { force: true });
    await updateDb((d) => {
      const v = d.videos.find((x) => x.id === id);
      if (!v) return;
      if (!bin) {
        // no ffmpeg: publish the original so the upload isn't wasted
        v.file = v.original.replace(/^raw-/, "video-");
        v.status = "ready";
      } else {
        v.status = "failed";
      }
      v.error = message;
    });
    if (!bin) {
      const pub = path.join(mediaDir, video.original.replace(/^raw-/, "video-"));
      await fs.copyFile(input, pub).catch(() => undefined);
    }
  }
}

export function ffmpegAvailable() {
  return Boolean(ffmpegBinary());
}
