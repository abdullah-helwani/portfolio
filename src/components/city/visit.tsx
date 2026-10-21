"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowSquareOut, CaretUp } from "@phosphor-icons/react/dist/ssr";
import type { Visit } from "./city-panel";

function ding() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    for (const [freq, at] of [
      [1318, 0],
      [988, 0.16],
    ] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.9);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 1);
    }
    window.setTimeout(() => void ctx.close(), 1500);
  } catch {}
}

/** Opens the link in a new tab; if the browser blocks it, the overlay offers a button instead. */
function openUrl(url: string) {
  const w = window.open(url, "_blank");
  if (w) {
    w.opener = null;
    return true;
  }
  return false;
}

export function VisitTransition({ visit, onDone }: { visit: Visit; onDone: () => void }) {
  const [phase, setPhase] = useState<"closing" | "riding" | "open" | "blocked">("closing");
  const [floor, setFloor] = useState(1);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  const host = visit.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const elevator = visit.kind === "elevator";

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ride = reduce ? 200 : elevator ? 1500 : 900;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("riding"), reduce ? 100 : 650));
    if (elevator) {
      const start = performance.now() + 650;
      const tick = () => {
        const p = Math.min(1, Math.max(0, (performance.now() - start) / ride));
        setFloor(Math.max(1, Math.round(1 + (visit.floors - 1) * (1 - Math.pow(1 - p, 3)))));
        if (p < 1) timers.push(window.setTimeout(tick, 40));
      };
      timers.push(window.setTimeout(tick, 650));
    }
    timers.push(
      window.setTimeout(() => {
        if (elevator) ding();
        setPhase("open");
      }, 650 + ride),
    );
    timers.push(
      window.setTimeout(() => {
        if (openUrl(visit.url)) timers.push(window.setTimeout(() => done.current(), 700));
        else setPhase("blocked");
      }, 650 + ride + 550),
    );
    return () => timers.forEach(clearTimeout);
  }, [elevator, visit.url, visit.floors]);

  const light = `radial-gradient(ellipse at center, #ffffff 0%, ${visit.color} 35%, #0b0f11 80%)`;

  return (
    <motion.div className="absolute inset-0 z-50 overflow-hidden bg-[#05080a]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>
      {/* what's behind the doors */}
      <div className="absolute inset-0 grid place-items-center" style={{ background: light }}>
        <motion.div initial={{ opacity: 0, transform: "scale(0.9)" }} animate={phase === "open" || phase === "blocked" ? { opacity: 1, transform: "scale(1)" } : {}} transition={{ duration: 0.5 }} className="px-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#0b0f11]/70">Now entering</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-[#0b0f11] md:text-6xl">{visit.label}</p>
          <p className="mt-2 font-mono text-sm text-[#0b0f11]/70">{host}</p>
          {phase === "blocked" ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => openUrl(visit.url) && onDone()} className="press inline-flex h-12 items-center gap-2 rounded-full bg-[#0b0f11] px-6 text-sm font-medium text-[#e8eeec]">
                Open {host} <ArrowSquareOut size={16} />
              </button>
              <button type="button" onClick={onDone} className="h-12 rounded-full px-5 text-sm text-[#0b0f11]/75 hover:text-[#0b0f11]">
                Back to the city
              </button>
            </div>
          ) : null}
        </motion.div>
      </div>

      {elevator ? (
        <>
          {/* elevator doors */}
          {[-1, 1].map((side) => (
            <motion.div
              key={side}
              className="absolute inset-y-0 w-1/2 border-white/10 bg-[linear-gradient(90deg,#5d6a6b,#a4b0ae_40%,#7d8a8a_60%,#4d5859)] shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]"
              style={{ left: side < 0 ? 0 : "50%", borderRightWidth: side < 0 ? 2 : 0, borderLeftWidth: side > 0 ? 2 : 0 }}
              initial={{ transform: `translateX(${side * 100}%)` }}
              animate={{ transform: phase === "open" || phase === "blocked" ? `translateX(${side * 100}%)` : "translateX(0%)" }}
              transition={{ duration: phase === "closing" ? 0.6 : 0.55, ease: [0.65, 0, 0.35, 1] }}
            >
              <div className="absolute inset-y-[8%] w-px bg-black/20" style={{ [side < 0 ? "right" : "left"]: 28 } as React.CSSProperties} />
            </motion.div>
          ))}
          {/* floor indicator */}
          <div className="absolute inset-x-0 top-[7%] flex justify-center">
            <motion.div
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b0f11] px-5 py-3 font-mono text-[#f6c177] shadow-[0_0_30px_rgba(246,193,119,0.25)]"
              animate={phase === "riding" ? { transform: ["translateY(0px)", "translateY(1.5px)", "translateY(0px)"] } : { transform: "translateY(0px)" }}
              transition={{ duration: 0.18, repeat: phase === "riding" ? Infinity : 0 }}
            >
              <CaretUp size={20} weight="fill" className={phase === "riding" ? "animate-pulse" : "opacity-40"} />
              <span className="w-14 text-center text-3xl tabular-nums">{String(floor).padStart(2, "0")}</span>
            </motion.div>
          </div>
          <p className="absolute inset-x-0 bottom-[8%] text-center font-mono text-xs uppercase tracking-[0.3em] text-white/60">
            {phase === "closing" ? "Doors closing" : phase === "riding" ? `Going up to ${visit.label}` : ""}
          </p>
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center [perspective:1200px]">
          <motion.div
            className="relative h-[70vh] w-[min(42vh,70vw)] rounded-t-[1rem] border-[14px] border-b-0 border-[#2a3134] bg-transparent"
            initial={{ transform: "scale(1)" }}
            animate={{ transform: phase === "open" || phase === "blocked" ? "scale(4)" : "scale(1)" }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          >
            <motion.div
              className="absolute inset-0 origin-left rounded-t-[0.5rem] bg-[linear-gradient(160deg,#5a3d2c,#3b2a22)] shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]"
              initial={{ transform: "rotateY(0deg)" }}
              animate={{ transform: phase === "closing" ? "rotateY(0deg)" : "rotateY(-105deg)" }}
              transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
            >
              <span className="absolute right-[12%] top-1/2 size-3 rounded-full bg-[#f6c177]" />
              <span className="absolute inset-x-[14%] top-[10%] h-[30%] rounded-md border border-black/20" />
              <span className="absolute inset-x-[14%] bottom-[10%] h-[40%] rounded-md border border-black/20" />
            </motion.div>
          </motion.div>
          <p className="absolute inset-x-0 bottom-[8%] text-center font-mono text-xs uppercase tracking-[0.3em] text-white/60">{phase === "closing" ? `Knock knock · ${visit.label}` : ""}</p>
        </div>
      )}
    </motion.div>
  );
}
