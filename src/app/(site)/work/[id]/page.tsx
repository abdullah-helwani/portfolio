import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle, GithubLogo, Globe, PresentationChart } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/animations/reveal";
import { DemoRunner } from "@/components/lab/lab";
import { ProjectVisualView } from "@/components/sections/work-visuals";
import { VideoPlayer } from "@/components/videos/player";
import { SitePreview } from "@/components/work/site-preview";
import type { Video } from "@/lib/site";
import { getContent } from "@/lib/store";

export async function generateMetadata({ params }: PageProps<"/work/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { projects } = await getContent();
  const p = projects.find((x) => x.id === id && x.visible);
  return p ? { title: p.title, description: p.description } : {};
}

function slidesEmbed(url: string) {
  if (/\.pdf($|\?)/i.test(url) || url.startsWith("/api/media/doc-")) return url;
  const g = /docs\.google\.com\/presentation\/d\/([\w-]+)/.exec(url);
  if (g) return `https://docs.google.com/presentation/d/${g[1]}/embed?start=false&loop=false`;
  if (url.includes("canva.com/design/")) return url.replace(/\/(edit|view)(\?.*)?$/, "/view?embed");
  return null;
}

export default async function ProjectPage({ params }: PageProps<"/work/[id]">) {
  const { id } = await params;
  const { projects, demos, videos } = await getContent();
  const visible = projects.filter((p) => p.visible);
  const i = visible.findIndex((p) => p.id === id);
  if (i < 0) notFound();
  const project = visible[i];
  const prev = visible[(i - 1 + visible.length) % visible.length];
  const next = visible[(i + 1) % visible.length];
  const demo = demos.find((d) => d.id === project.demoId && d.visible);
  const slides = project.presentationUrl ? slidesEmbed(project.presentationUrl) : null;
  const uploaded = project.videoUrl.startsWith("/api/media/") ? videos.find((v) => project.videoUrl.endsWith(v.file)) : undefined;
  const video: Video | null = project.videoUrl
    ? (uploaded ?? { id: "v", title: `${project.title} video`, description: "", file: "", original: "", poster: "", status: "ready", error: "", createdAt: "", visible: true, downloadable: false, externalUrl: project.videoUrl })
    : null;
  const paragraphs = (project.details || project.description).split(/\n\s*\n/).filter(Boolean);

  return (
    <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <Link href="/#work" className="group inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> All projects
      </Link>

      <header className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <span className="text-accent">{String(i + 1).padStart(2, "0")}</span> / {project.year} {project.role ? `· ${project.role}` : ""}
          </p>
          <h1 className="mt-6 text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.92] tracking-[-0.05em]">{project.title}</h1>
          <p className="mt-4 text-lg text-accent">{project.kicker}</p>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-fg/75">{project.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {project.liveUrl ? (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className="press inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-ink">
                <Globe size={17} weight="bold" /> Visit the live site <ArrowUpRight size={14} weight="bold" />
              </a>
            ) : null}
            {project.href ? (
              <a href={project.href} target="_blank" rel="noreferrer" className="press inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-5 text-sm hover:border-fg/30">
                <GithubLogo size={17} weight="fill" /> Source on GitHub
              </a>
            ) : null}
            {project.presentationUrl ? (
              <a href={project.presentationUrl} target="_blank" rel="noreferrer" className="press inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-5 text-sm hover:border-fg/30">
                <PresentationChart size={17} /> Presentation
              </a>
            ) : null}
            {demo ? (
              <a href="#try" className="press inline-flex h-12 items-center gap-2 rounded-full border border-ember/50 bg-ember/10 px-5 text-sm">
                Try it yourself
              </a>
            ) : null}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface/70 p-6 backdrop-blur">
            {project.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.coverUrl} alt={`${project.title} cover`} className="aspect-[16/10] w-full rounded-2xl object-cover" />
            ) : (
              <ProjectVisualView visual={project.visual} />
            )}
          </div>
        </div>
      </header>

      <div className="mt-20 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">The story</h2>
          <div className="mt-6 grid gap-5 text-lg leading-relaxed text-fg/80">
            {paragraphs.map((p, k) => (
              <Reveal as="p" key={k}>
                {p}
              </Reveal>
            ))}
          </div>
        </div>
        <aside className="grid content-start gap-6 lg:col-span-5">
          {project.highlights.length ? (
            <div className="rounded-[1.75rem] border border-line p-6">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Highlights</h2>
              <ul className="mt-4 grid gap-3">
                {project.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3">
                    <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {project.tags.length ? (
            <div className="rounded-[1.75rem] border border-line p-6">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Built with</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((t) => (
                  <li key={t} className="rounded-full border border-line-strong px-3 py-1 text-sm text-fg/80">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {project.liveUrl ? (
        <section className="mt-24" aria-labelledby="live">
          <h2 id="live" className="mb-6 text-3xl font-semibold tracking-[-0.03em]">
            The real thing, <span className="text-accent">running</span>
          </h2>
          <SitePreview url={project.liveUrl} title={project.title} />
        </section>
      ) : null}

      {demo ? (
        <section id="try" className="mt-24 scroll-mt-28" aria-labelledby="try-h">
          <h2 id="try-h" className="mb-6 text-3xl font-semibold tracking-[-0.03em]">
            Try it: <span className="text-accent">{demo.title}</span>
          </h2>
          <div className="rounded-[2rem] border border-line-strong bg-surface/70 p-2 backdrop-blur">
            <div className="rounded-[1.6rem] border border-line bg-bg/70 p-5 md:p-7">
              <DemoRunner demo={demo} />
            </div>
          </div>
        </section>
      ) : null}

      {slides ? (
        <section className="mt-24" aria-labelledby="slides">
          <h2 id="slides" className="mb-6 text-3xl font-semibold tracking-[-0.03em]">Presentation</h2>
          <div className="overflow-hidden rounded-[1.6rem] border border-line-strong bg-bg">
            <iframe src={slides} title={`${project.title} presentation`} loading="lazy" className="aspect-[16/10] w-full" allowFullScreen />
          </div>
        </section>
      ) : null}

      {video ? (
        <section className="mt-24" aria-labelledby="video">
          <h2 id="video" className="mb-6 text-3xl font-semibold tracking-[-0.03em]">Video</h2>
          <VideoPlayer video={video} />
        </section>
      ) : null}

      {visible.length > 1 ? (
        <nav aria-label="More projects" className="mt-28 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
          <Link href={`/work/${prev.id}`} className="group rounded-3xl border border-line p-6 transition-colors hover:border-line-strong">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              <ArrowLeft size={12} /> Previous
            </span>
            <span className="mt-2 block text-2xl font-semibold tracking-tight">{prev.title}</span>
          </Link>
          <Link href={`/work/${next.id}`} className="group rounded-3xl border border-line p-6 text-right transition-colors hover:border-line-strong">
            <span className="flex items-center justify-end gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Next <ArrowRight size={12} />
            </span>
            <span className="mt-2 block text-2xl font-semibold tracking-tight">{next.title}</span>
          </Link>
        </nav>
      ) : null}
    </main>
  );
}
