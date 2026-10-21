import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/animations/reveal";
import { VideoPlayer } from "@/components/videos/player";
import type { Video } from "@/lib/site";
import { SectionHeader, type SectionProps } from "./section-header";

export function publicVideos(videos: Video[]) {
  return videos.filter((v) => v.visible && (v.externalUrl || (v.file && v.status === "ready")));
}

export function Videos({ videos, section, index }: { videos: Video[] } & SectionProps) {
  const list = publicVideos(videos);
  if (!list.length) return null;
  const [first, ...rest] = list;
  return (
    <section id="videos" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <SectionHeader
        section={section}
        index={index}
        aside={
          list.length > 3 ? (
            <Link href="/videos" className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
              All {list.length} videos <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          ) : null
        }
      />
      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-8">
          <VideoPlayer video={first} />
        </Reveal>
        <div className="grid content-start gap-4 lg:col-span-4">
          {rest.slice(0, 2).map((v, i) => (
            <Reveal key={v.id} delay={0.08 * (i + 1)}>
              <VideoPlayer video={v} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
