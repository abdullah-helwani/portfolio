import type { Metadata } from "next";
import { TextReveal } from "@/components/animations/text-reveal";
import { LogFeed } from "@/components/log/log-feed";
import { sortPosts } from "@/components/sections/log";
import { getContent } from "@/lib/store";

export const metadata: Metadata = {
  title: "Build log",
  description: "What I've shipped, what I'm building and what's next.",
};

export default async function LogPage() {
  const { posts } = await getContent();
  const published = sortPosts(posts.filter((p) => p.published));
  return (
    <main className="mx-auto min-h-[100dvh] max-w-[1100px] px-5 pb-24 pt-36 md:px-10 md:pt-44">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span className="text-accent">Log</span> / {published.length} entries
      </p>
      <TextReveal
        as="h1"
        text="Shipped, building, *next*"
        className="mt-6 text-[clamp(2.8rem,8vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]"
      />
      <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted">
        A running record of what I&apos;ve finished, what&apos;s on the bench, and what I want to tackle next.
      </p>
      <LogFeed posts={published} />
    </main>
  );
}
