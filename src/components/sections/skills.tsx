"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import {
  Brain,
  Browser,
  ChartLineUp,
  Code,
  Database,
  Stack,
  Sparkle,
  CursorClick,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { TextReveal } from "@/components/animations/text-reveal";
import { useGameOptional } from "@/components/game/game-provider";
import type { Profile, SkillClass, SkillIcon } from "@/lib/site";
import { cn, easeOut } from "@/lib/utils";

const iconMap: Record<SkillIcon, ComponentType<IconProps>> = {
  brain: Brain,
  chart: ChartLineUp,
  code: Code,
  browser: Browser,
  database: Database,
  stack: Stack,
};

function shortName(name: string) {
  const parts = name.split(/\s+/);
  if (parts[1] === "&" && parts[2]) return `${parts[0]}/${parts[2]}`;
  return parts[0];
}

function Radar({ classes, active, show }: { classes: SkillClass[]; active: string; show: boolean }) {
  const reduce = useReducedMotion();
  const size = 320;
  const c = size / 2;
  const R = 118;
  const n = classes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, r: number) => [c + Math.cos(angle(i)) * r, c + Math.sin(angle(i)) * r] as const;
  const poly = classes.map((cl, i) => pt(i, (cl.level / 10) * R).join(",")).join(" ");

  if (n < 3) return null;

  return (
    <svg viewBox={`-70 -6 ${size + 140} ${size + 12}`} className="h-auto w-full max-w-[440px]" role="img" aria-label="Skill levels by class">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={classes.map((_, i) => pt(i, R * f).join(",")).join(" ")}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
      ))}
      {classes.map((cl, i) => {
        const [x, y] = pt(i, R);
        return (
          <line
            key={cl.id}
            x1={c}
            y1={c}
            x2={x}
            y2={y}
            stroke={cl.id === active ? "var(--accent)" : "var(--line)"}
            strokeWidth={cl.id === active ? 1.5 : 1}
          />
        );
      })}
      <motion.polygon
        points={poly}
        fill="rgb(95 214 192 / 0.16)"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ transformOrigin: `${c}px ${c}px` }}
        initial={reduce ? false : { transform: "scale(0)", opacity: 0 }}
        animate={show ? { transform: "scale(1)", opacity: 1 } : undefined}
        transition={{ duration: 1.2, ease: easeOut, delay: 0.2 }}
      />
      {classes.map((cl, i) => {
        const [x, y] = pt(i, (cl.level / 10) * R);
        const [lx, ly] = pt(i, R + 26);
        const on = cl.id === active;
        return (
          <g key={cl.id}>
            <motion.circle
              cx={x}
              cy={y}
              r={on ? 6 : 4}
              fill={on ? "var(--accent)" : "var(--bg)"}
              stroke="var(--accent)"
              strokeWidth="2"
              initial={reduce ? false : { opacity: 0 }}
              animate={show ? { opacity: 1 } : undefined}
              transition={{ delay: 0.8 + i * 0.08 }}
            />
            <text
              x={lx}
              y={ly}
              textAnchor={Math.abs(lx - c) < 8 ? "middle" : lx > c ? "start" : "end"}
              dominantBaseline="middle"
              className={cn("font-mono text-[10px] uppercase tracking-[0.12em]", on ? "fill-accent" : "fill-[var(--muted)]")}
            >
              {shortName(cl.name)} {cl.level}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function XpBar({ value, show, delay = 0, className }: { value: number; show: boolean; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-surface-2", className)}>
      <motion.div
        className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-[#b6f5e8]"
        initial={reduce ? { transform: `scaleX(${value / 100})` } : { transform: "scaleX(0)" }}
        animate={show ? { transform: `scaleX(${value / 100})` } : undefined}
        transition={{ duration: 1.1, ease: easeOut, delay }}
      />
    </div>
  );
}

export function Skills({ classes, profile }: { classes: SkillClass[]; profile: Profile }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const game = useGameOptional();
  const [activeId, setActiveId] = useState(classes[0]?.id ?? "");
  const [hoverSkill, setHoverSkill] = useState<string | null>(null);
  const active = classes.find((c) => c.id === activeId) ?? classes[0];
  const totalLevel = classes.reduce((sum, c) => sum + c.level, 0);
  const primary = [...classes].sort((a, b) => b.level - a.level)[0];

  const inventory = useMemo(() => {
    const map = new Map<string, { name: string; level: number; classes: string[] }>();
    for (const cl of classes) {
      for (const s of cl.skills) {
        const key = s.name.toLowerCase();
        const entry = map.get(key) ?? { name: s.name, level: 0, classes: [] };
        entry.level = Math.max(entry.level, s.level);
        entry.classes.push(cl.id);
        map.set(key, entry);
      }
    }
    return [...map.values()].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
  }, [classes]);

  const hovered = hoverSkill ? inventory.find((s) => s.name === hoverSkill) : null;

  const select = (id: string) => {
    setActiveId(id);
    game?.inspect(id, classes.length);
  };

  if (!active) return null;
  const ActiveIcon = iconMap[active.icon] ?? Sparkle;

  return (
    <section id="skills" className="relative mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <div className="mb-14 grid gap-6 md:grid-cols-12 md:items-end">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted md:col-span-3">
          <span className="text-accent">02</span> / Skills
        </p>
        <div className="md:col-span-9">
          <TextReveal
            text="My *character* sheet"
            className="text-[clamp(2.4rem,5.5vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.045em]"
          />
          <p className="mt-5 flex items-center gap-2 text-sm text-muted">
            <CursorClick size={16} className="text-accent" />
            Pick a class to inspect it. Inspect them all for an achievement.
          </p>
        </div>
      </div>

      <div ref={ref} className="grid gap-4 lg:grid-cols-12">
        {/* character card */}
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-6 md:p-8 lg:col-span-5 lg:row-span-2">
          <div aria-hidden="true" className="absolute -right-24 -top-24 size-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line-strong bg-bg">
              {profile.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logoUrl} alt={`${profile.name} logo`} className="size-full object-contain p-2" />
              ) : (
                <span className="font-serif text-3xl italic">{profile.firstName[0]}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold tracking-tight">{profile.name}</p>
              <p className="truncate text-sm text-muted">
                Main class · <span className="text-accent">{primary?.name}</span>
              </p>
            </div>
            <div className="ml-auto shrink-0 text-right">
              <p className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Total lv</p>
              <p className="font-mono text-3xl tabular-nums">{totalLevel}</p>
            </div>
          </div>
          <div className="relative mt-6 grid place-items-center">
            <Radar classes={classes} active={active.id} show={inView} />
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line text-center">
            {[
              { k: "Classes", v: classes.length },
              { k: "Skills", v: inventory.length },
              { k: "Mastered", v: inventory.filter((s) => s.level >= 5).length },
            ].map((s) => (
              <div key={s.k} className="bg-surface p-3">
                <p className="font-mono text-2xl tabular-nums">{s.v}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{s.k}</p>
              </div>
            ))}
          </div>
        </div>

        {/* class picker */}
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3">
          {classes.map((cl, i) => {
            const Icon = iconMap[cl.icon] ?? Sparkle;
            const on = cl.id === active.id;
            const lit = hovered ? hovered.classes.includes(cl.id) : false;
            return (
              <motion.button
                key={cl.id}
                type="button"
                onClick={() => select(cl.id)}
                aria-pressed={on}
                initial={{ opacity: 0, transform: "translateY(24px) scale(0.96)" }}
                animate={inView ? { opacity: 1, transform: "translateY(0px) scale(1)" } : undefined}
                transition={{ duration: 0.6, ease: easeOut, delay: 0.1 + i * 0.07 }}
                className={cn(
                  "press group relative overflow-hidden rounded-2xl border p-4 text-left transition-[border-color,background-color] duration-300",
                  on ? "border-accent/60 bg-accent/[0.07]" : "border-line bg-surface hover:border-line-strong",
                  lit && !on && "border-ember/60",
                )}
              >
                {on ? (
                  <motion.span
                    layoutId="class-glow"
                    className="absolute inset-0 -z-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgb(95_214_192/0.18),transparent_60%)]"
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  />
                ) : null}
                <div className="relative flex items-center justify-between">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl transition-colors duration-300",
                      on ? "bg-accent text-accent-ink" : "bg-surface-2 text-fg/80 group-hover:text-accent",
                    )}
                  >
                    <Icon size={20} weight="duotone" />
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted">Lv {cl.level}</span>
                </div>
                <p className="relative mt-4 font-medium leading-tight tracking-tight">{cl.name}</p>
                <XpBar value={cl.xp} show={inView} delay={0.4 + i * 0.08} className="relative mt-3" />
                <p className="relative mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                  {cl.xp}% to lv {Math.min(cl.level + 1, 10)}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* class detail */}
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-6 md:p-8 lg:col-span-7">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              initial={{ opacity: 0, transform: "translateX(20px)" }}
              animate={{ opacity: 1, transform: "translateX(0px)" }}
              exit={{ opacity: 0, transform: "translateX(-12px)", transition: { duration: 0.15 } }}
              transition={{ duration: 0.45, ease: easeOut }}
            >
              <div className="flex flex-wrap items-start gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <ActiveIcon size={24} weight="duotone" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">{active.name}</h3>
                  <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-muted">{active.blurb}</p>
                </div>
                <span className="rounded-full border border-accent/40 px-3 py-1 font-mono text-xs text-accent">
                  Lv {active.level}
                </span>
              </div>
              <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {active.skills.map((s, i) => (
                  <motion.li
                    key={s.name}
                    initial={{ opacity: 0, transform: "translateY(8px)" }}
                    animate={{ opacity: 1, transform: "translateY(0px)" }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: easeOut }}
                    className="flex items-center justify-between gap-3 border-b border-line pb-3"
                  >
                    <span className="text-[15px]">{s.name}</span>
                    <span className="flex gap-1" aria-label={`${s.level} out of 5`}>
                      {[1, 2, 3, 4, 5].map((pip) => (
                        <motion.span
                          key={pip}
                          className={cn("h-2 w-4 rounded-sm", pip <= s.level ? "bg-accent" : "bg-surface-2")}
                          initial={{ transform: "scaleY(0.2)", opacity: 0.4 }}
                          animate={{ transform: "scaleY(1)", opacity: 1 }}
                          transition={{ delay: 0.15 + i * 0.05 + pip * 0.04, duration: 0.3 }}
                        />
                      ))}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* inventory */}
      <div className="mt-10">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Inventory · hover a skill to see which classes use it
        </p>
        <ul className="flex flex-wrap gap-2">
          {inventory.map((s, i) => (
            <motion.li
              key={s.name}
              initial={{ opacity: 0, transform: "scale(0.8)" }}
              whileInView={{ opacity: 1, transform: "scale(1)" }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.02, 0.6), duration: 0.35, ease: easeOut }}
            >
              <button
                type="button"
                onMouseEnter={() => setHoverSkill(s.name)}
                onMouseLeave={() => setHoverSkill(null)}
                onFocus={() => setHoverSkill(s.name)}
                onBlur={() => setHoverSkill(null)}
                onClick={() => select(s.classes[0])}
                className={cn(
                  "press inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-[border-color,background-color,color] duration-200",
                  hoverSkill === s.name
                    ? "border-ember/70 bg-ember/10 text-fg"
                    : active.skills.some((a) => a.name === s.name)
                      ? "border-accent/50 text-fg"
                      : "border-line text-fg/70 hover:border-line-strong",
                )}
              >
                {s.name}
                <span className="font-mono text-[10px] text-muted">{"★".repeat(Math.min(s.level, 5))}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
