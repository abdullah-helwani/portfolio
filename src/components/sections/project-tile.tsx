"use client";

import { useRef, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Spotlight } from "@/components/ui/spotlight";
import type { Project } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";
import { ProjectVisualView } from "./work-visuals";

export function ProjectTile({
  project,
  index,
  big,
  className,
}: {
  project: Project;
  index: number;
  big: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 768px)");
  const animate3d = desktop && !reduce;

  // scroll-in: tiles tip forward from below as they enter the viewport
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.55"] });
  const enter = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  // hover tilt
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const tiltX = useSpring(py, { stiffness: 180, damping: 18 });
  const tiltY = useSpring(px, { stiffness: 180, damping: 18 });

  const transform = useTransform([enter, tiltX, tiltY], ([e, tx, ty]: number[]) => {
    if (!animate3d) return "none";
    const rotateX = (1 - e) * 28 + tx;
    const translateY = (1 - e) * 90;
    const scale = 0.88 + e * 0.12;
    return `perspective(1200px) translate3d(0, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${ty}deg) scale(${scale})`;
  });
  const opacity = useTransform(enter, [0, 0.6], [animate3d ? 0.2 : 1, 1]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!animate3d || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set(((event.clientX - rect.left) / rect.width - 0.5) * 8);
    py.set(-((event.clientY - rect.top) / rect.height - 0.5) * 8);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ transform, opacity, transformOrigin: "50% 100%" }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("will-change-transform", className)}
    >
      <a
        href={project.href}
        target="_blank"
        rel="noreferrer"
        className="group relative block h-full overflow-hidden rounded-[1.75rem] bg-line p-px"
      >
        <Spotlight size={340} className="bg-[radial-gradient(circle,var(--accent)_0%,transparent_65%)]" />
        <div
          className={cn(
            "relative flex h-full flex-col gap-8 rounded-[calc(1.75rem-1px)] bg-surface p-6 md:p-8",
            big && "lg:p-10",
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

          <div className={cn("flex-1", big && "flex w-full max-w-[640px] items-center")}>
            <div className="w-full">
            <ProjectVisualView visual={project.visual} />
            </div>
          </div>

          <div>
            <p className="text-sm text-accent">{project.kicker}</p>
            <h3 className={cn("mt-2 font-semibold tracking-[-0.03em]", big ? "text-4xl md:text-5xl" : "text-2xl")}>
              {project.title}
            </h3>
            <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-muted">{project.description}</p>
            {project.tags.length ? (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technologies">
                {project.tags.map((tag) => (
                  <li key={tag} className="rounded-full border border-line px-3 py-1 text-xs text-fg/70">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </a>
    </motion.div>
  );
}
