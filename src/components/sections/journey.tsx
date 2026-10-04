"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { TextReveal } from "@/components/animations/text-reveal";
import type { Milestone } from "@/lib/site";
import { cn, easeOut } from "@/lib/utils";

function MilestoneRow({ milestone, index }: { milestone: Milestone; index: number }) {
  const reduce = useReducedMotion();
  const left = index % 2 === 0;
  return (
    <li className="relative grid grid-cols-[28px_1fr] gap-6 md:grid-cols-[1fr_56px_1fr] md:gap-0">
      {/* node */}
      <div className="relative row-start-1 flex justify-center md:col-start-2">
        <motion.span
          className="relative z-10 mt-2 grid size-4 place-items-center rounded-full border border-line-strong bg-bg"
          initial={{ scale: 0.6, borderColor: "rgb(214 232 228 / 0.16)" }}
          whileInView={{ scale: 1, borderColor: "rgb(95 214 192 / 1)" }}
          viewport={{ margin: "-45% 0px -45% 0px" }}
          transition={{ duration: 0.4, ease: easeOut }}
        >
          <motion.span
            className="size-1.5 rounded-full bg-accent"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ margin: "-45% 0px -45% 0px" }}
          />
        </motion.span>
      </div>
      <motion.div
        className={cn(
          "row-start-1 pb-16 md:pb-24",
          left ? "md:col-start-1 md:pr-12 md:text-right" : "md:col-start-3 md:pl-12",
        )}
        initial={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, transform: `translateX(${left ? -60 : 60}px) rotate(${left ? -3 : 3}deg)`, filter: "blur(6px)" }
        }
        whileInView={{ opacity: 1, transform: "translateX(0px) rotate(0deg)", filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.9, ease: easeOut }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{milestone.date}</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-4xl">{milestone.title}</h3>
        <p className={cn("mt-3 max-w-[42ch] leading-relaxed text-muted", left && "md:ml-auto")}>{milestone.body}</p>
      </motion.div>
    </li>
  );
}

export function Journey({ journey }: { journey: Milestone[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.6", "end 0.6"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  const glowOpacity = useTransform(progress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  if (!journey.length) return null;

  return (
    <section id="journey" className="relative mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <div className="mb-20 grid gap-6 md:grid-cols-12 md:items-end">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted md:col-span-3">
          <span className="text-accent">03</span> / Journey
        </p>
        <TextReveal
          text="How I got *here*"
          className="text-[clamp(2.4rem,5.5vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.045em] md:col-span-9"
        />
      </div>

      <ol ref={ref} className="relative">
        {/* rail */}
        <div
          aria-hidden="true"
          className="absolute bottom-16 left-[13.5px] top-3 w-px bg-line md:left-1/2 md:-translate-x-1/2"
        >
          <motion.div
            className="absolute inset-0 origin-top bg-gradient-to-b from-accent via-accent to-ember"
            style={{ scaleY: progress }}
          />
          <motion.div
            className="absolute inset-x-[-6px] bottom-0 top-0 origin-top"
            style={{ scaleY: progress, opacity: glowOpacity }}
          >
            <div className="absolute inset-0 bg-accent/30 blur-md" />
          </motion.div>
        </div>
        {journey.map((milestone, i) => (
          <MilestoneRow key={`${milestone.date}-${i}`} milestone={milestone} index={i} />
        ))}
      </ol>
    </section>
  );
}
