"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "@phosphor-icons/react/dist/ssr";

// Nearest-template digit classifier. Templates are digits rendered in several typefaces and
// slants; both templates and drawings go through the same MNIST-style preprocessing
// (crop → fit in 20×20 → centre of mass in a 28×28 grid → blur), then cosine similarity.

const N = 28;

function preprocess(src: HTMLCanvasElement): Float32Array | null {
  const ctx = src.getContext("2d", { willReadFrequently: true })!;
  const { width: w, height: h } = src;
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 40) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  if (maxX < 0) return null;
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const s = 20 / Math.max(bw, bh);
  const tmp = document.createElement("canvas");
  tmp.width = tmp.height = N;
  const t = tmp.getContext("2d", { willReadFrequently: true })!;
  t.filter = "blur(0.6px)";
  t.drawImage(src, minX, minY, bw, bh, (N - bw * s) / 2, (N - bh * s) / 2, bw * s, bh * s);
  const px = t.getImageData(0, 0, N, N).data;
  const v = new Float32Array(N * N);
  let mx = 0,
    my = 0,
    m = 0;
  for (let i = 0; i < N * N; i++) {
    v[i] = px[i * 4 + 3] / 255;
    mx += (i % N) * v[i];
    my += Math.floor(i / N) * v[i];
    m += v[i];
  }
  // shift so the centre of mass sits in the middle
  const dx = Math.round(N / 2 - mx / m);
  const dy = Math.round(N / 2 - my / m);
  const out = new Float32Array(N * N);
  let norm = 0;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const sx = x - dx;
      const sy = y - dy;
      const val = sx >= 0 && sy >= 0 && sx < N && sy < N ? v[sy * N + sx] : 0;
      out[y * N + x] = val;
      norm += val * val;
    }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

let templates: { digit: number; v: Float32Array }[] | null = null;

function buildTemplates() {
  if (templates) return templates;
  const fonts = ["600 200px sans-serif", "400 200px serif", "500 200px monospace", "700 200px sans-serif", "italic 400 200px serif", "300 200px sans-serif"];
  const out: { digit: number; v: Float32Array }[] = [];
  const c = document.createElement("canvas");
  c.width = c.height = 280;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  for (let d = 0; d <= 9; d++)
    for (const f of fonts)
      for (const rot of [-0.14, 0, 0.14]) {
        ctx.clearRect(0, 0, 280, 280);
        ctx.save();
        ctx.translate(140, 140);
        ctx.rotate(rot);
        ctx.font = f;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000";
        ctx.fillText(String(d), 0, 10);
        ctx.restore();
        const v = preprocess(c);
        if (v) out.push({ digit: d, v });
      }
  templates = out;
  return out;
}

function classify(v: Float32Array) {
  const best = new Array(10).fill(-1);
  for (const t of buildTemplates()) {
    let dot = 0;
    for (let i = 0; i < v.length; i++) dot += v[i] * t.v[i];
    if (dot > best[t.digit]) best[t.digit] = dot;
  }
  const exps = best.map((s) => Math.exp(s * 18));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function DigitsDemo({ onRun }: { onRun: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [probs, setProbs] = useState<number[] | null>(null);

  useEffect(() => {
    const t = window.setTimeout(buildTemplates, 300);
    return () => clearTimeout(t);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 280, y: ((e.clientY - r.top) / r.height) * 280 };
  };
  const line = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const ctx = canvas.current!.getContext("2d")!;
    ctx.strokeStyle = "#e8eeec";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const v = preprocess(canvas.current!);
    if (v) {
      setProbs(classify(v));
      onRun();
    }
  };

  const top = probs ? probs.indexOf(Math.max(...probs)) : -1;

  return (
    <div className="grid gap-5 md:grid-cols-[280px_1fr]">
      <div>
        <canvas
          ref={canvas}
          width={280}
          height={280}
          aria-label="Drawing pad. Draw a digit from 0 to 9."
          className="aspect-square w-full max-w-[280px] cursor-crosshair touch-none rounded-2xl border border-line-strong bg-bg/80"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            last.current = pos(e);
            line(last.current, last.current);
          }}
          onPointerMove={(e) => {
            if (!drawing.current || !last.current) return;
            const p = pos(e);
            line(last.current, p);
            last.current = p;
          }}
          onPointerUp={finish}
          onPointerLeave={finish}
        />
        <button
          type="button"
          onClick={() => {
            canvas.current!.getContext("2d")!.clearRect(0, 0, 280, 280);
            setProbs(null);
          }}
          className="press mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm"
        >
          <Eraser size={15} /> Clear
        </button>
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Prediction</p>
        <p className="mt-1 text-6xl font-semibold tabular-nums tracking-tight text-accent">{top >= 0 ? top : "?"}</p>
        <ul className="mt-5 grid gap-1.5">
          {Array.from({ length: 10 }, (_, d) => (
            <li key={d} className="flex items-center gap-3 font-mono text-xs">
              <span className="w-3 text-muted">{d}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full origin-left rounded-full transition-transform duration-300" style={{ transform: `scaleX(${probs?.[d] ?? 0})`, background: d === top ? "#5fd6c0" : "#3a4246" }} />
              </span>
              <span className="w-10 text-right tabular-nums text-muted">{probs ? `${Math.round(probs[d] * 100)}%` : ""}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
