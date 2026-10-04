"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Reveal } from "@/components/animations/reveal";

type Fact = { label: string; value: string };

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const filter = useTransform(progress, range, ["blur(3px)", "blur(0px)"]);
  return (
    <motion.span style={{ opacity, filter }} className="mr-[0.25em] inline-block">
      {word}
    </motion.span>
  );
}

export function About({ statement, facts }: { statement: string; facts: Fact[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = statement.split(/\s+/).filter(Boolean);

  return (
    <section id="about" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-40">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted md:sticky md:top-28">
            <span className="text-accent">01</span> / About
          </p>
        </div>
        <div className="md:col-span-9">
          <h2 className="sr-only">About me</h2>
          <p
            ref={ref}
            className="text-[clamp(1.6rem,3.6vw,3.25rem)] font-medium leading-[1.12] tracking-[-0.03em]"
          >
            {reduce
              ? statement
              : words.map((word, i) => (
                  <Word
                    key={i}
                    word={word}
                    progress={scrollYProgress}
                    range={[i / words.length, Math.min(1, (i + 2) / words.length)]}
                  />
                ))}
          </p>

          <dl className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
            {facts.map((fact, i) => (
              <Reveal key={fact.label} delay={i * 0.08} className="bg-bg p-6">
                <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{fact.label}</dt>
                <dd className="mt-3 text-lg tracking-tight">{fact.value}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
