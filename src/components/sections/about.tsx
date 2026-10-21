"use client";

import { Fragment, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Reveal } from "@/components/animations/reveal";
import { SectionKicker, type SectionProps } from "./section-header";

type Fact = { label: string; value: string };

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {word}
    </motion.span>
  );
}

export function About({ statement, facts, portraitUrl, name, section, index }: { statement: string; facts: Fact[]; portraitUrl: string; name: string } & SectionProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = statement.split(/\s+/).filter(Boolean);

  return (
    <section id="about" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-40">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-3">
          <div className="md:sticky md:top-28">
            <SectionKicker section={section} index={index} />
            {portraitUrl ? (
              <Reveal delay={0.1} className="mt-8 hidden md:block">
                <figure className="relative aspect-[4/5] w-full max-w-[240px] overflow-hidden rounded-[1.75rem] border border-line-strong">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={portraitUrl} alt={`Portrait of ${name}`} className="size-full object-cover" />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
                </figure>
              </Reveal>
            ) : null}
          </div>
        </div>
        <div className="md:col-span-9">
          <h2 className="sr-only">{section.title.replaceAll("*", "")}</h2>
          {portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portraitUrl} alt={`Portrait of ${name}`} className="mb-8 size-24 rounded-3xl border border-line-strong object-cover md:hidden" />
          ) : null}
          <p ref={ref} className="text-[clamp(1.6rem,3.6vw,3.25rem)] font-medium leading-[1.14] tracking-[-0.03em]">
            {reduce
              ? statement
              : words.map((word, i) => (
                  <Fragment key={i}>
                    <Word word={word} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 2) / words.length)]} />{" "}
                  </Fragment>
                ))}
          </p>
          {section.intro ? <p className="mt-8 max-w-[60ch] text-lg leading-relaxed text-fg/70">{section.intro}</p> : null}

          <dl className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
            {facts.map((fact, i) => (
              <Reveal key={fact.label} delay={i * 0.08} className="bg-bg/90 p-6 backdrop-blur">
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
