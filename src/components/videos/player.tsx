"use client";

import { useRef, useState } from "react";
import { DownloadSimple, Play } from "@phosphor-icons/react/dist/ssr";
import { useGameOptional } from "@/components/game/game-provider";
import type { Video } from "@/lib/site";
import { cn } from "@/lib/utils";

export function embedFor(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {}
  return null;
}

/** Plays an uploaded (branded) video or a YouTube/Vimeo link, with a download button for uploads. */
export function VideoPlayer({ video, className, autoPlay }: { video: Video; className?: string; autoPlay?: boolean }) {
  const game = useGameOptional();
  const [started, setStarted] = useState(Boolean(autoPlay));
  const ref = useRef<HTMLVideoElement>(null);
  const embed = video.externalUrl ? embedFor(video.externalUrl) : null;
  const src = video.file ? `/api/media/${video.file}` : "";

  const watched = () => {
    game?.unlock("cinephile");
  };

  return (
    <div className={cn("overflow-hidden rounded-[1.6rem] border border-line-strong bg-bg", className)}>
      <div className="relative aspect-video">
        {embed ? (
          started ? (
            <iframe src={`${embed}?autoplay=1`} title={video.title} className="size-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : (
            <button type="button" onClick={() => {
                setStarted(true);
                watched();
              }} className="group absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,#1d3b37,#090b0c)]">
              <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-ink transition-transform duration-200 group-hover:scale-105">
                <Play size={26} weight="fill" />
              </span>
            </button>
          )
        ) : src ? (
          <video
            ref={ref}
            src={src}
            poster={video.poster || undefined}
            controls
            playsInline
            preload="metadata"
            className="size-full bg-black object-contain"
            onPlay={watched}
            onEnded={() => game?.activity("xp-video")}
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted">This video is still being prepared.</div>
        )}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight">{video.title}</h3>
          {video.description ? <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted">{video.description}</p> : null}
        </div>
        {src && video.downloadable && !embed ? (
          <a href={`${src}?download=${encodeURIComponent(video.title)}`} className="press inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong px-4 text-sm hover:border-fg/30">
            <DownloadSimple size={16} /> Download
          </a>
        ) : null}
      </div>
    </div>
  );
}
