"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowDown, ArrowUpRight, GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { AuroraVeil } from "@/components/ui/shader-aurora-veil";
import { site } from "@/lib/site";
import { easeOut } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";

function SplitWord({
  word,
  delay,
  className,
}: {
  word: string;
  delay: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={className} aria-hidden="true">
      {word.split("").map((char, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? { opacity: 0 } : { transform: "translateY(110%) rotate(6deg)" }}
            animate={reduce ? { opacity: 1 } : { transform: "translateY(0%) rotate(0deg)" }}
            transition={{ duration: 1.1, ease: easeOut, delay: delay + i * 0.045 }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function RoleRotator() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % site.roles.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={site.roles[index]}
          className="col-start-1 row-start-1 whitespace-nowrap font-serif text-[1.15em] italic text-accent"
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(100%)", filter: "blur(6px)" }}
          animate={{ opacity: 1, transform: "translateY(0%)", filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-100%)", filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease: easeOut }}
        >
          {site.roles[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, transform: "translateY(16px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.9, ease: easeOut, delay },
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 768px)");
  const parallax = desktop && !reduce;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentTransform = useTransform(scrollYProgress, (v) =>
    parallax ? `translate3d(0, ${v * -140}px, 0)` : "none",
  );
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, parallax ? 0 : 1]);
  const bgTransform = useTransform(scrollYProgress, (v) =>
    parallax ? `translate3d(0, ${v * 120}px, 0) scale(${1 + v * 0.12})` : "none",
  );

  return (
    <section
      id="top"
      ref={ref}
      aria-label="Introduction"
      className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden"
    >
      <motion.div className="absolute inset-0 -z-10 will-change-transform" style={{ transform: bgTransform }}>
        <AuroraVeil className="h-full w-full" />
      </motion.div>
      {/* grid lines + bottom fade into the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_at_40%_40%,black,transparent_75%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-bg" />

      <motion.div
        style={{ transform: contentTransform, opacity: contentOpacity }}
        className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-end px-5 pb-10 pt-32 md:px-10 md:pb-14"
      >
        <motion.p {...fadeUp(0.2)} className="mb-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          <span className="h-px w-10 bg-muted/60" />
          Portfolio / {new Date().getFullYear()}
        </motion.p>

        <h1 className="text-[clamp(4rem,17vw,13.5rem)] font-semibold leading-[0.86] tracking-[-0.055em]">
          <span className="sr-only">{site.name}</span>
          <SplitWord word={site.firstName} delay={0.25} className="block" />
          <SplitWord
            word={site.lastName}
            delay={0.55}
            className="block pl-[0.06em] font-serif font-normal italic tracking-[-0.03em] text-fg/90 md:pl-[1.2em]"
          />
        </h1>

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <motion.div {...fadeUp(1.0)} className="md:col-span-6 lg:col-span-5">
            <p className="max-w-[46ch] text-base leading-relaxed text-fg/80 md:text-lg">{site.intro}</p>
            <p className="mt-4 text-base text-muted md:text-lg">
              Right now: <RoleRotator />
            </p>
          </motion.div>

          <motion.div {...fadeUp(1.15)} className="flex flex-wrap items-center gap-3 md:col-span-6 md:justify-end lg:col-span-7">
            <a
              href="#work"
              className="press group inline-flex h-12 items-center gap-2 rounded-full bg-accent pl-6 pr-2 text-sm font-medium text-accent-ink transition-[background-color] duration-200 hover:bg-[#7ee3d1]"
            >
              See selected work
              <span className="grid size-8 place-items-center rounded-full bg-accent-ink/10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0.5">
                <ArrowDown size={16} weight="bold" />
              </span>
            </a>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="press group inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-bg/30 px-5 text-sm font-medium text-fg backdrop-blur-md transition-colors duration-200 hover:border-fg/40"
            >
              <GithubLogo size={18} weight="fill" />
              @{site.githubHandle}
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </motion.div>
        </div>

        <motion.div
          {...fadeUp(1.35)}
          className="mt-12 flex items-center justify-between border-t border-line pt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        >
          <span className="flex items-center gap-2.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            {site.status}
          </span>
          <span className="hidden sm:inline">{site.role}</span>
          <span className="flex items-center gap-2">
            Scroll
            <motion.span
              animate={reduce ? undefined : { transform: ["translateY(-2px)", "translateY(3px)", "translateY(-2px)"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              <ArrowDown size={12} />
            </motion.span>
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
