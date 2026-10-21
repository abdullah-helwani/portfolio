import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicVideos } from "@/components/sections/videos";
import { VideoPlayer } from "@/components/videos/player";
import { getContent } from "@/lib/store";

export const metadata: Metadata = { title: "Videos" };

export default async function VideosPage() {
  const { videos } = await getContent();
  const list = publicVideos(videos);
  if (!list.length) notFound();
  return (
    <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-36 md:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span className="text-accent">{String(list.length).padStart(2, "0")}</span> / Videos
      </p>
      <h1 className="mt-6 text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">Watch me build</h1>
      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {list.map((v) => (
          <VideoPlayer key={v.id} video={v} />
        ))}
      </div>
    </main>
  );
}
