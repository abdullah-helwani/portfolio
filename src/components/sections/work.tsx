import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Project } from "@/lib/site";
import { SectionHeader, type SectionProps } from "./section-header";
import { ProjectTile } from "./project-tile";

// Bento spans on the 6-column desktop grid: a featured project takes a 4x2 hero tile,
// the next two sit beside it, and the rest pair up in halves.
function spanFor(position: number, hasFeatured: boolean, total: number) {
  if (hasFeatured) {
    if (position === 0) return { big: true, className: "md:col-span-2 lg:col-span-4 lg:row-span-2" };
    if (position <= 2) return { big: false, className: "lg:col-span-2" };
    const rest = total - 3;
    const restIndex = position - 3;
    const lastOdd = rest % 2 === 1 && restIndex === rest - 1;
    return { big: false, className: lastOdd ? "md:col-span-2 lg:col-span-6" : "lg:col-span-3" };
  }
  const lastOdd = total % 2 === 1 && position === total - 1;
  return { big: false, className: lastOdd ? "md:col-span-2 lg:col-span-6" : "lg:col-span-3" };
}

export function Work({ projects, github, section, index }: { projects: Project[]; github: string } & SectionProps) {
  const visible = projects.filter((p) => p.visible);
  const featured = visible.find((p) => p.featured);
  const ordered = featured ? [featured, ...visible.filter((p) => p !== featured)] : visible;

  return (
    <section id="work" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <SectionHeader
        section={section}
        index={index}
        aside={
          <a
            href={`${github}?tab=repositories`}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-fg"
          >
            All repositories
            <ArrowUpRight
              size={14}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        }
      />

      {ordered.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6 lg:auto-rows-[minmax(280px,auto)]">
          {ordered.map((project, i) => {
            const { big, className } = spanFor(i, Boolean(featured), ordered.length);
            return <ProjectTile key={project.id} project={project} index={i} big={big} className={className} />;
          })}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-line-strong p-10 text-muted">
          New projects are on the way. In the meantime, everything I&apos;m working on is on GitHub.
        </p>
      )}
    </section>
  );
}
