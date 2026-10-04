import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/animations/reveal";
import { TextReveal } from "@/components/animations/text-reveal";
import { PostBody } from "@/components/log/post-body";
import { ReadTracker } from "@/components/log/read-tracker";
import { formatDate, StatusPill } from "@/components/log/status";
import { getContent } from "@/lib/store";

async function findPost(slug: string) {
  const { posts } = await getContent();
  return posts.find((p) => p.slug === slug && p.published);
}

export async function generateMetadata({ params }: PageProps<"/log/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPost(slug);
  return post ? { title: post.title, description: post.summary } : { title: "Not found" };
}

export default async function PostPage({ params }: PageProps<"/log/[slug]">) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[820px] px-5 pb-24 pt-36 md:px-10 md:pt-44">
      <ReadTracker />
      <Link href="/log" className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg">
        <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
        All entries
      </Link>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <StatusPill status={post.status} />
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted">{formatDate(post.date)}</span>
      </div>
      <TextReveal
        as="h1"
        text={post.title}
        className="mt-6 text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
      />
      <Reveal delay={0.2}>
        <p className="mt-6 text-xl leading-relaxed text-fg/70">{post.summary}</p>
        {post.tags.length ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-fg/70">
                {t}
              </li>
            ))}
          </ul>
        ) : null}
        <hr className="my-10 border-line" />
        <PostBody body={post.body} />
        {post.link ? (
          <a
            href={post.link}
            target="_blank"
            rel="noreferrer"
            className="press mt-12 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-ink"
          >
            Open the link
            <ArrowUpRight size={16} weight="bold" />
          </a>
        ) : null}
      </Reveal>
    </main>
  );
}
