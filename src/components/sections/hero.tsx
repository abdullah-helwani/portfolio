"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { ArrowDown, GameController, GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { Scramble } from "@/components/fx/scramble";
import type { Profile, SiteCopy, SkillClass } from "@/lib/site";
import { easeOut } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";

function RoleRotator({ roles }: { roles: string[] }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % Math.max(roles.length, 1)), 2600);
    return () => window.clearInterval(id);
  }, [roles.length]);

  if (!roles.length) return null;
  const role = roles[index % roles.length];

  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={role}
          className="col-start-1 row-start-1 whitespace-nowrap font-medium text-accent"
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(100%)" }}
          animate={{ opacity: 1, transform: "translateY(0%)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-100%)" }}
          transition={{ duration: 0.45, ease: easeOut }}
        >
          {role}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** A small terminal that types out a profile, for the coding feel. Desktop only. */
function Terminal({ profile, skills }: { profile: Profile; skills: SkillClass[] }) {
  const stack = Array.from(new Set(skills.flatMap((c) => c.skills.filter((s) => s.level >= 4).map((s) => s.name)))).slice(0, 5);
  const lines: { text: string; tone?: "cmd" | "key" | "dim" }[] = [
    { text: "~ whoami", tone: "cmd" },
    { text: "{" },
    { text: `  "name": "${profile.name}",`, tone: "key" },
    { text: `  "role": "${profile.role}",`, tone: "key" },
    { text: `  "stack": [${stack.map((s) => `"${s}"`).join(", ")}],`, tone: "key" },
    { text: `  "status": "${profile.available ? "available" : "busy"}"`, tone: "key" },
    { text: "}" },
    { text: "~ ./explore --city", tone: "cmd" },
  ];
  const full = lines.map((l) => l.text).join("\n");
  const [count, setCount] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setCount(full.length);
      return;
    }
    let i = 0;
    let t = 0;
    const start = window.setTimeout(function tick() {
      i += full[i] === "\n" ? 1 : 2;
      setCount(i);
      if (i < full.length) t = window.setTimeout(tick, full[i] === "\n" ? 120 : 14);
    }, 1400);
    return () => {
      clearTimeout(start);
      clearTimeout(t);
    };
  }, [full]);

  let used = 0;
  return (
    <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-line-strong bg-[#0b0f10]/80 shadow-[0_40px_100px_-40px_rgb(0_0_0/0.9)] backdrop-blur-md">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#f0773f]/80" />
        <span className="size-2.5 rounded-full bg-[#f6c177]/80" />
        <span className="size-2.5 rounded-full bg-[#5fd6c0]/80" />
        <span className="ml-3 font-mono text-[11px] text-muted">abdullah@portfolio: ~</span>
      </div>
      <pre className="min-h-[232px] whitespace-pre-wrap break-words px-5 py-4 font-mono text-[12.5px] leading-[1.75] text-fg/85">
        {lines.map((l, i) => {
          const visible = l.text.slice(0, Math.max(0, count - used));
          used += l.text.length + 1;
          if (!visible) return null;
          return (
            <span key={i} className={l.tone === "cmd" ? "text-accent" : l.tone === "key" ? "text-fg/80" : undefined}>
              {visible}
              {"\n"}
            </span>
          );
        })}
        <span className="inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] animate-pulse bg-accent" />
      </pre>
    </div>
  );
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, transform: "translateY(16px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.8, ease: easeOut, delay },
});

