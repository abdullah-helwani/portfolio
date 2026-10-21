"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Falling code, drawn on one canvas. Three depth layers (small/dim/slow → large/bright/fast)
// give it parallax; columns mix real code tokens with single glyphs so it reads as code,
// not as the movie effect.

const GLYPHS = "01{}[]()<>=+-*/;:.#$&|!?%_~^abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TOKENS = ["const", "=>", "def", "fn", "if", "for", "let", "await", "return", "SELECT", "import", "0x1F", "null", "true", "{}", "[]", "λ", "∑", "∂", "self", "np", "fit()", "map", "git", "</>", "SQL", "py", "ts"];

type Drop = { x: number; y: number; speed: number; layer: number; trail: string[]; color: number; next: number };

const LAYERS = [
  { size: 11, alpha: 0.32, speed: 0.55 },
  { size: 14, alpha: 0.55, speed: 0.9 },
  { size: 18, alpha: 0.9, speed: 1.35 },
];
const COLORS = ["95,214,192", "95,214,192", "95,214,192", "169,184,255", "240,119,63", "232,238,236"];

export function CodeRain({
  className,
  density = 1,
  intensity = 1,
  fps = 30,
  paused = false,
}: {
  className?: string;
  /** Columns per 100px of width, relative. */
  density?: number;
  /** Overall brightness multiplier. */
  intensity?: number;
  fps?: number;
  paused?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const font = getComputedStyle(document.body).getPropertyValue("--font-geist-mono") || "monospace";

    let w = 0;
    let h = 0;
    let dpr = 1;
    let drops: Drop[] = [];
    const pick = () => (Math.random() < 0.06 ? TOKENS[(Math.random() * TOKENS.length) | 0] : GLYPHS[(Math.random() * GLYPHS.length) | 0]);

    const seed = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.max(8, Math.round((w / 100) * 4.2 * density));
      drops = Array.from({ length: cols }, (_, i) => {
        const layer = Math.random() < 0.5 ? 0 : Math.random() < 0.7 ? 1 : 2;
        return {
          x: (i + Math.random() * 0.8) * (w / cols),
          y: Math.random() * h * 1.2 - h * 0.2,
          speed: (40 + Math.random() * 60) * LAYERS[layer].speed,
          layer,
          trail: Array.from({ length: 8 + ((Math.random() * 14) | 0) }, pick),
          color: (Math.random() * COLORS.length) | 0,
          next: Math.random(),
        };
      });
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const d of drops) {
        const L = LAYERS[d.layer];
        d.y += d.speed * dt;
        d.next -= dt * 6;
        if (d.next <= 0) {
          d.next = 0.4 + Math.random();
          d.trail.unshift(pick());
          d.trail.pop();
        }
        const len = d.trail.length * L.size * 1.15;
        if (d.y - len > h) {
          d.y = -Math.random() * h * 0.3;
          d.x = Math.random() * w;
        }
        ctx.font = `500 ${L.size}px ${font}`;
        for (let k = 0; k < d.trail.length; k++) {
          const y = d.y - k * L.size * 1.15;
          if (y < -L.size || y > h + L.size) continue;
          const fade = 1 - k / d.trail.length;
          const a = (k === 0 ? 1 : fade * fade * 0.75) * L.alpha * intensity;
          ctx.fillStyle = k === 0 ? `rgba(232,238,236,${Math.min(1, a)})` : `rgba(${COLORS[d.color]},${a})`;
          ctx.fillText(d.trail[k], d.x, y);
        }
      }
    };

    seed();
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const step = 1 / fps;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (pausedRef.current || document.hidden) return;
      acc += dt;
      if (acc < step) return;
      draw(acc);
      acc = 0;
    };
    if (reduce) draw(0);
    else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      seed();
      if (reduce) draw(0);
    });
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density, intensity, fps]);

  return <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none block size-full", className)} />;
}
