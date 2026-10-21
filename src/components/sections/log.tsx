import Link from "next/link";
import { ArrowRight, ArrowUpRight, PushPin } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/animations/reveal";
import { formatDate, statusMeta } from "@/components/log/status";
import { postStatuses, type Post } from "@/lib/site";
import { SectionHeader, type SectionProps } from "./section-header";

export function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));
}

export function Log({ posts, section, index }: { posts: Post[] } & SectionProps) {
  const published = sortPosts(posts.filter((p) => p.published));
  return (
    <section id="log" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <SectionHeader
        section={section}
        index={index}
        aside={
          <Link href="/log" className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
            Read the full log
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {postStatuses.map((status, col) => {
          const meta = statusMeta[status];
          const items = published.filter((p) => p.status === status).slice(0, 3);
          return (
            <Reveal key={status} delay={col * 0.1} className="flex flex-col rounded-[1.75rem] border border-line bg-surface/60 p-3">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className={`size-2 rounded-full ${meta.dot}`} />
                  {meta.column}
                </p>
                <span className="font-mono text-xs text-muted">{items.length}</span>
              </div>
              <div className="mt-1 flex flex-1 flex-col gap-3">
                {items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                    Nothing here yet.
                  </p>
                ) : null}
                {items.map((post, i) => (
                  <Reveal key={post.id} delay={col * 0.1 + 0.15 + i * 0.08}>
                    <Link
                      href={`/log/${post.slug}`}
                      className="group block rounded-2xl border border-line bg-bg p-5 transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-line-strong"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">{formatDate(post.date)}</span>
                        {post.pinned ? <PushPin size={14} weight="fill" className="text-ember" aria-label="Pinned" /> : null}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{post.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{post.summary}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs text-accent opacity-70 transition-opacity group-hover:opacity-100">
                        Read
                        <ArrowUpRight size={12} />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
