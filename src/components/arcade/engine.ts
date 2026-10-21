"use client";

import { useEffect, useRef } from "react";

export const W = 510;
export const H = 330;
export const C = {
  bg: "#020a08",
  fg: "#9ff0e0",
  accent: "#5fd6c0",
  dim: "rgba(95,214,192,0.35)",
  amber: "#f6c177",
  ember: "#f0773f",
  violet: "#a9b8ff",
  pink: "#e58fb6",
  white: "#e8eeec",
};
export const MONO = "var(--font-geist-mono), ui-monospace, monospace";

/** Keyboard codes from the arcade shell, delivered while the machine has focus. */
export type KeyBus = { subscribe: (fn: (code: string, down: boolean) => void) => () => void };

export type GameProps = {
  keys: KeyBus;
  onScore: (score: number) => void;
  onEnd: (score: number) => void;
};

/** requestAnimationFrame loop with a clamped delta, paused while the tab is hidden. */
export function useLoop(step: (dt: number, t: number) => void, running = true) {
  const ref = useRef(step);
  useEffect(() => {
    ref.current = step;
  });
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!document.hidden) ref.current(dt, t);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

export function useKeys(keys: KeyBus, fn: (code: string, down: boolean) => void) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => keys.subscribe((c, d) => ref.current(c, d)), [keys]);
}

export function setupCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== W * dpr) {
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function canvasPoint(e: { clientX: number; clientY: number }, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

export function hud(ctx: CanvasRenderingContext2D, left: string, right: string) {
  ctx.fillStyle = C.dim;
  ctx.fillRect(0, 24, W, 1);
  ctx.font = `600 12px ${MONO}`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = C.fg;
  ctx.textAlign = "left";
  ctx.fillText(left, 12, 13);
  ctx.textAlign = "right";
  ctx.fillText(right, W - 12, 13);
  ctx.textAlign = "left";
}

export function centerText(ctx: CanvasRenderingContext2D, lines: { text: string; size?: number; color?: string }[], y = H / 2) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let yy = y - ((lines.length - 1) * 22) / 2;
  for (const l of lines) {
    ctx.font = `600 ${l.size ?? 14}px ${MONO}`;
    ctx.fillStyle = l.color ?? C.fg;
    ctx.fillText(l.text, W / 2, yy);
    yy += (l.size ?? 14) + 10;
  }
  ctx.textAlign = "left";
}
