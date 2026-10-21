"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { GuideConfig } from "@/lib/site";
import { easeOut } from "@/lib/utils";
import { AvatarSvg } from "./avatar-svg";

/** The guide's speech box: typewriter text, one line per step. */
export function GuideDialog({ guide, portraitUrl, lines, onClose }: { guide: GuideConfig; portraitUrl: string; lines: string[]; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState(0);
  const line = lines[step] ?? "";
  const typing = shown < line.length;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(line.length);
      return;
    }
    setShown(0);
    let i = 0;
    const t = window.setInterval(() => {
      i += 2;
      setShown(i);
      if (i >= line.length) window.clearInterval(t);
    }, 22);
    return () => window.clearInterval(t);
  }, [line]);

  const next = () => {
    if (typing) return setShown(line.length);
    if (step >= lines.length - 1) return onClose();
    setStep((s) => s + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose();
      else if (e.code === "Enter" || e.code === "Space" || e.code === "KeyE") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <motion.div
      className="absolute inset-x-0 bottom-6 z-30 flex justify-center px-4 md:bottom-10"
      initial={{ opacity: 0, transform: "translateY(20px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      exit={{ opacity: 0, transform: "translateY(12px)", transition: { duration: 0.18 } }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      <div role="dialog" aria-label={`${guide.name} says`} className="flex w-full max-w-[720px] items-start gap-4 rounded-[1.75rem] border border-white/10 bg-[#0d1113]/92 p-4 shadow-[0_40px_100px_-30px_rgb(0_0_0/0.95)] backdrop-blur-xl md:p-5">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#1d3b37,#0b0f11)] md:size-20">
          {portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portraitUrl} alt="" className="size-full object-cover" />
          ) : (
            <AvatarSvg shirt={guide.shirt} pants={guide.pants} hair={guide.hair} skin={guide.skin} accessory={guide.accessory} className="h-14 md:h-16" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold tracking-tight">
              {guide.name} <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">City guide</span>
            </p>
            <span className="font-mono text-[11px] tabular-nums text-muted">
              {step + 1}/{lines.length}
            </span>
          </div>
          <p className="mt-2 min-h-[3.2em] text-[15px] leading-relaxed text-fg/90 md:text-base" aria-live="polite">
            {line.slice(0, shown)}
            {typing ? <span className="ml-0.5 inline-block h-[1em] w-[0.45em] translate-y-[0.15em] animate-pulse bg-accent" /> : null}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="text-sm text-muted hover:text-fg">
              Skip
            </button>
            <button type="button" onClick={next} className="press inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink">
              {step >= lines.length - 1 && !typing ? "Let's go" : "Next"}
              <kbd className="rounded bg-accent-ink/10 px-1.5 font-mono text-[10px]">E</kbd>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
