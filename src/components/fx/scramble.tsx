"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>/=+*#$%&";

/**
 * Decodes text out of random glyphs, left to right. Width is kept stable by rendering
 * every character in its own inline-block cell sized by the final character.
 */
export function Scramble({ text, duration = 900, delay = 0, className, start = true }: { text: string; duration?: number; delay?: number; className?: string; start?: boolean }) {
  const [shown, setShown] = useState(text.replace(/\S/g, " "));
  const done = useRef(false);

  useEffect(() => {
    if (!start || done.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(text);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (t: number) => {
      const p = Math.max(0, (t - t0) / duration);
      const reveal = Math.floor(p * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " " || i < reveal) out += ch;
        else if (t < t0) out += " ";
        else out += CHARS[(Math.random() * CHARS.length) | 0];
      }
      setShown(out);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        done.current = true;
        setShown(text);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration, delay, start]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split("").map((ch, i) => (
          <span key={i} className="relative inline-block">
            <span className="invisible">{ch === " " ? " " : ch}</span>
            <span className={shown[i] !== ch ? "absolute inset-0 text-center text-accent/80" : "absolute inset-0"}>{shown[i] === " " ? " " : shown[i]}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