export function Hero({ profile, copy, skills }: { profile: Profile; copy: SiteCopy; skills: SkillClass[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 768px)");
  const parallax = desktop && !reduce;
  const [decode, setDecode] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDecode(true), 150);
    return () => clearTimeout(t);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentTransform = useTransform(scrollYProgress, (v) => (parallax ? `translate3d(0, ${v * -120}px, 0)` : "none"));
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, parallax ? 0 : 1]);
  const termTransform = useTransform(scrollYProgress, (v) => (parallax ? `translate3d(0, ${v * -220}px, 0)` : "none"));

  return (
    <section id="top" ref={ref} aria-label="Introduction" className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(ellipse_70%_60%_at_25%_55%,rgba(9,11,12,0.88),rgba(9,11,12,0.35)_60%,transparent)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-bg" />

      <motion.div style={{ transform: contentTransform, opacity: contentOpacity }} className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 content-end gap-10 px-5 pb-10 pt-32 md:px-10 md:pb-14 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <motion.p {...fadeUp(0.2)} className="mb-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <span className="h-px w-10 bg-muted/60" />
            {copy.heroKicker} / {new Date().getFullYear()}
          </motion.p>

          <h1 className="text-[clamp(3.4rem,12.5vw,11rem)] font-semibold leading-[0.88] tracking-[-0.05em]">
            <span className="sr-only">{profile.name}</span>
            <span aria-hidden="true" className="block">
              <Scramble text={profile.firstName} start={decode} duration={700} />
            </span>
            <span aria-hidden="true" className="flex items-end gap-[0.06em] text-fg/70">
              <Scramble text={profile.lastName} start={decode} delay={250} duration={800} />
              <motion.span
                className="mb-[0.12em] inline-block h-[0.72em] w-[0.09em] bg-accent"
                animate={reduce ? undefined : { opacity: [1, 1, 0, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
              />
            </span>
          </h1>

          <div className="mt-10 grid gap-8 md:mt-12 md:grid-cols-2 md:items-end">
            <motion.div {...fadeUp(0.9)}>
              <p className="max-w-[46ch] text-base leading-relaxed text-fg/80 md:text-lg">{profile.intro}</p>
              <p className="mt-4 text-base text-muted md:text-lg">
                Currently into <RoleRotator roles={profile.roles} />
              </p>
            </motion.div>

            <motion.div {...fadeUp(1.05)} className="flex flex-wrap items-center gap-3">
              <a
                href="#work"
                className="press group inline-flex h-12 items-center gap-2 rounded-full bg-accent pl-6 pr-2 text-sm font-medium text-accent-ink transition-[background-color] duration-200 hover:bg-[#7ee3d1]"
              >
                {copy.heroPrimaryCta}
                <span className="grid size-8 place-items-center rounded-full bg-accent-ink/10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0.5">
                  <ArrowDown size={16} weight="bold" />
                </span>
              </a>
              <Link
                href="/world"
                className="press group inline-flex h-12 items-center gap-2 rounded-full border border-ember/50 bg-ember/10 px-5 text-sm font-medium text-fg backdrop-blur-md transition-colors duration-200 hover:bg-ember/20"
              >
                <GameController size={18} weight="fill" className="text-ember" />
                {copy.heroCityCta}
              </Link>
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                aria-label={`GitHub: ${profile.githubHandle}`}
                className="press group inline-flex size-12 items-center justify-center rounded-full border border-line-strong bg-bg/30 text-fg backdrop-blur-md transition-colors duration-200 hover:border-fg/40"
              >
                <GithubLogo size={20} weight="fill" />
              </a>
            </motion.div>
          </div>
        </div>

        <motion.div {...fadeUp(1.2)} style={{ transform: termTransform }} className="hidden items-end justify-end lg:col-span-4 lg:flex">
          <Terminal profile={profile} skills={skills} />
        </motion.div>

        <motion.div
          {...fadeUp(1.3)}
          className="flex items-center justify-between border-t border-line pt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted lg:col-span-12"
        >
          <span className="flex items-center gap-2.5">
            <span className="relative flex size-2">
              {profile.available ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" /> : null}
              <span className={profile.available ? "relative inline-flex size-2 rounded-full bg-accent" : "relative inline-flex size-2 rounded-full bg-muted"} />
            </span>
            {profile.status}
          </span>
          <span className="hidden sm:inline">{profile.role}</span>
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
