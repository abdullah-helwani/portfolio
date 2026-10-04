"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Brain, CirclesThreePlus, DeviceMobile, Browser } from "@phosphor-icons/react/dist/ssr";
import { TextReveal } from "@/components/animations/text-reveal";
import type { FocusItem } from "@/lib/site";

const icons = [Brain, CirclesThreePlus, DeviceMobile, Browser];
const tints = [
  "radial-gradient(120% 120% at 100% 0%, rgb(95 214 192 / 0.16), transparent 55%)",
  "radial-gradient(120% 120% at 0% 100%, rgb(240 119 63 / 0.14), transparent 55%)",
  "radial-gradient(120% 120% at 100% 100%, rgb(110 140 255 / 0.14), transparent 55%)",
  "radial-gradient(120% 120% at 0% 0%, rgb(95 214 192 / 0.12), transparent 55%)",
];

function StackCard({
  item,
  index,
  total,
  progress,
}: {
  item: FocusItem;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const reduce = useReducedMotion();
  const Icon = icons[index % icons.length];
  const start = index / total;
  const targetScale = 1 - (total - 1 - index) * 0.05;
  const scale = useTransform(progress, [start, 1], [1, reduce ? 1 : targetScale]);
  const dim = useTransform(progress, [start, Math.min(1, start + 1 / total), 1], [0, 0, reduce ? 0 : 0.5]);

  return (
    <div className="sticky top-24 flex h-[70vh] min-h-[420px] items-start justify-center md:top-28">
      <motion.article
        style={{ scale, transformOrigin: "50% 0%", top: `${index * 22}px` }}
        className="relative w-full overflow-hidden rounded-[2rem] border border-line-strong bg-surface shadow-[0_-30px_80px_-40px_rgb(0_0_0/0.9)]"
      >
        <div aria-hidden="true" className="absolute inset-0" style={{ background: tints[index % tints.length] }} />
        <div className="relative grid gap-10 p-8 md:grid-cols-12 md:p-14">
          <div className="md:col-span-4">
            <span className="grid size-14 place-items-center rounded-2xl border border-line-strong bg-bg/60 text-accent">
              <Icon size={26} weight="duotone" />
            </span>
            <p className="mt-8 font-mono text-sm tabular-nums text-muted">
              ({String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")})
            </p>
          </div>
          <div className="md:col-span-8">
            <h3 className="text-[clamp(2rem,4.5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
              {item.title}
            </h3>
            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-muted">{item.body}</p>
          </div>
        </div>
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg" style={{ opacity: dim }} />
      </motion.article>
    </div>
  );
}

export function Focus({ focus }: { focus: FocusItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  if (!focus.length) return null;

  return (
    <section id="focus" className="mx-auto max-w-[1400px] px-5 pt-28 md:px-10 md:pt-36">
      <div className="mb-10 grid gap-6 md:grid-cols-12 md:items-end">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted md:col-span-3">
          <span className="text-accent">07</span> / Services
        </p>
        <TextReveal
          text="What I can *do* for you"
          className="text-[clamp(2.4rem,5.5vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.045em] md:col-span-9"
        />
      </div>
      <div ref={ref} className="relative">
        {focus.map((item, i) => (
          <StackCard key={`${item.title}-${i}`} item={item} index={i} total={focus.length} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
