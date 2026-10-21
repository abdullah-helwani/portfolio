"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { CodeRain } from "./code-rain";

/**
 * The site-wide backdrop: falling code over slow colour fields that drift as you scroll,
 * so no section sits on flat black. Fixed and behind everything; content stays readable
 * because the rain dims once you start reading.
 */
export function SiteBackground({ rain = true }: { rain?: boolean }) {
  const reduce = useReducedMotion();
  const { scrollYProgress, scrollY } = useScroll();
  const rainOpacity = useTransform(scrollY, [0, 700], [0.85, 0.22]);
  const a = useTransform(scrollYProgress, (v) => `translate3d(${-10 + v * 40}vw, ${-10 + v * 30}vh, 0)`);
  const b = useTransform(scrollYProgress, (v) => `translate3d(${55 - v * 50}vw, ${40 - v * 25}vh, 0)`);
  const c = useTransform(scrollYProgress, (v) => `translate3d(${20 + Math.sin(v * 6) * 20}vw, ${70 - v * 60}vh, 0)`);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      <motion.div className="absolute size-[80vmax] rounded-full opacity-[0.16] [background:radial-gradient(closest-side,#5fd6c0,transparent)]" style={{ transform: reduce ? undefined : a }} />
      <motion.div className="absolute size-[70vmax] rounded-full opacity-[0.12] [background:radial-gradient(closest-side,#6c7bff,transparent)]" style={{ transform: reduce ? undefined : b }} />
      <motion.div className="absolute size-[60vmax] rounded-full opacity-[0.1] [background:radial-gradient(closest-side,#f0773f,transparent)]" style={{ transform: reduce ? undefined : c }} />
      {rain ? (
        <motion.div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_40%,transparent_10%,black_75%)]" style={{ opacity: rainOpacity }}>
          <CodeRain />
        </motion.div>
      ) : null}
      <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] [background-size:120px_120px] [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
    </div>
  );
}
