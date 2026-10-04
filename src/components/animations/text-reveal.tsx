"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn, easeOut } from "@/lib/utils";

type TextRevealProps = {
  /** Wrap words in *asterisks* to render them in the accent serif. */
  text: string;
  className?: string;
  accentClassName?: string;
  as?: "h1" | "h2" | "h3" | "p";
  delay?: number;
};

export function TextReveal({
  text,
  className,
  accentClassName = "font-serif font-normal italic",
  as = "h2",
  delay = 0,
}: TextRevealProps) {
  const reduce = useReducedMotion();
  const Tag = as;
  const tokens = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  const words: { word: string; accent: boolean }[] = [];
  for (const token of tokens) {
    const accent = token.startsWith("*") && token.endsWith("*");
    const clean = accent ? token.slice(1, -1) : token;
    for (const word of clean.split(/\s+/).filter(Boolean)) words.push({ word, accent });
  }

  return (
    <Tag className={className}>
      <span className="sr-only">{text.replaceAll("*", "")}</span>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: "-60px" }}
        transition={{ staggerChildren: 0.06, delayChildren: delay }}
      >
        {words.map(({ word, accent }, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className={cn("inline-block", accent && accentClassName)}
              variants={{
                hidden: reduce ? { opacity: 0 } : { transform: "translateY(105%) rotate(4deg)", opacity: 0 },
                shown: reduce ? { opacity: 1 } : { transform: "translateY(0%) rotate(0deg)", opacity: 1 },
              }}
              transition={{ duration: 0.9, ease: easeOut }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
