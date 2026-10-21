import type { ReactNode } from "react";
import { Reveal } from "@/components/animations/reveal";
import { TextReveal } from "@/components/animations/text-reveal";
import type { SectionConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export type SectionProps = { section: SectionConfig; index: number };

export const sectionNumber = (index: number) => String(index).padStart(2, "0");

export function SectionKicker({ section, index, className }: SectionProps & { className?: string }) {
  return (
    <p className={cn("font-mono text-xs uppercase tracking-[0.2em] text-muted", className)}>
      <span className="text-accent">{sectionNumber(index)}</span> / {section.kicker}
    </p>
  );
}

/** The numbered label, heading and intro every homepage section opens with. All text comes from the dashboard. */
export function SectionHeader({ section, index, aside, className }: SectionProps & { aside?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-14 grid gap-6 md:grid-cols-12 md:items-end", className)}>
      <Reveal className="md:col-span-3 md:self-start md:pt-3">
        <SectionKicker section={section} index={index} />
      </Reveal>
      <div className={aside ? "md:col-span-6" : "md:col-span-9"}>
        <TextReveal text={section.title} className="text-[clamp(2.4rem,5.5vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.045em]" />
        {section.intro ? (
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-fg/70 md:text-lg">{section.intro}</p>
          </Reveal>
        ) : null}
      </div>
      {aside ? (
        <Reveal delay={0.1} className="md:col-span-3 md:text-right">
          {aside}
        </Reveal>
      ) : null}
    </div>
  );
}
