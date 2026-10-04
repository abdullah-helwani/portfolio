"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { cn, easeOut } from "@/lib/utils";
import { drawPlayer, hoodieColors, type Character } from "./draw";

const CHAR_KEY = "ah-world-char";

export function loadCharacter(): Character | null {
  try {
    const raw = window.localStorage.getItem(CHAR_KEY);
    return raw ? (JSON.parse(raw) as Character) : null;
  } catch {
    return null;
  }
}

const accessories: { id: Character["accessory"]; label: string }[] = [
  { id: "none", label: "None" },
  { id: "cap", label: "Cap" },
  { id: "headphones", label: "Headphones" },
];

function Preview({ char }: { char: Character }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 200 * dpr;
    canvas.height = 180 * dpr;
    let raf = 0;
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() || "monospace";
    const frames = ["strideA", "pass", "strideB", "pass"];
    const tick = (t: number) => {
      ctx.setTransform(dpr * 1.6, 0, 0, dpr * 1.6, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 200, 180);
      const frame = frames[Math.floor(t / 160) % 4];
      drawPlayer(ctx, 62, 102, char, { facing: 1, frame, bob: 0, airborne: false }, font);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [char]);
  return <canvas ref={ref} style={{ width: 200, height: 180 }} aria-hidden="true" />;
}

export function CharacterCreator({
  initial,
  onDone,
  onCancel,
}: {
  initial: Character | null;
  onDone: (c: Character) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? hoodieColors[0]);
  const [accessory, setAccessory] = useState<Character["accessory"]>(initial?.accessory ?? "cap");
  const char: Character = { name: name.trim().slice(0, 16) || "Visitor", color, accessory };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(CHAR_KEY, JSON.stringify(char));
    } catch {}
    onDone(char);
  };

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center bg-bg/75 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="creator-title"
        initial={{ opacity: 0, transform: "translateY(20px) scale(0.97)" }}
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
        transition={{ duration: 0.45, ease: easeOut }}
        className="grid w-full max-w-[720px] overflow-hidden rounded-[2rem] border border-line-strong bg-surface shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] md:grid-cols-[260px_1fr]"
      >
        <div className="relative grid place-items-center border-b border-line bg-[radial-gradient(circle_at_50%_70%,rgb(95_214_192/0.18),transparent_65%)] p-6 md:border-b-0 md:border-r">
          <Preview char={char} />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Preview</p>
        </div>
        <div className="p-6 md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">New game</p>
          <h2 id="creator-title" className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Create your character
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Walk through my portfolio as a side-scroller. Inspect projects, collect skill orbs and bits, and level up.
          </p>

          <label className="mt-6 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted" htmlFor="char-name">
            Name
          </label>
          <input
            id="char-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Visitor"
            autoFocus
            className="mt-2 h-12 w-full rounded-xl border border-line-strong bg-bg px-4 text-[15px] focus:border-accent focus:outline-none"
          />

          <fieldset className="mt-5">
            <legend className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Hoodie</legend>
            <div className="mt-2 flex gap-2">
              {hoodieColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Hoodie colour ${c}`}
                  aria-pressed={color === c}
                  className={cn(
                    "press size-10 rounded-xl border-2 transition-transform duration-150",
                    color === c ? "scale-110 border-fg" : "border-transparent",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Gear</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {accessories.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccessory(a.id)}
                  aria-pressed={accessory === a.id}
                  className={cn(
                    "press h-10 rounded-xl border px-4 text-sm transition-colors duration-150",
                    accessory === a.id ? "border-accent bg-accent/10 text-fg" : "border-line-strong text-muted hover:text-fg",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              className="press inline-flex h-12 items-center gap-2 rounded-full bg-accent pl-6 pr-5 text-sm font-medium text-accent-ink"
            >
              {initial ? "Save character" : "Start exploring"}
              <ArrowRight size={16} weight="bold" />
            </button>
            {onCancel ? (
              <button type="button" onClick={onCancel} className="h-12 rounded-full px-4 text-sm text-muted hover:text-fg">
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
