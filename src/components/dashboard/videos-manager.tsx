"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowsClockwise,
  CircleNotch,
  DownloadSimple,
  Eye,
  EyeSlash,
  FilmSlate,
  LinkSimple,
  MagicWand,
  PencilSimple,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { deleteVideo, rebrandVideo, saveVideo, toggleVideo } from "@/app/dashboard/actions";
import type { Video, VideoBranding } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ObjectEditor } from "./schema-editor";
import { ActionButton, ActionStatus, Card, EmptyState, Field, Modal, SubmitButton, Switch, inputClass } from "./ui";
import { uploadBlob } from "./upload";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't render the image."))), "image/png"));
}

/** Draws the 1920×1080 logo card and the transparent corner watermark in the browser. */
async function renderBranding(logoUrl: string, name: string, tagline: string) {
  const font = getComputedStyle(document.body).fontFamily;
  const logo = await loadImage(logoUrl);

  const card = document.createElement("canvas");
  card.width = 1920;
  card.height = 1080;
  const c = card.getContext("2d")!;
  c.fillStyle = "#090b0c";
  c.fillRect(0, 0, 1920, 1080);
  const glow = c.createRadialGradient(960, 420, 40, 960, 420, 900);
  glow.addColorStop(0, "rgba(95,214,192,0.22)");
  glow.addColorStop(1, "rgba(95,214,192,0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, 1920, 1080);
  c.strokeStyle = "rgba(214,232,228,0.05)";
  c.lineWidth = 1;
  for (let x = 0; x <= 1920; x += 96) {
    c.beginPath();
    c.moveTo(x + 0.5, 0);
    c.lineTo(x + 0.5, 1080);
    c.stroke();
  }
  for (let y = 0; y <= 1080; y += 96) {
    c.beginPath();
    c.moveTo(0, y + 0.5);
    c.lineTo(1920, y + 0.5);
    c.stroke();
  }
  if (logo) {
    const s = Math.min(380 / logo.width, 380 / logo.height);
    c.drawImage(logo, 960 - (logo.width * s) / 2, 430 - (logo.height * s) / 2, logo.width * s, logo.height * s);
  } else {
    c.fillStyle = "#e8eeec";
    c.beginPath();
    c.arc(960, 430, 150, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#090b0c";
    c.font = `600 170px ${font}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(name.trim()[0] ?? "", 960, 440);
  }
  c.textAlign = "center";
  c.textBaseline = "alphabetic";
  c.fillStyle = "#e8eeec";
  c.font = `600 84px ${font}`;
  c.fillText(name, 960, 760);
  c.fillStyle = "#5fd6c0";
  c.font = `500 30px ${font}`;
  c.fillText(tagline.toUpperCase(), 960, 830);

  const mark = document.createElement("canvas");
  const m = mark.getContext("2d")!;
  if (logo) {
    const s = 420 / Math.max(logo.width, logo.height);
    mark.width = Math.round(logo.width * s);
    mark.height = Math.round(logo.height * s);
    m.drawImage(logo, 0, 0, mark.width, mark.height);
  } else {
    m.font = `600 64px ${font}`;
    const w = Math.ceil(m.measureText(name).width) + 40;
    mark.width = w;
    mark.height = 110;
    m.font = `600 64px ${font}`;
    m.shadowColor = "rgba(0,0,0,0.55)";
    m.shadowBlur = 12;
    m.fillStyle = "#ffffff";
    m.textBaseline = "middle";
    m.fillText(name, 20, 58);
  }
  return { card: await toBlob(card), mark: await toBlob(mark), preview: card.toDataURL("image/jpeg", 0.8) };
}

function BrandingStudio({ branding, logoUrl, name, tagline }: { branding: VideoBranding; logoUrl: string; name: string; tagline: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(branding.cardUrl);

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const out = await renderBranding(logoUrl, name, tagline);
      setPreview(out.preview);
      await uploadBlob(out.card, "card", { name: "card.png" });
      await uploadBlob(out.mark, "mark", { name: "mark.png" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the branding.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-bg">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo card used at the start and end of videos" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center p-6 text-center text-sm text-muted">Generate the card to see it here.</div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={generate} disabled={busy} className="press inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-70">
            {busy ? <CircleNotch size={16} className="animate-spin" /> : <MagicWand size={16} />}
            {branding.cardUrl ? "Regenerate from my logo" : "Generate from my logo"}
          </button>
          {!logoUrl ? <span className="text-xs text-muted">No logo yet: your name is used. Upload a logo on Profile & logo.</span> : null}
          {error ? <span className="text-xs text-ember">{error}</span> : null}
        </div>
      </div>
      <ObjectEditor target="branding" initial={branding} submitLabel="Save branding" />
    </div>
  );
}

function VideoForm({ video, onSaved }: { video: Video | null; onSaved: () => void }) {
  const [state, action, pending] = useActionState(saveVideo, null);
  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);
  return (
    <form action={action} className="grid gap-4">
      {video ? <input type="hidden" name="id" value={video.id} /> : null}
      <Field label="Title" htmlFor="v-title">
        <input id="v-title" name="title" required maxLength={120} defaultValue={video?.title} className={inputClass} />
      </Field>
      <Field label="Description" htmlFor="v-desc">
        <textarea id="v-desc" name="description" rows={3} maxLength={2000} defaultValue={video?.description} className={inputClass + " resize-y"} />
      </Field>
      <Field label="External link" hint={video?.file ? "Optional. If set, the site shows this link instead of the uploaded file." : "YouTube or Vimeo link."} htmlFor="v-ext">
        <input id="v-ext" name="externalUrl" placeholder="https://youtube.com/watch?v=…" defaultValue={video?.externalUrl} className={inputClass} />
      </Field>
      <div className="flex flex-wrap gap-6">
        <Switch name="visible" defaultChecked={video?.visible ?? true} label="Show on the site" />
        <Switch name="downloadable" defaultChecked={video?.downloadable ?? true} label="Visitors can download it" />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
        <ActionStatus state={state} />
        <SubmitButton pending={pending}>{video ? "Save video" : "Add video"}</SubmitButton>
      </div>
    </form>
  );
}

function Uploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <Field label="Title" hint="MP4, WebM or MOV up to 1 GB. It's branded automatically, then you choose when to publish it." htmlFor="up-title">
        <input id="up-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Building the City in 60 seconds" className={inputClass} />
      </Field>
      <div className="grid gap-1">
        <button type="button" onClick={() => input.current?.click()} disabled={progress !== null} className="press inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink disabled:opacity-80">
          {progress !== null ? <CircleNotch size={16} className="animate-spin" /> : <UploadSimple size={16} weight="bold" />}
          {progress !== null ? `Uploading ${Math.round(progress * 100)}%` : "Upload video"}
        </button>
      </div>
      {progress !== null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2 sm:col-span-2">
          <div className="h-full origin-left bg-accent transition-transform duration-200" style={{ transform: `scaleX(${progress})` }} />
        </div>
      ) : null}
      {error ? <p className="text-sm text-ember sm:col-span-2">{error}</p> : null}
      <input
        ref={input}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="sr-only"
        tabIndex={-1}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setError("");
          setProgress(0);
          try {
            await uploadBlob(file, "video", { title, onProgress: setProgress });
            setTitle("");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
          } finally {
            setProgress(null);
          }
        }}
      />
    </div>
  );
}

const statusStyle: Record<Video["status"], string> = {
  processing: "bg-[#f6c177]/15 text-[#f6c177]",
  ready: "bg-accent/15 text-accent",
  failed: "bg-ember/15 text-ember",
};

export function VideosManager({
  videos,
  branding,
  logoUrl,
  name,
  tagline,
  ffmpeg,
}: {
  videos: Video[];
  branding: VideoBranding;
  logoUrl: string;
  name: string;
  tagline: string;
  ffmpeg: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Video | "new" | null>(null);
  const processing = videos.some((v) => v.status === "processing");

  // keep the list fresh while ffmpeg works
  useEffect(() => {
    if (!processing) return;
    const t = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(t);
  }, [processing, router]);

  return (
    <div className="grid gap-4">
      {!ffmpeg ? (
        <p className="flex items-start gap-2 rounded-2xl border border-ember/30 bg-ember/10 p-4 text-sm text-fg/85">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-ember" />
          ffmpeg isn&apos;t available on this server, so uploads are published without the logo card and watermark. It installs automatically with npm on most hosts; set FFMPEG_PATH if yours needs it.
        </p>
      ) : null}
      <Card title="Upload a video">
        <Uploader />
      </Card>
      <Card
        title="Your videos"
        description="New uploads start hidden. Publish them with the eye once they're ready."
        actions={
          <button type="button" onClick={() => setEditing("new")} className="press inline-flex h-9 items-center gap-2 rounded-full border border-line-strong px-3.5 text-sm hover:border-fg/30">
            <LinkSimple size={15} /> Add a YouTube link
          </button>
        }
      >
        {videos.length === 0 ? (
          <EmptyState icon={<FilmSlate size={22} />} title="No videos yet" body="Upload your first video. Your logo is added at the start and end, with a watermark in the corner." />
        ) : (
          <ul className="grid gap-3">
            {videos.map((v) => (
              <li key={v.id} className={cn("flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-bg/40 p-3 md:flex-nowrap", !v.visible && "opacity-75")}>
                <div className="grid aspect-video w-36 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
                  {v.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.poster} alt="" className="size-full object-cover" />
                  ) : v.status === "processing" ? (
                    <CircleNotch size={20} className="animate-spin text-muted" />
                  ) : (
                    <FilmSlate size={20} className="text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{v.title}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", statusStyle[v.status])}>{v.status === "processing" ? "Branding…" : v.status}</span>
                    {!v.visible ? <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">Hidden</span> : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {v.createdAt.slice(0, 10)}
                    {v.externalUrl ? " · external link" : ""}
                  </p>
                  {v.error ? <p className="mt-1 text-xs text-ember">{v.error}</p> : null}
                </div>
                <div className="flex items-center gap-0.5">
                  <ActionButton action={toggleVideo.bind(null, v.id, "visible")} label={v.visible ? "Hide from site" : "Publish"}>
                    {v.visible ? <Eye size={16} /> : <EyeSlash size={16} />}
                  </ActionButton>
                  {v.file && v.status === "ready" ? (
                    <a href={`/api/media/${v.file}?download=${encodeURIComponent(v.title)}`} aria-label="Download" title="Download" className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
                      <DownloadSimple size={16} />
                    </a>
                  ) : null}
                  {v.original ? (
                    <ActionButton action={rebrandVideo.bind(null, v.id)} label="Re-brand with current settings">
                      <ArrowsClockwise size={16} />
                    </ActionButton>
                  ) : null}
                  <ActionButton action={async () => setEditing(v)} label="Edit">
                    <PencilSimple size={16} />
                  </ActionButton>
                  <ActionButton action={deleteVideo.bind(null, v.id)} label="Delete" confirm="Delete?">
                    <Trash size={16} />
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Branding" description="The logo card is shown at the start and end; the watermark sits in the corner throughout. Re-brand old videos after changing these.">
        <BrandingStudio branding={branding} logoUrl={logoUrl} name={name} tagline={tagline} />
      </Card>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a video link" : "Edit video"}>
        {editing !== null ? <VideoForm key={editing === "new" ? "new" : editing.id} video={editing === "new" ? null : editing} onSaved={() => setEditing(null)} /> : null}
      </Modal>
    </div>
  );
}
