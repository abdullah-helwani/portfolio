"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, PushPin } from "@phosphor-icons/react/dist/ssr";
import { formatDate, StatusPill, statusMeta } from "@/components/log/status";
import { postStatuses, type Post, type PostStatus } from "@/lib/site";
import { cn, easeOut } from "@/lib/utils";

export function LogFeed({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const shown = filter === "all" ? posts : posts.filter((p) => p.status === filter);
  const tabs: (PostStatus | "all")[] = ["all", ...postStatuses];

  return (
    <div className="mt-14">
      <div role="tablist" aria-label="Filter entries" className="inline-flex rounded-full border border-line bg-surface p-1">
        {tabs.map((t) => {
          const count = t === "all" ? posts.length : posts.filter((p) => p.status === t).length;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={filter === t}
              onClick={() => setFilter(t)}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm transition-colors duration-200",
                filter === t ? "text-accent-ink" : "text-muted hover:text-fg",
              )}
            >
              {filter === t ? (
                <motion.span layoutId="log-tab" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              ) : null}
              <span className="relative">
                {t === "all" ? "All" : statusMeta[t].label} <span className="opacity-60">{count}</span>
              </span>
            </button>
          );
        })}
      </div>

      <ol className="relative mt-10 border-l border-line pl-8">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((post, i) => (
            <motion.li
              key={post.id}
              layout
              initial={{ opacity: 0, transform: "translateY(16px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={{ opacity: 0, transform: "translateY(-8px)", transition: { duration: 0.15 } }}
              transition={{ duration: 0.5, ease: easeOut, delay: i * 0.04 }}
              className="relative pb-10"
            >
              <span className={cn("absolute -left-[37px] top-2 size-3 rounded-full ring-4 ring-bg", statusMeta[post.status].dot)} />
              <Link
                href={`/log/${post.slug}`}
                className="group block rounded-3xl border border-line bg-surface/60 p-6 transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-line-strong md:p-8"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill status={post.status} />
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted">{formatDate(post.date)}</span>
                  {post.pinned ? <PushPin size={14} weight="fill" className="text-ember" aria-label="Pinned" /> : null}
                  <ArrowUpRight size={18} className="ml-auto text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{post.title}</h2>
                <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">{post.summary}</p>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
        {shown.length === 0 ? <li className="pb-10 text-muted">No entries with this status yet.</li> : null}
      </ol>
    </div>
  );
}
