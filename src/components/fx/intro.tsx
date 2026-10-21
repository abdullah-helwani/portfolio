"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CodeRain } from "./code-rain";
import { Scramble } from "./scramble";

const KEY = "ah-intro-seen";

/**
 * First-second moment: a burst of falling code, a terminal line compiling the portfolio,
 * the name decoding out of the noise, then the screen opens onto the site.
 * Once per browser session; any key, click or scroll skips it.
 */
export function Intro({ name, line, enabled }: { name: string; line: string; enabled: boolean }) {
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    try {
      if (window.sessionStorage.getItem(KEY) === "1") return;
    } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      try {
        window.sessionStorage.setItem(KEY, "1");
      } catch {}
      setShow(false);
    };
    // decided after mount: sessionStorage is client-only
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    setStage(0);
    const timers = reduce
      ? [window.setTimeout(finish, 500)]
      : [window.setTimeout(() => setStage(1), 250), window.setTimeout(() => setStage(2), 900), window.setTimeout(() => setStage(3), 1900), window.setTimeout(finish, 2400)];
    const skip = () => finish();
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("wheel", skip, { once: true, passive: true });
    window.addEventListener("touchmove", skip, { once: true, passive: true });
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
    };
  }, [enabled]);

  useEffect(() => {
    if (!show) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[150] grid place-items-center overflow-hidden bg-[#070a0b]"
          initial={{ clipPath: "circle(150% at 50% 50%)" }}
          exit={{ clipPath: "circle(0% at 50% 50%)", transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] } }}
        >
          <div className="absolute inset-0">
            <CodeRain density={1.8} intensity={1.15} fps={40} />
          </div>
          <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,rgba(7,10,11,0.92)_20%,rgba(7,10,11,0.4)_60%,transparent)]" />
          <div className="relative px-6 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 1 ? 1 : 0 }}
              className="font-mono text-xs tracking-[0.08em] text-accent md:text-sm"
            >
              <span className="text-muted">~/portfolio $</span> {line}
              <span className="ml-2 inline-block w-28 text-left text-muted">
                [{"■".repeat(Math.min(8, stage * 3))}
                {"·".repeat(Math.max(0, 8 - stage * 3))}]
              </span>
            </motion.p>
            <h2 className="mt-6 text-[clamp(2.6rem,11vw,8rem)] font-semibold uppercase leading-[0.9] tracking-[-0.04em] text-fg">
              {stage >= 2 ? <Scramble text={name} duration={850} /> : <span className="opacity-0">{name}</span>}
            </h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 3 ? 1 : 0 }}
              className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-muted"
            >
              build successful · entering
            </motion.p>
          </div>
          <button type="button" onClick={() => setShow(false)} aria-label="Skip intro" className="absolute bottom-6 right-6 rounded-full border border-line-strong px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted hover:text-fg">
            Skip
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
