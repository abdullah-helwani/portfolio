import type { ReactNode } from "react";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/animations/reveal";
import { Spotlight } from "@/components/ui/spotlight";
import { projects, site, type Project } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ClassroomVisual, CodeVisual, FuzzyVisual, ScatterVisual, SunVisual } from "./work-visuals";

const layout: Record<string, { span: string; visual: ReactNode }> = {
  "Senior Project": { span: "lg:col-span-4 lg:row-span-2", visual: <ClassroomVisual /> },
  Luminary: { span: "lg:col-span-2", visual: <SunVisual /> },
  "ANFIS vs Fuzzy Logic": { span: "lg:col-span-2", visual: <FuzzyVisual /> },
  "ML Coursework": { span: "lg:col-span-3", visual: <ScatterVisual /> },
  "Odin Recipes": { span: "lg:col-span-3", visual: <CodeVisual /> },
};

function ProjectTile({ project, index }: { project: Project; index: number }) {
  const { span, visual } = layout[project.title] ?? { span: "lg:col-span-2", visual: null };

  return (
    <Reveal delay={(index % 3) * 0.06} className={cn("md:col-span-1", project.featured && "md:col-span-2", span)}>
      <a
        href={project.href}
        target="_blank"
        rel="noreferrer"
        className="group relative block h-full overflow-hidden rounded-[1.75rem] bg-line p-px"
      >
        <Spotlight size={320} className="bg-[radial-gradient(circle,var(--accent)_0%,transparent_65%)]" />
        <div
          className={cn(
            "relative flex h-full flex-col gap-8 rounded-[calc(1.75rem-1px)] bg-surface p-6 md:p-8",
            project.featured && "lg:p-10",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              {String(index + 1).padStart(2, "0")} · {project.year}
            </span>
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong text-fg transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-45 group-hover:bg-accent group-hover:text-accent-ink">
              <ArrowUpRight size={16} weight="bold" />
            </span>
          </div>

          <div className={cn("flex-1", project.featured ? "max-w-[520px]" : "")}>{visual}</div>

          <div>
            <p className="text-sm text-accent">{project.kicker}</p>
            <h3
              className={cn(
                "mt-2 font-semibold tracking-[-0.03em]",
                project.featured ? "text-4xl md:text-5xl" : "text-2xl",
              )}
            >
              {project.title}
            </h3>
            <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-muted">{project.description}</p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technologies">
              {project.tags.map((tag) => (
                <li key={tag} className="rounded-full border border-line px-3 py-1 text-xs text-fg/70">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </a>
    </Reveal>
  );
}

export function Work() {
  return (
    <section id="work" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <div className="mb-14 grid gap-6 md:grid-cols-12 md:items-end">
        <Reveal className="md:col-span-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <span className="text-accent">02</span> / Selected work
          </p>
        </Reveal>
        <Reveal delay={0.05} className="md:col-span-6">
          <h2 className="text-[clamp(2.4rem,5.5vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
            Things I&apos;ve <span className="font-serif font-normal italic text-fg/90">built</span> and studied
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="md:col-span-3 md:text-right">
          <a
            href={`${site.github}?tab=repositories`}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-fg"
          >
            All repositories
            <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6 lg:auto-rows-[minmax(280px,auto)]">
        {projects.map((project, i) => (
          <ProjectTile key={project.title} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
